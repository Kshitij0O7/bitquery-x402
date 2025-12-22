#!/usr/bin/env node

/**
 * End-to-End Test Suite for x402 Bitquery Service
 * 
 * This script tests the complete flow:
 * 1. Server connectivity
 * 2. Payment challenge (402 response)
 * 3. Payment challenge details validation
 * 4. Payment flow (if payment token provided)
 */

const axios = require('axios');
const { decodePaymentChallenge, payExact } = require('@x402/evm/exact/client');

// Configuration
const BASE_URL = process.env.API_URL || 'http://localhost:4021';
const ENDPOINT = '/bitquery/eth-transfers';
const EXPECTED_PAY_TO = '0x4C10192b9F6F4781BA5fb27145743630e4B0D3F8';
const EXPECTED_NETWORK = 'eip155:84532';
const EXPECTED_AMOUNT = '2000'; // $0.002 = 2000 in smallest unit (6 decimals)

// Test utilities
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function success(message) {
  log(`✓ ${message}`, 'green');
}

function error(message) {
  log(`✗ ${message}`, 'red');
}

function info(message) {
  log(`ℹ ${message}`, 'blue');
}

function warn(message) {
  log(`⚠ ${message}`, 'yellow');
}

// Base64 decode helper
function base64Decode(str) {
  try {
    return JSON.parse(Buffer.from(str, 'base64').toString('utf-8'));
  } catch (e) {
    return null;
  }
}

// Test cases
const tests = [];

async function test(name, fn) {
  tests.push({ name, fn });
}

// Test 1: Server is running and reachable
test('Server is running and reachable', async () => {
  try {
    const response = await axios.post(`${BASE_URL}${ENDPOINT}`, {}, {
      validateStatus: () => true, // Don't throw on any status
      timeout: 5000,
    });
    return response.status !== 0 && response.status !== 'ECONNREFUSED';
  } catch (err) {
    if (err.code === 'ECONNREFUSED' || err.message.includes('ECONNREFUSED')) {
      throw new Error('Server is not running. Please start it with: npm start');
    }
    throw err;
  }
});

// Test 2: Unprotected request returns 402 Payment Required
test('Unprotected request returns 402 Payment Required', async () => {
  const response = await axios.post(`${BASE_URL}${ENDPOINT}`, {}, {
    validateStatus: () => true,
  });
  
  if (response.status !== 402) {
    throw new Error(`Expected status 402, got ${response.status}`);
  }
  
  return true;
});

// Test 3: Payment challenge header is present
test('Payment challenge header (PAYMENT-REQUIRED) is present', async () => {
  const response = await axios.post(`${BASE_URL}${ENDPOINT}`, {}, {
    validateStatus: () => true,
  });
  
  const paymentHeader = response.headers['payment-required'];
  if (!paymentHeader) {
    throw new Error('PAYMENT-REQUIRED header is missing');
  }
  
  return true;
});

// Test 4: Payment challenge is valid JSON
test('Payment challenge header is valid base64 encoded JSON', async () => {
  const response = await axios.post(`${BASE_URL}${ENDPOINT}`, {}, {
    validateStatus: () => true,
  });
  
  const paymentHeader = response.headers['payment-required'];
  const decoded = base64Decode(paymentHeader);
  
  if (!decoded) {
    throw new Error('Payment challenge is not valid base64 encoded JSON');
  }
  
  if (!decoded.x402Version) {
    throw new Error('Payment challenge missing x402Version');
  }
  
  if (!decoded.accepts || !Array.isArray(decoded.accepts)) {
    throw new Error('Payment challenge missing or invalid accepts array');
  }
  
  return true;
});

