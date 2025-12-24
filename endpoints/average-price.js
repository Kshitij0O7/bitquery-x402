import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

/**
 * Handler for GET /average-price endpoint
 * Fetches the latest token price from Bitquery
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getAveragePrice = async (req, res) => {
  try {
    let { tokenAddress, interval } = req.body || {};
    
    if (!tokenAddress) {
      return res.status(400).json({
        error: "Bad Request",
        message: "tokenAddress is required in request body"
      });
    }

    if (!interval) {
      interval = 60; // 1 minute
    }
    
    const query = `
      query MyQuery {
        Trading {
          Tokens(
            where: {Token: {Address: {is: "${tokenAddress}"}}, Interval: {Time: {Duration: {eq: ${interval}}}}}
            orderBy: {descending: Interval_Time_Start}
          ) {
            Interval {
              Time {
                Start
                End
              }
            }
            Price {
              Average {
                Mean
                SimpleMoving
                WeightedSimpleMoving
                ExponentialMoving
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
      console.warn(`No data found for token: ${tokenAddress} with interval: ${interval}`);
      return res.status(404).json({
        error: "No Data Found",
        message: `No trading data found for token address: ${tokenAddress}`,
        tokenAddress,
        interval
      });
    }
    
    res.json(tokens);
  } catch (error) {
    console.error("Error fetching average price:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: error.response?.data?.message || error.message || "Failed to fetch average price",
      details: error.response?.data
    });
  }
};