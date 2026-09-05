# Contributing to FileForge

Thanks for your interest in contributing. This document covers how the project is set up, how to get a local environment running, and what's expected in a pull request.

---

## 🏗️ Project Structure

FileForge is split into two independent services:

```
FileForge/
├── frontend/   # React app
└── backend/    # Express API
```

Each has its own `README.md` with setup instructions, its own `package.json`, and its own test suite. Changes to one service generally don't require touching the other.

---

## 🛠️ Local Setup

1. Fork the repository and clone your fork.
2. Follow the setup steps in [`frontend/README.md`](./frontend/README.md) and [`backend/README.md`](./backend/README.md), depending on which service you're working on.
3. Create a branch for your change:
   ```
   git checkout -b feature/short-description
   ```

The project runs locally only for now. There's no Docker setup or deployment step to worry about yet.

---

## ✅ Before Opening a Pull Request

Each service has its own quality checks. Run them from inside the relevant folder (`frontend/` or `backend/`):

```
npm run lint
npm run typecheck
npm run format:check
npm test
```

These are the same checks CI runs on every push and pull request. A PR won't be merged if any of them fail.

If you're adding a feature, add tests for it under the appropriate `tests/unit/` or `tests/integration/` folder in that service.

---

## 📝 Commit Messages

Keep commit messages short and specific about what changed and why. A subject line like `add PDF split validation for empty page ranges` is more useful than `fix bug`.

---

## 🔀 Pull Requests

- Keep PRs focused on a single change or feature. Smaller PRs are easier to review.
- Fill out the pull request template, it asks for what changed, why, and how it was tested.
- Link any related issue.
- Be ready to make changes based on review feedback. This is a normal part of the process, not a rejection.

---

## 💡 Feature Requests and Bugs

Use the issue templates under `.github/ISSUE_TEMPLATE/` when opening an issue. This helps keep reports consistent and easier to act on.

---

## 📜 Code of Conduct

This project follows the [Code of Conduct](./CODE_OF_CONDUCT.md). Participation in this project means agreeing to abide by it.