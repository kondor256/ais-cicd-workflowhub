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
└── README.md
```

Not everything exists yet. The backend and frontend arrive in WFH-02, Docker in WFH-04 and CI in WFH-05, WFH-08 and WFH-09. Run and setup instructions will be added with those stories.

## Configuration

All configuration comes from environment variables. No secrets are committed; only `.env.example` files are.

`DJANGO_SECRET_KEY`, `DEBUG`, `ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`, `DATABASE_URL`, `VITE_API_URL`

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

## Licence

See [LICENSE](LICENSE).
