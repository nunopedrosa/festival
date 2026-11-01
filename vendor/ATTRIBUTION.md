# Festival: holiday data attribution

Festival 1.1.0 includes date-holidays 3.38.0 (catalogue 2026-10-24), by commenthol and contributors. https://github.com/commenthol/date-holidays

The worldwide country rules and shared names are a modified adaptation of the upstream holidays.json, distributed under **CC BY-SA 3.0** as declared inside that dataset. https://creativecommons.org/licenses/by-sa/3.0/

Retain this attribution, license, modification notice and upstream references when redistributing the adapted dataset. The upstream LICENSE (included as date-holidays-LICENSE.txt) contains individual country source attributions. Unmodified country YAML files, including their @attrib references, are in vendor/sources/ in the source project.

Local modifications: worldwide catalogue; Portugal optional Carnival classification; European Portuguese Mother's Day; English Republic Day and Restoration of Independence; 2013–2015 suspended national holidays; Azores, Madeira, Lisbon and Porto subdivisions. Legal/local references and coverage are in docs/DATA_SOURCES.md. Changes are made by the Festival project, 2026-10-31.

The parser and other runtime components are bundled in holiday-parser.js. Upstream copyright and licenses are preserved in that file and parser-LICENSE.txt; date-holidays-parser is ISC licensed. Parser release: see package-lock.json. The application code and original SVG artwork are MIT licensed (LICENSE).

This catalogue contains reusable community-maintained rules. It is not an assertion that every country, municipality, historical year or extraordinary government decision has been independently verified. Native holiday names may fall back to English when a translation is unavailable. Some religious dates depend on official announcements.

Country flags: flag-icons, Copyright (c) 2013 Panayiotis Lipiridis, MIT. Local unmodified 4:3 SVG subset for the 251 selectable countries/territories. Full license in flag-icons-LICENSE.txt. Source: https://github.com/lipis/flag-icons

The 44 additional national calendars are generated offline from Python holidays 0.107 (MIT), Copyright Vacanza and contributors. Full license: python-holidays-LICENSE.txt. Country source documentation and references: python-holidays-sources.json. Annual tables retain native names and estimated qualifiers. https://github.com/vacanza/holidays

Country names generated from i18n-iso-countries (MIT), Copyright (c) 2016 widdix GmbH; full license in country-names-LICENSE.txt. https://github.com/michaelwittig/node-i18n-iso-countries
