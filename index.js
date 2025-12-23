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

const app = express();
app.use(express.json()); // Parse JSON request bodies

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

app.post("/latest-price", getLatestPrice);
app.post("/ohlc", getOHLC);
app.post("/average-price", getAveragePrice);
app.post("/volume", getVolume);

app.listen(4021, () =>
console.log("Paid Bitquery API running on :4021")
);
  