# Java Academy

An interactive Java learning platform with lessons, quizzes, a live Java playground, coding
challenges, progress tracking, and Duke the tutor.

Structure
- frontend: React + Vite + TypeScript app (UI, playground, Duke integration)
- backend: Node + Express API serving lessons and user data

Quick start (local)

1. Install dependencies from the project root:

```bash
npm install
npm install --prefix frontend
npm install --prefix backend
```

2. Start both applications:

```bash
npm run dev
```

Or start them separately:

Frontend:

```bash
cd java-academy/frontend
npm install
npm run dev
```

Backend:

```bash
cd java-academy/backend
npm install
npm run dev
```

The frontend runs on `http://localhost:5173` and proxies API requests to the backend on
`http://localhost:4000`. Check `http://localhost:4000/api/health` for runtime status.

Graphify
--------

This repository includes a project-scoped Graphify skill for OpenCode. Install the CLI separately
with `uv tool install graphifyy`, then generate or update the local graph with:

```powershell
graphify .
```

Graphify updates automatically after commits through the local Git hook. Generated graph data and
cache files are intentionally ignored by `.gitignore`; the project skill and OpenCode plugin are
tracked.

Docker runner (playground)
- The backend includes a Docker-based sandbox runner at `POST /api/run-sandbox` which executes user Java code inside `openjdk:17`.
- Defaults: CPU `0.5`, Memory `256m`, timeout `8000ms`, max code size `64KB`.
- These can be configured via environment variables: `DOCKER_ENABLED`, `DOCKER_CPUS`, `DOCKER_MEMORY`, `DOCKER_TIMEOUT_MS`, `MAX_CODE_BYTES`.
- Docker must be available on the host (Docker Desktop on Windows). The runner serializes executions to prevent resource contention.

Postgres setup (optional, recommended)
- To persist progress in Postgres, provide `DATABASE_URL` or `PG_CONNECTION` environment variable to the backend.
- Example local setup using psql (replace values as needed):

```bash
# create database and user
createdb java_academy
# set env (example)
export DATABASE_URL=postgres://user:pass@localhost:5432/java_academy

# run the backend; it will create the `progress` table automatically
cd java-academy/backend
npm install
npm run dev
```

The SQL schema is available at `backend/db/schema.sql`.

Security note
- The sandbox runner is intended for local development only. For public deployments, use a hardened execution service (dedicated container pool, firecracker, or remote judge) and apply strict networking/resource isolation.

```
This is a scaffold. Continue building modules and migrate content from the prototype HTML.
```

Git troubleshooting
-------------------

If you're unable to commit or push changes, follow these steps from the project root.

1) Quick check if repository is initialized:

```bash
git status
```

2) Initialize and push (Linux/macOS):

```bash
./scripts/init-repo.sh <REMOTE_URL>
```

3) Initialize and push (Windows PowerShell):

```powershell
.\scripts\init-repo.ps1 -RemoteUrl "git@github.com:yourname/yourrepo.git"
```

4) If commits fail due to hooks, retry commit with `--no-verify` to bypass local hooks temporarily:

```bash
git commit -m "WIP" --no-verify
```

5) If you still get errors, copy the exact error output and paste it into the issue or chat so I can diagnose further.

Notes
- Replace `yourname/yourrepo` with your actual remote repository path.
- Ensure you have network access and appropriate SSH keys or HTTPS credentials configured for pushing.

