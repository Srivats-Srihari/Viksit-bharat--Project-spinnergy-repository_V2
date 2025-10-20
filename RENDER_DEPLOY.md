Deploying to Render (quick)
1) Create GitHub repo and push this spinnergy folder
2) Go to render.com -> New -> Web Service
   - Connect GitHub repo
   - Build command: `cd server && npm install && cd ../client && npm install && npm run build`
   - Start command: `cd server && npm start`
   - Alternatively create TWO services: one for server (web service) and one static site for client (static site pointing to /client/build)
3) Set environment variables in Render (for the server service):
   - NUTRITIONIX_APP_ID
   - NUTRITIONIX_APP_KEY
   - (optional) FIREBASE_API_KEY
4) Deploy. Once server is live, the client will call it for nutrition lookups.

Notes:
- For Micro:bit Web Bluetooth, use HTTPS (Render provides HTTPS by default).
- Judges will open the client URL and click Connect Micro:bit once to grant Bluetooth access.