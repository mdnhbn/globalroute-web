# GlobalRoute

GlobalRoute uses a Next.js frontend and a FastAPI backend. The backend stores accounts, agency submissions, and payment records in PostgreSQL in production. Dashboard drafts use browser storage.

## Deploy on Render

Use the repository Blueprint or create the two services with these settings.

| Setting | FastAPI Web Service | Next.js Static Site |
| --- | --- | --- |
| Root Directory | `backend` | `frontend` |
| Build Command | `pip install -r requirements.txt` | `npm ci && npm run build` |
| Start Command | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` | |
| Health Check Path | `/health` | |
| Publish Directory | | `out` |

Backend environment variables:

- `APP_ENV=production`
- `DATABASE_URL` with the connection string for a dedicated PostgreSQL database. Use TLS for an external provider.
- `SECRET_KEY` with a stable, randomly generated signing key of at least 32 bytes.
- `FRONTEND_URL` with the site's HTTPS origin. Separate multiple authorized origins with commas.
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`, and `SMTP_FROM_EMAIL` for verification emails. The default port uses STARTTLS; set `SMTP_USE_SSL=true` for an SSL SMTP endpoint.
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `GOOGLE_OAUTH_REDIRECT_URI` for Google sign-in. Register the exact callback `https://<backend-host>/api/v1/auth/google/callback` as an authorized redirect URI in Google Cloud Console.

Frontend environment variables:

- `NEXT_STATIC_EXPORT=1`
- `NEXT_PUBLIC_API_BASE_URL` with the backend HTTPS origin followed by `/api/v1`.
- `NEXT_PUBLIC_WHATSAPP_NUMBER` for the optional public support link, in international format.

Set the API URL before the frontend build. If Render assigns different hostnames, update both services with the assigned URLs. Backend WhatsApp notifications use the optional `WHATSAPP_API_URL`, `WHATSAPP_TOKEN`, and `WHATSAPP_PHONE_NUMBER_ID` settings in `backend/.env.example`.

To create the first administrator, run this in an authorized environment with access to the production database and the backend settings. The command prompts for the password without echoing it.

```sh
cd backend
python -m app.create_admin --email admin@example.com
```

Once the first administrator can sign in, add the real payment methods in the admin panel before accepting agency fees.

Email registration is unavailable until SMTP is configured. New users receive a six-digit code that expires after 10 minutes; sign-in is blocked until that code is verified. Google sign-in uses the verified Google email and does not need SMTP. The frontend language selector persists the chosen language in the browser; Bengali remains the default for a new browser.
