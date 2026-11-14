# Scientific Validation Policy

## Purpose
The game is an educational prototype, not a mission operations system. Its scientific content must be accurate, traceable and honest about simplification. No statistic, threshold, performance figure or NASA attribution may be invented.

## Source priority
Prefer, in order appropriate to the claim:
1. NASA primary materials and mission/technical documentation.
2. NASA Artemis documentation and NASA lunar science resources.
3. NASA Technical Reports Server (NTRS), NASA OSDR and NASA DONKI when the dataset/topic is relevant.
4. Peer-reviewed research and authoritative standards for gaps not covered by NASA sources.
5. Reputable educational resources only for age-appropriate explanation, not as sole support for critical numeric claims.

The presence of an official NASA domain does not automatically prove a specific claim. Check source purpose, date, author/publisher, context and limitations. DONKI is not a general lunar habitat engineering database; use it only for relevant space-weather/event information. OSDR is a research data repository; do not cite it as proof of a gameplay threshold without examining the dataset and methodology.

## Required claim record
Every factual statement that materially influences mechanics, explanatory copy, tutorial content or project presentation receives a claim ID (for example `SCI-LIFE-001`) and a record with:
- Exact claim as used or paraphrased.
- Classification: `REAL_SCIENTIFIC_FACT` or `SIMULATION_VALUE`.
- Source title, organization/authors, stable URL/report ID/DOI and publication date if available.
- Access date and relevant section/page/table/dataset identifier.
- Evidence excerpt or concise support summary.
- Caveat, uncertainty, context and limits of applicability.
- Intended in-game location/feature.
- Researcher and reviewer identity; review status.

## Real facts versus gameplay values
`REAL_SCIENTIFIC_FACT` may be stated as a factual claim only within the source's scope and caveats. `SIMULATION_VALUE` is a game tuning parameter chosen for clarity and playability. Label simulation values in internal data/config, and describe them to players as simplified game values or relative indicators. Do not imply a 0–100 game meter represents a NASA-certified reserve, pressure, dose limit or life-support specification.

If mechanics use simplified rules, explain why: children need readable cause/effect, the real system is complex, the prototype omits variables, or the value is selected for balance. Never transform an unsourced value into a fact by repeating it in multiple files.

## Topic-specific diligence
- **Lunar environment:** distinguish lunar day/night, vacuum, dust, gravity, temperature extremes, terrain and local conditions. Avoid universalizing conditions across all lunar locations.
- **Life support / oxygen:** distinguish oxygen storage, generation, recycling, atmosphere pressure and crew consumption. Do not conflate oxygen percentage with oxygen inventory or assume a simple meter equals cabin pressure.
- **Power:** identify generation, storage, load and location/illumination context. Do not assert solar continuity at every lunar site.
- **Radiation:** distinguish radiation types, shielding approaches, solar particle events and galactic cosmic rays where relevant. Do not invent dose limits or claim a generic shield eliminates risk.
- **Food production:** distinguish experimental crop growth, resource inputs, life-support integration and operational reliability. Do not imply a prototype proves food self-sufficiency.
- **Habitat maintenance:** qualify dust, thermal, pressure-seal and equipment-maintenance claims; do not present invented maintenance intervals as real mission rules.

## Asset and visual references
For every external model, texture, image or sound, record creator/source, URL, license/usage terms, attribution requirements, modifications, file path and access date. NASA media can have specific third-party or endorsement restrictions; verify the individual asset's conditions. A source image is a visual reference, not necessarily an asset that can be redistributed. Prefer original simple geometry or assets with clear reuse terms.

## Review and correction process
D-S1/D-S2/D-S3 prepare topic briefs. D-S4 owns the canonical source register, claim matrix and source/asset validation report. D1 approves departmental science; A1/C1 check that design and mechanics do not exceed evidence; E1 checks child-facing wording; F1 includes material claim checks in QA. A disputed/high-impact claim is withheld from the build or labeled as a game abstraction until resolved.

If a source changes, is archived, or is found unsuitable, preserve its record, note the review date, replace/re-qualify the claim and search dependent UI/mechanics/docs. Archive the old decision rather than silently deleting provenance.

## Prohibited practices
- Fabricating NASA figures, quotations, mission findings, sources, dates or report identifiers.
- Citing a broad landing page for a precise numeric value without locating its support.
- Calling simulation values “realistic NASA values” without evidence and caveats.
- Suggesting NASA reviewed, endorsed, certified or sponsored the game unless explicit proof exists.
- Using an image or asset without checking its individual licensing/attribution terms.
