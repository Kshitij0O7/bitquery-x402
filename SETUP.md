# Setup and Running Instructions

## Prerequisites

Before running this project, make sure you have:
- **Node.js** (v18 or higher recommended)
- **npm** (comes with Node.js)
- A **Bitquery API key** (get one at [bitquery.io](https://account.bitquery.io/auth/signup/))

## Step 1: Install Dependencies

Open your terminal in the project directory and run:

```bash
npm install
```

This will install all required packages including:
- Express (web server)
- x402 payment protocol libraries
- Axios (for API calls)
- Other dependencies

## Step 2: Configure Environment Variables

Create a `.env` file in the root directory with your Bitquery API key:

```bash
# Create .env file
touch .env
```

Add the following to your `.env` file:

```
BITQUERY_API_KEY=your_bitquery_api_key_here
EVM_PRIVATE_KEY=your_private_key_here
BYPASS_PAYMENT=true
```

**Required Environment Variables:**

1. **`BITQUERY_API_KEY`** ⚠️ **REQUIRED**
   - **This is mandatory** - APIs won't work without it!
   - Get your free API key from [bitquery.io](https://account.bitquery.io/auth/signup/)
   - Used to authenticate requests to Bitquery's GraphQL API
   - Without this, all API endpoints will return errors

2. **`EVM_PRIVATE_KEY`** (Optional, but needed for payments)
   - Only needed if you want to test with actual payments
   - Used for:
     - Testing with `payTest.js` (for making payments via x402 protocol)
     - Using the browser UI payment proxy (for automatic payment handling in the frontend)
   - For the private key, you can include or exclude the `0x` prefix - both work
   - Make sure the wallet has USDC on Base Sepolia testnet if testing payments

3. **`BYPASS_PAYMENT`** (Optional)
   - Set to `true` to bypass payment requirements for free testing
   - Set to `false` or remove it to enable payments (requires `EVM_PRIVATE_KEY`)

## Step 3: Run the Server

You have two options to run the server:

### Option A: Development Mode (with auto-reload)
```bash
npm run dev
```

This uses `nodemon` to automatically restart the server when you make changes.

### Option B: Production Mode
```bash
npm start
```

The server will start on **port 4021** and you should see:
```
Paid Bitquery API running on :4021
```

## Step 4: Access the UI

Once the server is running, open your web browser and navigate to:

```
http://localhost:4021
```

You'll see a beautiful UI with forms to test all 4 API endpoints:
1. **Latest Price** - Get the latest token price
2. **OHLC Data** - Get Open, High, Low, Close candle data
3. **Average Price** - Get average prices with moving averages
4. **Volume Data** - Get trading volume information

## Step 5: Testing the APIs

### Using the Web UI

1. Enter a token address in any of the forms
2. Click the submit button
3. View the response in the formatted output below

**Payment Handling:**
- **If `BYPASS_PAYMENT=true`**: APIs work for free (no payment required) - perfect for testing!
- **If payment is enabled**: 
  - The UI automatically uses a backend payment proxy that handles x402 payments
  - Make sure `EVM_PRIVATE_KEY` is set in your `.env` file
  - The proxy uses your private key to make payments automatically (0.001 USDC per request)
  - You'll see payment transaction details in the response
  - Make sure you have USDC on Base Sepolia testnet in the wallet associated with your private key

### Using the Test Script

To test the APIs with actual payments, use the provided test script:

```bash
npm test
```

This will:
- Make requests to all 4 endpoints
- Handle x402 payments automatically
- Display formatted results in the terminal

Make sure you have:
- USDC on Base Sepolia testnet
- Your `EVM_PRIVATE_KEY` set in `.env`

## API Endpoints

All endpoints are POST requests to `http://localhost:4021`:

- `POST /latest-price` - Get latest token price
- `POST /ohlc` - Get OHLC candle data
- `POST /average-price` - Get average price with moving averages
- `POST /volume` - Get trading volume data

See `README.md` for detailed API documentation.

## Troubleshooting

### Server won't start
- Check if port 4021 is already in use
- Make sure all dependencies are installed (`npm install`)
- Verify your Node.js version (`node --version`)

### "Payment Required" errors in UI
- If you see 402 errors, check that `EVM_PRIVATE_KEY` is set in your `.env` file
- The payment proxy requires the private key to handle payments automatically
- Alternatively, set `BYPASS_PAYMENT=true` to test without payments
- Use `npm test` to test with payments via the command line

### API errors
- **Most common issue**: `BITQUERY_API_KEY` is missing or incorrect
  - Verify your `BITQUERY_API_KEY` is set correctly in `.env`
  - Make sure there are no extra spaces or quotes around the key
  - Get a new key from [bitquery.io](https://account.bitquery.io/auth/signup/) if needed
- Check that the token address is valid
- Ensure you have an active Bitquery account
- Check server console for specific error messages

### Can't access the UI
- Make sure the server is running
- Check the URL: `http://localhost:4021`
- Try clearing your browser cache

## Project Structure

```
Bitquery-x402/
├── endpoints/          # API endpoint handlers
│   ├── latest-price.js
│   ├── ohlc.js
│   ├── average-price.js
│   └── volume.js
├── public/            # Static files (UI)
│   └── index.html
├── index.js           # Express server setup
├── payTest.js         # Test script with payments
├── package.json       # Dependencies
└── .env              # Environment variables (create this)
```

## Next Steps

- Integrate x402 payment handling in the frontend for full browser-based testing
- Add more token addresses to test with
- Customize the UI styling
- Add error handling and validation

Happy coding! 🚀

