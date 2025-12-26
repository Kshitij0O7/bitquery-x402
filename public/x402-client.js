// x402 Client for Browser
// This will be bundled with esbuild

import { wrapFetchWithPayment } from "@x402/fetch";
import { x402Client, x402HTTPClient } from "@x402/core/client";
import { registerExactEvmScheme } from "@x402/evm/exact/client";
import { privateKeyToAccount } from "viem/accounts";

let x402ClientInstance = null;
let fetchWithPayment = null;

export function initializeX402Client(privateKey) {
  try {
    // Remove 0x prefix if present
    const cleanKey = privateKey.replace(/^0x/, '');
    const signer = privateKeyToAccount(`0x${cleanKey}`);
    
    // Create x402 client
    x402ClientInstance = new x402Client();
    registerExactEvmScheme(x402ClientInstance, { signer });
    
    // Wrap fetch with payment handling
    fetchWithPayment = wrapFetchWithPayment(fetch, x402ClientInstance);
    
    return { success: true, client: x402ClientInstance };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function makePaidRequest(url, options, sendPayment = true) {
  if (!sendPayment) {
    // Make request without payment - will get 402
    return await fetch(url, options);
  }
  
  if (!fetchWithPayment) {
    throw new Error("x402 client not initialized. Please connect your wallet first.");
  }
  
  // Make request with payment handling
  const response = await fetchWithPayment(url, options);
  
  // Extract payment info if successful
  let paymentInfo = null;
  if (response.ok && x402ClientInstance) {
    try {
      const httpClient = new x402HTTPClient(x402ClientInstance);
      paymentInfo = httpClient.getPaymentSettleResponse(
        (name) => response.headers.get(name)
      );
    } catch (error) {
      console.warn("Could not extract payment info:", error);
    }
  }
  
  return { response, paymentInfo };
}

export function isClientInitialized() {
  return fetchWithPayment !== null;
}

