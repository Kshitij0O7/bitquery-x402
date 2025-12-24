import { wrapFetchWithPayment } from "@x402/fetch";
import { x402Client, x402HTTPClient } from "@x402/core/client";
import { registerExactEvmScheme } from "@x402/evm/exact/client";
import { privateKeyToAccount } from "viem/accounts";
import dotenv from "dotenv";

dotenv.config();

// Create a signer from private key (use environment variable)
let privateKey = process.env.EVM_PRIVATE_KEY?.trim();
if (!privateKey) {
  throw new Error("EVM_PRIVATE_KEY environment variable is not set");
}
// Extract just the value if the variable name is included (e.g., "EVM_PRIVATE_KEY=value")
if (privateKey.includes('=')) {
  privateKey = privateKey.split('=').slice(1).join('=').trim();
}
// Ensure the private key is properly formatted as hex with 0x prefix
const privateKeyHex = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;
const signer = privateKeyToAccount(privateKeyHex);

const client = new x402Client();
registerExactEvmScheme(client, { signer });

const explorerUrl = "https://basescan.org/tx/";
// Wrap fetch with payment handling
const fetchWithPayment = wrapFetchWithPayment(fetch, client);

// ============================================================================
// TEST 1: Latest Price Endpoint
// ============================================================================
console.log("\n" + "=".repeat(60));
console.log("TEST 1: Testing /latest-price endpoint");
console.log("=".repeat(60));

try {
  const response1 = await fetchWithPayment("http://localhost:4021/latest-price", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ tokenAddress: "cbbtcf3aa214zXHbiAZQwf4122FBYbraNdFqgw4iMij" }),
  });

  // First, check payment status
  console.log("\nPayment Status Check:");
  console.log("=".repeat(60));
  console.log(`Response Status: ${response1.status} ${response1.statusText}`);

  const httpClient1 = new x402HTTPClient(client);
  
  if (response1.status === 402) {
    console.log("Payment Required (402)");
    try {
      const body1 = await response1.clone().json().catch(() => ({}));
      const paymentRequired1 = httpClient1.getPaymentRequiredResponse(
        (name) => response1.headers.get(name),
        body1
      );
      console.log("Payment Required Response:", JSON.stringify(paymentRequired1, null, 2));
      if (paymentRequired1.accepts && paymentRequired1.accepts.length > 0) {
        const req = paymentRequired1.accepts[0];
        const amountInSmallestUnit = BigInt(req.amount);
        const decimals = 6; // USDC has 6 decimals
        const actualAmount = Number(amountInSmallestUnit) / Math.pow(10, decimals);
        console.log(`   Amount: ${actualAmount} ${req.extra?.name || 'USDC'}`);
        console.log(`   Network: ${req.network}`);
        console.log(`   Pay To: ${req.payTo}`);
      }
    } catch (error) {
      console.error("Error parsing payment required:", error.message);
      const paymentRequired = response1.headers.get("PAYMENT-REQUIRED");
      if (paymentRequired) {
        console.log("Payment Required Header:", paymentRequired.substring(0, 100) + "...");
      }
    }
  } else {
    try {
      const paymentResponse1 = httpClient1.getPaymentSettleResponse(
        (name) => response1.headers.get(name)
      );
      if (paymentResponse1) {
        console.log("Payment Response:", JSON.stringify(paymentResponse1, null, 2));
        if (paymentResponse1.success) {
          const amountInSmallestUnit = BigInt(paymentResponse1.requirements.amount);
          const decimals = 6; // USDC has 6 decimals
          const actualAmount = Number(amountInSmallestUnit) / Math.pow(10, decimals);
          console.log(`Payment successful!`);
          console.log(`   Transaction: ${explorerUrl}${paymentResponse1.transaction}`);
          console.log(`   Network: ${paymentResponse1.network}`);
          console.log(`   Amount: ${actualAmount} ${paymentResponse1.requirements.extra.name}`);
        }
      }
    } catch (error) {
      console.log("No payment settlement information found in headers");
    }
  }
  console.log("=".repeat(60));

  // Now get the data
  const data1 = await response1.json();

// Display Bitquery API response in a readable format
console.log("\nBitquery API Response:");
console.log("=".repeat(60));
console.log(JSON.stringify(data1, null, 2));
console.log("=".repeat(60));

