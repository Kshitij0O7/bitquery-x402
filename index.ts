import express from "express";
import axios from "axios";
import { paymentMiddleware, x402ResourceServer } from "@x402/express";
import { ExactEvmScheme } from "@x402/evm/exact/server";
import { HTTPFacilitatorClient } from "@x402/core/server";

const app = express();
app.use(express.json());

// Your wallet (seller receives USDC here)
const payTo = "0x4C10192b9F6F4781BA5fb27145743630e4B0D3F8";

// Testnet facilitator
const facilitatorClient = new HTTPFacilitatorClient({
  url: "https://x402.org/facilitator"
});

const server = new x402ResourceServer(facilitatorClient)
  .register("eip155:84532", new ExactEvmScheme()); // Base Sepolia

// x402 paywall
app.use(
  paymentMiddleware(
    {
      "POST /bitquery/eth-transfers": {
        accepts: [
          {
            scheme: "exact",
            price: "$0.002",
            network: "eip155:84532",
            payTo,
          },
        ],
        description: "Ethereum transfer data via Bitquery",
        mimeType: "application/json",
      },
    },
    server,
  ),
);

app.post("/bitquery/eth-transfers", async (req, res) => {
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
          "Authorization": "Bearer ory_at_YE9xJUabGenX_R6ZqwJOu1qvQ8pu4petzY2mYAMFpj0.nv9CMJYlpmiXDlm3iYV5hC7b-ooXWg2lrYNADOO-IYk",
        },
      }
    );
  
    res.json(response.data);
  });
  
app.listen(4021, () =>
console.log("Paid Bitquery API running on :4021")
);
  