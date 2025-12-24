import { mnemonicToSeedSync } from "@scure/bip39";
import { HDKey } from "@scure/bip32";
import dotenv from "dotenv";

dotenv.config();

// Function to derive private key from mnemonic phrase
function getPrivateKeyFromMnemonic(mnemonic, accountIndex = 0) {
  // Validate mnemonic
  if (!mnemonic || typeof mnemonic !== 'string') {
    throw new Error("Mnemonic phrase must be a non-empty string");
  }

  // Convert mnemonic to seed
  const seed = mnemonicToSeedSync(mnemonic.trim());
  
  // Create HD key from seed
  const hdkey = HDKey.fromMasterSeed(seed);
  
  // Derive the account using BIP44 path: m/44'/60'/0'/0/accountIndex
  // 44' = BIP44, 60' = Ethereum, 0' = account, 0 = change, accountIndex = address index
  const derivedKey = hdkey.derive(`m/44'/60'/0'/0/${accountIndex}`);
  
  // Get the private key (remove 0x prefix if present, then add it back)
  const privateKey = derivedKey.privateKey;
  if (!privateKey) {
    throw new Error("Failed to derive private key from mnemonic");
  }
  
  // Convert Uint8Array to hex string with 0x prefix
  return `0x${Buffer.from(privateKey).toString('hex')}`;
}

// Main execution
try {
  // Get mnemonic phrase from environment variable or command line argument
  const mnemonic = process.env.MNEMONIC_PHRASE || process.argv[2];
  
  if (!mnemonic) {
    console.error("❌ Error: Mnemonic phrase is required");
    console.log("\nUsage:");
    console.log("  Option 1: Set MNEMONIC_PHRASE in .env file");
    console.log("  Option 2: node getPrivateKey.js \"your mnemonic phrase here\"");
    console.log("\nOptional: Set ACCOUNT_INDEX in .env (default: 0)");
    process.exit(1);
  }

  // Get account index (default: 0)
  const accountIndex = parseInt(process.env.ACCOUNT_INDEX || '0', 10);
  
  // Derive private key
  const privateKey = getPrivateKeyFromMnemonic(mnemonic, accountIndex);
  
  // Display results
  console.log("\n" + "=".repeat(60));
  console.log("🔑 Private Key Derived from Mnemonic Phrase");
  console.log("=".repeat(60));
  console.log(`\nAccount Index: ${accountIndex}`);
  console.log(`\nPrivate Key:`);
  console.log(privateKey);
  console.log("\n" + "=".repeat(60));
  console.log("\n✅ Success! You can now use this private key in your .env file:");
  console.log(`EVM_PRIVATE_KEY=${privateKey.replace('0x', '')}`);
  console.log("\n" + "=".repeat(60) + "\n");
  
} catch (error) {
  console.error("\n❌ Error:", error.message);
  process.exit(1);
}

