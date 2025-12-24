import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

/**
 * Handler for GET /latest-price endpoint
 * Fetches the latest token price from Bitquery
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getLatestPrice = async (req, res) => {
  try {
    const { tokenAddress } = req.body || {};
    
    if (!tokenAddress) {
      return res.status(400).json({
        error: "Bad Request",
        message: "tokenAddress is required in request body"
      });
    }
    
    const query = `
      query MyQuery {
        Trading {
          Tokens(
            where: {Token: {Address: {is: "${tokenAddress}"}}, Interval: {Time: {Duration: {eq: 1}}}}
            orderBy: {descending: Block_Time}
            limit: {count: 1}
          ) {
            Price {
              Ohlc {
                Close
              }
            }
          }
        }
      }
    `;
  
    const response = await axios.post(
      "https://streaming.bitquery.io/graphql",
      {
        query
      },
      {
        headers: {
          "Authorization": `Bearer ${process.env.BITQUERY_API_KEY}`,
        },
      }
    );
    
    // Check for GraphQL errors
    if (response.data.errors) {
      console.error("Bitquery GraphQL errors:", response.data.errors);
      return res.status(400).json({
        error: "Bitquery API Error",
        message: response.data.errors[0]?.message || "GraphQL query error",
        details: response.data.errors
      });
    }
    
    // Check if data exists
    const tokens = response.data.data?.Trading?.Tokens || [];
    
    if (tokens.length === 0) {
      console.warn(`No data found for token: ${tokenAddress}`);
      return res.status(404).json({
        error: "No Data Found",
        message: `No price data found for token address: ${tokenAddress}`,
        tokenAddress
      });
    }
    
    const price = tokens[0]?.Price?.Ohlc?.Close;
    
    if (!price) {
      console.warn(`Price data missing for token: ${tokenAddress}`);
      return res.status(404).json({
        error: "No Price Data",
        message: `Price data not available for token address: ${tokenAddress}`,
        tokenAddress
      });
    }
    
    res.json(price);
  } catch (error) {
    console.error("Error fetching latest price:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: error.response?.data?.message || error.message || "Failed to fetch latest price",
      details: error.response?.data
    });
  }
};

