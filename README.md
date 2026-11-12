# WorkFlowHub

WorkFlowHub is a SaaS workflow app for remote teams. Users register, log in and out, and create, edit, delete and update the status of workflow items (**Pending / In Progress / Completed**).

Built for SOFT806 Continuous Integration and Continuous Deployment (Assignment 1).

**Stack:** Django REST Framework (backend) · React + Vite (frontend) · PostgreSQL · Docker · GitHub Actions and CircleCI.

## Repository structure

```
workflowhub/
├── .github/        issue forms, pull request template, workflows/ (ci.yml, release.yml, deploy-azure.yml)
├── .circleci/      config.yml
├── backend/        Django + DRF (accounts/, workflows/), Dockerfile, .env.example
├── frontend/       React + Vite, Dockerfile (multi-stage, nginx), .env.example
├── docker-compose.yml   backend + frontend + postgres
├── .env.example    variables for docker-compose.yml
└── README.md
```

The `accounts/` app provides registration, login, logout and a protected `/me/` endpoint (token authentication). The `workflows/` app lets a signed-in user create, list, edit, change the status of and delete their own workflow items.

## Configuration

All configuration comes from environment variables. No secrets are committed; only `.env.example` files are.

| Variable | Used by | Required | Default | Example |
|---|---|---|---|---|
| `DJANGO_SECRET_KEY` | backend | **Yes** | none (the backend will not start without it) | `change-me` |
| `DATABASE_URL` | backend | **Yes** | none (the backend will not start without it) | `sqlite:///db.sqlite3` or `postgres://user:password@db:5432/workflowhub` |
| `DEBUG` | backend | No | `False` | `True` (local only) |
| `ALLOWED_HOSTS` | backend | No | empty | `localhost,127.0.0.1` |
| `CORS_ALLOWED_ORIGINS` | backend | No | empty (no cross-origin calls allowed) | `http://localhost:8080` (Docker frontend) |
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


**Release 1.1 exception:** The first WFH-17 pull request uses `Refs #37` because the issue remains open until the checklist v1.1 follow-up PR is merged. The follow-up PR uses `Closes #37`.


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
- From WFH-08, the CI checks (`test-backend`, `build-images`) must also pass before merging. From WFH-29, `test-frontend` is required too.
- The PR title matches the issue title, for example `WFH-01: Repository, branching strategy and PR review workflow`.

### Labels

`app`, `devops`, `enabler`, `backend`, `frontend`, `docker`, `ci`, `security`, `bug`, `release`, `priority:high|medium|low`, `role:po|dev|devops`

## Run locally

### Prerequisites
- Python 3.12+
- Node.js 22+ and npm (the frontend tests need Node 22; the app itself builds on Node 20.19+)

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
Check it: open http://localhost:8000/api/health/ to see the service status and Git commit SHA. The SHA will be "unknown" when running locally without GIT_SHA.

Run the tests:
```bash
python manage.py test
```

### API endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/health/` | Health check, returns service status and Git commit SHA |
| POST | `/api/auth/register/` | Create an account (public, see below) |
| POST | `/api/auth/login/` | Log in and get a token (public, see below) |
| POST | `/api/auth/logout/` | Delete the caller's token (needs a token) |
| GET | `/api/auth/me/` | Current user, `{"username", "email"}` (needs a token) |
| GET | `/api/workflows/items/` | List the caller's workflow items, newest first (needs a token) |
| POST | `/api/workflows/items/` | Create a workflow item (needs a token, see below) |
| GET | `/api/workflows/items/<id>/` | One of the caller's items; `404` for anyone else's (needs a token) |
| PATCH | `/api/workflows/items/<id>/` | Update an item's `title`, `description` or `status`; `400` for an invalid value (for example an empty title), `404` for anyone else's item (needs a token) |
| DELETE | `/api/workflows/items/<id>/` | Delete one of the caller's items; returns `204` with no body, `404` for anyone else's item (needs a token) |

Endpoints are private by default (`IsAuthenticated`); only `health`, `register` and `login` are public.

**Register** takes JSON `{"username", "email", "password", "password2"}`. All four are required, `email` must be valid, and `password` must match `password2` and pass Django's password validators (length, common passwords, numeric-only, similarity to username/email). It returns `201` with `{"username", "email"}` only; the password is stored hashed and never returned. Validation errors return `400` with `{field: [messages]}`.

**Login** takes JSON `{"username", "password"}` and returns `200` with `{"token": "..."}`. A wrong password or unknown user returns `400` with `{"detail": "Invalid username or password"}` and creates no token. Logging in again returns the same token.

