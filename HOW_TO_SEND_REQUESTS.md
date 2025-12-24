# How to Send Requests to the API

This guide shows you how to send requests to the x402 Bitquery API endpoints.

## Prerequisites

1. **Start the server** (if running locally):
   ```bash
   npm start
   ```
   The server runs on `http://localhost:4021` by default.

2. **Set up your environment**:
   - Make sure you have `EVM_PRIVATE_KEY` in your `.env` file
   - For mainnet (optional): Add `CDP_API_KEY_ID` and `CDP_API_KEY_SECRET` to use CDP facilitator
   - You need USDC on Base Sepolia testnet for payments

---

## Method 1: Using x402 Payment Protocol (Recommended)

The x402 payment protocol automatically handles payments. Use `wrapFetchWithPayment` to wrap your fetch calls.

### Setup Code

```javascript
import { wrapFetchWithPayment } from "@x402/fetch";
import { x402Client } from "@x402/core/client";
import { registerExactEvmScheme } from "@x402/evm/exact/client";
import { privateKeyToAccount } from "viem/accounts";
import dotenv from "dotenv";

dotenv.config();

// Create signer from private key
const privateKey = process.env.EVM_PRIVATE_KEY?.trim();
const privateKeyHex = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;
const signer = privateKeyToAccount(privateKeyHex);

// Setup x402 client
const client = new x402Client();
registerExactEvmScheme(client, { signer });

// Wrap fetch with payment handling
const fetchWithPayment = wrapFetchWithPayment(fetch, client);
```

### Example: Latest Price

```javascript
const response = await fetchWithPayment("http://localhost:4021/latest-price", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ 
    tokenAddress: "cbbtcf3aa214zXHbiAZQwf4122FBYbraNdFqgw4iMij" 
  }),
});

const data = await response.json();
console.log(data);
```

### Example: OHLC Data

```javascript
const response = await fetchWithPayment("http://localhost:4021/ohlc", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ 
    tokenAddress: "cbbtcf3aa214zXHbiAZQwf4122FBYbraNdFqgw4iMij",
    interval: 60 // Optional: time interval in seconds (default: 60)
  }),
});

const data = await response.json();
console.log(data);
```

### Example: Average Price

```javascript
const response = await fetchWithPayment("http://localhost:4021/average-price", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ 
    tokenAddress: "cbbtcf3aa214zXHbiAZQwf4122FBYbraNdFqgw4iMij",
    interval: 60 // Optional: time interval in seconds (default: 60)
  }),
});

const data = await response.json();
console.log(data);
```

### Example: Volume Data

```javascript
const response = await fetchWithPayment("http://localhost:4021/volume", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ 
    tokenAddress: "cbbtcf3aa214zXHbiAZQwf4122FBYbraNdFqgw4iMij",
    interval: 3600 // Optional: time interval in seconds (default: 60)
  }),
});

const data = await response.json();
console.log(data);
```

---

## Method 2: Using curl (Manual Payment Handling)

When using curl, you'll need to handle the payment flow manually:

1. **First request** - Get payment challenge (402 response)
2. **Make payment** - Send USDC transaction
3. **Second request** - Include payment authorization headers

### Step 1: Get Payment Challenge

```bash
curl -X POST http://localhost:4021/latest-price \
  -H "Content-Type: application/json" \
  -d '{"tokenAddress": "cbbtcf3aa214zXHbiAZQwf4122FBYbraNdFqgw4iMij"}'
```

You'll receive a `402 Payment Required` response with a `PAYMENT-REQUIRED` header containing payment instructions.

### Step 2: Make Payment

Follow the payment instructions from the `PAYMENT-REQUIRED` header to send USDC on Base Sepolia.

### Step 3: Include Payment Authorization

After payment, include the payment authorization headers in subsequent requests:

```bash
curl -X POST http://localhost:4021/latest-price \
  -H "Content-Type: application/json" \
  -H "PAYMENT-AUTHORIZATION: <authorization-header>" \
  -d '{"tokenAddress": "cbbtcf3aa214zXHbiAZQwf4122FBYbraNdFqgw4iMij"}'
```

---

## Method 3: Using the Test Script

The easiest way to test all endpoints is using the provided test script:

```bash
# Make sure server is running first
npm start

# In another terminal, run the test
npm test
# or
node payTest.js
```

This will test all 4 endpoints automatically with proper payment handling.

---

## Request Examples for All Endpoints

### 1. `/latest-price`

**Request:**
```json
{
  "tokenAddress": "cbbtcf3aa214zXHbiAZQwf4122FBYbraNdFqgw4iMij"
}
```

**Response:**
```json
"1234.56"
```

### 2. `/ohlc`

**Request:**
```json
{
  "tokenAddress": "cbbtcf3aa214zXHbiAZQwf4122FBYbraNdFqgw4iMij",
  "interval": 60
}
```

**Response:**
```json
[
  {
    "Interval": {
      "Time": {
        "Start": "2024-01-01T00:00:00Z",
        "End": "2024-01-01T00:01:00Z"
      }
    },
    "Price": {
      "Ohlc": {
        "Close": "1234.56"
      }
    }
  }
]
```

### 3. `/average-price`

**Request:**
```json
{
  "tokenAddress": "cbbtcf3aa214zXHbiAZQwf4122FBYbraNdFqgw4iMij",
  "interval": 60
}
```

**Response:**
```json
[
  {
    "Interval": {
      "Time": {
        "Start": "2024-01-01T00:00:00Z",
        "End": "2024-01-01T00:01:00Z"
      }
    },
    "Price": {
      "Average": {
        "Mean": "1234.56",
        "SimpleMoving": "1235.00",
        "WeightedSimpleMoving": "1234.75",
        "ExponentialMoving": "1234.60"
      }
    }
  }
]
```

### 4. `/volume`

**Request:**
```json
{
  "tokenAddress": "cbbtcf3aa214zXHbiAZQwf4122FBYbraNdFqgw4iMij",
  "interval": 3600
}
```

**Response:**
```json
[
  {
    "Interval": {
      "Time": {
        "Start": "2024-01-01T00:00:00Z",
        "End": "2024-01-01T01:00:00Z"
      }
    },
    "Volume": {
      "Base": "1000000.0",
      "Quote": "1234567.89",
      "Usd": "1234567.89"
    }
  }
]
```

---

## Payment Information

- **Cost per request**: 0.001 USDC
- **Network**: Base Sepolia (testnet)
- **Chain ID**: 84532
- **Payment is automatic** when using `wrapFetchWithPayment`

---

## Troubleshooting

1. **Connection Refused**: Make sure the server is running (`npm start`)
2. **401 Unauthorized**: Check your `EVM_PRIVATE_KEY` in `.env`
3. **402 Payment Required**: This is normal for the first request - payment will be handled automatically
4. **Insufficient Funds**: Make sure your wallet has USDC on Base Sepolia testnet

