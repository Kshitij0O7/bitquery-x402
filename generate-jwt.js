import { generateJwt } from "@coinbase/cdp-sdk/auth";
import dotenv from "dotenv";
dotenv.config();

// console.log(process.env.CDP_API_KEY_SECRET);
const main = async () => {
  // Generate the JWT using the CDP SDK
  const token = await generateJwt({
    apiKeyId: process.env.CDP_API_KEY_ID,
    apiKeySecret: process.env.CDP_API_KEY_SECRET,
    requestMethod: "GET",
    requestHost: "api.cdp.coinbase.com",
    requestPath: "/platform/v2/x402/supported",
    expiresIn: 3600*24*30 // 30 days // optional (defaults to 120 seconds)
  });
  
  console.log(token);
};

main();