import axios from "axios";
import express from "express";
import { paymentMiddleware } from "@x402/express";
import { x402ResourceServer, HTTPFacilitatorClient } from "@x402/core/server";
import { registerExactEvmScheme } from "@x402/evm/exact/server";
import dotenv from "dotenv";
import {queryRunner} from "bitquery-helper";

dotenv.config();

const app = express();

// Your wallet (seller receives USDC here)
const payTo = "0x4C10192b9F6F4781BA5fb27145743630e4B0D3F8";

// Testnet facilitator
const facilitatorClient = new HTTPFacilitatorClient({
  url: "https://x402.org/facilitator"
});

const server = new x402ResourceServer(facilitatorClient);
registerExactEvmScheme(server);

// x402 paywall
app.use(
  paymentMiddleware(
    {
      "POST /latest-price": {
        accepts: [
          {
            scheme: "exact",
            price: "$0.001",
            network: "eip155:84532",
            payTo,
          },
        ],
        description: "Latest price of a token via Bitquery",
        mimeType: "application/json",
      },
    },
    server,
  ),
);

app.post("/latest-price", async (req, res) => {
    const query = `
      query MyQuery {
        Trading {
          Tokens(
            orderBy: {descending: Block_Time}
            limit: {count: 1}
          ) {
            Price {
              Ohlc {
                Close
              }
            }
          }
        }
      }
    `;
  
    const response = await axios.post(
      "https://streaming.bitquery.io/graphql",
      {
        query,
        variables: { limit: 10 },
      },
      {
        headers: {
          "Authorization": `Bearer ${process.env.BITQUERY_API_KEY}`,
        },
      }
    );
    res.json(response.data);
  });
  
app.listen(4021, () =>
console.log("Paid Bitquery API running on :4021")
);
  