import express from "express";
import { paymentMiddleware } from "@x402/express";
import { x402ResourceServer, HTTPFacilitatorClient } from "@x402/core/server";
import { registerExactEvmScheme } from "@x402/evm/exact/server";
import dotenv from "dotenv";
import { getLatestPrice } from "./endpoints/latest-price.js";
import { getOHLC } from "./endpoints/ohlc.js";
import { getAveragePrice } from "./endpoints/average-price.js";
import { getVolume } from "./endpoints/volume.js";

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

// x402 paywall - Payment is ALWAYS required (no bypass)
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

app.post("/latest-price", getLatestPrice);
app.post("/ohlc", getOHLC);
app.post("/average-price", getAveragePrice);
app.post("/volume", getVolume);

app.listen(4021, () => {
  console.log("🚀 Bitquery API running on :4021");
  console.log("");
  
  // Check environment setup
  if (process.env.BITQUERY_API_KEY) {
    console.log("✅ BITQUERY_API_KEY: Configured");
  } else {
    console.log("❌ BITQUERY_API_KEY: MISSING (APIs will not work!)");
  }
  
  console.log("");
  console.log("📝 Payment mode: ENABLED (0.001 USDC per request)");
  console.log("   ✅ Users must pay from their own wallets using x402 client libraries");
  console.log("   ✅ Frontend demo shows how users integrate x402 payments");
  console.log("   💡 Use 'npm test' (payTest.js) for command-line testing");
  console.log("");
});
  