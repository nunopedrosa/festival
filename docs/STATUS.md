# Status — Festival 1.1.0

Implementation complete for first-version scope. Deliverable: ready-to-run static project with source and optional rebuild tooling. No production deployment.

## Verification evidence

- Engine checks: 58 selectable catalogues × 4 years (2000, 2026, 2027, 2050), valid civil dates, leap years, Portugal's 13 national holidays in 2026, Easter/Good Friday/Corpus Christi, Orthodox Easter, UK substitute holidays, Scotland exclusion of Easter Monday, Bavaria regional Epiphany, Portuguese Carnival/municipal optional classification, Azores and Madeira rules, 2013–2015 suspension and invalid preferences.
- DOM simulation: full month/all-days rendering; language changes; country/region saves; country editing cancellation; backup export metadata; Restore preferences checked/unchecked; cancellation; invalid schema; storage quota rollback; stale-window protection.
- Service-worker simulation: every precache asset exists; no automatic skipWaiting; complete readiness; missing-resource readiness failure; offline engine/catalogue fetches; bounded release caches. Real install/update/offline remains unverified in the HTTP preview environment.
- Modern Chrome visual inspection: main grid, Portuguese/English switch, December holiday details; responsive iframe layouts at 320 and 375px and a short landscape frame. The 320px frame had page scrollWidth equal to clientWidth (305px, accounting for its scrollbar). Settings fitted in the narrow frame and its body scrolled independently.

## Shared PWA baseline adoption audit

| Group | Status / evidence or remaining gap |
|---|---|
| Local/privacy | Implemented; no calendar APIs; browser offline lifecycle still needs HTTPS/device QA. |
| Settings/help | Implemented and narrow Settings visually inspected; gear then local SVG flag selector. |
| EN/pt-PT | UI dictionaries have matching keys; browser switching checked; holiday names fall back when untranslated. |
| Backups | Automated checked/unchecked/cancel/invalid/quota/conflict checks pass in isolated DOM simulation. Real legacy iOS download/import still needs device QA. |
| Installation | Manifest and local icons implemented; manual instructions available; physical install untested. |
| Updates | Complete release caching, version comparison and explicit activation implemented; simulated activation checked; actual multi-version browser cycle untested. |
| Visual/interaction | 2px controls, 4px panels, flat surfaces, SVG icon family, focus handling, 44px targets and bounded component scrolling. No independent collapsible cards are used. |
| Resilience | Revision checks and error states implemented; restore failure/cancel tested. No user records or irreversible operations. |
| Helper typography | Partial: consistent narrow system-font stack used. The shared baseline has not selected its canonical bundled narrow font; no cross-app font conformance is claimed. |
| Layout/access | Desktop and narrow modern-browser QA; physical touch, enlarged OS text and VoiceOver untested. |
| Safari 12/iPhone 6 | Required target; conservative app syntax and Safari-12 bundle target; actual device/Safari 12 untested. CSS gap may have reduced spacing on older Safari; core flow has wrapping/fallback spacing. |
| Domain/outputs | Reference calculation regressions pass. Regional/municipal coverage remains partial; no ICS/print export promised. |
| Release/docs | Version markers consistent; pinned sources/licenses included. No production deployment performed. |

## Next useful validation

Install over HTTPS on the user's iPhone, verify first cache preparation then airplane-mode reload, preferences backup/restore via Files, and a controlled update from 1.0.0 to the next release. Test Safari 12/iPhone 6 specifically; modern Chrome responsive layouts are not device evidence.

## 1.0.1 validation — 2026-11-01

Focused DOM regressions passed: each holiday button contains direct SVG geometry, with no external use element; column labels contain codes only with accessible country names; columns are declared at 44 px. Existing preference/backup/cancellation/quota/conflict regressions passed unchanged. Offline cache simulation passed with icons.js included.

Modern Chrome inspection in a 375 px frame confirmed visible Christmas tree icons in the calendar and details. Measured country header widths were all 44 px, and page scrollWidth/clientWidth were both 360 px (frame scrollbar accounted for). Physical Safari/iPhone validation remains pending.

## 1.0.2 validation — 2026-11-01

All 58 country/territory flags are bundled as local SVG files with their MIT license. Build, preference/backup workflow regressions and the complete offline asset simulation passed. Modern Chrome inspection in a 375 px frame confirmed loaded flags below PT/ES/FR/DE/GB, with every measured country header still 44 px wide. Physical iPhone/Safari validation remains pending.

## 1.1.0 — worldwide scope and controls

251 selectable entries (249 ISO + XK + IC), 207 local rule calendars and 44 national annual-table supplements. World flag/name coverage is complete at entry level; regional, municipal, historical and future confirmed-date coverage still varies by source. No runtime calendar-service requests. The complete packaged data and flags are included in offline preparation.

All engine, preference/backup and simulated offline checks passed after expansion. Engine checks cover every entry across 2000, 2026, 2027 and 2050, old-format preferences still restore, and a 251-entry preference backup validates. Additional checks cover Bhutan National Day and Qatar National Day and reject invented Bhutan dates before its source start year.

Modern Chrome inspection at 375 and 620 px confirmed the normalized controls. At 620 px the year group, year selector, Today, month and Countries controls all measured 44 px high on the same line; mobile controls wrap in two rows. Bhutan was found in the picker, selected, and its 17 December 2026 National Day was displayed. Physical Safari/iPhone validation remains pending.

Worldwide checks also cover multi-day Eid al-Fitr cells rather than displaying only the first day of a multi-day rule.
