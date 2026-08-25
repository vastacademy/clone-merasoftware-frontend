# Documentation Index

This folder holds one file: **`CODEBASE_MAP.md`** — the current-state reference for this codebase.

Start there. It tells you, for every major system (auth, leads, projects, service plans, payments/invoices, trash, documents, chess, UI design system), the current rule and the exact file/function where the code lives — no history, no session logs, no rejected attempts.

## Why only one file

This folder previously held 63 session-log documents written over many development sessions, each describing one feature build or fix. They were consolidated into `CODEBASE_MAP.md` on 2026-08-25 because:

- Reading 63 files to find "where is the code for X" was a heavy, error-prone burden for both humans and AI sessions.
- Many of the older documents had been silently superseded by later ones, or by direct code changes never written back to any doc.
- A single, code-verified, current-state file is faster to scan and harder to get wrong.

A full backup of all 63 original files is kept at `frontend/src/DOCS_backup_before_consolidation_work1/` if historical context is ever needed (e.g. "why was this decision made," "what did we try before this").

## Working rule for this project

- No code or file changes without explicit permission — always propose and get approval first.
- No `npm run build` unless explicitly requested.
- Evidence-based only: verify against the actual code before stating something as current.
- When you update a system covered in `CODEBASE_MAP.md`, update the relevant section of that file too — keep it current, don't let it drift back into needing another audit.
