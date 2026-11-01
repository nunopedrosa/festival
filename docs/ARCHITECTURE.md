# Architecture and code map

- index.html: static shell; styles.css: flat responsive layout and bounded scroll table.
- icons.js: generated local SVG geometry map from assets/icons.svg; dynamic icons embed their paths directly with a viewBox, without external use references. Header icons are inlined at build time.
- assets/flags/: local flag-icons SVGs for every selectable country/territory, precached for offline use; attribution in vendor/flag-icons-LICENSE.txt.
- i18n.js: complete EN/pt-PT interface catalogues; country names are generated in vendor/country-names.js, with existing European Portuguese refinements retained in engine.js.
- vendor/holiday-parser.js: locally bundled rule engine, syntax target Safari 12. No external imports or CDN. esbuild's destructuring compatibility flag is explicitly overridden because Safari 12 supports the syntax, while esbuild cannot transform a related Safari bug; physical Safari testing remains required.
- vendor/world-data.js: complete worldwide rule catalogue, shared holiday names and Portuguese amendments. Not precomputed annual holiday lists.
- vendor/supplement-data.js: national annual date tables for 44 further ISO entries, generated from Python holidays 0.107; source start/end bounds and upstream estimated qualifiers are retained.
- scripts/generate-supplement.py: optional offline-data maintenance step, pinned in scripts/requirements-data.txt. Python is not a runtime or regular-build dependency.
- engine.js: civil dates, multi-day event expansion, region metadata, effective regional calendars, country-level intersection, holiday symbols, bounded 100-result cache, preference validation. Dates use the rule engine's date string; UTC timestamps never shift a displayed holiday date.
- app.js: UI, immediate translations, country draft editing, localStorage revisioned preferences, backup preview/validation/atomic replace, installation help, service-worker update/readiness messages.
- sw.js + precache.js: complete version cache, explicit activation, runtime cached assets, readiness verification and at most two Festival release caches. No user preference data is in the service worker.
- scripts/build.cjs: pinned dependency bundling, subset extraction with _days dependencies, local rule amendments, licenses, precache and dist output. No network requests by the produced runtime.
- tests/engine.cjs: domain regression checks across all selectable countries and selected reference dates.
- tests/workflows.cjs: isolated DOM simulation of view/country preferences, backups and failure paths.
- tests/offline.cjs: isolated service-worker cache/activation/readiness simulation; not a substitute for a physical browser offline/install/update test.

Storage: localStorage key festival.preferences.v1 stores all preferences and a revision atomically, plus backup-export status outside the fingerprinted preferences. A conflicting revision prevents silent overwrite. Ordinary save failure retains session preferences with an error; restore failure preserves the prior in-memory and durable preferences.

Privacy: all runtime requests are same-origin app assets. Source links open only when invoked. No API polling, analytics, remote fonts or accounts.