// Extract and display key information
if (typeof data1 === 'number' || typeof data1 === 'string') {
  console.log(`\nLatest Token Price: ${data1}`);
} else if (data1?.data?.Trading?.Tokens) {
  const tokens = data1.data.Trading.Tokens;
  console.log("\nToken Price Data:");
  tokens.forEach((token, index) => {
    console.log(`\nToken ${index + 1}:`);
    if (token.Price?.Ohlc?.Close) {
      console.log(`  Price (Close): ${token.Price.Ohlc.Close}`);
    }
    console.log(`  Full Data:`, JSON.stringify(token, null, 4));
  });
} else {
  console.log("\nToken Price Data:");
  console.log(JSON.stringify(data1, null, 4));
}
} catch (error) {
  console.error("\nError in TEST 1:", error.message);
  if (error.stack) {
    console.error("Stack:", error.stack);
  }
}

// ============================================================================
// TEST 2: OHLC Endpoint
// ============================================================================
console.log("\n" + "=".repeat(60));
console.log("TEST 2: Testing /ohlc endpoint");
console.log("=".repeat(60));

try {
  const response2 = await fetchWithPayment("http://localhost:4021/ohlc", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ 
      tokenAddress: "cbbtcf3aa214zXHbiAZQwf4122FBYbraNdFqgw4iMij",
      interval: 60 // 1 minute interval (optional, defaults to 60)
    }),
  });

  // First, check payment status
  console.log("\nPayment Status Check:");
  console.log("=".repeat(60));
  console.log(`Response Status: ${response2.status} ${response2.statusText}`);

  const httpClient2 = new x402HTTPClient(client);
  
  if (response2.status === 402) {
    console.log("Payment Required (402)");
    try {
      const body2 = await response2.clone().json().catch(() => ({}));
      const paymentRequired2 = httpClient2.getPaymentRequiredResponse(
        (name) => response2.headers.get(name),
        body2
      );
      console.log("Payment Required Response:", JSON.stringify(paymentRequired2, null, 2));
      if (paymentRequired2.accepts && paymentRequired2.accepts.length > 0) {
        const req = paymentRequired2.accepts[0];
        const amountInSmallestUnit = BigInt(req.amount);
        const decimals = 6; // USDC has 6 decimals
        const actualAmount = Number(amountInSmallestUnit) / Math.pow(10, decimals);
        console.log(`   Amount: ${actualAmount} ${req.extra?.name || 'USDC'}`);
        console.log(`   Network: ${req.network}`);
        console.log(`   Pay To: ${req.payTo}`);
      }
    } catch (error) {
      console.error("Error parsing payment required:", error.message);
      const paymentRequired = response2.headers.get("PAYMENT-REQUIRED");
      if (paymentRequired) {
        console.log("Payment Required Header:", paymentRequired.substring(0, 100) + "...");
      }
    }
  } else {
    try {
      const paymentResponse2 = httpClient2.getPaymentSettleResponse(
        (name) => response2.headers.get(name)
      );
      if (paymentResponse2) {
        console.log("Payment Response:", JSON.stringify(paymentResponse2, null, 2));
        if (paymentResponse2.success) {
          const amountInSmallestUnit = BigInt(paymentResponse2.requirements.amount);
          const decimals = 6; // USDC has 6 decimals
          const actualAmount = Number(amountInSmallestUnit) / Math.pow(10, decimals);
          console.log(`Payment successful!`);
          console.log(`   Transaction: ${explorerUrl}${paymentResponse2.transaction}`);
          console.log(`   Network: ${paymentResponse2.network}`);
          console.log(`   Amount: ${actualAmount} ${paymentResponse2.requirements.extra.name}`);
        }
      }
    } catch (error) {
      console.log("No payment settlement information found in headers");
    }
  }
  console.log("=".repeat(60));

  // Now get the data
  const data2 = await response2.json();

// Display Bitquery API response in a readable format
console.log("\nBitquery API Response:");
console.log("=".repeat(60));
console.log(JSON.stringify(data2, null, 2));
console.log("=".repeat(60));

// Extract and display key information
if (Array.isArray(data2) && data2.length > 0) {
  console.log(`\nOHLC Data (${data2.length} records):`);
  data2.forEach((token, index) => {
    console.log(`\nRecord ${index + 1}:`);
    if (token.Interval?.Time) {
      console.log(`  Start: ${token.Interval.Time.Start}`);
      console.log(`  End: ${token.Interval.Time.End}`);
    }
    if (token.Price?.Ohlc?.Close) {
      console.log(`  Close Price: ${token.Price.Ohlc.Close}`);
    }
  });
} else {
  console.log("\nOHLC Data:");
  console.log(JSON.stringify(data2, null, 4));
}
} catch (error) {
  console.error("\nError in TEST 2:", error.message);
  if (error.stack) {
    console.error("Stack:", error.stack);
  }
}

