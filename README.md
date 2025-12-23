# x402 Bitquery Service

A paid API microservice that provides access to Bitquery blockchain data through the x402 payment protocol. Pay-per-request using USDC on Base Sepolia to access real-time cryptocurrency price data, OHLC candles, moving averages, and trading volume.

## 📚 Documentation

For comprehensive documentation on Bitquery's crypto price APIs, OHLC data, and trading analytics:

**[Bitquery Crypto Price APIs Documentation](https://docs.bitquery.io/docs/category/crypto-price-apis/?utm_source=github&utm_medium=x402_service&utm_campaign=x402_hackathon_project)**

## 📡 API Endpoints

All endpoints require payment of **0.001 USDC** on Base Sepolia (testnet) and accept POST requests with JSON body.

### Base URL
```
https://your-domain.com
```

**Payment Protocol:** All endpoints use the [x402 protocol](https://x402.org) for automatic payment handling. Include payment authorization headers when making requests.

---

### POST `/latest-price`

Retrieves the latest closing price for a specific token.

#### Request

```bash
POST /latest-price
Content-Type: application/json

{
  "tokenAddress": "string"  // Required: Token contract address
}
```

#### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `tokenAddress` | string | ✅ Yes | The contract address of the token |

#### Success Response (200 OK)

Returns a single number representing the latest closing price.

```json
"1234.56"
```

---

### POST `/ohlc`

Retrieves OHLC (Open, High, Low, Close) candle data for a token with specified time intervals.

#### Request

```bash
POST /ohlc
Content-Type: application/json

{
  "tokenAddress": "string",  // Required: Token contract address
  "interval": number         // Optional: Time interval in seconds (default: 60)
}
```

#### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `tokenAddress` | string | ✅ Yes | The contract address of the token |
| `interval` | number | ❌ No | Time interval in seconds (default: 60) |

#### Success Response (200 OK)

Returns an array of OHLC data objects.

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

#### Response Structure

| Field | Type | Description |
|-------|------|-------------|
| `Interval.Time.Start` | string | Start time of the interval (ISO 8601) |
| `Interval.Time.End` | string | End time of the interval (ISO 8601) |
| `Price.Ohlc.Close` | number | Closing price for the interval |

---

### POST `/average-price`

Retrieves average price data with various moving averages (Mean, Simple Moving, Weighted Simple Moving, Exponential Moving) for a token.

#### Request

```bash
POST /average-price
Content-Type: application/json

{
  "tokenAddress": "string",  // Required: Token contract address
  "interval": number         // Optional: Time interval in seconds (default: 60)
}
```

#### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `tokenAddress` | string | ✅ Yes | The contract address of the token |
| `interval` | number | ❌ No | Time interval in seconds (default: 60) |

#### Success Response (200 OK)

Returns an array of average price data objects.

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

#### Response Structure

| Field | Type | Description |
|-------|------|-------------|
| `Interval.Time.Start` | string | Start time of the interval (ISO 8601) |
| `Interval.Time.End` | string | End time of the interval (ISO 8601) |
| `Price.Average.Mean` | number | Mean/average price |
| `Price.Average.SimpleMoving` | number | Simple moving average |
| `Price.Average.WeightedSimpleMoving` | number | Weighted simple moving average |
| `Price.Average.ExponentialMoving` | number | Exponential moving average |

---

### POST `/volume`

Retrieves trading volume data (Base, Quote, and USD) for a token.

#### Request

```bash
POST /volume
Content-Type: application/json

{
  "tokenAddress": "string",  // Required: Token contract address
  "interval": number         // Optional: Time interval in seconds (default: 60)
}
```

#### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `tokenAddress` | string | ✅ Yes | The contract address of the token |
| `interval` | number | ❌ No | Time interval in seconds (default: 60) |

#### Success Response (200 OK)

Returns an array of volume data objects.

```json
[
  {
    "Interval": {
      "Time": {
        "Start": "2024-01-01T00:00:00Z",
        "End": "2024-01-01T00:01:00Z"
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

#### Response Structure

| Field | Type | Description |
|-------|------|-------------|
| `Interval.Time.Start` | string | Start time of the interval (ISO 8601) |
| `Interval.Time.End` | string | End time of the interval (ISO 8601) |
| `Volume.Base` | number | Volume in base token |
| `Volume.Quote` | number | Volume in quote token |
| `Volume.Usd` | number | Volume in USD |

---

## 🔌 Using x402 Payment Protocol

All endpoints require payment via the x402 protocol. When making a request:

1. **First request**: You'll receive a `402 Payment Required` response with payment instructions
2. **Payment**: Complete the payment using an x402-compatible wallet
3. **Subsequent requests**: Include payment authorization headers

For implementation details, see the [x402 documentation](https://x402.org) or check the `payTest.js` file for examples.

## ⚠️ Error Responses

### 400 Bad Request
```json
{
  "error": "Bad Request",
  "message": "tokenAddress is required in request body"
}
```

### 402 Payment Required
- Status: `402 Payment Required`
- Header: `PAYMENT-REQUIRED` (contains payment challenge)
- Body: `{}`

### 500 Internal Server Error
```json
{
  "error": "Internal Server Error",
  "message": "Error description"
}
```

## 📧 Contact

For inquiries about this service or Bitquery APIs:
- **Email:** sales@bitquery.io

---

**Built for the x402 Hackathon** 🎉