**Workflow items** have `id`, `title`, `description`, `status` (`pending`, `in_progress` or `completed`), `created_at` and `updated_at`. Creating takes JSON `{"title", "description"}`; `title` is required (max 200 characters) and a missing or blank one returns `400` with `{"title": ["Title is required"]}`. `description` is optional. The timestamps are read-only, and a new item is always `pending`, even if a `status` is sent. Editing takes `PATCH` with any of `title` and `description`, for example `{"title": "New title"}`: it returns `200` with the updated item and `updated_at` increases. An empty `title` returns `400` with `{"title": ["Title is required"]}` and nothing changes. Changing the status takes `PATCH` with JSON `{"status": "in_progress"}`: it returns `200` with the updated item and `updated_at` changes. A value that is not `pending`, `in_progress` or `completed` returns `400` with `{"status": [...]}` and the item stays unchanged. (`PUT` is also accepted by the endpoint and needs a `title`.) Deleting takes `DELETE` and returns `204`; the item is gone, so a later `GET` returns `404`. Trying to delete someone else's item returns `404` and the item is not touched. Each user sees only their own items.

**Authenticated requests** send the header `Authorization: Token <token>`. A missing or invalid token returns `401`. **Logout** deletes the token (`204`), so it stops working at once.

### Frontend (React + Vite)
In a second terminal:
```bash
cd frontend
npm install
npm run dev                     # http://localhost:5173
```
Open http://localhost:5173. The page should show **API: online**.
If you stop the backend and reload, it shows **API: unreachable**.

Pages (React Router):

| Route | Page |
|---|---|
| `/` | Home, with the API status |
| `/register` | Registration form (calls `POST /api/auth/register/`, then goes to `/login`) |
| `/login` | Login form (calls `POST /api/auth/login/`, then goes to `/workflows`) |
| `/workflows` | Protected page: greets the user from `GET /api/auth/me/`, has a "New item" form (title, description) and lists the user's items newest first, with an empty-state message. Each item shows a status badge (colour, symbol and text) and a Status dropdown (Pending / In Progress / Completed) that saves with `PATCH`; the list updates at once and goes back to the old status with an error message if the call fails. Each item also has an **Edit** button that opens an inline form pre-filled with the title and description. **Save** sends `PATCH`, shows validation errors from the API (for example "Title is required") and updates the item and its "Updated" time; **Cancel** closes the form without a request. Each item also has a **Delete** button that shows an in-page confirmation ("Delete this item? Confirm / Cancel"): **Confirm** sends `DELETE` and removes the item from the list, **Cancel** keeps it (an error message appears if the call fails). Redirects to `/login` without a token |

The header shows Login and Register links for anonymous users and a **Log out** button when logged in. The token is kept in `localStorage` (key `workflowhub.token`) and sent with every API request. A `401` response clears it.

Check the code with `npm run lint` and `npm run build`.

Run the tests:
```bash
npm test                        # runs once, as in CI
npm run test:watch              # re-runs the tests when a file changes
```
The tests use Vitest and React Testing Library in jsdom (a browser-like environment), so no browser and no backend are needed. They sit next to the code as `*.test.jsx` files and cover the status badge, the workflow list (status change, delete with confirmation), the protected route redirect and the login page (success, wrong password, server error). The login tests replace `fetch` with a stub, so the real API client and `AuthProvider` run without a server.

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
- Backend health check: http://localhost:8000/api/health/ (returns the service status and Git commit SHA; the SHA is "unknown" when running locally without GIT_SHA)

The backend container runs `python manage.py migrate` and then starts gunicorn. Stop with `Ctrl+C` or `docker compose down`. Add `-v` to also delete the database volume.

The frontend (port 8080) calls the backend (port 8000) directly, which is a different origin. The backend therefore allows the frontend origin through `CORS_ALLOWED_ORIGINS` (default in Compose: `http://localhost:8080`). If you serve the frontend from another address, add it to that variable in `.env`.

The root `.env` is only for Compose. `backend/.env` is only for running the backend without Docker. Neither is copied into an image.

### Build the images separately
```bash
docker build -t workflowhub-backend ./backend
docker build --build-arg VITE_API_URL=http://localhost:8000 -t workflowhub-frontend ./frontend
```
`VITE_API_URL` is baked into the frontend bundle at build time, so changing it needs a rebuild.

## Continuous integration (GitHub Actions)


`.github/workflows/ci.yml` runs on every push and on pull requests to `main`. It has four jobs:

1. `lint` runs Ruff on the Django backend and oxlint on the React frontend. It uses Python 3.12 and Node.js 22, installs the required dependencies, and reports code-quality issues automatically.

2. `test-backend` sets up Python 3.12, installs `backend/requirements.txt`, and runs `python manage.py test` using a temporary SQLite database.

3. `test-frontend` runs in parallel with the backend tests. It sets up Node.js 22, installs dependencies using `npm ci`, and runs `npm test`.

4. `build-images` runs only after both `test-backend` and `test-frontend` succeed. It builds the backend and frontend Docker images without pushing them to a registry.