// ============================================================================
// TEST 3: Average Price Endpoint
// ============================================================================
console.log("\n" + "=".repeat(60));
console.log("TEST 3: Testing /average-price endpoint");
console.log("=".repeat(60));

try {
  const response3 = await fetchWithPayment("http://localhost:4021/average-price", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ 
      tokenAddress: "cbbtcf3aa214zXHbiAZQwf4122FBYbraNdFqgw4iMij",
      interval: 60 // 1 minute interval (optional, defaults to 60)
    }),
  });

  // First, check payment status
  console.log("\nPayment Status Check:");
  console.log("=".repeat(60));
  console.log(`Response Status: ${response3.status} ${response3.statusText}`);

  const httpClient3 = new x402HTTPClient(client);
  
  if (response3.status === 402) {
    console.log("Payment Required (402)");
    try {
      const body3 = await response3.clone().json().catch(() => ({}));
      const paymentRequired3 = httpClient3.getPaymentRequiredResponse(
        (name) => response3.headers.get(name),
        body3
      );
      console.log("Payment Required Response:", JSON.stringify(paymentRequired3, null, 2));
      if (paymentRequired3.accepts && paymentRequired3.accepts.length > 0) {
        const req = paymentRequired3.accepts[0];
        const amountInSmallestUnit = BigInt(req.amount);
        const decimals = 6; // USDC has 6 decimals
        const actualAmount = Number(amountInSmallestUnit) / Math.pow(10, decimals);
        console.log(`   Amount: ${actualAmount} ${req.extra?.name || 'USDC'}`);
        console.log(`   Network: ${req.network}`);
        console.log(`   Pay To: ${req.payTo}`);
      }
    } catch (error) {
      console.error("Error parsing payment required:", error.message);
      const paymentRequired = response3.headers.get("PAYMENT-REQUIRED");
      if (paymentRequired) {
        console.log("Payment Required Header:", paymentRequired.substring(0, 100) + "...");
      }
    }
  } else {
    try {
      const paymentResponse3 = httpClient3.getPaymentSettleResponse(
        (name) => response3.headers.get(name)
      );
      if (paymentResponse3) {
        console.log("Payment Response:", JSON.stringify(paymentResponse3, null, 2));
        if (paymentResponse3.success) {
          const amountInSmallestUnit = BigInt(paymentResponse3.requirements.amount);
          const decimals = 6; // USDC has 6 decimals
          const actualAmount = Number(amountInSmallestUnit) / Math.pow(10, decimals);
          console.log(`Payment successful!`);
          console.log(`   Transaction: ${explorerUrl}${paymentResponse3.transaction}`);
          console.log(`   Network: ${paymentResponse3.network}`);
          console.log(`   Amount: ${actualAmount} ${paymentResponse3.requirements.extra.name}`);
        }
      }
    } catch (error) {
      console.log("No payment settlement information found in headers");
    }
  }
  console.log("=".repeat(60));

  // Now get the data
  const data3 = await response3.json();

// Display Bitquery API response in a readable format
console.log("\nBitquery API Response:");
console.log("=".repeat(60));
console.log(JSON.stringify(data3, null, 2));
console.log("=".repeat(60));

// Extract and display key information
if (Array.isArray(data3) && data3.length > 0) {
  console.log(`\nAverage Price Data (${data3.length} records):`);
  data3.forEach((token, index) => {
    console.log(`\nRecord ${index + 1}:`);
    if (token.Interval?.Time) {
      console.log(`  Start: ${token.Interval.Time.Start}`);
      console.log(`  End: ${token.Interval.Time.End}`);
    }
    if (token.Price?.Average) {
      const avg = token.Price.Average;
      console.log(`  Mean: ${avg.Mean}`);
      console.log(`  Simple Moving Average: ${avg.SimpleMoving}`);
      console.log(`  Weighted Simple Moving Average: ${avg.WeightedSimpleMoving}`);
      console.log(`  Exponential Moving Average: ${avg.ExponentialMoving}`);
    }
  });
} else {
  console.log("\nAverage Price Data:");
  console.log(JSON.stringify(data3, null, 4));
}
} catch (error) {
  console.error("\nError in TEST 3:", error.message);
  if (error.stack) {
    console.error("Stack:", error.stack);
  }
}

