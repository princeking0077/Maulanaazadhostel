# Version 2.1.9 — 2025-11-15

- Bonafide: Correct course/degree wording (e.g., B.Pharm. vs B.Ed.) with editable override; added font scale and font family controls for improved A4 readability.
- Dashboard: New Admin Finance cards showing Income, Expenses, and Net using itemized billing totals.
- Admin Billing: Minor robustness using netAmount for facility totals.
- Build: Verified production build and packaged Windows installer.

Notes: No DB migration required. Facility totals now prefer `netAmount` when available.