The `lint` job runs independently of the test jobs. The team will configure `lint` as a required status check so that lint failures block pull request merges.


The backend tests need the repository **secret** `DJANGO_SECRET_KEY` (Settings → Secrets and variables → Actions → Secrets → New repository secret). Use a throwaway value, for example a long random string, not the key used anywhere else. Without this secret the backend will not start and `test-backend` fails.

The frontend build needs `VITE_API_URL`. It comes from a **repository variable** (Settings → Secrets and variables → Actions → Variables), not from the YAML. It is a variable and not a secret because the value is public inside the JavaScript bundle.


## Continuous integration and deployment (CircleCI)

The CircleCI configuration is defined in `.circleci/config.yml`.

### CI workflow

The `ci` workflow runs the following jobs:

- `test-frontend`: Installs frontend dependencies, runs Vitest tests and stores JUnit test results.
- `test-backend`: Installs backend dependencies and runs Django tests.
- `build-images`: Builds the backend and frontend Docker images after both test jobs pass.
- `publish-render-images`: Builds and pushes versioned Docker images to GitHub Container Registry (GHCR).
- `deploy-render`: Deploys the backend and frontend images to Render and verifies their availability.

The `publish-render-images` job runs on the `main` branch and the `ci/39-deploy-render-circleci` branch. The `deploy-render` job runs only on `main`.

### Required CircleCI contexts and environment variables

The following CircleCI contexts are required:

**`ghcr-push`**
- `GHCR_USER`: GitHub Container Registry username.
- `GHCR_TOKEN`: GitHub Container Registry access token.
- `VITE_API_URL`: Backend API URL used when building the frontend image.

**`render-deploy`**
- `BACKEND_DEPLOY_HOOK`: Render backend deployment hook.
- `FRONTEND_DEPLOY_HOOK`: Render frontend deployment hook.

Secret values must be stored securely in CircleCI and must not be committed to the repository.

### Docker image publishing

Images are published to GitHub Container Registry using commit-specific tags:

- Backend: `ghcr.io/kondor256/workflowhub-backend:circleci-<commit-sha>`
- Frontend: `ghcr.io/kondor256/workflowhub-frontend:render-<commit-sha>`

The backend image receives the Git commit SHA through the `GIT_SHA` Docker build argument. This value is exposed by the backend health endpoint.

### Render deployment and verification

The application is deployed to Render:

- Frontend: https://workflowhub-frontend.onrender.com
- Backend: https://workflowhub-backend-v1jm.onrender.com

The backend health endpoint is:

`/api/health/`

It returns the service status and deployed Git commit SHA.

After deployment, CircleCI retries the backend health check and verifies that the reported SHA matches the expected commit. It also retries the frontend HTTP availability check. The deployment job fails if either verification does not succeed within the retry period.

### Rollback procedure

To roll back to a previous version:

1. Identify the previous working commit SHA from the successful CircleCI pipeline.
2. Locate the corresponding backend and frontend images in GHCR.
3. Redeploy the previous backend image using its `circleci-<commit-sha>` tag.
4. Redeploy the previous frontend image using its `render-<commit-sha>` tag.
5. Verify the backend health endpoint and frontend availability after deployment.

Do not delete previous working images, as they may be needed for rollback.

To use the CircleCI deployment workflow:

1. Set up the GitHub repository as a CircleCI project.

2. Create the `ghcr-push` context and add `GHCR_USER`, `GHCR_TOKEN` and `VITE_API_URL`.

3. Create the `render-deploy` context and add `BACKEND_DEPLOY_HOOK` and `FRONTEND_DEPLOY_HOOK`.

4. Push a branch. The pipeline appears in CircleCI, and its status is shown on the commit or PR in GitHub.

The `publish-render-images` job uses the `ghcr-push` context. The `deploy-render` job uses the `render-deploy` context.

## Continuous deployment to Azure (GitHub Actions)

`.github/workflows/deploy-azure.yml` deploys every push to `main` to **Azure Container Apps** (toolchain A). The live app:

| | URL |
|---|---|
| Frontend | https://ca-wfh-frontend.redwater-4b97b0c9.australiaeast.azurecontainerapps.io |
| Backend health | https://ca-wfh-backend.redwater-4b97b0c9.australiaeast.azurecontainerapps.io/api/health/ |

The job runs in the GitHub Environment `azure-production` and does the following:

