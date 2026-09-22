# OneAquaHealth (OAH) ecosystem research for the IEEE OAH Global Hackathon 2026

Researched 2026-09-22. Labels: **CONFIRMED** = seen directly on an official source (fetched), **INFERRED** = reasoned from evidence, **UNKNOWN** = not found.
Local copies of the sources (decks, PDFs, transcripts) are in the scratchpad: `pdf/`, `ev/`, `app/`, `yt_*.txt`.

---

## 0. Top findings for building a prototype

| What | URL | Access | Status |
|---|---|---|---|
| OAH FHIR sandbox (HAPI FHIR 8.2.0, R4 4.0.1), public, no auth, CORS open, also accepts writes | `https://sandbox.hl7europe.eu/oneaquahealth/fhir` (web UI: `https://sandbox.hl7europe.eu/oneaquahealth/`) | Free, no key | CONFIRMED (queried live) |
| OAH FHIR IG source (FSH) | https://github.com/hl7-eu/oah | Public GitHub | CONFIRMED |
| OAH FHIR IG rendered | https://build.fhir.org/ig/hl7-eu/oah/ | **Returned 404 on 2026-09-22** (listed in search engines and in the Aug 27 deck; the CI build seems to be missing right now). Use GitHub or the sandbox instead. | CONFIRMED 404 |
| Field Sampling Protocols (with the field form, Annex I), CC-BY-4.0 | https://doi.org/10.5281/zenodo.20344421 | Free PDF | CONFIRMED |
| Key Indicators Factsheets, CC-BY-4.0 | https://doi.org/10.5281/zenodo.20345207 | Free PDF | CONFIRMED |
| Citizen Science App (PWA, Nuxt) | https://apps.oneaquahealth.eu/login (same app also at https://app.enora-oah.eu/login) | You must register with the OAH Community first | CONFIRMED |
| Resilience Map (public SPA, CSV export) | https://apps.oneaquahealth.eu/resmap/ | Public | CONFIRMED |
| Backend REST behind the Resilience Map | `https://api.enora-oah.eu/api/...` (e.g. `/sites/all`, `/resilience-map/health-risks`, `/resilience-map/urban-parameters`, `/resilience-map/weather?siteCode=..&start=..`) | GET works without auth, but CORS allows only `apps.oneaquahealth.eu`, so a browser app would need a server-side proxy. **Undocumented and not offered as a public API.** Ask the organizers before relying on it, or cite it as "data exported from the Resilience Map". | CONFIRMED works / INFERRED not sanctioned |
| City Dashboards | https://www.oneaquahealth.eu/city_dashboards/ (iframe of https://app.enora-oah.eu/city-dashboards/iframe) | Public view | CONFIRMED |
| Decision Support System | https://www.oneaquahealth.eu/decision-support-system/ | Public | CONFIRMED |
| GEOSSIP | https://www.oneaquahealth.eu/geossip/ which links to https://apps.oneaquahealth.eu/sites | For scientists and authorized users only | CONFIRMED |

Organizer stance on data (Session 1 transcript, Gora Datta): *"We are on purpose not providing you with data… feel free to use any data sets… nothing is right, nothing is wrong."* They encourage the Citizen Science App and OAH tools but do not require them. CONFIRMED (YouTube auto-transcript of V2t3CWj9pRg).

---

## 1. The Citizen Science App and the stream assessment protocol

