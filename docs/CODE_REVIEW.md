
# WorkFlowHub — Code Review Guide

**Release:** 1.1  
**Checklist version:** 1.1
**Team:** Yury, Rahul, Samjhana

## 1. Purpose

This guide defines a consistent code review process for WorkFlowHub. Our goal is to catch defects, protect user data, improve maintainability, and share knowledge before changes are merged.


Before the `a1-submitted` tag, Assignment 1 had 17 merged pull requests, 16 approvals, 15 of which had an empty review body, and 3 inline review comments. These figures were counted from the repository's merged pull requests.

This baseline shows that although the team used pull request approvals, most approvals did not include written feedback. For Release 1.1, we aim to improve the review process through a documented checklist, actionable review comments, and automated CI checks.


## 2. Review Strategy

We use asynchronous, pull-request-based code reviews supported by automated CI checks and a standard reviewer checklist.

### Why asynchronous PR reviews?

- Team members can review code around different study schedules.
- GitHub records review comments, requested changes, approvals, and fixes.
- Automated checks detect test failures and lint issues.
- Written reviews help us collect evidence and improve our development process.

### Supporting practices

**Pair programming:** We may work together on technically difficult or high-risk changes, especially deployment configuration and authentication.

**Formal inspection:** A structured inspection can detect defects systematically, but it requires more coordination. For this small team, we borrow its checklist approach without adopting the entire formal inspection process.

Our chosen strategy combines the flexibility of PR reviews, the consistency of a checklist, and the reliability of automated quality checks.

## 3. Review Responsibilities

| Change | Author | Reviewer |
|---|---|---|
| WFH-17 — Code review and linting | Rahul | Yury |
| WFH-18 — GitHub Actions to Azure | Yury | Samjhana |
| WFH-19 — CircleCI to Render | Samjhana | Rahul |
| WFH-23 — Playwright e2e testing | Rahul | Yury |
| WFH-16 — Workflow status filter | Rahul | Samjhana |
| WFH-20 — Optional due date | Samjhana | Yury |
| WFH-21 — Pagination | Yury | Rahul |

The CODEOWNERS file helps GitHub automatically request reviewers for affected parts of the repository.

## 4. Review Protocol

Every pull request follows these steps:

1. **Check CI first.** Verify all applicable required checks. If a required check fails, request changes and identify the failing job using [CI-1].

2. **Understand the change.** Read the linked issue, acceptance criteria, PR description, and testing instructions.


3. **Review the code.** Examine the changed files using the checklist in Section 6. Check both the pull request diff and the complete updated files before reporting defects. Distinguish deleted lines from added lines, verify existing tests, and pay particular attention to functionality, security, CI/CD configuration, readability, and documentation.

4. **Submit a documented review.** Choose Request changes, Comment, or Approve. Include a checklist summary and identify any blocking issues. Do not submit an empty approval.

5. **Re-review after fixes.** Check the author's responses and new commits, verify updated CI results, and resolve review conversations before approval.

6. **Respond promptly.** Aim to provide the first review within 24 hours of a review request.

A pull request should be merged only after all required checks pass, blocking issues are addressed, required approvals are obtained, and review conversations are resolved.

## 5. Review Comment Labels

We use consistent labels so that authors understand the importance and intention of each comment.

| Label | Meaning |
|---|---|
| `issue:` | Identifies a defect or requirement not met |
| `suggestion:` | Proposes an improvement |
| `question:` | Requests clarification |
| `nitpick:` | Identifies a minor, optional improvement |
| `praise:` | Recognises a good implementation |

Comments may include `(blocking)` or `(non-blocking)` to indicate whether a change is required.

### Examples

**Blocking issue**

`issue (blocking): [SEC-1] The queryset is not restricted to the authenticated user. Please filter by request.user and add an ownership test.`

**Suggestion**

`suggestion (non-blocking): [RD-1] Consider moving the repeated API request logic into the existing API client.`

**Question**

