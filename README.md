# x402 Bitquery Service

A paid API service that provides access to Bitquery blockchain data through the x402 payment protocol. Users pay a small fee (0.001 USDC) per request to access token price data via Bitquery's GraphQL API.

## 🚀 Introduction

This project implements a monetized API gateway for Bitquery blockchain data using the [x402 protocol](https://x402.org). It allows API providers to charge users directly through cryptocurrency payments (USDC on Base Sepolia testnet), enabling micro-payments for API access without traditional payment infrastructure.

**Key Features:**
- 💰 Pay-per-request model using USDC on Base Sepolia
- 🔒 Secure payment verification via x402 protocol
- 📊 Access to Bitquery GraphQL API for blockchain data
- ⚡ Fast Express.js server with x402 middleware
- 🧪 Built-in test client for end-to-end testing

## 📋 Prerequisites

Before you begin, ensure you have the following:

- **Node.js** (v18 or higher)
- **npm** or **yarn** package manager
- **Wallet** with USDC tokens on Base Sepolia testnet (for testing)
- **Bitquery API Key** ([Get one here](https://bitquery.io/))
- **Private Key** for your wallet (for the client test)

## 🛠️ Installation

1. **Clone the repository** (or navigate to the project directory):
   ```bash
   git clone https://github.com/Kshitij0O7/bitquery-x402
   cd bitquery-x402
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Create a `.env` file** in the root directory:
   ```bash
   touch .env
   ```

4. **Configure environment variables** in `.env`:
   ```env
   BITQUERY_API_KEY=your_bitquery_api_key_here
   EVM_PRIVATE_KEY=your_wallet_private_key_without_0x_prefix
   ```

   **Important Security Note:** Never commit your `.env` file or private keys to version control!

## ⚙️ Configuration

### Server Configuration

The server configuration is in `index.js`:

- **Port**: `4021` (default)
- **Payment Amount**: `$0.001` USDC per request
- **Network**: Base Sepolia testnet (`eip155:84532`)
- **Recipient Address**: `0x4C10192b9F6F4781BA5fb27145743630e4B0D3F8` (update this to your wallet address)

### Payment Settings

To change the payment amount or recipient address, modify the `paymentMiddleware` configuration in `index.js`:

```javascript
"POST /latest-price": {
  accepts: [
    {
      scheme: "exact",
      price: "$0.001",  // Change this to your desired price
      network: "eip155:84532",
      payTo: "YOUR_WALLET_ADDRESS",  // Update this
    },
  ],
  // ...
}
```

## 🚦 Usage

### Starting the Server

```bash
npm start
```

The server will start on `http://localhost:4021` and display:
```
Paid Bitquery API running on :4021
```

### Making a Request (Without Payment)

If you try to access the endpoint without payment, you'll receive a `402 Payment Required` response:

```bash
curl -X POST http://localhost:4021/latest-price \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Expected Response:**
- Status Code: `402 Payment Required`
- Header: `PAYMENT-REQUIRED` (contains base64-encoded payment challenge)
- Body: `{}`

### Making a Paid Request

To access the API, you need to pay using the x402 protocol. Here are two methods:

#### Method 1: Using the Test Client

The project includes a test client (`payTest.js`) that demonstrates how to make paid requests:

```bash
npm test
```

This will:
1. Automatically handle the payment flow
2. Make the request to the API
3. Display the response data
4. Show payment settlement information

**Requirements:**
- `.env` file with `EVM_PRIVATE_KEY` set
- Wallet must have USDC on Base Sepolia testnet
- Server must be running (`npm start` in another terminal)

#### Method 2: Using x402 Client Library

In your own application, you can use the x402 client libraries:

```javascript
import { wrapFetchWithPayment } from "@x402/fetch";
import { x402Client } from "@x402/core/client";
import { registerExactEvmScheme } from "@x402/evm/exact/client";
import { privateKeyToAccount } from "viem/accounts";

// Setup client with your wallet
const signer = privateKeyToAccount(`0x${process.env.EVM_PRIVATE_KEY}`);
const client = new x402Client();
registerExactEvmScheme(client, { signer });

// Wrap fetch to handle payments automatically
const fetchWithPayment = wrapFetchWithPayment(fetch, client);

// Make request - payment is handled automatically
const response = await fetchWithPayment("http://localhost:4021/latest-price", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({}),
});

const data = await response.json();
console.log(data);
```

## 📡 API Endpoint

### POST `/latest-price`

Retrieves the latest token price data from Bitquery.

**Payment Required:** Yes (0.001 USDC on Base Sepolia)

**Request:**
```bash
POST /latest-price
Content-Type: application/json

{}
```

**Success Response (200 OK):**
```json
{
  "data": {
    "Trading": {
      "Tokens": [
        {
          "Price": {
            "Ohlc": {
              "Close": "1234.56"
            }
          }
        }
      ]
    }
  }
}
```

**Payment Required Response (402):**
- Status: `402 Payment Required`
- Header: `PAYMENT-REQUIRED` (payment challenge)
- Body: `{}`

## 🧪 Testing

### Running the Test Client

1. **Start the server** in one terminal:
   ```bash
   npm start
   ```

2. **Run the test client** in another terminal:
   ```bash
   npm test
   ```

The test client will:
- Connect to the server
- Handle the payment automatically
- Display the API response
- Show payment settlement details

### Manual Testing with cURL

**Test without payment (should return 402):**
```bash
curl -v -X POST http://localhost:4021/latest-price \
  -H "Content-Type: application/json" \
  -d '{}'
```

**View payment challenge:**
```bash
curl -X POST http://localhost:4021/latest-price \
  -H "Content-Type: application/json" \
  -d '{}' \
  -i | grep PAYMENT-REQUIRED
```

## 🔧 Getting Testnet Tokens

To test the payment functionality, you'll need:

1. **Base Sepolia ETH** (for gas fees):
   - Get from [Base Sepolia Faucet](https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet)

2. **USDC on Base Sepolia** (for payments):
   - Bridge or swap testnet tokens
   - Or use a testnet DEX to swap testnet ETH for USDC

## 🔐 Security Considerations

1. **Never expose private keys**: Always use environment variables
2. **Use `.env` files**: Never commit `.env` to version control
3. **Testnet vs Mainnet**: This project uses Base Sepolia testnet - update configuration for production
4. **API Keys**: Keep your Bitquery API key secure
5. **Wallet Security**: Use a dedicated wallet for the service, not your personal wallet

## 📁 Project Structure

```
x402-bitquery/
├── index.js          # Main server file with x402 middleware
├── payTest.js        # Test client demonstrating payment flow
├── package.json      # Dependencies and scripts
├── .env             # Environment variables (not committed)
└── README.md        # This file
```

## 🛣️ Roadmap / Customization

You can customize this service by:

1. **Adding more endpoints**: Add additional routes to `paymentMiddleware` configuration
2. **Changing pricing**: Modify the `price` field in the payment configuration
3. **Using mainnet**: Update the network from `eip155:84532` (testnet) to mainnet
4. **Different queries**: Modify the Bitquery GraphQL query in the endpoint handler
5. **Additional networks**: Support other blockchain networks via x402

## 📚 Learn More

- [x402 Protocol Documentation](https://x402.org)
- [Bitquery API Documentation](https://docs.bitquery.io/)
- [Base Sepolia Network](https://docs.base.org/base-sepolia)
- [Express.js Documentation](https://expressjs.com/)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

ISC

## ⚠️ Disclaimer

This is a demonstration project for the x402 hackathon. For production use, ensure proper security practices, error handling, and thorough testing.

---

**Built for the x402 Hackathon** 🎉