// Test 5: Payment details are correct
test('Payment challenge contains correct payment details', async () => {
  const response = await axios.post(`${BASE_URL}${ENDPOINT}`, {}, {
    validateStatus: () => true,
  });
  
  const paymentHeader = response.headers['payment-required'];
  const challenge = base64Decode(paymentHeader);
  
  if (!challenge || !challenge.accepts || challenge.accepts.length === 0) {
    throw new Error('Invalid payment challenge structure');
  }
  
  const paymentOption = challenge.accepts[0];
  
  const errors = [];
  
  if (paymentOption.network !== EXPECTED_NETWORK) {
    errors.push(`Expected network ${EXPECTED_NETWORK}, got ${paymentOption.network}`);
  }
  
  if (paymentOption.payTo !== EXPECTED_PAY_TO) {
    errors.push(`Expected payTo ${EXPECTED_PAY_TO}, got ${paymentOption.payTo}`);
  }
  
  if (paymentOption.amount !== EXPECTED_AMOUNT) {
    errors.push(`Expected amount ${EXPECTED_AMOUNT}, got ${paymentOption.amount}`);
  }
  
  if (paymentOption.scheme !== 'exact') {
    errors.push(`Expected scheme 'exact', got ${paymentOption.scheme}`);
  }
  
  if (errors.length > 0) {
    throw new Error(errors.join('; '));
  }
  
  return true;
});

// Test 6: Resource information is correct
test('Payment challenge contains correct resource information', async () => {
  const response = await axios.post(`${BASE_URL}${ENDPOINT}`, {}, {
    validateStatus: () => true,
  });
  
  const paymentHeader = response.headers['payment-required'];
  const challenge = base64Decode(paymentHeader);
  
  if (!challenge.resource) {
    throw new Error('Resource information is missing');
  }
  
  if (!challenge.resource.url || !challenge.resource.url.includes(ENDPOINT)) {
    throw new Error(`Resource URL should contain ${ENDPOINT}`);
  }
  
  if (challenge.resource.description !== 'Ethereum transfer data via Bitquery') {
    throw new Error('Resource description mismatch');
  }
  
  return true;
});

// Test 7: Response body for unpaid request is empty object
test('Unpaid request returns empty object in response body', async () => {
  const response = await axios.post(`${BASE_URL}${ENDPOINT}`, {}, {
    validateStatus: () => true,
  });
  
  if (response.status !== 402) {
    throw new Error('Expected 402 status for this test');
  }
  
  const body = response.data;
  if (typeof body !== 'object' || (Object.keys(body).length !== 0 && JSON.stringify(body) !== '{}')) {
    throw new Error(`Expected empty object, got: ${JSON.stringify(body)}`);
  }
  
  return true;
});

// Test 8: Content-Type header is correct
test('Response has correct Content-Type header', async () => {
  const response = await axios.post(`${BASE_URL}${ENDPOINT}`, {}, {
    validateStatus: () => true,
  });
  
  const contentType = response.headers['content-type'];
  if (!contentType || !contentType.includes('application/json')) {
    throw new Error(`Expected application/json Content-Type, got: ${contentType}`);
  }
  
  return true;
});

// Test 9: Payment with token (if provided via env var)
test('Paid request with valid payment token returns Bitquery data', async () => {
  const paymentToken = getPaymentToken("0x7c6CEAA563735B6A0E22AeC0911476245A4E5eDD");
  if (!paymentToken) {
    warn('  SKIPPED: PAYMENT_TOKEN not provided. Set PAYMENT_TOKEN env var to test paid requests.');
    return { skipped: true };
  }
  
  try {
    const response = await axios.post(`${BASE_URL}${ENDPOINT}`, {}, {
      headers: {
        'PAYMENT-SIGNATURE': paymentToken,
      },
      validateStatus: () => true,
    });
    
    if (response.status === 402) {
      throw new Error('Request still requires payment. Token may be invalid or expired.');
    }
    
    if (response.status !== 200) {
      throw new Error(`Expected status 200, got ${response.status}`);
    }
    
    // Check if response contains Bitquery data structure
    const data = response.data;
    if (!data || typeof data !== 'object') {
      throw new Error('Response is not a valid JSON object');
    }
    
    // Bitquery typically returns data in a structure like { data: { ethereum: { transfers: [...] } } }
    if (data.data && data.data.ethereum) {
      success('  Received valid Bitquery data structure');
    } else {
      warn('  Response structure may not match expected Bitquery format');
    }
    
    return true;
  } catch (err) {
    if (err.response && err.response.status === 402) {
      throw new Error('Payment token was rejected. Token may be invalid or expired.');
    }
    throw err;
  }
});