// ============================================================================
// TEST 4: Volume Endpoint
// ============================================================================
console.log("\n" + "=".repeat(60));
console.log("TEST 4: Testing /volume endpoint");
console.log("=".repeat(60));

try {
  const response4 = await fetchWithPayment("http://localhost:4021/volume", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ 
      tokenAddress: "cbbtcf3aa214zXHbiAZQwf4122FBYbraNdFqgw4iMij",
      interval: 3600 // 1 hour interval (optional, defaults to 60)
    }),
  });

  // First, check payment status
  console.log("\nPayment Status Check:");
  console.log("=".repeat(60));
  console.log(`Response Status: ${response4.status} ${response4.statusText}`);

  const httpClient4 = new x402HTTPClient(client);
  
  if (response4.status === 402) {
    console.log("Payment Required (402)");
    try {
      const body4 = await response4.clone().json().catch(() => ({}));
      const paymentRequired4 = httpClient4.getPaymentRequiredResponse(
        (name) => response4.headers.get(name),
        body4
      );
      console.log("Payment Required Response:", JSON.stringify(paymentRequired4, null, 2));
      if (paymentRequired4.accepts && paymentRequired4.accepts.length > 0) {
        const req = paymentRequired4.accepts[0];
        const amountInSmallestUnit = BigInt(req.amount);
        const decimals = 6; // USDC has 6 decimals
        const actualAmount = Number(amountInSmallestUnit) / Math.pow(10, decimals);
        console.log(`   Amount: ${actualAmount} ${req.extra?.name || 'USDC'}`);
        console.log(`   Network: ${req.network}`);
        console.log(`   Pay To: ${req.payTo}`);
      }
    } catch (error) {
      console.error("Error parsing payment required:", error.message);
      const paymentRequired = response4.headers.get("PAYMENT-REQUIRED");
      if (paymentRequired) {
        console.log("Payment Required Header:", paymentRequired.substring(0, 100) + "...");
      }
    }
  } else {
    try {
      const paymentResponse4 = httpClient4.getPaymentSettleResponse(
        (name) => response4.headers.get(name)
      );
      if (paymentResponse4) {
        console.log("Payment Response:", JSON.stringify(paymentResponse4, null, 2));
        if (paymentResponse4.success) {
          const amountInSmallestUnit = BigInt(paymentResponse4.requirements.amount);
          const decimals = 6; // USDC has 6 decimals
          const actualAmount = Number(amountInSmallestUnit) / Math.pow(10, decimals);
          console.log(`Payment successful!`);
          console.log(`   Transaction: ${explorerUrl}${paymentResponse4.transaction}`);
          console.log(`   Network: ${paymentResponse4.network}`);
          console.log(`   Amount: ${actualAmount} ${paymentResponse4.requirements.extra.name}`);
        }
      }
    } catch (error) {
      console.log("No payment settlement information found in headers");
    }
  }
  console.log("=".repeat(60));

  // Now get the data
  const data4 = await response4.json();

// Display Bitquery API response in a readable format
console.log("\nBitquery API Response:");
console.log("=".repeat(60));
console.log(JSON.stringify(data4, null, 2));
console.log("=".repeat(60));

// Extract and display key information
if (Array.isArray(data4) && data4.length > 0) {
  console.log(`\nVolume Data (${data4.length} records):`);
  data4.forEach((token, index) => {
    console.log(`\nRecord ${index + 1}:`);
    if (token.Interval?.Time) {
      console.log(`  Start: ${token.Interval.Time.Start}`);
      console.log(`  End: ${token.Interval.Time.End}`);
    }
    if (token.Volume) {
      console.log(`  Base Volume: ${token.Volume.Base}`);
      console.log(`  Quote Volume: ${token.Volume.Quote}`);
      console.log(`  USD Volume: ${token.Volume.Usd}`);
    }
  });
} else {
  console.log("\nVolume Data:");
  console.log(JSON.stringify(data4, null, 4));
}
} catch (error) {
  console.error("\nError in TEST 4:", error.message);
  if (error.stack) {
    console.error("Stack:", error.stack);
  }
}

console.log("\n" + "=".repeat(60));
console.log("All tests completed!");
console.log("=".repeat(60) + "\n");