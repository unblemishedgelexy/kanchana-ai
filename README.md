# Kanchana Frontend

Next.js App Router frontend connected to the Kanchana backend APIs.

## Run Locally

1. Start backend (`../backend`) first.
2. Install frontend dependencies:
   ```bash
   npm install
   ```
3. Create `.env.local` from `.env.example`.
4. Run:
   ```bash
   npm run dev
   ```
5. Open `http://localhost:3000`.

## Environment

- `NEXT_PUBLIC_API_BASE_URL=https://kanchana-ai-backend.onrender.com/api`
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID=...` (optional, for Google login button)
- `NEXT_PUBLIC_PAYMENTS_ENABLED=false`
- `NEXT_PUBLIC_FRONTEND_GEMINI_ENABLED=true`
- `NEXT_PUBLIC_GEMINI_LIVE_ENABLED=true`
- `NEXT_PUBLIC_GEMINI_API_KEY=...` (required if frontend Gemini is enabled)
- `NEXT_PUBLIC_GEMINI_MODEL=gemini-2.5-flash-native-audio-preview-12-2025`
- `NEXT_PUBLIC_GEMINI_FALLBACK_MODEL=gemini-2.5-flash`

## Deploy to Netlify

1. Push this repo to GitHub/GitLab/Bitbucket.
2. In Netlify, create a new site from that repository.
3. Keep default build settings (this repo already includes `netlify.toml`):
   - Build command: `npm run build`
   - Publish directory: `.next`
   - Node version: `20`
4. In Netlify Site settings -> Environment variables, add all variables from `.env.example`.
5. Trigger deploy.

Notes:
- This app uses Next.js runtime routes (for example `/api/auth/google/callback`), so deploy as a Netlify Next.js app (not plain static export).
- If Google OAuth is enabled, ensure your backend/frontend callback URLs in Google Cloud match your deployed domains.

## Folder Layout

```text
src/
  app/              # Next App Router + app shell entry
  components/pages/ # Screen-level components
  components/layout/# Navigation and layout building blocks
  components/system/# Diagnostics/system widgets
  components/ui/    # Reusable UI primitives
  services/         # API client layer
  shared/           # Shared constants and types
  styles/           # Global styles
```

