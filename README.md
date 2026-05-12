# Radkummerkasten

A minimal Vienna issue tracker with MapLibre, Vue 3, Fastify, and Postgres.

## Folder structure

- `frontend/` — Vue 3 + Vite app with mobile-friendly map UI and email verification flow
- `backend/` — Fastify REST API for issues, comments, verification, and Cloudflare uploads
- `database/` — Postgres schema and Docker Compose setup

## Setup

1. Start the database:

```bash
docker compose -f database/docker-compose.yml up -d
```

2. Install backend dependencies:

```bash
cd backend
npm install
```

3. Install frontend dependencies:

```bash
cd ../frontend
npm install
```

4. Copy `backend/.env.example` to `backend/.env` and update the following variables:
   - `DATABASE_URL`: PostgreSQL connection string
   - `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_IMAGES_NAMESPACE`: For image uploads
   - `TURNSTILE_SECRET_KEY`: Cloudflare Turnstile secret key (get from Cloudflare dashboard)
   - `FRONTEND_URL`: Your frontend URL

5. Update the Turnstile site key in the frontend components:
   - Replace `0x4AAAAAAA_example_site_key` with your actual site key in:
     - `frontend/src/components/IssueForm.vue`
     - `frontend/src/components/CommentForm.vue`
     - `frontend/src/components/IssuePanel.vue`

6. Start the backend and frontend:

```bash
cd backend
npm run dev
```

```bash
cd ../frontend
npm run dev
```

7. Open `http://localhost:5173`.

## Notes

- The app uses a dev-mode magic link that logs the verification URL to the backend console.
- Photos are represented with URLs, and the backend includes a Cloudflare upload proxy route.
- The map uses client-side clustering with MapLibre.
