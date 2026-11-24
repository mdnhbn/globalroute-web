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
