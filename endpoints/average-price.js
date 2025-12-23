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
    
    res.json(response.data.data.Trading.Tokens);
  } catch (error) {
    console.error("Error fetching token price:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: error.response?.data?.message || error.message || "Failed to fetch token price"
    });
  }
};