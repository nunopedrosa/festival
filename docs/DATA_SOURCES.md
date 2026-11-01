# Sources and coverage — Festival 1.1.0

Catalogue: date-holidays 3.38.0, upstream data version 2026-10-24. Retrieved 2026-10-31. Calculations use the bundled date-holidays-parser and local rules; no calendar service is contacted by the app. Rules and source references are bundled, not live-refreshed.

Country rules: https://github.com/commenthol/date-holidays/tree/master/data/countries
Country attributions: vendor/sources/ in the source package. Distribution: CC BY-SA 3.0; see vendor/ATTRIBUTION.md.

## Portugal amendments

- National and optional holidays: Código do Trabalho, Articles 234–235. https://diariodarepublica.pt/dr/legislacao-consolidada/lei/2009-34546475-46746675
- Carnival is optional, not an unconditional national public holiday. Municipal Lisbon/Porto holidays are also classified as optional under Article 235. This describes the labour-code classification; public-sector tolerâncias de ponto are separate and are not added automatically.
- The suspension of Corpus Christi, Republic Day, All Saints and Restoration of Independence in 2013–2015 is encoded as dated exceptions; the 2016 reinstatement is reflected in the current Labour Code consolidated history linked above.
- Azores Day: Monday after Pentecost, Easter +50. Decreto Regional 13/80/A. https://diariodarepublica.pt/dr/detalhe/decreto-regional/13-1980-470865
- Madeira Day: 1 July. Decreto Regional 27/79/M. https://diariodarepublica.pt/dr/detalhe/decreto-regional/27-1979-363277
- Madeira 26 December: regional Christmas holiday, also specified in Decreto Legislativo Regional 21/2009/M, Article 5. https://diariodarepublica.pt/dr/detalhe/decreto-legislativo-regional/21-2009-493011
- Madeira Autonomy Day: 2 April, first occurrence 2025. Decreto Legislativo Regional 17/2024/M, published 2024-12-16, effective the following day. https://diariodarepublica.pt/dr/detalhe/decreto-legislativo-regional/17-2024-900164436
- Lisbon: 13 June. Municipal calendar: https://informacoeseservicos.lisboa.pt/fileadmin/espacos/ficheiros/Feriados_2022.pdf
- Porto: 24 June. https://www.gov.pt/locais-de-atendimento/espaco-cidadao-acm-cnaim-porto

## Explicit coverage boundaries

251 selectable entries: all 249 ISO 3166-1 countries/territories plus Kosovo and the Canary Islands. 207 have local JavaScript rule calendars; the remaining 44 have packaged national annual tables generated from Python holidays 0.107. Inclusion is a product coverage choice, not a geopolitical classification. Dependencies/territories are labelled in the country chooser.

Regions depend on the upstream catalogue. Portugal adds Azores, Madeira, Lisbon and Porto only; municipal coverage is partial. A single region/locality or all available subdivisions can be selected per country. National events remain included. Multiple different regions in one country are represented by “all available regions” in v1, not independent duplicate country columns.

National events are calculated from country rules that remain present in every listed first-level subdivision. A selected region uses its effective calendar, including removal of inherited rules; for example, Easter Monday is not carried into Scotland. Where coverage is partial, this intersection is only as complete as the bundled subdivisions. Review regional source data where that distinction matters.

The UI supports 2000–2050. Rule validity is preserved where supplied by upstream; the catalogue is not a complete historical audit, a guarantee of future legal stability, or complete coverage of emergency decrees. Islamic dates can depend on lunar observation. Empty cells mean no event recorded for the current selection. Bank holidays are shown distinctly from public holidays. Optional/observance/school days require the additional-events filter.

Sources open as external links and may require a connection; the catalogue, calculations and this source document are available offline after shell preparation completes.

## Worldwide supplement — generated 2026-11-01

Python holidays 0.107 (MIT), https://github.com/vacanza/holidays . The source covers all 44 ISO entries missing from date-holidays. Scripts/requirements-data.txt pins the generation dependency. Each country entry links to its source module; vendor/python-holidays-sources.json preserves country documentation and references. License: vendor/python-holidays-LICENSE.txt.

Tables for 2000–2050 are generated locally at maintenance time; they are not downloaded from calendar APIs during use. English and native names, including source estimated/observed qualifiers, are retained. Supplement tables contain national PUBLIC events only and do not add regional choices. Countries whose source starts later have empty earlier years; no dates are invented. Several uninhabited territory classes deliberately have no national public events. The UI flags calendars with no events under the selected year/filter, rather than presenting empty cells as confirmed working days.

Country names: i18n-iso-countries, MIT, generated English/Portuguese resources with app-specific European Portuguese refinements retained. Flags: flag-icons (MIT), locally bundled for all 251 entries.
