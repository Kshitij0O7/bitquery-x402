import express from "express";
import { paymentMiddleware } from "@x402/express";
import { x402ResourceServer, HTTPFacilitatorClient } from "@x402/core/server";
import { registerExactEvmScheme } from "@x402/evm/exact/server";
import dotenv from "dotenv";
import { getLatestPrice } from "./endpoints/latest-price.js";
import { getOHLC } from "./endpoints/ohlc.js";
import { getAveragePrice } from "./endpoints/average-price.js";
import { getVolume } from "./endpoints/volume.js";
import { proxyRequest } from "./endpoints/proxy.js";

dotenv.config();

// Check for required environment variables
if (!process.env.BITQUERY_API_KEY) {
  console.warn("⚠️  WARNING: BITQUERY_API_KEY is not set in .env file!");
  console.warn("   The APIs will not work without a Bitquery API key.");
  console.warn("   Get one at: https://account.bitquery.io/auth/signup/");
}

const app = express();
app.use(express.json()); // Parse JSON request bodies
app.use(express.static('public')); // Serve static files from public directory

// Your wallet (seller receives USDC here)
const payTo = "0x4C10192b9F6F4781BA5fb27145743630e4B0D3F8";

// Testnet facilitator
const facilitatorClient = new HTTPFacilitatorClient({
  url: "https://x402.org/facilitator"
});

const server = new x402ResourceServer(facilitatorClient);
registerExactEvmScheme(server);

const payConfig = {
    scheme: "exact",
    price: "$0.001",
    network: "eip155:84532",
    payTo,
};

// Check if payment should be bypassed (for testing/development)
const BYPASS_PAYMENT = process.env.BYPASS_PAYMENT === "true";

if (BYPASS_PAYMENT) {
  console.log("⚠️  Payment bypass enabled - APIs are free for testing");
} else {
  // x402 paywall
  app.use(
    paymentMiddleware(
      {
        "POST /latest-price": {
          accepts: [
            payConfig,
          ],
          description: "Latest price of a token via Bitquery",
          mimeType: "application/json",
        },
        "POST /ohlc": {
          accepts: [
            payConfig,
          ],
          description: "OHLC of a token via Bitquery",
          mimeType: "application/json",
        },
        "POST /average-price": {
          accepts: [
            payConfig,
          ],
          description: "Average price of a token via Bitquery",
          mimeType: "application/json",
        },
        "POST /volume": {
          accepts: [
            payConfig,
          ],
          description: "Trade volume for a token via Bitquery",
          mimeType: "application/json",
        },
      },
      server,
    ),
  );
  console.log("💰 Payment required - APIs cost 0.001 USDC per request");
}

app.post("/latest-price", getLatestPrice);
app.post("/ohlc", getOHLC);
app.post("/average-price", getAveragePrice);
app.post("/volume", getVolume);

// Proxy endpoint for browser-based payment handling
app.post("/proxy", proxyRequest);

app.listen(4021, () => {
  console.log("🚀 Bitquery API running on :4021");
  console.log("");
  
  // Check environment setup
  if (process.env.BITQUERY_API_KEY) {
    console.log("✅ BITQUERY_API_KEY: Configured");
  } else {
    console.log("❌ BITQUERY_API_KEY: MISSING (APIs will not work!)");
  }
  
  if (process.env.EVM_PRIVATE_KEY) {
    console.log("✅ EVM_PRIVATE_KEY: Configured (payment proxy available)");
  } else {
    console.log("⚠️  EVM_PRIVATE_KEY: Not set (payment proxy disabled)");
  }
  
  console.log("");
  if (BYPASS_PAYMENT) {
    console.log("📝 Payment mode: DISABLED (Free testing - no payment required)");
  } else {
    console.log("📝 Payment mode: ENABLED (0.001 USDC per request)");
    if (!process.env.EVM_PRIVATE_KEY) {
      console.log("   ⚠️  Note: EVM_PRIVATE_KEY not set - payment proxy unavailable");
      console.log("   💡 Set EVM_PRIVATE_KEY in .env to enable payment proxy");
    } else {
      console.log("   ✅ Payment proxy enabled - browser UI can make paid requests");
    }
    console.log("   💡 Use 'npm test' (payTest.js) for command-line testing");
    console.log("   💡 Or set BYPASS_PAYMENT=true in .env for free testing");
  }
  console.log("");
});
  