1. Builds both images and pushes them to GHCR with the built-in `GITHUB_TOKEN`. The backend is tagged with the commit SHA. The frontend is tagged `azure-<sha>`, because it is built with the Azure backend URL (`VITE_API_URL`).
2. Logs in to Azure with **OpenID Connect**: GitHub issues a short-lived token, and Azure accepts it through a federated credential on the managed identity `id-workflowhub-gha`. **No Azure password or key is stored in GitHub.** The identity has the Contributor role on the resource group `rg-workflowhub-a2` only.
3. Deploys the backend image (`azure/container-apps-deploy-action`). The container runs `migrate` before `gunicorn`, so new migrations are applied on start.
4. **Smoke test:** waits until `/api/health/` returns the new commit SHA as `version` (the image gets it from the `GIT_SHA` build argument), so a 200 from the old revision does not count.
5. Deploys the frontend image and checks that it answers 200. The job summary lists the images and URLs, and the run appears under **Deployments** on the repository page.

The environment `azure-production` holds four **variables** (not secrets): `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_SUBSCRIPTION_ID` and `VITE_API_URL`. Only `main` may deploy to it. The backend's own settings (`DJANGO_SECRET_KEY`, `DATABASE_URL`, `ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`, `DEBUG`) live in the container app; the first two are Container Apps secrets.

Both apps scale to zero when idle, so the first request after a quiet period waits for a cold start.

**Roll back:** run the deploy by hand for an older commit, or point the app to an older image:

```bash
az containerapp update -g rg-workflowhub-a2 -n ca-wfh-backend \
  --image ghcr.io/kondor256/workflowhub-backend:<older-sha>
```

## Releases

`.github/workflows/release.yml` runs when a tag starting with `v` is pushed. It builds the backend and frontend images and pushes them to the GitHub Container Registry (ghcr.io). It logs in with the built-in `GITHUB_TOKEN`, so no extra secret is needed. The frontend build reads the repository variable `VITE_API_URL`, as in CI.

### How to tag a release

Merge everything into `main` first, then:

```bash
git checkout main
git pull
git tag v1.0.0
git push origin v1.0.0
```

Use `vMAJOR.MINOR.PATCH`. A tag with a suffix, such as `v1.1.0-rc.1`, is treated as a pre-release. The run appears in the **Actions** tab as **Release**.

### Where the images are

| Image | Package page | Tags |
|---|---|---|
| `ghcr.io/kondor256/workflowhub-backend` | [workflowhub-backend](https://github.com/users/kondor256/packages/container/package/workflowhub-backend) | `1.0.0` (the tag without the `v`), `latest` |
| `ghcr.io/kondor256/workflowhub-frontend` | [workflowhub-frontend](https://github.com/users/kondor256/packages/container/package/workflowhub-frontend) | `1.0.0`, `latest` |

All packages of the repository are also listed at [github.com/kondor256?tab=packages&repo_name=ais-cicd-workflowhub](https://github.com/kondor256?tab=packages&repo_name=ais-cicd-workflowhub). `latest` is moved only by stable tags, never by pre-releases. The packages are private by default; change the visibility in the package settings if others must pull them without logging in.

### How to run a released version

The backend still needs the environment variables from the configuration table, and a PostgreSQL database. The easiest way is to pull the images and start them with the same Compose file, using an override file that replaces `build:` with `image:`:

```yaml
# docker-compose.release.yml
services:
  backend:
    image: ghcr.io/kondor256/workflowhub-backend:1.0.0
  frontend:
    image: ghcr.io/kondor256/workflowhub-frontend:1.0.0
```

```bash
docker login ghcr.io          # only needed if the packages are private
docker compose -f docker-compose.yml -f docker-compose.release.yml pull backend frontend
docker compose -f docker-compose.yml -f docker-compose.release.yml up --no-build
```

Because `VITE_API_URL` is baked into the frontend bundle at build time, the published frontend image calls the API address that was set when the release was built.


## Code Review and Linting

WorkFlowHub Release 1.1 uses checklist-guided pull request reviews and automated code-quality checks.

For the review strategy, reviewer responsibilities, comment labels, and the 16-item checklist, see [Code Review Guide](docs/CODE_REVIEW.md).

### Backend linting (Ruff)

Install the development dependency:

```bash
cd backend
python -m pip install -r requirements-dev.txt
```

Run Ruff:

```bash
ruff check .
```

Ruff checks Python code using the rules configured in `backend/pyproject.toml`.

### Frontend linting (oxlint)

From the `frontend` directory:

```bash
npm ci
npm run lint
```

### Automated linting in GitHub Actions

The GitHub Actions CI workflow includes a job named `lint`, which runs:

- `ruff check --output-format=github .` for the Django backend
- `npm run lint` for the React frontend

The `lint` job is configured as a required status check in the repository ruleset. Pull requests with failing lint checks cannot be merged into `main`.

### Pull Request Review Process

Developers work on feature branches and open pull requests against `main`. Pull requests must include the linked issue, testing information, deployment impact, and author self-check.

Reviewers follow `docs/CODE_REVIEW.md`, provide actionable feedback with checklist IDs, and verify that applicable CI checks pass before approving.


## Licence

See [LICENSE](LICENSE).
