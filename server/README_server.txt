README_server.txt — Render デプロイ手順（最小）
1) /server に以下を置く
   - server_ws_relay.js
   - package.json
2) Render 設定
   - Service Type: Web Service
   - Root Directory: server
   - Build Command: npm install
   - Start Command: npm start
3) デプロイ後の確認
   - Logs に [relay] listening on <port>
   - https://<your>.onrender.com/ にアクセスして 'ok' と表示
