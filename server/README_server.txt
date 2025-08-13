README_server.txt — Render デプロイ手順（最小）
1) この2ファイルをリポの /server に置く
   - /server/server_ws_relay.js
   - /server/package.json
2) Render の設定
   - Service Type: Web Service
   - Root Directory: server
   - Build Command: npm install
   - Start Command: npm start
   - Plan: Free でOK
3) デプロイ後の確認
   - Logs に [relay] listening on <port> と出る
   - https://<your>.onrender.com/ で ok と表示される
