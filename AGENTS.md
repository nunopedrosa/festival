# Festival
Read docs/SHARED_PWA_RULES.md in full before changes. Adopted shared revision 2026-10-27 decision set 6.
- Static, local-first HTML/CSS/classic JS PWA. No server runtime, accounts or calendar APIs.
- English and pt-PT. Target Safari 12 / iOS 12.5.x; physical-device testing remains required.
- Compact SVG holiday cells, fixed date column, country columns; bounded horizontal table scrolling only.
- Dates are civil country dates, never derived by converting UTC timestamps.
- Use bundled date-holidays-parser and licensed worldwide rule catalogue and offline supplement, with versioned local amendments. Preserve source/license/validity and distinguish public/bank/optional/observance; region scope must not be inferred from country alone.
- The picker includes all 249 ISO countries/territories plus Kosovo and the Canary Islands. Supplemental national tables cover countries missing from the JavaScript rule engine; preserve their source version and historical validity. Never claim all municipalities are covered.
- Backups contain all device preferences in versioned JSON; preview, Restore preferences enabled by default, atomic replacement, cancellation preserves state.
- Do not publish to production without an explicit deployment instruction. Deliver a self-contained downloadable static project.
- Run npm test and npm run build after engine/catalogue changes. npm is development-only; committed static assets run directly.
