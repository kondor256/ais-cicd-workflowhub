# WorkFlowHub

WorkFlowHub is a SaaS workflow app for remote teams. Users register, log in and out, and create, edit, delete and update the status of workflow items (**Pending / In Progress / Completed**).

Built for SOFT806 Continuous Integration and Continuous Deployment (Assignment 1).

**Stack:** Django REST Framework (backend) · React + Vite (frontend) · PostgreSQL · Docker · GitHub Actions and CircleCI.

## Repository structure

```
workflowhub/
├── .github/        issue forms, pull request template, workflows/ci.yml
├── .circleci/      config.yml
├── backend/        Django + DRF (accounts/, workflows/), Dockerfile, .env.example
├── frontend/       React + Vite, Dockerfile (multi-stage, nginx), .env.example
├── docker-compose.yml   backend + frontend + postgres
├── .env.example    variables for docker-compose.yml
└── README.md
```

Not everything exists yet. CI arrives in WFH-05, WFH-08 and WFH-09, and the `accounts/` and `workflows/` apps in later stories.

## Configuration

All configuration comes from environment variables. No secrets are committed; only `.env.example` files are.

| Variable | Used by | Required | Default | Example |
|---|---|---|---|---|
| `DJANGO_SECRET_KEY` | backend | **Yes** | none (the backend will not start without it) | `change-me` |
| `DATABASE_URL` | backend | **Yes** | none (the backend will not start without it) | `sqlite:///db.sqlite3` or `postgres://user:password@db:5432/workflowhub` |
| `DEBUG` | backend | No | `False` | `True` (local only) |
| `ALLOWED_HOSTS` | backend | No | empty | `localhost,127.0.0.1` |
| `CORS_ALLOWED_ORIGINS` | backend | No | not used yet (added with WFH-15) | `http://localhost:5173` |
| `VITE_API_URL` | frontend | No | empty (use the Vite dev proxy for `/api`) | `http://localhost:8000` |
| `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD` | Docker Compose (db) | Yes, for Compose | none | see root `.env.example` |

Copy the example files to create your own local files. `.env` files are ignored by git:

```bash
copy backend\.env.example backend\.env        # macOS/Linux: cp backend/.env.example backend/.env
copy frontend\.env.example frontend\.env      # optional
```

Real environment variables (Docker, CI) override values in `backend/.env`. CI jobs and Docker Compose must set `DJANGO_SECRET_KEY` and `DATABASE_URL` themselves. Never put real secrets in an `.env.example` file.

## Team workflow

Work is planned with GitHub Issues, Milestones (sprints) and a Projects board: **Backlog → To Do → In Progress → In Review → Done**.

1. Pick an issue (`WFH-xx`) from **To Do** and move it to **In Progress**.
2. Create a branch from an up-to-date `main`, named as below.
3. Commit in small steps using Conventional Commits.
4. Push and open a pull request into `main` using the PR template. Put `Closes #<issue>` in the description.
5. Another team member reviews. At least **1 approval** is required before merging.
6. Merge, delete the branch, and the issue closes automatically.

### Branch naming

`<type>/<issue-number>-<short-slug>`, lowercase, words separated by hyphens.

| Prefix | Use for | Example |
|---|---|---|
| `feature/` | Application features (backend or frontend) | `feature/6-registration` |
| `devops/` | Repo setup, Docker, environment, release | `devops/1-repo-setup` |
| `ci/` | CI/CD pipeline changes | `ci/5-github-actions-build` |
| `fix/` | Bug fixes | `fix/15-cors-in-docker` |

### Commit messages

[Conventional Commits](https://www.conventionalcommits.org/): `<type>(<optional scope>): <description> #<issue>`

| Type | Meaning |
|---|---|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `chore` | Maintenance, repo setup, config |
| `ci` | CI/CD pipeline files |
| `build` | Dockerfiles, dependencies |
| `test` | Adding or changing tests |
| `refactor` | Code change that is neither a fix nor a feature |

Examples:

```
feat(auth): add login endpoint #7
ci: build both Docker images on push #5
fix(cors): allow the frontend origin in Docker #15
docs: document branching and commit conventions #1
```

Use the imperative mood ("add", not "added"), keep the first line under about 72 characters, and always reference the issue.

### Pull requests and `main`

- `main` is protected: no direct pushes and no force pushes. Every change goes through a pull request with 1 approving review.
- From WFH-08, the CI checks (`test-backend`, `build-images`) must also pass before merging.
- The PR title matches the issue title, for example `WFH-01: Repository, branching strategy and PR review workflow`.

### Labels

`app`, `devops`, `enabler`, `backend`, `frontend`, `docker`, `ci`, `security`, `bug`, `release`, `priority:high|medium|low`, `role:po|dev|devops`

## Run locally

### Prerequisites
- Python 3.12+
- Node.js 20+ and npm

### Backend (Django REST Framework)
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # Windows (macOS/Linux: source .venv/bin/activate)
pip install -r requirements.txt
copy .env.example .env          # macOS/Linux: cp .env.example .env
python manage.py migrate
python manage.py runserver      # http://localhost:8000
```
Check it: open http://localhost:8000/api/health/ and you should see `{"status": "ok"}`.

Run the tests:
```bash
python manage.py test
```

### Frontend (React + Vite)
In a second terminal:
```bash
cd frontend
npm install
npm run dev                     # http://localhost:5173
```
Open http://localhost:5173. The page should show **API: online**.
If you stop the backend and reload, it shows **API: unreachable**.

## Run with Docker

### Prerequisites
- Docker Desktop (Docker Engine with Compose v2)

### Whole stack (backend + frontend + PostgreSQL)
```bash
copy .env.example .env          # macOS/Linux: cp .env.example .env
# edit .env: set DJANGO_SECRET_KEY and POSTGRES_PASSWORD
docker compose up --build
```
- Frontend: http://localhost:8080
- Backend health check: http://localhost:8000/api/health/ (should return `{"status": "ok"}`)

The backend container runs `python manage.py migrate` and then starts gunicorn. Stop with `Ctrl+C` or `docker compose down`. Add `-v` to also delete the database volume.

> **Known issue:** the frontend (port 8080) calls the backend (port 8000) directly, so the browser blocks the request and the page shows **API: unreachable**. This is a CORS problem tracked as WFH-15.

The root `.env` is only for Compose. `backend/.env` is only for running the backend without Docker. Neither is copied into an image.

### Build the images separately
```bash
docker build -t workflowhub-backend ./backend
docker build --build-arg VITE_API_URL=http://localhost:8000 -t workflowhub-frontend ./frontend
```
`VITE_API_URL` is baked into the frontend bundle at build time, so changing it needs a rebuild.

## Continuous integration (GitHub Actions)

`.github/workflows/ci.yml` runs on every push and on pull requests to `main`. The `build-images` job builds the backend and frontend Docker images (nothing is pushed) and uses the GitHub Actions cache for Docker layers. A Dockerfile error makes the run fail and the PR show a red check.

The frontend build needs `VITE_API_URL`. It comes from a **repository variable** (Settings → Secrets and variables → Actions → Variables), not from the YAML. It is a variable and not a secret because the value is public inside the JavaScript bundle.

## Licence

See [LICENSE](LICENSE).
