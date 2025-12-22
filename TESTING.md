# Testing Guide for x402 Bitquery Service

## Prerequisites

1. **Wallet Setup**: You need a wallet with USDC on Base Sepolia testnet
   - Network: Base Sepolia (Chain ID: 84532)
   - Testnet USDC token
   - Some testnet ETH for gas fees

2. **Get Testnet Tokens**:
   - Base Sepolia ETH: https://www.coinbase.com/faucets/base-ethereum-goerli-faucet
   - You'll need USDC on Base Sepolia for payments

## Step 1: Start the Server

```bash
npm start
```

Or for development with auto-reload:
```bash
npm run dev
```

The server should start on port 4021 and you should see:
```
Paid Bitquery API running on :4021
```

## Step 2: Test Without Payment (Should Fail)

First, test that the endpoint is protected:

```bash
curl -X POST http://localhost:4021/bitquery/eth-transfers \
  -H "Content-Type: application/json" \
  -d '{}'
```

Expected response: A payment challenge/402 response from x402 middleware indicating payment is required.

## Step 3: Get Payment Instructions

The x402 middleware will return payment instructions when you try to access the endpoint. The response should include:
- Payment amount: $0.002 USDC
- Network: Base Sepolia (eip155:84532)
- PayTo address: `0x4C10192b9F6F4781BA5fb27145743630e4B0D3F8`
- Payment instructions/details

## Step 4: Make Payment Using x402 Client

You'll need to use an x402 client to make the payment. The workflow typically involves:

1. **Get the payment challenge** from the API response
2. **Sign the payment transaction** using your wallet
3. **Submit the payment proof** back to the API

### Using curl with x402 headers:

After making the payment through x402 protocol, you'll receive a payment token/proof that needs to be included in subsequent requests.

## Step 5: Test With Payment

Once payment is made, you should be able to access the endpoint:

```bash
curl -X POST http://localhost:4021/bitquery/eth-transfers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <payment-token>" \
  -d '{}'
```

Expected response: JSON data from Bitquery containing Ethereum transfer information.

## Step 6: Verify Payment Received

Check your wallet at `0x4C10192b9F6F4781BA5fb27145743630e4B0D3F8` on Base Sepolia to verify you received the payment.

## Alternative: Using x402 Browser Extension/SDK

If you have an x402 browser extension or SDK:

1. Make sure your wallet is connected to Base Sepolia
2. Ensure you have USDC tokens
3. Navigate to the endpoint
4. The x402 client should automatically handle the payment flow
5. After payment, the API call should succeed

## Troubleshooting

1. **Server not starting**: Check if port 4021 is already in use
2. **Payment not working**: Verify you're on Base Sepolia testnet
3. **Bitquery API error**: Check if your auth token is valid
4. **402 Payment Required**: This is expected - it means the middleware is working correctly

## Testing Checklist

- [ ] Server starts successfully
- [ ] Unpaid request returns 402/payment challenge
- [ ] Payment can be initiated
- [ ] Payment is received at the specified address
- [ ] Paid request returns Bitquery data
- [ ] Response contains Ethereum transfer information