`question: [CI-3] Have the new environment variables been configured on both Azure and Render?`

**Nitpick**

`nitpick (non-blocking): [DOC-2] This section could use a clearer heading.`

**Praise**

`praise: [FT-2] Good coverage of both successful and invalid input cases.`

Comments should explain the problem, its impact, and the expected action whenever possible.

## 6. Reviewer Checklist v1

Reviewers should use the applicable checklist items for every pull request.

Use Pass, Fail, or N/A and explain any failed check in a review comment with the corresponding ID.

### Functionality and Tests

| ID | Review question |
|---|---|
| FT-1 | Does the change satisfy every acceptance criterion of its linked issue? |
| FT-2 | Are tests included for new behaviour, covering backend and frontend where relevant, including at least one failure case? Before requesting additional tests, has the reviewer checked the existing test coverage and CI results? |
| FT-3 | Are edge cases handled, such as empty input, invalid values, or missing resources? |

### Security and Configuration

| ID | Review question |
|---|---|
| SEC-1 | Are database queries restricted to the authenticated user where ownership is required? |
| SEC-2 | Are secrets and hostnames kept out of source code, with configurable values supplied through environment variables and documented in `.env.example`? |
| SEC-3 | Is user input validated by the backend serializer rather than only in React? |
| SEC-4 | Do new protected API endpoints require authentication? |

### Docker and CI/CD

| ID | Review question |
|---|---|
| CI-1 | Have all applicable required checks passed in GitHub Actions and CircleCI? |
| CI-2 | Are dependencies pinned appropriately, and do both Docker images build successfully? |
| CI-3 | For deployment changes, are the correct build identifiers passed to Docker images, environment variables available in the required CI jobs, production branch filters correct, and post-deployment health and availability checks included? Are Azure and Render deployment impacts documented where relevant? |
| CI-4 | Are database migrations included and safe for existing data, using nullable fields or appropriate defaults where needed? |

### Readability and Design

| ID | Review question |
|---|---|
| RD-1 | Does the code follow existing project naming, structure, and design patterns? |
| RD-2 | Is the pull request focused on one issue and reasonably small, normally under approximately 400 changed lines? |
| RD-3 | Are known shortcuts or unresolved technical limitations documented as follow-up work? |

### Documentation and Process

| ID | Review question |
|---|---|
| DOC-1 | Does the PR explain what changed, why it changed, how to test it, and which issue it addresses? Has the description been updated to reflect the final scope, including deployment impact and any changes added during review? |
| DOC-2 | Are relevant README/API documents updated, and do commits follow the agreed naming convention with the issue number? For deployment changes, are the pipeline steps, required configuration and context variable names (without secret values), service URLs, and rollback instructions documented? |

Normally, the PR uses `Closes #N` for its issue. The first WFH-17 PR is an exception: it uses `Refs #37`, since the issue remains open until the checklist v1.1 follow-up PR is completed.

## 7. Review Summary Template

Every reviewer should finish with a short summary such as:

**Review checklist v1**

- FT-1: Pass
- FT-2: Pass
- SEC-1: Pass
- SEC-2: Fail — see inline comment
- CI-1: Pass
- CI-4: N/A — no database migration
- Remaining applicable items: Pass

**Result:** Request changes

**Blocking findings:** One security issue under SEC-2.

**Next action:** Address the comment, push a fix, and request re-review.

The final review should account for all 16 checklist items, including any that are not applicable.


## 8. Pilot Review Retrospective and Checklist v1.1

### 8.1 Pilot Reviews

Checklist v1.0 was evaluated using the code reviews of:

