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
    
    res.json(response.data.data.Trading.Tokens[0].Price.Ohlc.Close);
  } catch (error) {
    console.error("Error fetching token price:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: error.response?.data?.message || error.message || "Failed to fetch token price"
    });
  }
};

