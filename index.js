import express from "express";
import { paymentMiddleware } from "@x402/express";
import { x402ResourceServer, HTTPFacilitatorClient } from "@x402/core/server";
import { registerExactEvmScheme } from "@x402/evm/exact/server";
import { registerExactSvmScheme } from "@x402/svm/exact/server";
import dotenv from "dotenv";
import { getLatestPrice } from "./endpoints/latest-price.js";
import { getOHLC } from "./endpoints/ohlc.js";
import { getAveragePrice } from "./endpoints/average-price.js";
import { getVolume } from "./endpoints/volume.js";

dotenv.config();

const app = express();
app.use(express.json()); // Parse JSON request bodies

// Your wallet (seller receives USDC here)
const payToEVM = "0x4C10192b9F6F4781BA5fb27145743630e4B0D3F8";
const payToSVM = "Dm2wPukN7AJqEbEgT8w8oLrPdWVhj8j7D9JVXGv9NPAd";

// Facilitator client configuration
// For testnet (default)
let facilitatorClient = new HTTPFacilitatorClient({
  url: "https://x402.org/facilitator"
});

// For mainnet with CDP (Coinbase Developer Platform)
// Automatically uses CDP facilitator if credentials are provided
// See: https://docs.cdp.coinbase.com/x402/quickstart-for-sellers#running-on-mainnet
if (process.env.CDP_API_KEY_ID && process.env.CDP_API_KEY_SECRET) {
  facilitatorClient = new HTTPFacilitatorClient({
    url: "https://api.cdp.coinbase.com/platform/v2/x402",
  });
}  

console.log(facilitatorClient);


const server = new x402ResourceServer(facilitatorClient);
registerExactEvmScheme(server);
registerExactSvmScheme(server);

const EVMPayConfig = {
    scheme: "exact",
    price: "$0.001",
    network: "eip155:8453", // Base Mainnet (chain ID 8453)
    payTo: payToEVM,
};

const SVMPayConfig = {
    scheme: "exact",
    price: "$0.001",
    network: "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp", // Solana mainnet
    payTo: payToSVM,
};
const discoveryConfig = {
    bazaar: {
      discoverable: true,
      category: "finance",
      tags: ["price", "ohlc", "average-price", "volume"],
    },
};
// x402 paywall
app.use(
  paymentMiddleware(
    {
      "POST /latest-price": {
        accepts: [
          EVMPayConfig,
        //   SVMPayConfig,
        ],
        description: "Latest price of a token via Bitquery",
        mimeType: "application/json",
        // extensions: discoveryConfig,
      },
      "POST /ohlc": {
        accepts: [
          EVMPayConfig,
        //   SVMPayConfig,
        ],
        description: "OHLC of a token via Bitquery",
        mimeType: "application/json",
    //    extensions: discoveryConfig,
      },
      "POST /average-price": {
        accepts: [
          EVMPayConfig,
        //   SVMPayConfig,
        ],
        description: "Average price of a token via Bitquery",
        mimeType: "application/json",
        // extensions: discoveryConfig,
      },
      "POST /volume": {
        accepts: [
          EVMPayConfig,
        //   SVMPayConfig,
        ],
        description: "Trade volume for a token via Bitquery",
        mimeType: "application/json",
      },
    //   extensions: discoveryConfig,
    },
    server,
  ),
);

app.post("/latest-price", getLatestPrice);
app.post("/ohlc", getOHLC);
app.post("/average-price", getAveragePrice);
app.post("/volume", getVolume);

const PORT = process.env.PORT || 4021;
app.listen(PORT, () =>
console.log(`Paid Bitquery API running on :${PORT}`)
);
  