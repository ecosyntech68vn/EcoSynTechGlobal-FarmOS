# Two-Repo Architecture for Investor Demos

- Private main repository: EcosynTech-Web (internal access, full code, models, secrets)
- Public investor repository: ecosyntech-public (sanitized demo content for investor reviews)

Workflow
- Development happens in the private repo (main).
- When investor demo is required, run the sanitize pipeline to create a public/demo branch and push sanitized content to ecosyntech-public.
- Investors access ecosyntech-public for QA; sensitive content remains private.

Governance mapping (ISO 27001:2022)
- A.5.x: Information classification and labeling between PRIVATE and PUBLIC.
- A.8.4: Access control for both repositories; ensure public has restricted code/content.
- A.14.x: AI/ML governance artifacts in private and sanitized evidence in public.

Key artifacts sharing plan
- Public repo should include: public docs, API references, governance docs, and sanitized AI interface placeholders.
- Private repo should include: full AI models, raw code, and secrets (not shared).

Owner: Security & Compliance Lead
Next Review: 6 months