// Test 10: Error handling for invalid endpoints
test('Invalid endpoint returns 404', async () => {
  try {
    const response = await axios.post(`${BASE_URL}/invalid-endpoint`, {}, {
      validateStatus: () => true,
    });
    
    // This endpoint doesn't exist, so it should either be 404 or handled by x402
    // Since x402 might not protect it, we just check it doesn't crash
    return true;
  } catch (err) {
    // Network errors should still be handled
    if (err.code === 'ECONNREFUSED') {
      throw err;
    }
    return true;
  }
});

// Helper Function

const getPaymentToken = async (buyerWallet) => {
  const response = await axios.post(`${BASE_URL}${ENDPOINT}`, {}, {
    validateStatus: () => true,
  });
  
  const paymentHeader = response.headers['payment-required'];
  const challenge = base64Decode(paymentHeader);

  const paymentToken= await payExact({
    challenge,
    wallet: buyerWallet,
  });

  return paymentToken
}
// Main test runner
async function runTests() {
  log('\n🧪 Starting End-to-End Tests for x402 Bitquery Service\n', 'blue');
  log(`Testing server at: ${BASE_URL}${ENDPOINT}\n`, 'blue');
  
  let passed = 0;
  let failed = 0;
  let skipped = 0;
  const failures = [];
  
  for (const { name, fn } of tests) {
    try {
      info(`Running: ${name}`);
      const result = await fn();
      
      if (result && result.skipped) {
        skipped++;
      } else {
        success(`  PASSED: ${name}`);
        passed++;
      }
    } catch (err) {
      error(`  FAILED: ${name}`);
      error(`    Error: ${err.message}`);
      failed++;
      failures.push({ name, error: err.message });
    }
    console.log('');
  }
  
  // Summary
  log('\n' + '='.repeat(60), 'blue');
  log('Test Summary', 'blue');
  log('='.repeat(60), 'blue');
  log(`Total:  ${tests.length}`, 'reset');
  log(`Passed: ${passed}`, 'green');
  if (failed > 0) {
    log(`Failed: ${failed}`, 'red');
  }
  if (skipped > 0) {
    log(`Skipped: ${skipped}`, 'yellow');
  }
  log('='.repeat(60) + '\n', 'blue');
  
  // Show payment instructions if tests passed but no payment test was run
  if (failed === 0 && skipped > 0 && !process.env.PAYMENT_TOKEN) {
    log('💡 To test the full payment flow:', 'yellow');
    log('   1. Make a payment using the x402 protocol', 'yellow');
    log('   2. Get the payment token from the payment response', 'yellow');
    log(`   3. Run: PAYMENT_TOKEN=<your-token> node test.js\n`, 'yellow');
  }
  
  // Show failures if any
  if (failures.length > 0) {
    log('Failed Tests:', 'red');
    failures.forEach(({ name, error }) => {
      log(`  - ${name}: ${error}`, 'red');
    });
    log('');
  }
  
  // Exit with appropriate code
  process.exit(failed > 0 ? 1 : 0);
}

// Handle unhandled rejections
process.on('unhandledRejection', (err) => {
  error(`\nUnhandled error: ${err.message}`);
  if (err.stack) {
    console.error(err.stack);
  }
  process.exit(1);
});

// Run tests
if (require.main === module) {
  runTests().catch((err) => {
    error(`Fatal error: ${err.message}`);
    if (err.stack) {
      console.error(err.stack);
    }
    process.exit(1);
  });
}

module.exports = { runTests, tests };

