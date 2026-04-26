# Documentation Guide

Purpose
- Provide a lightweight, consistent template for all project docs.

Scope
- Architecture, Executive Summary, ISO 27001 GAP, SOPs, Audit Evidence, Release Notes.

Structure Template
- Title (H1)
- Version and Date (top-right badge if desired)
- Summary/Overview
- Sections by topic with consistent headings:
  - Goals
  - Assumptions
  - Architecture/Design
  - Security/Compliance
  - Testing/Validation
  - Operations
  - Appendix/References

Versioning & Updates
- Keep a CHANGES/RELEASE_NOTES.md at repo root.
- Each doc should include a Last Updated date (ISO format: YYYY-MM-DD) and a short Change log entry.

VERSIONING SCHEME
- Architecture/Design docs (e.g., ARCHITECTURE.md, EXECUTIVE_SUMMARY.md, ISO_27001_GAP, SOP_INDEX): Use milestone versioning (e.g., 6.0.0 for dual-path architecture) - reflects major architecture/policy changes, not code releases.
- Code releases (package.json, RELEASE_NOTES.md, CHANGELOG.md): Follow semantic versioning (e.g., v5.2.0) - increments with code changes.
- ISMS/Compliance docs: Independent versioning (e.g., 1.0.0 for initial ISMS policy) - cycles with audit/compliance reviews.

CONSISTENT FIELDS
- Last Updated: YYYY-MM-DD - required for all audit-relevant docs.
- Version: Clear about which scheme is used (architecture milestone vs. code release vs. compliance).
- Note: If version differs from package.json, explain in a "Version Notes" section.

Review & Approvals
- Include Author, Reviewer, Date.
- Approvals can be via PR reviews.

Templates (optional)
- ARCHITECTURE template
- ISO_27001_2022_GAP_ANALYSIS template
- SOP_INDEX template
- EXECUTIVE_SUMMARY template

Usage
- Use this guide whenever adding/updating a doc in the repo.
