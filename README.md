# LoopLines Online (Minimal)

This repo contains a **client** (static HTML) and a **server** (WebSocket relay) to run 1v1 online.

## Quick Deploy

### 1) Deploy server (Render – recommended for quick TLS/WSS)
- Create a new **Web Service** from this repo's `/server` folder
- Build Command: `npm install`
- Start Command: `npm start`
- Render assigns you `https://your-app.onrender.com` (`wss://your-app.onrender.com`)

### 2) Deploy client (GitHub Pages / Netlify / Vercel)
- Serve `/client` as static site
- If GitHub Pages: set Pages source to `/client` (root) or publish subdir
- Access with: `https://<user>.github.io/<repo>/?room=ROOM1&ws=wss://your-app.onrender.com`

## Local test
Server:
```bash
cd server
npm i
npm start   # ws://localhost:8080
```
Client:
- Open `client/index.html` in a static server (e.g., `npx serve client`)
- Visit from two devices:
  - `http://<host>:<port>/?room=ROOM1` (defaults to ws://localhost:8080 unless `&ws=` set)

## Notes
- **Minimal sync**: taps, two-finger cancel, outer-tap close. Sender applies locally and **ignores echo**.
- For HTTPS pages, use **WSS** (`wss://`) for the server URL to avoid mixed-content blocking.

