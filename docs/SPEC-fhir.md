# StreamLink FHIR contract (v0.1). Shared by `fhir/` (FSH) and `src/core` (TypeScript)

Any change to this file must be made in both places. FHIR R4 4.0.1.

## Identity
- Canonical base: `https://example.org/fhir/streamlink`. This is a placeholder; we'll switch to the public repo URL once it is known. Constant name: `SL`.
- Package: `streamlink.fhir.oah-citizen` 0.1.0. Depends on `hl7.eu.fhir.oah` 0.1.0-ci-build, built locally from github.com/hl7-eu/oah commit b907cf0.
- OAH code system: `http://hl7.eu/fhir/ig/oah/CodeSystem/temporarySystem-oah-eu` (alias `$oah`).
- StreamLink code system: `SL/CodeSystem/streamlink` (alias `$sl`). It holds answer codes and proposed indicator codes.
- Tags (meta.tag, system `SL/CodeSystem/streamlink-tags`): `demo` on every record StreamLink writes; `simulated` on any synthetic lab result.

## Resources and profiles
| Resource | Profile (id) | Key rules |
|---|---|---|
| Location | `LocationOah` (OAH, used as-is) | identifier system `SL/NamingSystem/oah-site-code` (value e.g. `C1`); name; mode=instance; position |
| Practitioner | `sl-citizen-scientist` | **pseudonymous**: identifier (system `SL/NamingSystem/volunteer`, random value) 1..1; name 0..0, telecom 0..0, address 0..0 |
| Practitioner | (plain) expert reviewer / coordinator | identifier + name allowed (demo persona) |
| Organization | (plain) | "Demo municipal lab" (tag demo) |
| Questionnaire | `oah-citizen-stream-check` instance | items below; url `SL/Questionnaire/oah-citizen-stream-check` |
| QuestionnaireResponse | `sl-stream-check-response` | questionnaire = the canonical above; subject Reference(Location) 1..1; author Reference(Practitioner) 1..1; authored 1..1 |
| Observation | `sl-citizen-observation` (parent Observation) | status from {preliminary, final, amended, entered-in-error}; code from `sl-citizen-indicators-vs` (required) = OAH codes ∪ `$sl` event codes; subject only Reference(LocationOah) 1..1; performer 1..; effective[x] 1..; derivedFrom → QuestionnaireResponse 1..; value CodeableConcept or Quantity; category = `survey` (http://terminology.hl7.org/CodeSystem/observation-category) |
| Observation (verified) | same record with status=final, meta.profile = [`sl-citizen-observation`, OAH `observation-indicators-oah`] | must validate against **both** |
| Observation | `sl-perceived-wellbeing` (parent Observation) | code `$sl#perceived-wellbeing`; subject Location; components joy, serenity, anger, fear (`$sl` codes) each valueInteger 0–10; category survey; note "self-reported, not clinical" |
| Observation | `sl-context-baseline` (parent Observation) | code `$sl#map-context-risk`; subject Location; valueQuantity (0–1, unit "1"); components `$sl#dist-wastewater-plant` (m), `$sl#dist-farmland` (m), `$sl#urban-fraction-2km` (%); method text "StreamLink baseline v1"; derivedFrom Library (model card) |
| Provenance | `sl-check-provenance` | target = all resources from one check; recorded; activity (`http://terminology.hl7.org/CodeSystem/v3-DataOperation#CREATE`); agent[author] → citizen Practitioner; entity[source] → QuestionnaireResponse; extension `sl-trust-assessment` (see below) |
| Provenance | `sl-verification-provenance` | target = verified Observations; activity `$sl#expert-verification`; agent → reviewer Practitioner; reason text optional |
| ServiceRequest | `sl-lab-sampling-referral` | status active→completed; intent order; code `$sl#stream-lab-sampling`; subject only Reference(Location) 1..1; requester → coordinator Practitioner; performer → lab Organization; reasonReference → citizen Observations 0..*; supportingInfo → baseline Observation 0..*; authoredOn 1..; extension `sl-priority-explanation` (string, human-readable reasons) |
| Observation | lab result (OAH `observation-indicators-oah`) | status final; code e.g. `$oah#coliforms`; basedOn → ServiceRequest; tag `simulated` in the demo |
| Communication | `sl-citizen-feedback` | status completed; recipient → citizen Practitioner; about → ServiceRequest or Observation; payload.contentString (e.g. "Your report led to a lab visit") |
| Library | (plain) model card for baseline v1 | type logic-library; describes data, method, evaluation |

### Extension `sl-trust-assessment` (on Provenance)
- `score` valueDecimal 0–1
- `flag` 0..*, a complex extension with `rule` valueCode (`$sl` rule code), `message` valueString, `resolution` valueCode {open, corrected, confirmed-by-citizen, dismissed-by-expert}

## Questionnaire items (linkId: type, answers). Mirrors the OAH Citizen Science App
Answer codes are in `$sl`. Every choice question also allows `not-sure`.
| linkId | type | answers → mapping to Observation.code |
|---|---|---|
| site | reference (Location) | → subject |
| channel-form | choice | flat, u-shape, v-shape → `$oah#morophology` |
| bottom-type | choice | natural, artificial → `$oah#morophology` |
| bank-type | choice | natural, artificial, laid-stones → `$oah#morophology` |
| habitats | choice, repeats | sand-banks, sand-islands, stone-deposits, riffles, aquatic-vegetation → `$oah#morophology` (one Obs, multiple codings in valueCodeableConcept not allowed, so one Obs per selected habitat) |
| natural-debris | choice, repeats | fallen-trees, fallen-branches, leaf-deposits → `$oah#morophology` |
| water-flow | choice | fast, slow, stagnant, dry → `$oah#hydrology` |
| water-aspect | choice | clear, turbid, foam, altered-colour → `$oah#foam` |
| water-withdrawal | choice | yes/no → `$oah#hydrology` (value present/absent) |
| barriers | choice | yes/no → `$oah#hydrology` |
| drain-pipes | choice | yes/no → `$sl#drain-outflow` (value `$oah#present`/`$oah#absent`) |
| sewage-discharge | choice | yes/no → `$sl#sewage-discharge` |
| construction | choice | yes/no → `$sl#construction-works` |
| water-height | decimal (m) | → `$oah#hydrology` valueQuantity m |
| impervious-left / impervious-right | choice | yes/no → `$oah#LandUse` |
| vegetated-left / vegetated-right | choice | yes/no → `$oah#riparianVegetation` |
| dominant-veg-left / dominant-veg-right | choice | herbs, shrubs, trees → `$oah#riparianVegetation` (value `$oah#herbaceous`/`#bushes`/`#trees`) |
| invasive-plants | choice (+ string `invasive-which`) | yes/no → `$oah#invasiveOrganisms` |
| recent-cuts | choice | yes/no → `$oah#riparianVegetation` |
| overall-health | choice | good, moderate, poor → `$sl#citizen-overall-rating` |
| emotions | group: joy, serenity, anger, fear (integer 0–10) | → `sl-perceived-wellbeing` |
| photos | attachment, repeats | → QuestionnaireResponse only; not stored on a shared server in the demo |
| gps | string "lat,lon" | → Provenance.location is not used; the distance-to-site check uses it |
"not-sure" answers create **no** Observation (they stay in the QuestionnaireResponse). Left/right answers carry `bodySite`-like text in Observation.note ("left bank"/"right bank"). Observations use `Observation.component` only in the wellbeing and baseline profiles.

## Trust rules (codes in `$sl`, implemented in src/core/trust.ts)
- `far-from-site`: GPS more than 300 m from the site.
- `dry-but-wet`: flow = dry but aspect ≠ not-sure, or water height > 0.
- `stagnant-riffles`: flow = stagnant but habitats include riffles.
- `no-veg-dominant`: vegetated = no but a dominant vegetation type is given (same side).
- `good-but-sewage`: overall = good but sewage or drain = yes.
- `implausible-height`: water height > 3 m.
- `no-photos`: no photos attached.
- `future-time`: authored time is in the future.
Score = 1 − Σ(weight of open flags), floored at 0. Weights are in code, documented.

## ConceptMap `sl-citizen-to-oah`
source = the Questionnaire's item linkIds (as codes in `$sl`); target = the OAH codes above. `$sl` event codes (`sewage-discharge`, `drain-outflow`, `construction-works`, `citizen-overall-rating`) are marked **unmatched → proposed additions to the OAH temporary code system**.

## Deviations (FHIR specialist, 2026-09-23)
Implemented in `fhir/` (SUSHI 0 errors) and checked by `scripts/validate.sh` (HL7 validator, OAH IG loaded).
1. **`sl-context-baseline` has no `derivedFrom → Library`.** R4 `Observation.derivedFrom` only allows DocumentReference, ImagingStudy, Media, QuestionnaireResponse, Observation and MolecularSequence. Instead, `method.text` (1..1) names the model ("StreamLink baseline v1 …"). The model card is `Library/sl-baseline-v1-model-card` (url `SL/Library/sl-baseline-v1-model-card`). The value is Quantity UCUM `1`, constrained to 0–1 by invariant `sl-baseline-range`. Components are closed slices: dist-wastewater-plant (`m`), dist-farmland (`m`), urban-fraction-2km (`%`). Performer and category are not required.
2. **Questionnaire items follow the emitter.**
   - `photos` is an `integer` count, not a repeating attachment, because photos never leave the device in the demo.
   - `emotions` is a group with children `emotion-joy|serenity|anger|fear`, each an integer 0–10 (min/maxValue extensions).
   - `invasive-which` is a string item.
   - Items are flat and in emitter order: site, the questions in order, invasive-which, emotions, photos, gps.
   - The validator checks QR answers against answerOption, item order and item `text`. **`QuestionnaireResponse.item.text` must equal the Questionnaire text exactly, or be omitted.**
3. **Citizen `Observation.code` may carry two codings:** the OAH indicator plus `$sl#<linkId>` naming the question. The required binding to `sl-citizen-indicators-vs` is met by the OAH coding. The validator accepts the extra coding (verified). New ValueSet `sl-question-codes-vs` lists the question codes.
4. **Extra `$sl` codes and structure.**
   - Codes are grouped under `#question`, `#answer`, `#proposed-indicator`, `#trust-rule` and `#flag-resolution` (hierarchy only; the TS codes are unchanged).
   - Added the linkIds `drain-pipes`, `construction` and `overall-health` as codes, so they can be ConceptMap sources.
   - Added the resolution codes open, corrected, confirmed-by-citizen and dismissed-by-expert.
   - New required-binding ValueSets: `sl-trust-rules-vs`, `sl-flag-resolution-vs`, `sl-citizen-observation-status-vs`, `sl-referral-status-vs` and `sl-wellbeing-components-vs`.
5. **Cardinalities the SPEC left implicit.**
   - `sl-perceived-wellbeing`: `note` 1..*; `component` 1..* as closed slices joy/serenity/anger/fear, each 0..1; `value[x]` 0..0.
   - `sl-citizen-observation`: `component` 0..0; `value[x]` 1..1.
   - `sl-check-provenance`: `agent[author]` 1..1 with type `provenance-participant-type#author` → `sl-citizen-scientist`; `entity[source]` 1..1 (role=source → QuestionnaireResponse); extension `sl-trust-assessment` 1..1.
   - `sl-verification-provenance`: `agent[verifier]` 1..1 with type `#verifier`.
   - `sl-lab-sampling-referral`: `status` ∈ {active, completed}; `requester` 1..1; `sl-priority-explanation` 0..*.
   - `sl-citizen-feedback`: `recipient` → `sl-citizen-scientist` 1..*; `about` 1..*; `payload.contentString` 1..*.
6. **Lab-result UCUM code:** use `{CFU}/dL` (unit text "CFU/100 mL"; 1 dL = 100 mL). tx.fhir.org rejects `{CFU}/100mL` as an unknown UCUM code. The offline run cannot detect this.
7. **OAH package build:** the OAH IG is built with `sushi --snapshot`, because its StructureDefinitions have no snapshots and SUSHI needs snapshots to create instances of OAH profiles. `scripts/fhir-install-oah.sh` installs the result into `~/.fhir/packages/hl7.eu.fhir.oah#0.1.0-ci-build`.
8. **Known warnings, not errors:**
   - The verification activity `$sl#expert-verification` falls outside the extensible provenance-activity-type ValueSet.
   - Provenance.reason is text-only (extensible PurposeOfUse).
   - dom-6 (no narrative).
