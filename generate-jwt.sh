export JWT=$(node generate-jwt.js)
echo $JWT

curl -L -X POST "https://api.cdp.coinbase.com/platform/v2/x402" \
  -H "Authorization: Bearer eyJhbGciOiJFZERTQSIsImtpZCI6IjY4ODk1Y2Q1LWMzMzItNDliNy1hN2ZhLTRkOTFiOGQ2MTMwMiIsInR5cCI6IkpXVCIsIm5vbmNlIjoiMTAwMGEzY2NkMDU1YjhiNTIyOTQyOTVkYzFjZTdhZWYifQ.eyJzdWIiOiI2ODg5NWNkNS1jMzMyLTQ5YjctYTdmYS00ZDkxYjhkNjEzMDIiLCJpc3MiOiJjZHAiLCJ1cmlzIjpbIlBPU1QgaHR0cHM6Ly9hcGkuY2RwLmNvaW5iYXNlLmNvbS9wbGF0Zm9ybS92Mi94NDAyIl0sImlhdCI6MTc2NjY0NzIzMSwibmJmIjoxNzY2NjQ3MjMxLCJleHAiOjE3NjY2NDczNTF9.iBF6Xb8j6dO_sp3LUcFYxRv8IIaKZwA72jLqBt1pcIuFDheCn9NPwj92IKH8MD-tfeR-exi2LbJ9Lx7_qIxgAg" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json"