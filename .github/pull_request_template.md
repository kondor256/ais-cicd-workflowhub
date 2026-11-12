
## Summary
<!-- What does this PR change, and why? Explain how it meets the linked issue's acceptance criteria. -->

## Linked issue
Closes #

## Type of change
- [ ] Feature (`feature/`)
- [ ] DevOps / infrastructure (`devops/`)
- [ ] CI/CD pipeline (`ci/`)
- [ ] Bug fix (`fix/`)
- [ ] Documentation only

## How to test
<!-- Provide commands and steps that the reviewer can follow to verify the changes. -->

**Commands run:**
```bash
# Add relevant testing commands here
```

**Results:**
<!-- Summarise the actual test results. -->

## Deployment impact (A = Azure, B = Render)
<!-- Check all applicable options and explain changes for each deployment platform. -->

- [ ] None
- [ ] New or changed environment variables (updated on both applicable platforms and in `.env.example`)
- [ ] Database migration (nullable or with a safe default)
- [ ] API response shape changed (frontend updated)
- [ ] Other deployment-related changes

**Details:**
<!-- Explain any changes affecting Azure, Render, Docker images, deployment pipelines, or configuration. -->

## Author self-check
<!-- Complete this checklist before requesting a review. See docs/CODE_REVIEW.md for the full reviewer checklist. -->

- [ ] **FT-1:** Every acceptance criterion of the linked issue is met.
- [ ] **FT-2:** Tests have been added or updated for new behaviour, including a failure case where applicable.
- [ ] **SEC-2:** No secrets, credentials, or hosts are hard-coded. Configuration uses environment variables.
- [ ] **CI-1:** All applicable required GitHub Actions and CircleCI checks are green.
- [ ] **RD-2:** The PR is focused on one issue and reasonably small (normally under approximately 400 changed lines).
- [ ] **DOC-2:** Relevant README or documentation changes are included, and commits follow Conventional Commits with the issue number.

## Additional checks
- [ ] Branch name follows the agreed convention (`feature/<#>-slug`, `devops/<#>-slug`, `ci/<#>-slug`, or `fix/<#>-slug`).
- [ ] No `.env` files, passwords, API tokens, or other secrets are committed.
- [ ] Changes have been tested locally where applicable.
- [ ] Known limitations or follow-up work are documented.

## Screenshots / evidence
<!-- Add relevant screenshots, CI runs, Docker build results, or links to evidence. -->

## Reviewer notes
<!-- Highlight anything the reviewer should pay particular attention to, including security, deployment, or testing concerns. -->