### 1a. Access and sign-up
- Hackathon page: "Download and use the OneAquaHealth Citizen Science App to explore real environmental data, contribute your own observations…" CONFIRMED (Devpost overview).
- Flow: first join the **OneAquaHealth Community** (https://www.oneaquahealth.eu/community/), then log in to the app with the same email and password. It is a PWA installed with "Add to Home Screen" from https://oneaquahealth.eu/citizenscienceapp. CONFIRMED (community page, installation guide PDF https://www.oneaquahealth.eu/app/uploads/2025/07/OneAquaHealth-Guide-A4-Citizen-Science-App-Installation-0.4.pdf, citizen-science-project page).
- Open to anyone: INFERRED yes, since community registration is public. The in-app text says "using your assigned email and password", so accounts may be provisioned manually and there could be a delay.
- UI languages: en, el, fr, it, nl, no, pt. These match the partner countries. CONFIRMED (app i18n bundle).

### 1b. The citizen assessment form (exact fields)
CONFIRMED from the app's public client bundle (`/_nuxt/i18n.config.*.js`, English strings). Wizard steps: Basic Information, then Additional Details, Media Upload, Questions 1/3, 2/3, 3/3, Feedback 1/2, 2/2, Review & Submit.

- **Site:** pick an OAH research site (the app shows your distance to each) or "Add New Site" (site name, latitude, longitude). User-generated sites are stored separately.
- **Media:** upstream photo, downstream photo, a photo of the surroundings (houses, roads), a photo of an interesting biodiversity element (plant, animal, fungus), and a short 5–10 s video.
- **Questions 1/3, "What do you see from where you stand (in ca. 100 m)?"**
  - Channel form: Flat (A) / U shape (B) / V shape (C) / not sure
  - Bottom type: Natural / Artificial (concrete, or stones with concrete) / not sure
  - Bank type: Natural / Artificial / Laid stones with no concrete / not sure
  - Habitats (multi-select): sand banks, sand islands, stone deposits, riffles/rapids/falls, aquatic vegetation
  - Natural debris (multi-select): fallen trees, fallen branches, deposits of fallen leaves
  - Water flow: Fast / Slow / Stagnant or intermittent / Dry / not sure
- **Questions 2/3**
  - Water aspect: Clear / Muddy or turbid / Has foam / Altered colour / not sure
  - Water withdrawal (abstraction), Barriers (dams or weirs), Draining pipes (polluted water), Sewage discharge, Construction or works in the stream: each Yes / No / not sure
  - Water height (m, free number)
- **Questions 3/3, "In the margins/riparian zone (5–10 m from the channel bank top)"**
  - Impervious areas > 1/3 of the margin, asked separately for left and right: Y/N/not sure
  - Margin covered by vegetation, left and right: Y/N/not sure
  - Dominant vegetation type (>50% cover, first 5 m), left and right: Herbs / Shrubs / Trees / not sure. Left and right are defined facing downstream.
  - Invasive or non-native plants: Y/N/not sure, plus "Which ones?" free text
  - Recent vegetation cuts: Y/N/not sure
- **Feedback 1/2, overall stream health (a 3-class self-assessment, the app's only "score"):**
  - Good: riparian vegetation, natural channel, good water quality, biodiversity present
  - Moderate: some alterations, still biodiverse, some vegetation, water looks good
  - Poor: highly modified or artificial, loss of riparian vegetation or only invasive species, habitat loss, polluted
- **Feedback 2/2, emotions ("streams may influence human emotions"):** intensity sliders for Joy, Serenity, Anger and Fear, plus "Not applicable". This is the One Health wellbeing link.
- The client code references these API routes: `/api/citizens/{channel_forms, bottom/channel_types, bank_types, habitats, fallen_biomass, water_flows, water_colors, vegetation_types, stream_assessments, submit}` and `/api/citizens/user-generated-sites/{insert, my-sites, submit}`. They need authentication and are not publicly documented. CONFIRMED (route names) / INFERRED (auth needed).
- **Not in the citizen form:** macroinvertebrates, litter or trash as its own field, and any numeric scoring index. Litter is only mentioned as a tip ("note… litter, erosion, invasive plants") on the citizen-science-project page. CONFIRMED absent from the form strings. The "structured scoring system" the website mentions is, in practice, the categorical answers plus the Good/Moderate/Poor overall rating. INFERRED.
- Opportunity (INFERRED): no numeric index is computed from the answers. A transparent, explainable hydromorphology and riparian score built from these fields, cross-checked against the photos (Track 3) or mapped to FHIR (Track 7), would fill a real gap.

### 1c. The professional protocol behind it (Zenodo, CC-BY-4.0, published 2026-05-22)
"OneAquaHealth Field Sampling Protocols for Urban Stream Ecosystems" (https://doi.org/10.5281/zenodo.20344421). CONFIRMED (full text read):
- **Site characterization:** GPS, altitude, air temperature, date and time; water temperature, dissolved O2 (mg/L and %), pH, conductivity and TDS measured with a multiparameter probe; width, depth and velocity each measured 3 times. Land use in the catchment and a 500 m buffer (% impervious, natural, agriculture) is derived later with GIS.
- **Water samples:** nutrients (total P, total N, phosphates, sulphates, ammonia, nitrates…), TSS, pharmaceuticals.
- **Hydromorphology (Annex I form, 50–100 m reach):**
  - Flow types RU/RI/PO/NP/D (runs, riffles, pools, no perceptible flow, dry), each scored P/E/A (Present / Extensive >33% / Absent)
  - Channel substrate BE/BO/ST/G/SA/MU/OM/AR (bedrock, boulders, stones, gravel, sand, mud, organic matter, artificial), each P/E/A
  - Bank substrate per margin EA/ST/GA/CC/Other (earth, laid stones, gabion, concrete…)
  - Counts of barriers (weirs or dams), outflows (pipes), intakes, and bridges (pedestrian or car); other artificial structures
- **Ecosystem health indicators:** benthic macroinvertebrates (kick-net, 6 sub-samples × 1 m over 50 m, EN 27828 / EN 16150, identified to family), fish (electrofishing, EN 14011), diatoms (5 stones, EN 13946/14407, IBD index; teratology is used as an early warning), macrophytes (types, Present or Extensive, native or non-native), and riparian vegetation.
- **Riparian vegetation scoring:** herbaceous (<1.5 m), shrubby (1.5–3 m) and arboreal (>3 m) layers, each scored 1–5 by cover class (0–20, 21–40, 41–60, 61–80, 81–100%) over 10 m of each margin. Dominant species with ≥10% cover are also recorded.
- **Biological health-risk indicators:** epilithic biofilm microbiomes (16S, pathogens, antibiotic resistance genes (ARGs)), adult Diptera caught in BG-Pro CO2 traps (Culicidae as vectors of dengue, West Nile virus, chikungunya…), and birds (mist nets, or acoustic surveys with BirdNET or Merlin: 10 min per point, 2–5 h after sunrise).
- The website says these protocols produced the data shown in the City Dashboards and the predictive models. CONFIRMED.
- Factsheets (https://doi.org/10.5281/zenodo.20345207) cover diatoms, macroinvertebrates, fish, amphibians, birds, microbiomes, fecal coliforms and others: each has a rationale, a method and its One Health relevance. CONFIRMED.
- Both documents are also linked from https://www.oneaquahealth.eu/health-assessment-framework-for-urban-aquatic-ecosystems/. CONFIRMED.
- CORDIS (GA 101086521, https://cordis.europa.eu/project/id/101086521, 1 Jan 2023 to 31 Dec 2026, EU contribution €4.94M): the results list is loaded by JavaScript and no D-numbered deliverables were retrieved. UNKNOWN. Session 3 slides mention D3.4–3.6 (ODH interventions) and T3.2 (FAIRification).

### 1d. Public API or open dataset of citizen submissions
- No documented public API and no open dataset of citizen submissions was found. UNKNOWN / INFERRED none.
- Aggregated research data is visible in the Resilience Map, which offers CSV export (CONFIRMED on the news page https://www.oneaquahealth.eu/2026/05/11/oneaquahealth-resilience-map-exploring-environmental-health-through-data/), and in the FHIR sandbox.

---

## 2. OAH-FHIR Implementation Guide
- **Repo:** https://github.com/hl7-eu/oah (FSH/SUSHI). Package id `hl7.eu.fhir.oah`, canonical `http://hl7.eu/fhir/ig/oah`, version 0.1.0-ci-build, status draft, FHIR 4.0.1, dependency `hl7.fhir.uv.xver-r5.r4`. Last commit 2026-06-11. CONFIRMED.
- **Rendered IG:** https://build.fhir.org/ig/hl7-eu/oah/ is referenced in the Aug 27 deck, but it returns **HTTP 404 as of 2026-09-22** and is not in build.fhir.org's qas.json. Search engines still index its pages, for example `CodeSystem-temporarySystem-oah-eu.html`. CONFIRMED.
- **HL7 Europe project page:** https://www.hl7europe.org/projects-initiatives/oneaquahealth/ (search result only).
- **Seven logical models**, each mapped to FHIR through model maps and ConceptMaps (CONFIRMED in the deck and the repo `input/fsh/model-maps/`):
  1. DataSetOah: dataset metadata, stewardship, versioning. Maps to Library.
  2. IndicatorsOah: the environmental indicator taxonomy (5 themes, 40+ indicators).
  3. HealthIndicatorsOah: population health prevalence.
  4. SampleOah: sampling site and event. Maps to Location, Observation and Specimen.
  5. SimpleIndicatorOah: a single-value measurement.
  6. StructuredIndicatorOah: a multi-component measurement.
  7. HealthMeasureOah: a health measure for a cohort. Maps to Observation and Group.
- **Profiles** (repo `input/fsh/profiles/`; CONFIRMED):
  - `ObservationIndicatorsOah` (`observation-indicators-oah`): status fixed to final; code 1.. (preferred binding OahIndicatorsNoHealthOahVs); subject 1.. only Reference(LocationOah); specimen → SpecimenOah; effective[x] 1..; performer 1..; value[x] only CodeableConcept or Quantity; component value can be CodeableConcept, string or Quantity.
  - `ObservationWithCompOah` (`observation-with-component-oah`): no value[x], component 1..*, sliced into `macrophytes` (Absent/Present/Extensive), `nonNativeMacrophytes` (string) and `riparianVegetation` (trees / bushes / herbaceous scored with the 0–20…81–100% codes). The Benevento pollutant statistics also use it (avg/max/min/SD/median components, UCUM units).
  - `ObservationHealthMeasureOah`: code from HealthIndicatorsOahVs; subject LocationOah; focus only Reference(GroupOah).
  - `LocationOah`: identifier 1.., name 1.., mode = instance, optional position (lat and long both required if present), `referenceForm` extension (RelatedArtifact). Locations can be nested with partOf (river, then reach, then spot).
  - `SpecimenOah`: subject LocationOah; collection.collector 1..1 PractitionerRole; collectedDateTime 1..1; type from SpecimenTypeOahVs.
  - `LibraryOah`: the dataset "asset collection" (url, title, status, type, date required); extensions `library-size` and `library-numberOfRecords`.
  - `GroupOah`: definitional person cohort (type person, actual=false, no members, characteristics such as sex, age band and living place, from OahCohortCharacteristicCodeVs).
- **Terminology:** `TemporaryOahSystem` = `http://hl7.eu/fhir/ig/oah/CodeSystem/temporarySystem-oah-eu`. It includes:
  - Biological: macroinvertebrates, diatoms, fish, macrophyte types and their non-native variants
  - Riparian vegetation: trees, bushes, herbaceous, with 5 cover classes
  - Hydromorphology: `morophology` (spelled that way in the code system), `hydrology`, `LandUse`
  - Water quality: nutrients, pH, dissolvedO2, waterTemperature, TDS, TSS, conductivity, pharmaceuticals, foam/colour/smell, coliforms, ions and dissolved metals
  - Biorisk: diptera, ticks, invasive organisms, birds, diatom teratology, amphibians
  - Remote sensing: NDVI, NDWI, MNDWI, NDCI, MCI, LST, EBBI, IBI, PISI and more
  - Air: benzene, NO2, O3, PM10, PM2.5 (also under system `https://oneaquahealth.eu/air-parameters`)
  - Health: about 40 prevalence, mortality and hospitalization codes
  - Value sets: `riparianVegetation-vs`, `macrophytes-vs`, `oah-indicators(-no-health)-vs`, `health-indicators-vs`, `cohort-characteristic-code-vs`, `specimen-type-vs`, `observation-type-with-component`
  - Some SNOMED CT codes are used as well, for example 420531007 (river) and 288520005 as Location types, and 703421000 (temperature).
  - CONFIRMED.
- **Example data** (in the IG and loaded in the sandbox):
  - Heraklion, Crete: Almyros river, 135 water-quality observations 2013–2025 (Library-Almyros-FullResults), and Giofyros
  - Benevento: sites 01–12, air pollutant annual summaries plus disease-prevalence cohorts (Library-Benevento-01…12, BeneventoAll)
  - Oslo: Nordre Aker health cohorts (OsloAll)
  - Deck totals: 504 resources (135 environmental, 163 mixed, 81 health). CONFIRMED.
- **Sandbox (hackathon hands-on, Aug 27 session):** `https://sandbox.hl7europe.eu/oneaquahealth/fhir`. CONFIRMED live on 2026-09-22.
  - Counts: Observation 390, Location 22, Library 18, Group 27, Organization 2, Device 2, Specimen 0, Patient 0.
  - Conformance resources (StructureDefinition, CodeSystem, ValueSet) are **not** loaded, so validate against the IG package, not the server.
  - CORS returns `Access-Control-Allow-Origin` for any origin and allows GET, POST, PUT and DELETE. No authentication.
  - It is **shared and writable**: other hackathon teams have already posted resources, such as a "Strawberry Creek" Location (ids 454–456, Berkeley) and observations with codes from `github.com/alejandro-publius/second-look`. Treat the data as untrusted, namespace your own resources, and seed your own data at demo time.
  - Example queries from the deck, verified working:
    - `GET /Library?description=Benevento`
    - `GET /Observation/Obs-Benevento01-Benzene-2018`
    - `GET /Observation?subject=Location/Loc-Almyros`
- **Scalability recipe in the deck:** (1) assess the local context, (2) adopt the IG profiles, (3) map local indicators to IndicatorsOah and extend the value sets, (4) define cohorts with Group, (5) publish datasets as Library collections and validate. CONFIRMED. This lines up with the "integration with existing systems" judging criterion. INFERRED.
- **Policy alignment named in the deck:** WFD 2000/60/EC, EQS Directive 2008/105/EC, One Health (WHO/EU), Green Deal zero pollution, and FHIR for FAIR deployment patterns (https://hl7.org/fhir/uv/fhir-for-fair/deployment.html). CONFIRMED.
- **Gap (INFERRED):** the IG has no profile or code set for the **citizen app questionnaire** (channel form, bank type, emotions and so on). A FHIR Questionnaire/QuestionnaireResponse, or an ObservationIndicatorsOah mapping of citizen submissions, is an obvious Track 7 contribution. The deck says "citizen reports share the same Observation profiles" as sensors and labs.

---

## 3. City Dashboards, Resilience Map, GEOSSIP, DSS, Diptera Forecasting
All CONFIRMED on https://www.oneaquahealth.eu/project-solutions/ unless marked otherwise.
- **City Dashboards:** https://www.oneaquahealth.eu/city_dashboards/, which embeds https://app.enora-oah.eu/city-dashboards/iframe. Choose a city, then sites, to see water quality, biodiversity and pollution indicators.
- **Resilience Map:** https://apps.oneaquahealth.eu/resmap/ (React and Leaflet, built by ENORA Innovation).
  - Sections: Health & Ecosystem (pathogen risk, contamination, ecosystem health), Weather (temperature, humidity, precipitation, heatwaves, dry and wet days), and Earth Observation indices with map overlays.
  - Statistics (mean, min, max, median, SD), Compare Sites, and CSV export.
  - Tutorial video: https://www.youtube.com/watch?v=kvE17KjCqcQ ("OneAquaHealth - Resilience Map Tutorial", ENORA Innovation).
  - Backend (CONFIRMED responding to unauthenticated GET, CORS-locked, undocumented):
    - `https://api.enora-oah.eu/api/sites/all` returns **106 research sites**: Toulouse 24, Ghent 22, Coimbra 20, Benevento 20, Oslo 20, each with code, name, city, lat, long and altitude.
    - `/resilience-map/health-risks` returns 96 rows per site and date: scaledPathogenRisk, scaledFecalRisk, scaledArgRisk, healthRiskScore (0–1).
    - `/resilience-map/urban-parameters` returns distances to hospitals, sewage stations, roads and farmland, plus vegetation cover and patch density in 50–2000 m buffers.
    - `/resilience-map/weather…?siteCode=&start=` covers precipitation (summary, dry days, wet days, heavy-rain days, longest dry spell) and temperature (summary, hot days, heatwaves).
- **GEOSSIP:** https://www.oneaquahealth.eu/geossip/ links to https://apps.oneaquahealth.eu/sites. It is a data-management platform "primarily intended for scientists and authorized stakeholders" for data input and management. No public API found.
- **Decision Support System:** https://www.oneaquahealth.eu/decision-support-system/. Three steps: Indicators (water chemistry, hydromorphology, macroinvertebrates, diatoms, fish, riparian vegetation), then Impairments and stressors, then rehabilitation Measures. It says it "does not replace expert judgement". Supporting catalogue of measures: https://www.oneaquahealth.eu/app/uploads/2026/05/OAH_Catalogue-of-measures-1.pdf.
- **Diptera Forecasting App:** named in the Sept 16, 2026 session "Build with OneAquaHealth: Turning Data into Hackathon Innovation" as one of three public-facing tools, alongside the Citizen Science App and the Resilience Map. No URL was found. UNKNOWN.
- **Policy Brief:** https://www.oneaquahealth.eu/app/uploads/2026/05/OneAquaHealth-Policy-Brief.pdf. Key facts: 100 sites in 5 cities; pharmaceuticals in 91% of sites; diatom deformities as early warning; poorer stream condition associated with higher cause-specific mortality; Diptera vectors present; biofilms carry pathogens and ARGs. CONFIRMED (news page).

---

## 4. Case-study cities and sites
- The **5 research cities** are Coimbra (PT, the coordinator, University of Coimbra / MARE), Ghent (BE), Toulouse (FR), Benevento (IT) and Oslo (NO). Each has about 20 streams, about 100 in total. CONFIRMED on https://www.oneaquahealth.eu/research-cities/ and in the API site list.
  - Oslo streams named: Ljanselva, Hovinbekken, Hoffselva. Akerselva and Alna are cited as rehabilitated. CONFIRMED on the Oslo page.
  - Coimbra: Mondego tributaries; streams in the old city are covered or channelized; many invasive plants; no official monitoring. CONFIRMED.
- **Heraklion, Crete (GR):** Almyros and Giofyros streams. These are FHIR example data and the subject of a 2024 IEEE EMBS webinar, but Crete is not one of the 5 research cities. CONFIRMED.
- Vienna, Sofia, Berlin and Ljubljana are **not** case-study sites. Session 1 shows Vienna 2026, Naples 2025, Oslo 2024 and Coimbra 2023 as general-assembly and meeting locations. INFERRED / CONFIRMED not in the research-city list.
- Consortium: 14 partners in 10 countries (PT, FR, CH, NO, GR, AT, ES, IT, IL, BE). Partners include UC, SYNYO (AT), ENORA Innovation (GR), HL7 Europe, SHINE 2Europe (PT), WiseAngle (ES), UiO (NO), UGent, INP Toulouse, UNINA/CNR (IT), HIT (IL), EFMI and Marionet (theatre). CONFIRMED (deck and home page links).
- **Open data:** there is no open-data portal. Usable routes are the FHIR sandbox (Almyros, Benevento and Oslo), the Resilience Map CSV export and the undocumented API, the Zenodo protocols, and the publications list at https://www.oneaquahealth.eu/project-publications/. Sensors: no live sensor feed found. UNKNOWN.

---

## 5. Session recordings (https://www.oneaquahealth.eu/project-events/)
YouTube channel: https://www.youtube.com/@OneAquaHealthProject (channel id UCsIBgmnXZEzwZ5T4rVOOyMQ; RSS feed read). All CONFIRMED.

| Date | Session | Page | Video | Slides |
|---|---|---|---|---|
| 2026-06-12 | Hackathon #1: Introducing OAH project + hackathon (M.J. Feio, G. Datta) | /introducing-oneaquahealth-project/ | https://youtu.be/V2t3CWj9pRg | /app/uploads/2026/06/OneAquaHealth_hackathon_session_1_0.1.pdf |
| 2026-06-30 | #2 Nature as Blueprint (O. Tamburis) | /nature-as-blueprint/ | https://youtu.be/ljEJAyLpNZo | /app/uploads/2026/07/OneAquaHealth_hackathon_session_2_Nature-as-Blueprint-0.3.pdf |
| 2026-07-15 | #3 One Digital Health & FAIR Principles | /one-digital-health-and-fair-principles/ | https://youtu.be/vuTfIzOziZo | /app/uploads/2026/08/OneAquaHealth_hackathon_session_3_0.1.pdf |
| 2026-08-27 | #4 Informatics, Technology & Standards (FHIR + sandbox; G. Datta, S. Kokolakis, G. Cangioli, P. Kodgi) | /oneaquahealth-ieee-global-hackathon-informatics-technology-standards/ | https://youtu.be/lAxoNQxsnCs | /app/uploads/2026/08/OneAquaHealth_hackathon_session_4_Aug27-2026.pdf |
| 2026-09-16 | #5 Build with OneAquaHealth: Turning Data into Hackathon Innovation (Citizen Science App, Resilience Map, Diptera Forecasting App) | /build-with-oneaquahealth-turning-data-into-hackathon-innovation/ | "coming soon" (not posted) | Link points to the Aug 27 deck (identical md5), so no separate public deck |
| 2025-03-17 | Assessment of ecological quality of urban streams (5 cities) | /assessment-of-the-ecological-quality-of-urban-streams-webinar-2025/ | https://youtu.be/swgpf80hIEc | /app/uploads/2025/04/OneAquaHealth_webinar-presentation.pdf |
| 2024 | Citizen science and mobile apps webinar (DRYvER, E4WARNING, PHArA-ON, Invasoras.pt) | /oneaquahealth-citizen-science-webinar-2024/ | https://youtu.be/Kx6xwJKUBPw | /app/uploads/2024/06/OneAquaHealth_WISE_webinar-1.pdf |
| 2024-04-26 | GIS and water, Heraklion (IEEE EMBS) | /oneaquahealth-webinar-2024/ | https://youtu.be/GrpkttJpX3g | /app/uploads/2024/05/OneAquaHealth_IEEE-EMBS-webinar.pdf |
| 2023-12-07 | IEEE SoCal webinar | /webinar-1/ | https://youtu.be/i0fnkqDqMu8 | /app/uploads/2024/01/OneAquaHealth_IEEE-webinar.pdf |
| 2024-01-16 | Workshop: FHIR and aquatic ecosystems (Athens Digital Health Week) | /workshop-1/ | none | none |

Other channel videos:
- "OneAqua Health AI image classification model" (HcIYx0CgYmk, 2026-05-29): citizens report stream pollution by QR code with photos and geolocation, AI classifies the image, and the report is routed to authorities.
- "Citizen Science Watershed Toxicity Monitoring" (fKC3nGKvkKA): UC Berkeley CIVENG 187, Strawberry Creek vs Tuolumne River.
- These are prior student projects. Ideas close to them are **already seen** by the organizers, so differentiate. INFERRED.

Rules-page schedule (Devpost): Sessions 1–4 as above; Session 5 Sep 3 "Hub Tools" (held as Sep 16); Session 6 Sep 15 "AB2Q of Emerging Technologies". Hackathon period Sep 16–30; judging Oct 1–15; winners announced Oct 24 at IEEE iGET (Irvine) and celebrated at the OAH summit in Barcelona in November. Rules: "Projects must be original and developed during the hackathon period" and a public repo with docs is required. CONFIRMED (Devpost rules).

### Organizer guidance on strong submissions
From transcripts obtained with youtube-transcript-api (auto captions) and from the decks. CONFIRMED unless marked.
- Datta, Session 1: the tracks are "guard rails"; "your creativity [is what] we are looking for"; "use the citizen science app… but not just that, create your own solution"; "we are on purpose not providing you with data… feel free to use any data sets"; AI image processing on citizen photos was endorsed ("absolutely, demonstrate that"); non-technical awareness projects are acceptable.
- Judging focus: relevance to OAH and One Health impact; "how are you taking some of the guidance we have provided"; technical implementation; UX; and **scaling: "take what the OAH team has done for Europe… scale that not only across Europe of 27 countries but across the globe."** Each criterion is scored 1–10 and weighted.
- Hard requirements: project description, **3–5 min demo video (missing video means rejection)**, public repo, prototype, and no deadline grace. Outputs will be showcased on the OAH Open Information Hub.
- Session 4 (Cangioli): the sandbox data is there "if you want to play with the FHIR API… develop a player or an analyzer based on this data." Use Library for dataset discovery, then fetch the referenced Observations. FHIR-for-FAIR deployment patterns (a metadata registry plus distributed repositories) were suggested. The session description says any prototype that uses more than one data source "runs into" the interoperability problem, not only Track 7 projects.
- DSS and project messaging: tools should "structure expert judgement, not replace it", which matches Track 3's "without replacing human judgment".
- Session 2 framing: "does your solution make nature more possible, or less necessary?"
- The Sept 16 session description says existing tools "could be expanded by combining new data, AI, analytics and visualisation". Building **on top of** the OAH tools (the App, the Resilience Map, the Diptera forecasting) is explicitly invited. INFERRED as a scoring advantage for "integration with existing systems".

---

## 6. External open data (all checked live on 2026-09-22, free, no key)
- **Open-Meteo:** forecast `https://api.open-meteo.com/v1/forecast`, historical `https://archive-api.open-meteo.com/v1/archive`, and GloFAS river discharge `https://flood-api.open-meteo.com/v1/flood?daily=river_discharge`. All returned data for Coimbra. Free for non-commercial use. CONFIRMED.
- **GBIF occurrences:** `https://api.gbif.org/v1/occurrence/search?decimalLatitude=..&decimalLongitude=..`. The Coimbra bounding box returned 230k records. CONFIRMED.
- **iNaturalist:** `https://api.inaturalist.org/v1/observations?lat&lng&radius`. CONFIRMED.
- **EEA WISE Waterbase (SoE water quality):** SQL API `https://discodata.eea.europa.eu/sql?query=SELECT TOP 2 * FROM [WISE_SOE].[latest].[Waterbase_T_WISE6_AggregatedData]` returned river monitoring data (e.g., FR sites). CONFIRMED.
- **EU Bathing Water Directive data:** available through the EEA datahub and discodata. INFERRED (not queried). Bathing sites are rarely on small urban streams, so it matters less.
- **Copernicus Sentinel-2 indices (NDVI, NDWI and others)** align with the IG remote-sensing codes. They are available through the Copernicus Data Space (free registration). INFERRED (not tested).
- The **OAH solutions catalogue** (https://www.oneaquahealth.eu/solutions/) lists Mosquito Alert, BirdNET, Pl@ntNet, iNaturalist, Invasoras.pt and LIFE INVASAQUA as complementary tools. CONFIRMED.

---

## 7. One Health and One Digital Health framing (short)
- **One Health:** the health of urban freshwater ecosystems, animals and plants, and human physical and mental wellbeing are interconnected. Degraded urban streams become sources of water-borne and vector-borne disease and lose services such as climate regulation, air quality and mental wellbeing. The project proposes "urban freshwater restoration as a preventive One Health / public-health measure". CONFIRMED (Session 1 deck, policy brief, app text).
- **One Digital Health (ODH):** the "ODH Steering Wheel" framework (Benis, Tamburis et al.) with 2 keys (One Health, Digital Health), 3 perspectives (Individual health and wellbeing, Population and society, Ecosystem) and 5 dimensions (citizen engagement, education, environment, human and veterinary healthcare, healthcare industry). OAH operationalises it through "ODH Interventions" at research sites, FAIRification of datasets (task T3.2, with an OAH FAIR Data Maturity Model based on the RDA indicators), and the HL7 FHIR IG as the interoperability layer. CONFIRMED (Session 3 deck, partially garbled text) / INFERRED (exact wording of the dimensions comes from the published ODH framework, not the deck).
- Framing a submission explicitly in ODH terms (which perspective or dimension it serves), plus FAIR (persistent IDs, FHIR Library metadata, licence), mirrors the organizers' own vocabulary. INFERRED.
