# Decisions — 2026-10-31

- Name: Festival; Portuguese and English, static buildless application at runtime.
- Days as rows, countries as columns, compact SVG icons and detailed dialog. National date column and country header remain visible in the scrolling component.
- 44px active cells preserve usable touch targets while avoiding names in cells. SVGs are included locally rather than emoji.
- date-holidays-parser avoids reimplementing Easter/Orthodox/lunar/weekly/substitution grammars. A bundled European subset avoids calendar APIs and world-data loading. Development-only npm is justified for reproducible vendoring; production has no Node/npm dependency.
- Main/default country rules are intersected with listed first-level subdivisions before being labelled national; selecting a region uses its effective calendar, including removals.
- Source rules are community-maintained; no claim of comprehensive official municipal/historical coverage. Portugal is explicitly supplemented and referenced to legal/municipal sources.
- JSON schema 1 backs up every supported preference, including language. Single-record localStorage gives atomic replacement without introducing a database for preference-only data.
- Default public/bank events are visible. Additional optional/observance/school events have an explicit filter; type remains visible in details and accessible names.
- Years 2000–2050 bound computation. Source rule validity is retained; known Portugal suspension 2013–2015 and Madeira Autonomy Day since 2025 are encoded.
- No deployment instruction was given; the adopted baseline calls for a separate explicit production deployment. Deliver a downloadable project without production publication.

## Worldwide expansion — 2026-11-01

User requested all countries and corrected calendar control alignment. The picker now covers 249 ISO entries + XK + IC. Retain the existing local JavaScript engine for its 207 calendars; bundle precomputed national annual tables from Python holidays 0.107 for the other 44, avoiding any runtime service/Python requirement. This is an explicit extension of the original rule-only approach. Preserve source start-year limits and estimated qualifiers; mark calendars with no recorded events. Expand multi-day rule events across all their civil dates. Normalize selector appearance, sizing and responsive toolbar placement without changing preferences.