- WFH-18 — GitHub Actions deployment to Azure (PR #44).
- WFH-19 — CircleCI deployment to Render (PR #45).

The findings below are based on actual GitHub review comments, author responses, and review outcomes.

### 8.2 Findings from WFH-18 (PR #44)

During the Azure deployment review, two concerns were raised about the health endpoint and its tests.

The reviewer initially interpreted deleted lines in the GitHub diff as existing code and questioned whether the health endpoint returned the build version correctly. The reviewer also requested test updates that were already included in the branch.

The author clarified both concerns by referring to the complete updated files, existing tests, and successful CI results. The reviewer subsequently approved the PR.

**Lessons learned:**

- Reviewers should distinguish removed and added lines in a PR diff.
- Reviewers should inspect the final source file when a diff is unclear.
- Existing tests and CI evidence should be checked before requesting additional test cases.

These findings informed improvements to the review protocol and FT-2.

### 8.3 Findings from WFH-19 (PR #45)

The CircleCI-to-Render deployment review identified several concerns:

- The backend Docker build needed the commit SHA to support deployment-version verification.
- Deployment required backend health checks and frontend availability checks.
- CI environment variables needed to be available in the correct jobs or contexts.
- Temporary feature-branch deployment permissions needed to be removed before merging.
- The README needed deployment configuration and rollback documentation.
- The PR description needed updating after the scope of the changes expanded.

The author addressed the deployment and documentation feedback, explained the environment-variable configuration, and received approval after further review.

**Lessons learned:**

- Passing image-build checks alone does not prove that the expected version has been deployed.
- Reviewers should verify environment-variable scope, deployment verification, and branch filters.
- Deployment documentation and PR descriptions must reflect the actual implementation.

These findings informed improvements to CI-3, DOC-1, and DOC-2.

### 8.4 Checklist v1.1 Decisions

Based on both pilot reviews, the team identified opportunities to make the checklist more precise without increasing review complexity.

The original 16 checklist items are retained.

Version 1.1 improves:

1. The review protocol: inspect the final code as well as the PR diff.
2. FT-2: verify existing tests and CI results before requesting new coverage.
3. CI-3: verify deployment identifiers, CI variable scope, branch filters, and post-deployment checks.
4. DOC-1: ensure PR descriptions reflect the final scope.
5. DOC-2: require clear deployment and rollback documentation where applicable.

Automated linting continues to handle style-related checks, allowing human reviewers to focus on functionality, security, deployment behaviour, and maintainability.

The specific changes and supporting PR evidence are recorded in Section 9.


## 9. Change Log

The following changes were introduced in checklist v1.1 following the pilot reviews of WFH-18 (PR #44) and WFH-19 (PR #45).

| Version | Item | Change | Reason | Evidence (PR #) |
|---|---|---|---|---|
| 1.1 | Review Protocol (Section 4) | Added guidance to inspect complete updated files, distinguish added and deleted lines, and verify existing code before reporting defects. | During the Azure review, deleted lines were initially interpreted as active code, leading to unnecessary change requests. | #44 |
| 1.1 | FT-2 | Clarified that reviewers should check existing test coverage and CI results before requesting additional tests. | PR #44 already contained tests for the health endpoint's version field and default value, which were initially overlooked. | #44 |
| 1.1 | CI-3 | Expanded deployment checks to cover build identifiers, environment-variable scope, production branch filters, backend health checks, and frontend availability. | PR #45 identified missing deployment verification and build configuration concerns, alongside questions about CI context variables and temporary branch filters. | #45 |
| 1.1 | DOC-1 | Added a requirement to keep PR descriptions accurate when implementation scope changes during review. | PR #45's description initially covered CircleCI testing but did not reflect the expanded Render deployment and backend changes. | #45 |
| 1.1 | DOC-2 | Expanded deployment documentation checks to include pipeline steps, configuration variable names, service URLs, and rollback instructions. | The reviewer requested additional README guidance to support deployment maintenance and troubleshooting. | #45 |

### Version 1.1 Summary

Checklist v1.1 retains all 16 original review item IDs.

The improvements clarify existing review expectations rather than introducing additional checklist items.

The changes are supported by recorded review discussions and author responses in PRs #44 and #45.

Automated lint checks continue to handle code-style issues, while reviewers focus on functionality, security, configuration, deployment verification, and documentation.
