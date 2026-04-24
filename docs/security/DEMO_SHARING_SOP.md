# Demo Sharing SOP (ISO 27001:2022 A.5.x, A.14.x)

Purpose
- Define a repeatable, auditable process to share a sanitized repository demo with investors without exposing IP or secrets.

Scope
- Applies to all investor/demo sharing scenarios for EcoSynTech Farm OS.

Principles
- Use two-repo model: private main (internal) and public/demo (investor demo).
- Sanitize content before sharing: remove models, secrets, and proprietary AI logic; replace with placeholders where appropriate.
- Maintain an audit trail of all sharing actions (who, when, what was sanitized, where it was pushed).
- Validate demo branch before sharing using the provided validation script.

Process
- Step 1: Create a sanitized demo branch from main (public/demo) using the automation script or manually.
- Step 2: Remove sensitive assets:
  - Delete or mask AI model files (e.g., .tflite, .onnx) from the demo branch.
  - Remove secrets (.env, keys) or ensure they are not committed to the branch.
  - Replace proprietary AI modules with placeholders that demonstrate interfaces but not implementations.
- Step 3: Update demo README with a clear disclaimer that this branch is sanitized for investor review.
- Step 4: Run validation: ensure no sensitive files exist and that AI placeholders are in place.
- Step 5: Push to the public repo (ecosyntech-public) and share the link with investors.
- Step 6: After the demo, revert or delete the public demo branch or keep for audit with restricted access.

Artifacts & Evidence
- Keep a separate audit log documenting the demo creation, sanitization steps, and sharing details (branch name, date, who performed it).
- Ensure evidence aligns with A.14 control requirements for AI governance and A.5 controls for information classification.

Owner
- Security & Compliance Lead

Date
+- Next review: 6 months from creation
