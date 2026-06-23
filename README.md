# IQMD Editor

IQMD Editor is a physician documentation app for creating patient protocols from locked templates. It includes a FastAPI backend, a Next.js frontend, patient/regimen management, versioned document editing, and DOCX/PDF export.

## Repository Layout

```text
apps/
  api/    FastAPI backend, database models, routers, export services
  web/    Next.js frontend
```

## Prerequisites

- Node.js and npm
- Python 3.11+
- Docker Desktop
- LibreOffice, required for PDF export

## Local Setup

Install JavaScript dependencies from the repo root:

```powershell
npm install
```

Create a Python virtual environment and install API dependencies:

```powershell
cd apps/api
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Start Postgres from the repo root:

```powershell
docker compose up -d
```

Create `apps/api/.env`:

```env
DATABASE_URL=postgresql://iqmd:iqmd_dev@localhost:5432/iqmd_db
TEST_DATABASE_URL=postgresql://iqmd:iqmd_dev@localhost:5433/iqmd_test
SECRET_KEY=replace-with-a-local-dev-secret
FRONTEND_URL=http://localhost:3000
LIBREOFFICE_PATH=C:\Program Files\LibreOffice\program\soffice.exe
```

Run migrations and seed demo users/templates:

```powershell
cd apps/api
alembic upgrade head
python seed.py
```

## Run The App

From the repo root:

```powershell
npm run dev
```

Or run each server separately:

```powershell
npm run dev:web
npm run dev:api
```

Open the web app at:

```text
http://localhost:3000
```

API runs at:

```text
http://localhost:8000
```

## Demo Login

```text
Physician:
physician@iqmd.com
IQMDDoc2026!

Admin:
admin@iqmd.com
IQMDAdmin2026!
```

These are local seed credentials only. Change them before using a shared or deployed environment.

## Main Workflow

1. Log in as the physician.
2. Go to `/patients`.
3. Create or open a patient.
4. Click **New Protocol**.
5. Select **IQMD Master Template 2026**.
6. Fill the **Physician Version** and **Patient Version** tabs.
7. Add supplement rows near the bottom of the editor.
8. Click **Save**.
9. Optionally click **Mark as Final** to remove the draft watermark.
10. Use **Export** to download Word or PDF.

## Testing And Checks

Frontend:

```powershell
cd apps/web
npm run lint
npm run build
```

API import/compile check:

```powershell
cd apps/api
python -c "import main; print('api import ok')"
python -m compileall -q .
```

## Deploy On Render

This repo includes a `render.yaml` Blueprint with:

- `iqmd-api`: FastAPI Docker service with LibreOffice installed for PDF export
- `iqmd-web`: Next.js web service
- `iqmd-db`: Render PostgreSQL database

Deploy steps:

1. Push this repository to GitHub.
2. In Render, choose **New +** -> **Blueprint**.
3. Connect the GitHub repository.
4. Select the branch with `render.yaml`.
5. Apply the Blueprint.
6. Wait for the database, API, and web services to deploy.

The Blueprint assumes these public service URLs:

```text
https://iqmd-api.onrender.com
https://iqmd-web.onrender.com
```

If Render assigns different URLs, update these environment variables in the Render dashboard:

```text
iqmd-api:
FRONTEND_URL=https://your-web-service.onrender.com

iqmd-web:
NEXT_PUBLIC_API_URL=https://your-api-service.onrender.com
```

Then redeploy both services.

The API pre-deploy command runs migrations and seeds the local demo users/templates:

```text
alembic upgrade head && python seed.py
```

For a real production environment, replace the seed credentials immediately after deployment.

## Notes

- `.env`, `.env.local`, virtual environments, build output, `node_modules`, and `cookies.txt` are ignored by git.
- PDF export uses LibreOffice in headless mode. If PDF export fails, confirm `LIBREOFFICE_PATH` points to `soffice.exe` and restart the API server.
