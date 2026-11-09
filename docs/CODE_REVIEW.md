
# WorkFlowHub — Code Review Guide

**Release:** 1.1  
**Checklist version:** 1.0  
**Team:** Yury, Rahul, Samjhana

## 1. Purpose

This guide defines a consistent code review process for WorkFlowHub. Our goal is to catch defects, protect user data, improve maintainability, and share knowledge before changes are merged.

The Assignment 1 review baseline reported 17 approvals without written review feedback. For Release 1.1, we will improve review quality by using a documented checklist, actionable comments, and automated CI checks.

The baseline figures should be confirmed against the repository's Assignment 1 pull requests before being included in the final report.

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

3. **Review the code.** Examine the changed files using the checklist in Section 6. Pay particular attention to functionality, security, CI/CD configuration, readability, and documentation.

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
| FT-2 | Are tests included for new behaviour, covering backend and frontend where relevant, including at least one failure case? |
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
| CI-3 | Have configuration changes been applied to both Azure and Render where necessary and recorded in the PR's deployment impact section? |
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
| DOC-1 | Does the PR explain what changed, why it changed, how to test it, and which issue it addresses? |
| DOC-2 | Are relevant README/API documents updated, and do commits follow the agreed naming convention with the issue number? |

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

## 8. Checklist Improvement Process

Checklist v1 will be piloted during the reviews of WFH-18 and WFH-19.

Reviewers and authors will record:
- Items that are unclear
- Checks that do not apply to certain PR types
- Missing security, testing, or deployment concerns
- Suggestions for reducing unnecessary review effort

After the team retrospective, we will update the checklist to v1.1 in a separate pull request.

Changes must be based on actual review experience rather than invented findings.

## 9. Change Log

| Version | Item | Change | Reason | Evidence (PR #) |
|---|---|---|---|---|

The change log will be completed following the pilot reviews and retrospective.
