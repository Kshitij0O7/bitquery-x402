import { wrapFetchWithPayment } from "@x402/fetch";
import { x402Client, x402HTTPClient } from "@x402/core/client";
import { registerExactEvmScheme } from "@x402/evm/exact/client";
import { privateKeyToAccount } from "viem/accounts";
import dotenv from "dotenv";

dotenv.config();

// Create a signer from private key (use environment variable)
const signer = privateKeyToAccount(`0x${process.env.EVM_PRIVATE_KEY}`);

const client = new x402Client();
registerExactEvmScheme(client, { signer });

// Wrap fetch with payment handling
const fetchWithPayment = wrapFetchWithPayment(fetch, client);

// Make request - payment is handled automatically
const response = await fetchWithPayment("http://localhost:4021/latest-price", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({}),
});

const data = await response.json();

// Display Bitquery API response in a readable format
console.log("\n📊 Bitquery API Response:");
console.log("=".repeat(60));
console.log(JSON.stringify(data, null, 2));
console.log("=".repeat(60));

// Extract and display key information
if (data?.data?.Trading?.Tokens) {
  const tokens = data.data.Trading.Tokens;
  console.log("\n💰 Token Price Data:");
  tokens.forEach((token, index) => {
    console.log(`\nToken ${index + 1}:`);
    if (token.Price?.Ohlc?.Close) {
      console.log(`  Price (Close): ${token.Price.Ohlc.Close}`);
    }
    console.log(`  Full Data:`, JSON.stringify(token, null, 4));
  });
}

// Get payment receipt from response headers
if (response.ok) {
  console.log("\n💳 Payment Information:");
  console.log("=".repeat(60));
  const httpClient = new x402HTTPClient(client);
  const paymentResponse = httpClient.getPaymentSettleResponse(
    (name) => response.headers.get(name)
  );
  console.log(JSON.stringify(paymentResponse, null, 2));
  console.log("=".repeat(60));
  
  if (paymentResponse.success) {
    console.log(`\n✅ Payment successful!`);
    console.log(`   Transaction: ${paymentResponse.transaction}`);
    console.log(`   Network: ${paymentResponse.network}`);
    console.log(`   Amount: ${paymentResponse.requirements.amount} ${paymentResponse.requirements.extra.name}`);
  }
}