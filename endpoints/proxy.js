import { wrapFetchWithPayment } from "@x402/fetch";
import { x402Client, x402HTTPClient } from "@x402/core/client";
import { registerExactEvmScheme } from "@x402/evm/exact/client";
import { privateKeyToAccount } from "viem/accounts";
import dotenv from "dotenv";

dotenv.config();

// Initialize x402 client for payment handling
let fetchWithPayment = null;
let x402ClientInstance = null;

function initializePaymentClient() {
  if (!process.env.EVM_PRIVATE_KEY) {
    console.warn("⚠️  EVM_PRIVATE_KEY not set - payment proxy will not work");
    return null;
  }

  try {
    // Create signer from private key (remove 0x prefix if present, then add it back)
    const privateKey = process.env.EVM_PRIVATE_KEY.replace(/^0x/, '');
    const signer = privateKeyToAccount(`0x${privateKey}`);
    
    // Create x402 client and register EVM scheme
    x402ClientInstance = new x402Client();
    registerExactEvmScheme(x402ClientInstance, { signer });
    
    // Wrap fetch with payment handling
    fetchWithPayment = wrapFetchWithPayment(fetch, x402ClientInstance);
    
    console.log("✅ x402 payment client initialized");
    return fetchWithPayment;
  } catch (error) {
    console.error("❌ Failed to initialize x402 client:", error.message);
    return null;
  }
}

// Initialize on module load
const paymentFetch = initializePaymentClient();

/**
 * ⚠️ DEMO ONLY: Proxy endpoint that handles x402 payments using SERVER's wallet
 * 
 * This is for testing/demo purposes only. In production, users should use x402
 * client libraries in their own code to pay from their own wallets.
 * 
 * This proxy uses the server's EVM_PRIVATE_KEY, meaning the SERVER pays for requests.
 * For a real pay-per-use service, remove this proxy and have users integrate
 * x402 client libraries in their own applications.
 */
export const proxyRequest = async (req, res) => {
  try {
    const { endpoint, body } = req.body;

    if (!endpoint) {
      return res.status(400).json({
        error: "Bad Request",
        message: "endpoint is required in request body"
      });
    }

    // Check if payment client is available
    if (!paymentFetch) {
      return res.status(503).json({
        error: "Service Unavailable",
        message: "Payment client not initialized. Set EVM_PRIVATE_KEY in .env file."
      });
    }

    // Validate endpoint to prevent SSRF
    const allowedEndpoints = ['/latest-price', '/ohlc', '/average-price', '/volume'];
    if (!allowedEndpoints.includes(endpoint)) {
      return res.status(400).json({
        error: "Bad Request",
        message: `Invalid endpoint. Allowed: ${allowedEndpoints.join(', ')}`
      });
    }

    // Make the request with payment handling
    const url = `http://localhost:4021${endpoint}`;
    const response = await paymentFetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body || {})
    });

    const data = await response.json();

    // Get payment receipt from response headers (only if request was successful)
    let paymentInfo = null;
    if (response.ok && x402ClientInstance) {
      try {
        const httpClient = new x402HTTPClient(x402ClientInstance);
        paymentInfo = httpClient.getPaymentSettleResponse(
          (name) => response.headers.get(name)
        );
      } catch (error) {
        // Payment info extraction failed, but request succeeded
        console.warn("Could not extract payment info:", error.message);
      }
    }

    // If the response is an error, return it directly (don't wrap in data field)
    if (!response.ok) {
      return res.status(response.status).json({
        ...data,
        payment: paymentInfo,
        status: response.status
      });
    }

    // Return successful response with payment info
    res.status(response.status).json({
      data,
      payment: paymentInfo,
      status: response.status
    });

  } catch (error) {
    console.error("Proxy error:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: error.message || "Failed to proxy request"
    });
  }
};

