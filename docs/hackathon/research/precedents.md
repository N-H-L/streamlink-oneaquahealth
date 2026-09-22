# Competitive precedents: OneAquaHealth IEEE Global Hackathon 2026

Research date: 2026-09-22. Everything below comes from pages I fetched, unless it is labelled **[inference]**.

## 0. Critical facts about the target hackathon (verified)

- Devpost: https://oneaquahealth-ieee-hackathon.devpost.com/ . Deadline **Sep 30, 2026 9:00pm PDT**. Judging runs Oct 1–15. Winners are announced **Oct 24, 2026 at the IEEE iGET Conference**. 976 participants registered. The overview page lists $3,500 in cash, while the rules list "5000$ Cash/InKind Prize TBD".
- **Eligibility conflict:** the Devpost sidebar says "Students only" and **"Team required"**, but the rules say "Open to individuals or teams" (https://oneaquahealth-ieee-hackathon.devpost.com/rules). A solo entrant should confirm this with the organizers (Discussions tab) before submitting.
- Rules: "All projects must include a public code repository (e.g., GitHub) with source code and documentation." Projects must be built during the hackathon period. If two teams tie, both get the higher prize. IEEE Certificates of Merit go to the top 3.
- There is no prior edition. The project gallery currently shows no public submissions. This is the first OneAquaHealth hackathon.
- The learning series included "Session 4: Informatics, Technology & Standards (HL7 FHIR Standard + hands-on FHIR Sandbox)" (https://www.oneaquahealth.eu/oneaquahealth-ieee-global-hackathon-informatics-technology-standards/, https://events.vtools.ieee.org/m/571958). Recordings: https://www.oneaquahealth.eu/project-events/
- **An official OneAquaHealth HL7 FHIR Implementation Guide exists:** https://github.com/hl7-eu/oah (CI build: https://build.fhir.org/ig/hl7-eu/oah). Its profiles include `observation-indicators-oah`, `observation-health-measure-oah`, `observation-with-component`, `specimen-oah`, `location-oah`, `group-oah` and `library-oah`. It also has logical-model maps (DataSet, HealthIndicators, HealthMeasure, Indicators, Sample, SimpleIndicator, StructuredIndicator → FHIR) and example data for Benevento pollutants, Oslo/Benevento disease-prevalence groups, and an Almyros chemistry example. **Building on this IG instead of inventing a FHIR mapping is a strong differentiator in front of Gora Datta (HL7 FHIR) and the EFMI/ISO organizers.** [inference]

## A. Prior hackathons run by the same circle (IEEE OC / EMBS OC / Kodgi / Datta)

The same circle has completed only one Devpost hackathon with published winners:

### IEEE OC Computer Society AI Dev Hack 2025 (Sep 19–21, 2025, virtual, 3 days)
- https://ieee-ai-dev-hack-2025.devpost.com/ . The gallery has 23 projects, and 3 carry the "Winner" badge.
- Pradyumna Kodgi was Program Manager and a judge. Gora Datta chaired IEEE OC Computer Society. The other judges were Christoph Heike, Madhumitha Karthikeyan and Swapnali Karvekar.
- **Documented judge statement:** the organizers awarded three First Prizes because "the top projects were so closely matched in innovation, execution, and impact that it was impossible to distinguish a single clear winner." Criteria: "originality, impact, and adherence to hackathon guidelines" / "creativity, technical execution, and compliance with event guidelines." No feedback was published for individual projects. (https://www.computer.org/publications/tech-news/insider-membership-news/ieee-ocai-2025-hackathon)

| Project | Status | What it did | Tech | Demo / repo |
|---|---|---|---|---|
| Arrhythmia Detection https://devpost.com/software/arrhythmia-detection | VERIFIED Winner, "Grand Prize" (1 of 3 tied firsts) | ECG arrhythmia screening. A Random Forest runs on NeuroKit2 features (HRV, QRS width) and a 1D CNN runs on raw ECG windows, using MIT-BIH data. A Streamlit app reports F1, AUROC and false alarms per hour, and raises an alert after consecutive abnormal windows. Personal motivation: a grandmother's death. | Python, scikit-learn, PyTorch, Streamlit, Plotly, wfdb. **No FHIR, no blockchain.** | Repo https://github.com/EganO11/arrhythmia-detection . Streamlit demo described. |
| MinuteMind https://devpost.com/software/minutemind | VERIFIED Winner, "Grand Prize" | Uploads meeting audio, transcribes it and produces a summary. The author calls it "not the most spectacular webpage" and says it has "many competitors". | Google Chirp, Gemini, Python, React | Repo https://github.com/Crayann/MinuteMind |
| AI Productivity Overlay https://devpost.com/software/productivity-layer | VERIFIED Winner, "Grand Prize" | An always-on-top Electron desktop overlay with grammar AI, clipboard, tasks, a ChatGPT query box, image generation and a screen watcher that sends email alerts. | Electron, Vite, TypeScript, OpenAI, Gemini | Repo https://github.com/jarrensj/productivity-layer . Two YouTube demo videos. |

Observations:
- The bar was modest. All three winners were working end-to-end apps with public repos. One was a health project with quantitative evaluation (F1/AUROC). None used FHIR or blockchain.
- The organizers were willing to tie several projects for first place. The OneAquaHealth rules also contain tie language.

### Other events from this circle (no winners yet)
- **IEEE ClimateChain Global Hackathon** (AI + blockchain, IEEE Blockchain / IEEE Turkey; Gora Datta is a judge; $3,000): https://ieee-climatechain-hack.devpost.com/ . It runs Oct 5–25, 2026, so it has no winners yet. It uses the same template as OneAquaHealth: a learning-session series, IEEE Certificates of Merit for the top 3, and "Students only".
- I found no earlier OneAquaHealth or EMBS-OC Devpost hackathon. I also found no earlier Datta-judged FHIR hackathon on Devpost.

**Limitation:** I found only 3 verified winners from this judge circle, not the 5–8 requested. The circle's Devpost track record is one event.

## A2. Visible competing OneAquaHealth submissions on GitHub (as of 2026-09-22)
A GitHub search for "oneaquahealth" shows what other teams are building:
- shi1720/catchment-oneaquahealth (Track 2): turns citizen evidence into a budget-constrained field-sampling plan with human review. It uses real UK Environment Agency rainfall data, exports "experimental FHIR", and carries strong disclaimers. Quality is high.
- aliirtaza58/oneaqua-insight-hub (Track 2): a Streamlit/Folium dashboard for the 5 pilot cities with composite indices (EHI/HHRI/UCSI), an AI policy summarizer and a what-if simulator.
- kathir-iTech/streamvitals (Track 3, AI assessment), momo25bend/streamsentinel (AI stream assessment), dapphari007/neer (explainable Stream One Health Index), khansakln297-coder/AquaSentinel-AI (anomaly engine), Cyberchopin/aquasentinel (observation triage with human review), evacatalina123-cyber/streamhealth-oneaquahealth (scoring platform plus AI summaries).

Pattern: the "Data-to-Insight dashboard / composite index / AI summary" space is crowded. Few teams appear to target the Community & Gamification, Awareness & Storytelling or Digital Health Standards tracks, or to do a real IG-conformant FHIR implementation. [inference, from visible repos only]

## B. Winners from other water / citizen-science hackathons

| Hackathon | Winner | What it did | Tech | Link |
|---|---|---|---|---|
| Hack the Bay (Chesapeake Monitoring Cooperative) | "Hack the Bay" (Challenge 1 winner) | Interactive tool relating water-quality change over time to land cover | Python, Tableau | https://devpost.com/software/hack-the-bay , repo https://github.com/jacob-r-hassinger/Hack-the-Bay |
| Hack the Bay | "Mind the Gap" (Challenge 2 co-winner) | Map-based tool that finds temporal and geospatial **gaps in citizen/agency sampling**, prioritized by HUC-12 land use, to plan where volunteers should sample next | Python, QGIS, Esri | https://devpost.com/software/the-chesapeake-bayes-addressing-challenge-2 |
| Hack the Bay | "Shore Is Fun" (Challenge 3) | ML predictive pollution models for tributaries | ML | https://devpost.com/software/hack-the-bay-challenge-3 |
| CA Water Data Hackathon | "Visualizing Voices" (People's Choice) | Scraped community-reported water concerns and compared them with gaps in the government database (a citizen-voice vs official-data mismatch) | Python | https://devpost.com/software/visualizing-voices |
| Global Blockchain Hackathon for Clean Water (WRC) | "Wastewater reuse with Blockchain & ML" (First Prize) | Tamper-proof IoT meter readings on Hyperledger, with autoencoder/LSTM anomaly detection for fraud | Hyperledger, Flask, scikit-learn | https://devpost.com/software/code_for_clean_water |
| same | "Regulator dashboard" (Second) | Regulator dashboard for water-reuse credits with tamper detection | Hyperledger, Solidity, Leaflet, R Shiny | https://devpost.com/software/regulator-dashboard |
| same | "Water Wizard" (Third) | Ethereum DApp for device authentication and meter readings | Solidity, Truffle, React | https://devpost.com/software/water-wizard |

Documented judge reasons (Hack the Bay, https://www.chesapeakemonitoringcoop.org/resources/hackthebay/): the Challenge 1 winner was chosen for "the immediate use of the product and the scalability of the tool". The Challenge 2 co-winners were chosen for "an in depth analysis and incredible useful tools". A Copernicus hackathon project, "Rivers Network" (merging citizen, government and business river data for the Baltic), was mentioned by EUMETSAT, but I did not verify its winner status.

## C. Existing products to differentiate from
- **miniSASS** (GroundTruth/IWMI, South Africa): macroinvertebrate-group stream health score. The app has a digital dichotomous key and an **ML model that predicts invertebrate groups from photos** to speed up verification. https://play.google.com/store/apps/details?id=com.rk.amii , https://github.com/iwmihq/miniSASS-mobile-app
- **FreshWater Watch** (Earthwatch): kit-based nitrate/phosphate and turbidity citizen sampling with a global map. It works on chemistry, not biology or health.
- **Stream Visual Assessment Protocol (USDA NRCS SVAP2)**: a paper/protocol scoring habitat elements. It has no app intelligence.
- **iNaturalist / Seek**: general species identification by computer vision. It is not built for stream health indices or macroinvertebrate scoring.
- **CrowdWater (SPOTTERON, Univ. Zurich)**: crowdsourced water level (virtual staff gauge), streamflow, soil moisture and intermittent-stream status for hydrological models. It has gamification (a "game" to rate stage). https://apps.apple.com/us/app/crowdwater-spotteron/id1213513623
- **Water Rangers**: low-cost test kits plus an open data platform for community water-quality testing (Canada).
- **EarthEcho Water Challenge**: an education and awareness campaign with simple test kits (temperature, pH, DO, turbidity) and a global data map.
- **AI macroinvertebrate ID**: miniSASS ML, CGIAR "AI-based biomonitoring" (https://cgspace.cgiar.org/items/ec45d471-203f-427d-a318-91f688d3d7bd), Synaptiq CV work (https://www.synaptiq.ai/library/computer-vision-to-identify-aquatic-macroinvertebrates-evaluate-water-quality), PocketMacros (static ID key), Macroinvertebrates.org atlas.
- **OneAquaHealth's own tools (must not duplicate, should integrate):** the OneAquaHealth CitizenScience App (https://apps.oneaquahealth.eu/login), which records photos, video and structured stream/habitat scoring; **DipteraCAST**, an ML forecast (RF/LR/SVM/XGBoost) of Diptera and disease vectors from water quality, hydromorphology, land use and climate, planned for the Open Information Hub (https://www.oneaquahealth.eu/2026/07/31/oneaquahealth-dipteracast-using-artificial-intelligence-to-predict-disease-vectors-in-urban-freshwater-ecosystems/); the Open Information Hub; and the HL7 FHIR IG (hl7-eu/oah).
- **Early-warning dashboards**: agency tools such as the EPA CyAN cyanobacteria app, the EEA/Copernicus water-quality viewers and bathing-water portals. They serve professionals, use satellite or agency data only, and do not link to health data or citizen reports. [general knowledge, not re-verified]

### Differentiation gaps [inference]
1. **Citizen-to-health standards bridge.** No citizen stream app emits HL7 FHIR resources that conform to the OneAquaHealth IG, so none of them connects eco-observations with One Health indicators (such as the disease-prevalence Group/Observation examples in the IG).
2. **Trust and quality of volunteer data.** Existing apps collect data but rarely show confidence, provenance and reviewer workflow. The ML in miniSASS verifies organism groups, not the whole assessment.
3. **Closing the loop.** Tools collect data but rarely tell the citizen what happened next or where to sample next. "Mind the Gap" won by doing exactly this sampling-gap prioritization.
4. **Urban and European fit.** miniSASS, SVAP, EarthEcho and Water Rangers are calibrated for other regions and settings. OneAquaHealth pilots are urban streams in Coimbra, Toulouse, Benevento, Gent and Oslo.
5. **Integration rather than replacement.** Judges from the OneAquaHealth consortium (Feio, SYNYO, ENORA, SHINE 2Europe) are likely to favour tools that plug into their app, DipteraCAST and the Open Information Hub over a competing standalone app.

## D. Documented reasons vs inference; bias caveats
- **Documented:** DevHack 2025 criteria were originality, impact, technical execution and guideline compliance, and three firsts were awarded because the top projects were "closely matched". Hack the Bay rewarded "immediate use" and "scalability", and "in depth analysis" with "useful tools".
- **Inference:** In this circle, a working end-to-end demo with a public repo was necessary but not exceptional. Health relevance with honest quantitative evaluation (Arrhythmia: F1/AUROC, false alarms per hour) looks like a strong signal. FHIR and blockchain were not needed to win in 2025, but the OneAquaHealth panel is far more standards-heavy (Datta/HL7, EFMI, ISO, IEEE Blockchain), and it has a dedicated FHIR track and an official IG.
- **Survivorship bias:** I inspected only winners. I cannot see what losing projects did differently, and in DevHack's case the winners did not look very different from the rest of the gallery. The sample is tiny (1 event, 3 winners, different topic and judges). The water-hackathon winners (2020-era Hack the Bay, the WRC blockchain event) had different judges. Visible OneAquaHealth GitHub repos are a biased sample of competitors, since many teams keep repos private until submission.
