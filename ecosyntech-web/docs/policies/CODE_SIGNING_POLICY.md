# CODE SIGNING POLICY

Version: 1.0.0
Date: 2026-04-23

Overview
- This policy defines requirements for digital signing of commits and artifacts to ensure integrity, traceability, and ISO 27001 alignment (A.12.1, A.14.x, A.9.x).

Scope
- All code committed to the repository and CI artifacts produced by the build pipeline.

Key Information
- Signing Key Fingerprint (SHA256): Iqd6mYzCDSWsa5nGEq+pehSagljt6s/FpiKsJxd3flI
- Key type: GPG (or as provided), private keys MUST be stored in secure secrets (e.g., GitHub Secrets) and rotated per A.8.24 rotation policy.
- Public key fingerprint should be shared with auditors and stored in ISMS as evidence of authenticity.

Roles and Responsibilities
- Developers: sign commits locally; ensure GPG is configured with correct key before signing.
- CI/Automation: verify signed commits if configured; reject unsigned commits where required by policy.
- Security/Compliance: maintain key rotation schedule and ensure private keys are rotated and stored securely.

Process
- Local setup:
  - Import the private key into the local GPG keychain and configure git:
    - git config --global user.signingkey <your-key-id>
    - git config --global commit.gpgsign true
    - gpg --export --armor <your-key-id> > public-key.asc
  - Sign commits: git commit -S -m "message"
- CI setup:
  - Store the private key in GitHub Secrets (signed payload), and import it in the workflow before running builds that generate signed artifacts.
  - Verify signature in CI where applicable (using gpg --verify).

Security considerations
- Rotate keys every 90 days (A.8.24) and rotate secret/passthrough material in CI accordingly.
- Do not hard-code private keys in repo; use secrets management.
- Maintain an auditable trail of signed commits and artifacts.

Audit and evidence
- Include in ISO GAP evidence: mapping to A.8.24, A.9.x, and demonstration of signing process in the evidence pack.

Revision history
- 1.0.0: Initial policy creation.
