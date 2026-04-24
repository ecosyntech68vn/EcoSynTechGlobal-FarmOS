BRANCH PROTECTION (ISO 27001:2022 Alignment)

Overview
- Defines branch protection rules to safeguard IP while enabling controlled sharing for investor demos.

Recommended rules
- main (private/internal):
  - Require pull request reviews before merging
  - Require status checks to pass (CI) before merging
  - Require a linear history (no merge commits) where possible
  - Prohibit force pushes
  - Require signed commits (GPG)
  - Restrict pushes to authorized maintainers
- public/demo (demo branch):
  - Protected against direct pushes; require PRs and sanitization checks before merge into demo
  - Auto-sanitize script must be used; add a guard to ensure only sanitized content is merged
  - Review threshold may be lower for speed, but must maintain traceability

Operations guidance
- Use a dedicated automation script to create demo branches (create-demo-branch.sh) and to validate (validate-demo-branch.sh)
- All demo content should be stored in ecosyntech-public repository; internal sensitive code should remain in main/private repo
- Maintain audit trails of branch creation, sanitization steps, and investor sharing actions

Compliance mapping (A.5.x, A.14.x)
- A.5.9/5.10: Information classification and labeling
- A.8.4: Access control: restrict sensitive code and assets
- A.14.x: AI/ML operations governance and secure bootstrap for models used in demos

Owner: Security & Compliance Lead
Next review: 6 months
