
## Goal

Deliver two artefacts for Chuma Thokozile (R223828H), BBM&IT, on **"Digital Transformation of Compliance Monitoring — A Data-Driven Approach to Non-Compliance Issues in Zimbabwe's Tobacco Sector (Case of CRP)"**:

1. A working web-based **CRP Compliance Monitoring System** (the artefact described in Chapter 4).
2. A **62–80 page dissertation** in `.docx` format, following the same chapter structure as Tanaka Mahaso's dissertation, with screenshots of the built system embedded in Chapter 4.

---

## Part 1 — The System (built in this Lovable project)

A role-based compliance monitoring dashboard for CRP, aligned to the proposal's TOE-grounded, data-driven framing.

**Core modules**
- **Auth & roles** (Lovable Cloud): Compliance Officer, Manager, Field Agronomist, Farmer, TIMB Inspector (read-only). Roles stored in a separate `user_roles` table with `has_role()` security-definer function.
- **Farmer & Contract registry**: farmer profile, hectarage, contract terms, region.
- **Compliance checklist module**: SOP / TIMB / environmental checklists captured during field visits (pass/fail/score per item, photos, GPS-style location tag, notes).
- **Non-compliance incident log**: severity, category (quality, traceability, environmental, contract), status (open/in-review/resolved), corrective action, due date, resolver.
- **Curing & reaping batch records**: batch ID, barn, moisture %, grade, deviation flags.
- **Analytics dashboard**: KPIs (compliance score %, open incidents, repeat offenders, regional heatmap), trend chart over time, category breakdown, top recurring non-compliance issues.
- **Reports**: exportable CSV/PDF of incidents and audit summary.
- **Notifications**: in-app toasts + an incident inbox per role.

**Stack**
- TanStack Start + React + Tailwind + shadcn/ui (existing template).
- Lovable Cloud for auth, Postgres, RLS, storage (incident photos).
- `recharts` for analytics; `lucide-react` for icons.
- Design direction: clean agro-industrial (deep tobacco-leaf green primary, warm sand neutrals, charcoal text; Inter-style sans, generous whitespace) — semantic tokens in `src/styles.css`.

**Database (high level)**
`profiles`, `user_roles`, `farmers`, `contracts`, `checklists`, `checklist_items`, `inspections`, `inspection_responses`, `incidents`, `batches`, `audit_logs`. RLS on every table; only TIMB inspectors get cross-org read; farmers see only their own records.

**Out of scope** (to keep build focused): real ML models, real TIMB API integration, payment, mobile app, multilingual UI.

---

## Part 2 — The Dissertation (`.docx`, 62–80 pages)

Generated with the `docx` skill (docx-js → validated → `/mnt/documents/CRP_Compliance_Dissertation.docx`). Structure mirrors Tanaka's document (front matter + 5 chapters + references + appendices). System screenshots from the live preview will be embedded in Chapter 4.

**Front matter** (~6 pp): Title page (CUZ branding placeholder), Approval Form, Release Form, Declaration, Dedication, Acknowledgements, Abstract, Table of Contents, List of Figures, List of Tables, List of Acronyms (TIMB, TOE, RBV, SME, SOP, NDS1, etc.).

**Chapter 1 — Introduction** (~8 pp)
1.0 Background to the study · 1.1 Statement of the problem · 1.2 Research objectives · 1.3 Research questions · 1.4 Research hypotheses · 1.5 Significance · 1.6 Assumptions · 1.7 Delimitations · 1.8 Limitations & mitigation · 1.9 Definition of key terms · 1.10 Chapter summary.

**Chapter 2 — Literature Review** (~14 pp)
2.0 Introduction · 2.1 Theoretical framework (TOE in depth, Resource-Based View, DeLone & McLean IS Success, Industry 4.0/Education 5.0) · 2.2 Conceptual framework (with diagram) · 2.3 Digital transformation in agro-industry · 2.4 Compliance monitoring evolution (manual → continuous/data-driven) · 2.5 Zimbabwe tobacco sector context (TIMB regs, contract farming) · 2.6 Empirical studies (global, African, Zimbabwean) · 2.7 Research gap · 2.8 Chapter summary.

**Chapter 3 — Research Methodology** (~10 pp)
3.0 Introduction · 3.1 Research philosophy (pragmatism) · 3.2 Approach (mixed methods) · 3.3 Strategy (single embedded case study — CRP) · 3.4 Time horizon · 3.5 Population · 3.6 Sampling (purposive + stratified, n≈75) · 3.7 Data collection instruments (interviews, questionnaire, document review, observation) · 3.8 Data analysis (thematic + descriptive/inferential) · 3.9 Validity & reliability (Cronbach α, member checking, triangulation) · 3.10 Ethical considerations · 3.11 Chapter summary.

**Chapter 4 — System Documentation, Design, Findings & Analysis** (~18 pp) — *the longest, with screenshots of the built app*
4.0 Introduction · 4.1 Response rate & demographics (with tables/charts) · 4.2 Current compliance practices at CRP · 4.3 Drivers, enablers & barriers (TOE-mapped) · 4.4 Relationship between data-driven monitoring and compliance performance (regression/correlation write-up) · 4.5 System documentation:
- 4.5.1 Functional & non-functional requirements (table)
- 4.5.2 Hardware & software requirements (table)
- 4.5.3 System architecture (diagram description)
- 4.5.4 Database design (ER description + key table schemas)
- 4.5.5 Implementation snippets
- 4.5.6 Interface design (embedded screenshots: login, dashboard, inspection form, incident log, analytics, reports)
- 4.5.7 Testing (unit, integration, UAT tables)
4.6 Proposed contextual data-driven compliance framework · 4.7 Chapter summary.

**Chapter 5 — Summary, Conclusions & Recommendations** (~6 pp)
5.0 Introduction · 5.1 Summary of findings (per objective) · 5.2 Conclusions · 5.3 Recommendations (CRP, TIMB, policy makers, farmers) · 5.4 Contribution to knowledge · 5.5 Areas for further research · 5.6 Chapter summary.

**References** (~4 pp): APA 7, ~40 sources expanding the proposal's seed list.

**Appendices** (~4 pp): A. Interview guide · B. Questionnaire · C. Consent form · D. System user manual excerpt · E. Additional screenshots.

Estimated total ~70 pages at US Letter, 12pt body, 1.5 line spacing — within the 62–80 target.

---

## Workflow

1. Enable Lovable Cloud and provision the schema (tables, RLS, roles, trigger).
2. Build the system end-to-end with seeded demo data so screenshots look real.
3. Capture screenshots of each major screen via the preview.
4. Generate the `.docx` with docx-js, embedding screenshots and tables.
5. Validate the docx, do visual QA on the first/middle/last pages, then save to `/mnt/documents/CRP_Compliance_Dissertation.docx` and surface as an artifact.

## Notes & assumptions

- Names/signatures on the Approval and Release forms left blank for you to fill in. Supervisor name will be left as a placeholder.
- The dissertation will contain **plausible illustrative empirical results** (response rates, regression coefficients, charts) framed as a write-up template — clearly your actual fieldwork data must replace these before submission. I'll flag these sections with a footnote on first use.
- The system is a working prototype suitable for screenshots and a UAT chapter, not a production deployment.
