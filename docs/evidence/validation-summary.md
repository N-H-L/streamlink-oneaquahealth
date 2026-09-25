# StreamLink FHIR validation summary

- Result: **PASS**
- Generated: 2026-09-25T13:32:16.165Z
- SUSHI (fhir/): | Just like a perfect pearl. 0 Errors 0 Warnings |
- Validator: FHIR Validation tool Version 6.10.4; FHIR 4.0.1; IGs loaded: `hl7.eu.fhir.oah#0.1.0-ci-build` (local build of github.com/hl7-eu/oah b907cf0) + `fhir/fsh-generated/resources` (streamlink.fhir.oah-citizen 0.1.0)
- Files: 45 IG resources (profiles, extensions, terminology, examples), 12 transaction bundles produced by the app's own engine (`out/bundles`), 34 resources as stored after a full lifecycle (`out/resources`), 5 negative tests (expected to fail)
- Terminology: `-tx https://tx.fhir.org/r4`. Online terminology server: UCUM and external code systems are checked; results depend on the server's availability and content.
- Display-name mismatches are warnings (`-display-issues-are-warnings`); example.org URLs allowed (`-allow-example-urls`).

## Per file

| Kind | File | Errors | Warnings | Info | Expected |
|---|---|---:|---:|---:|---|
| bundle | `out/bundles/baseline.json` | 0 | 2 | 0 | OK |
| bundle | `out/bundles/check-clean.json` | 0 | 29 | 0 | OK |
| bundle | `out/bundles/check-contradictory.json` | 0 | 26 | 0 | OK |
| bundle | `out/bundles/check-sewage.json` | 0 | 26 | 0 | OK |
| bundle | `out/bundles/lifecycle-01-Location.json` | 0 | 26 | 0 | OK |
| bundle | `out/bundles/lifecycle-02-Practitioner.json` | 0 | 1 | 0 | OK |
| bundle | `out/bundles/lifecycle-03-Observation.json` | 0 | 47 | 4 | OK |
| bundle | `out/bundles/lifecycle-04-Practitioner.json` | 0 | 1 | 0 | OK |
| bundle | `out/bundles/lifecycle-05-Organization.json` | 0 | 1 | 0 | OK |
| bundle | `out/bundles/lifecycle-06-Observation.json` | 0 | 2 | 0 | OK |
| bundle | `out/bundles/lifecycle-07-ServiceRequest.json` | 0 | 1 | 0 | OK |
| bundle | `out/bundles/lifecycle-08-Observation.json` | 0 | 6 | 0 | OK |
| ig | `fhir/fsh-generated/resources/CodeSystem-streamlink-tags.json` | 0 | 1 | 0 | OK |
| ig | `fhir/fsh-generated/resources/CodeSystem-streamlink.json` | 0 | 1 | 0 | OK |
| ig | `fhir/fsh-generated/resources/Communication-feedback-c1.json` | 0 | 1 | 0 | OK |
| ig | `fhir/fsh-generated/resources/ConceptMap-sl-citizen-to-oah.json` | 0 | 3 | 0 | OK |
| ig | `fhir/fsh-generated/resources/Library-sl-baseline-v1-model-card.json` | 0 | 1 | 0 | OK |
| ig | `fhir/fsh-generated/resources/Location-site-c1-coimbra.json` | 0 | 1 | 0 | OK |
| ig | `fhir/fsh-generated/resources/NamingSystem-oah-site-code.json` | 0 | 1 | 0 | OK |
| ig | `fhir/fsh-generated/resources/NamingSystem-staff.json` | 0 | 1 | 0 | OK |
| ig | `fhir/fsh-generated/resources/NamingSystem-volunteer.json` | 0 | 1 | 0 | OK |
| ig | `fhir/fsh-generated/resources/Observation-baseline-c1.json` | 0 | 2 | 0 | OK |
| ig | `fhir/fsh-generated/resources/Observation-lab-result-c1-coliforms.json` | 0 | 2 | 0 | OK |
| ig | `fhir/fsh-generated/resources/Observation-obs-c1-channel-form.json` | 0 | 1 | 0 | OK |
| ig | `fhir/fsh-generated/resources/Observation-obs-c1-sewage-verified.json` | 0 | 1 | 1 | OK |
| ig | `fhir/fsh-generated/resources/Observation-obs-c1-sewage.json` | 0 | 1 | 0 | OK |
| ig | `fhir/fsh-generated/resources/Observation-obs-c1-veg-left.json` | 0 | 1 | 0 | OK |
| ig | `fhir/fsh-generated/resources/Observation-obs-c1-water-aspect.json` | 0 | 1 | 0 | OK |
| ig | `fhir/fsh-generated/resources/Observation-obs-c1-water-height.json` | 0 | 1 | 0 | OK |
| ig | `fhir/fsh-generated/resources/Observation-wellbeing-c1.json` | 0 | 1 | 0 | OK |
| ig | `fhir/fsh-generated/resources/Organization-lab-coimbra.json` | 0 | 1 | 0 | OK |
| ig | `fhir/fsh-generated/resources/Practitioner-coordinator-rui.json` | 0 | 1 | 0 | OK |
| ig | `fhir/fsh-generated/resources/Practitioner-reviewer-ana.json` | 0 | 1 | 0 | OK |
| ig | `fhir/fsh-generated/resources/Practitioner-volunteer-7f3a9c.json` | 0 | 1 | 0 | OK |
| ig | `fhir/fsh-generated/resources/Provenance-prov-check-c1.json` | 0 | 1 | 0 | OK |
| ig | `fhir/fsh-generated/resources/Provenance-prov-verification-c1.json` | 0 | 3 | 0 | OK |
| ig | `fhir/fsh-generated/resources/Questionnaire-oah-citizen-stream-check.json` | 0 | 1 | 0 | OK |
| ig | `fhir/fsh-generated/resources/QuestionnaireResponse-check-c1-2026-09-20.json` | 0 | 1 | 0 | OK |
| ig | `fhir/fsh-generated/resources/ServiceRequest-referral-c1.json` | 0 | 1 | 0 | OK |
| ig | `fhir/fsh-generated/resources/StructureDefinition-sl-check-provenance.json` | 0 | 1 | 1 | OK |
| ig | `fhir/fsh-generated/resources/StructureDefinition-sl-citizen-feedback.json` | 0 | 1 | 0 | OK |
| ig | `fhir/fsh-generated/resources/StructureDefinition-sl-citizen-observation.json` | 0 | 1 | 1 | OK |
| ig | `fhir/fsh-generated/resources/StructureDefinition-sl-citizen-scientist.json` | 0 | 1 | 0 | OK |
| ig | `fhir/fsh-generated/resources/StructureDefinition-sl-context-baseline.json` | 0 | 1 | 1 | OK |
| ig | `fhir/fsh-generated/resources/StructureDefinition-sl-lab-sampling-referral.json` | 0 | 1 | 0 | OK |
| ig | `fhir/fsh-generated/resources/StructureDefinition-sl-perceived-wellbeing.json` | 0 | 1 | 2 | OK |
| ig | `fhir/fsh-generated/resources/StructureDefinition-sl-priority-explanation.json` | 0 | 1 | 0 | OK |
| ig | `fhir/fsh-generated/resources/StructureDefinition-sl-stream-check-response.json` | 0 | 1 | 0 | OK |
| ig | `fhir/fsh-generated/resources/StructureDefinition-sl-trust-assessment.json` | 0 | 1 | 0 | OK |
| ig | `fhir/fsh-generated/resources/StructureDefinition-sl-verification-provenance.json` | 0 | 1 | 1 | OK |
| ig | `fhir/fsh-generated/resources/ValueSet-sl-citizen-indicators-vs.json` | 0 | 2 | 10 | OK |
| ig | `fhir/fsh-generated/resources/ValueSet-sl-citizen-observation-status-vs.json` | 0 | 2 | 0 | OK |
| ig | `fhir/fsh-generated/resources/ValueSet-sl-flag-resolution-vs.json` | 0 | 2 | 0 | OK |
| ig | `fhir/fsh-generated/resources/ValueSet-sl-question-codes-vs.json` | 0 | 3 | 1 | OK |
| ig | `fhir/fsh-generated/resources/ValueSet-sl-referral-status-vs.json` | 0 | 2 | 0 | OK |
| ig | `fhir/fsh-generated/resources/ValueSet-sl-trust-rules-vs.json` | 0 | 2 | 0 | OK |
| ig | `fhir/fsh-generated/resources/ValueSet-sl-wellbeing-components-vs.json` | 0 | 2 | 4 | OK |
| negative | `fhir/negative-tests/neg-check-provenance.json` | 8 | 1 | 0 | fails (OK) |
| negative | `fhir/negative-tests/neg-citizen-observation.json` | 6 | 2 | 0 | fails (OK) |
| negative | `fhir/negative-tests/neg-citizen-scientist-named.json` | 3 | 1 | 0 | fails (OK) |
| negative | `fhir/negative-tests/neg-stream-check-response.json` | 4 | 1 | 0 | fails (OK) |
| negative | `fhir/negative-tests/neg-verified-still-preliminary.json` | 3 | 2 | 1 | fails (OK) |
| stored | `out/resources/Communication-sl-mugzvjx9-y.json` | 0 | 1 | 0 | OK |
| stored | `out/resources/Location-sl-mugzvjvs-1.json` | 0 | 1 | 0 | OK |
| stored | `out/resources/Observation-sl-mugzvjvs-4.json` | 0 | 1 | 0 | OK |
| stored | `out/resources/Observation-sl-mugzvjvs-5.json` | 0 | 1 | 0 | OK |
| stored | `out/resources/Observation-sl-mugzvjvs-6.json` | 0 | 1 | 0 | OK |
| stored | `out/resources/Observation-sl-mugzvjvs-7.json` | 0 | 1 | 0 | OK |
| stored | `out/resources/Observation-sl-mugzvjvs-8.json` | 0 | 1 | 0 | OK |
| stored | `out/resources/Observation-sl-mugzvjvs-9.json` | 0 | 1 | 0 | OK |
| stored | `out/resources/Observation-sl-mugzvjvs-a.json` | 0 | 1 | 0 | OK |
| stored | `out/resources/Observation-sl-mugzvjvs-b.json` | 0 | 1 | 0 | OK |
| stored | `out/resources/Observation-sl-mugzvjvs-c.json` | 0 | 1 | 1 | OK |
| stored | `out/resources/Observation-sl-mugzvjvs-d.json` | 0 | 1 | 1 | OK |
| stored | `out/resources/Observation-sl-mugzvjvs-e.json` | 0 | 1 | 1 | OK |
| stored | `out/resources/Observation-sl-mugzvjvs-f.json` | 0 | 1 | 0 | OK |
| stored | `out/resources/Observation-sl-mugzvjvs-g.json` | 0 | 1 | 0 | OK |
| stored | `out/resources/Observation-sl-mugzvjvs-h.json` | 0 | 1 | 0 | OK |
| stored | `out/resources/Observation-sl-mugzvjvs-i.json` | 0 | 1 | 0 | OK |
| stored | `out/resources/Observation-sl-mugzvjvs-j.json` | 0 | 1 | 0 | OK |
| stored | `out/resources/Observation-sl-mugzvjvs-k.json` | 0 | 1 | 0 | OK |
| stored | `out/resources/Observation-sl-mugzvjvs-l.json` | 0 | 1 | 0 | OK |
| stored | `out/resources/Observation-sl-mugzvjvs-m.json` | 0 | 1 | 0 | OK |
| stored | `out/resources/Observation-sl-mugzvjvs-n.json` | 0 | 1 | 0 | OK |
| stored | `out/resources/Observation-sl-mugzvjvs-o.json` | 0 | 1 | 1 | OK |
| stored | `out/resources/Observation-sl-mugzvjvs-p.json` | 0 | 1 | 0 | OK |
| stored | `out/resources/Observation-sl-mugzvjx2-v.json` | 0 | 2 | 0 | OK |
| stored | `out/resources/Observation-sl-mugzvjx9-x.json` | 0 | 2 | 0 | OK |
| stored | `out/resources/Organization-sl-mugzvjww-u.json` | 0 | 1 | 0 | OK |
| stored | `out/resources/Practitioner-sl-mugzvjvs-2.json` | 0 | 1 | 0 | OK |
| stored | `out/resources/Practitioner-sl-mugzvjwn-r.json` | 0 | 1 | 0 | OK |
| stored | `out/resources/Practitioner-sl-mugzvjwu-t.json` | 0 | 1 | 0 | OK |
| stored | `out/resources/Provenance-sl-mugzvjvs-q.json` | 0 | 1 | 0 | OK |
| stored | `out/resources/Provenance-sl-mugzvjwr-s.json` | 0 | 3 | 0 | OK |
| stored | `out/resources/QuestionnaireResponse-sl-mugzvjvs-3.json` | 0 | 1 | 0 | OK |
| stored | `out/resources/ServiceRequest-sl-mugzvjx5-w.json` | 0 | 1 | 0 | OK |

## First errors per file

### fhir/negative-tests/neg-check-provenance.json (expected)

- Provenance.extension[0].extension[0]: Constraint failed: sl-trust-score-range: 'The trust score is between 0 and 1.' (defined in https://n-h-l.github.io/streamlink-oneaquahealth/fhir/StructureDefinition/sl-trust-assessment)
- Provenance.extension[0].extension[1].extension[0].value.ofType(code): The System URI could not be determined for the code 'made-up-rule' in the ValueSet 'https://n-h-l.github.io/streamlink-oneaquahealth/fhir/ValueSet/sl-trust-rules-vs'
- Provenance.extension[0].extension[1].extension[0].value.ofType(code): The value provided ('made-up-rule') was not found in the value set 'StreamLink trust rules' (https://n-h-l.github.io/streamlink-oneaquahealth/fhir/ValueSet/sl-trust-rules-vs), and a code is required from this value set (error message = The System URI could not be determined for the code 'made-up-rule' in the ValueSet 'https://n-h-l.github.io/streamlink-oneaquahealth/fhir/ValueSet/sl-trust-rules-vs'; The provided code '#made-up-rule' was not found in the value set 'https://n-h-l.github.io/streamlink-oneaquahealth/fhir/ValueSet/sl-trust-rules-vs')
- Provenance.extension[0].extension[1].extension[1].value.ofType(code): The System URI could not be determined for the code 'ignored' in the ValueSet 'https://n-h-l.github.io/streamlink-oneaquahealth/fhir/ValueSet/sl-flag-resolution-vs'
- Provenance.extension[0].extension[1].extension[1].value.ofType(code): The value provided ('ignored') was not found in the value set 'StreamLink trust-flag resolution' (https://n-h-l.github.io/streamlink-oneaquahealth/fhir/ValueSet/sl-flag-resolution-vs), and a code is required from this value set (error message = The System URI could not be determined for the code 'ignored' in the ValueSet 'https://n-h-l.github.io/streamlink-oneaquahealth/fhir/ValueSet/sl-flag-resolution-vs'; The provided code '#ignored' was not found in the value set 'https://n-h-l.github.io/streamlink-oneaquahealth/fhir/ValueSet/sl-flag-resolution-vs')
- Provenance: Provenance.entity: minimum required = 1, but only found 0 (from https://n-h-l.github.io/streamlink-oneaquahealth/fhir/StructureDefinition/sl-check-provenance)

### fhir/negative-tests/neg-citizen-observation.json (expected)

- Observation: Observation.performer: minimum required = 1, but only found 0 (from https://n-h-l.github.io/streamlink-oneaquahealth/fhir/StructureDefinition/sl-citizen-observation)
- Observation: Observation.derivedFrom: minimum required = 1, but only found 0 (from https://n-h-l.github.io/streamlink-oneaquahealth/fhir/StructureDefinition/sl-citizen-observation)
- Observation.status: The System URI could not be determined for the code 'registered' in the ValueSet 'https://n-h-l.github.io/streamlink-oneaquahealth/fhir/ValueSet/sl-citizen-observation-status-vs'
- Observation.status: The value provided ('registered') was not found in the value set 'StreamLink citizen Observation status' (https://n-h-l.github.io/streamlink-oneaquahealth/fhir/ValueSet/sl-citizen-observation-status-vs), and a code is required from this value set (error message = The System URI could not be determined for the code 'registered' in the ValueSet 'https://n-h-l.github.io/streamlink-oneaquahealth/fhir/ValueSet/sl-citizen-observation-status-vs'; The provided code '#registered' was not found in the value set 'https://n-h-l.github.io/streamlink-oneaquahealth/fhir/ValueSet/sl-citizen-observation-status-vs')
- Observation.code: None of the codings provided are in the value set 'StreamLink citizen indicators' (https://n-h-l.github.io/streamlink-oneaquahealth/fhir/ValueSet/sl-citizen-indicators-vs), and a coding from this value set is required) (codes = https://n-h-l.github.io/streamlink-oneaquahealth/fhir/CodeSystem/streamlink#channel-form)
- Observation: The type of element valueString is not known - it could not be determined from the information available. Valid types at this point are Quantity, CodeableConcept

### fhir/negative-tests/neg-citizen-scientist-named.json (expected)

- Practitioner: Practitioner.name: max allowed = 0, but found 1 (from https://n-h-l.github.io/streamlink-oneaquahealth/fhir/StructureDefinition/sl-citizen-scientist)
- Practitioner: Practitioner.telecom: max allowed = 0, but found 1 (from https://n-h-l.github.io/streamlink-oneaquahealth/fhir/StructureDefinition/sl-citizen-scientist)
- Practitioner.identifier[0].system: Value is 'https://example.org/somewhere-else' but is fixed to 'https://n-h-l.github.io/streamlink-oneaquahealth/fhir/NamingSystem/volunteer' in the profile https://n-h-l.github.io/streamlink-oneaquahealth/fhir/StructureDefinition/sl-citizen-scientist#Practitioner.identifier.system

### fhir/negative-tests/neg-stream-check-response.json (expected)

- QuestionnaireResponse.item[1].answer[0].value.ofType(Coding).code: Unknown code 'purple' in the CodeSystem 'https://n-h-l.github.io/streamlink-oneaquahealth/fhir/CodeSystem/streamlink'
- QuestionnaireResponse: LinkId 'favourite-fish' not found in questionnaire
- QuestionnaireResponse.item[1].answer[0]: The code https://n-h-l.github.io/streamlink-oneaquahealth/fhir/CodeSystem/streamlink::purple is not in the set of permitted values
- QuestionnaireResponse.item[2].item[0].answer[0].value.ofType(integer): The value 14 is greater than the allowed maximum of 10

### fhir/negative-tests/neg-verified-still-preliminary.json (expected)

- Observation: Observation.performer: minimum required = 1, but only found 0 (from https://n-h-l.github.io/streamlink-oneaquahealth/fhir/StructureDefinition/sl-citizen-observation)
- Observation: Observation.performer: minimum required = 1, but only found 0 (from http://hl7.eu/fhir/ig/oah/StructureDefinition/observation-indicators-oah)
- Observation.status: Value is 'preliminary' but is fixed to 'final' in the profile http://hl7.eu/fhir/ig/oah/StructureDefinition/observation-indicators-oah#Observation.status

## Notable warnings (IG resources and bundles)

Omitted here: dom-6 (no narrative) and UCUM "unable to validate without terminology services".

### out/bundles/baseline.json

- Bundle.entry[0].resource/*Observation/null*/: Best Practice Recommendation: In general, all observations should have a performer

### out/bundles/lifecycle-03-Observation.json

- Bundle.entry[22].resource/*Provenance/null*/.target[0]: Entry 1 matches the reference Observation/sl-mugzvjvs-4 by type and id but its fullUrl https://demo-store.streamlink.invalid/fhir/Observation/sl-mugzvjvs-4 does not match the full target URL urn:uuid:sl-mugzvjvs-4 by Bundle resolution rules
- Bundle.entry[22].resource/*Provenance/null*/.target[1]: Entry 2 matches the reference Observation/sl-mugzvjvs-5 by type and id but its fullUrl https://demo-store.streamlink.invalid/fhir/Observation/sl-mugzvjvs-5 does not match the full target URL urn:uuid:sl-mugzvjvs-5 by Bundle resolution rules
- Bundle.entry[22].resource/*Provenance/null*/.target[2]: Entry 3 matches the reference Observation/sl-mugzvjvs-6 by type and id but its fullUrl https://demo-store.streamlink.invalid/fhir/Observation/sl-mugzvjvs-6 does not match the full target URL urn:uuid:sl-mugzvjvs-6 by Bundle resolution rules
- Bundle.entry[22].resource/*Provenance/null*/.target[3]: Entry 4 matches the reference Observation/sl-mugzvjvs-7 by type and id but its fullUrl https://demo-store.streamlink.invalid/fhir/Observation/sl-mugzvjvs-7 does not match the full target URL urn:uuid:sl-mugzvjvs-7 by Bundle resolution rules

### out/bundles/lifecycle-06-Observation.json

- Bundle.entry[0].resource/*Observation/null*/: Best Practice Recommendation: In general, all observations should have a performer

### out/bundles/lifecycle-08-Observation.json

- Bundle.entry[0].resource/*Observation/null*/.basedOn[0]: Entry 1 matches the reference ServiceRequest/sl-mugzvjx5-w by type and id but its fullUrl https://demo-store.streamlink.invalid/fhir/ServiceRequest/sl-mugzvjx5-w does not match the full target URL urn:uuid:sl-mugzvjx5-w by Bundle resolution rules
- Bundle.entry[0].resource/*Observation/null*/.value.ofType(Quantity): UCUM Codes that contain human readable annotations like {CFU} can be misleading (e.g. they are ignored when comparing units). Best Practice is not to depend on annotations in the UCUM code, so this usage should be checked
- Bundle.entry[2].resource/*Communication/null*/.about[0]: Entry 1 matches the reference ServiceRequest/sl-mugzvjx5-w by type and id but its fullUrl https://demo-store.streamlink.invalid/fhir/ServiceRequest/sl-mugzvjx5-w does not match the full target URL urn:uuid:sl-mugzvjx5-w by Bundle resolution rules

### fhir/fsh-generated/resources/ConceptMap-sl-citizen-to-oah.json

- ConceptMap.group[0]: There are multiple different potential matches for the url 'https://n-h-l.github.io/streamlink-oneaquahealth/fhir/CodeSystem/streamlink'. It might be a good idea to fix to the correct version to reduce the likelihood of a wrong version being selected by an implementation/implementer, or use the [IG Parameter `pin-canonicals`](https://hl7.org/fhir/tools/CodeSystem-ig-parameters.html). Using version 'null', found versions: {{unversioned}}. Suggested fix: change the canonical reference from 'https://n-h-l.github.io/streamlink-oneaquahealth/fhir/CodeSystem/streamlink' to 'https://n-h-l.github.io/streamlink-oneaquahealth/fhir/CodeSystem/streamlink\|null'
- ConceptMap.group[1]: There are multiple different potential matches for the url 'https://n-h-l.github.io/streamlink-oneaquahealth/fhir/CodeSystem/streamlink'. It might be a good idea to fix to the correct version to reduce the likelihood of a wrong version being selected by an implementation/implementer, or use the [IG Parameter `pin-canonicals`](https://hl7.org/fhir/tools/CodeSystem-ig-parameters.html). Using version 'null', found versions: {{unversioned}}. Suggested fix: change the canonical reference from 'https://n-h-l.github.io/streamlink-oneaquahealth/fhir/CodeSystem/streamlink' to 'https://n-h-l.github.io/streamlink-oneaquahealth/fhir/CodeSystem/streamlink\|null'

### fhir/fsh-generated/resources/Observation-baseline-c1.json

- Observation: Best Practice Recommendation: In general, all observations should have a performer

### fhir/fsh-generated/resources/Observation-lab-result-c1-coliforms.json

- Observation.value.ofType(Quantity): UCUM Codes that contain human readable annotations like {CFU} can be misleading (e.g. they are ignored when comparing units). Best Practice is not to depend on annotations in the UCUM code, so this usage should be checked

### fhir/fsh-generated/resources/Provenance-prov-verification-c1.json

- Provenance.reason[0]: No code provided, and a code should be provided from the value set 'PurposeOfUse' (http://terminology.hl7.org/ValueSet/v3-PurposeOfUse\|3.1.0)
- Provenance.activity: None of the codings provided are in the value set 'Provenance activity type' (http://hl7.org/fhir/ValueSet/provenance-activity-type\|4.0.1), and a coding should come from this value set unless it has no suitable code (note that the validator cannot judge what is suitable) (codes = https://n-h-l.github.io/streamlink-oneaquahealth/fhir/CodeSystem/streamlink#expert-verification)

### fhir/fsh-generated/resources/ValueSet-sl-citizen-indicators-vs.json

- ValueSet.compose.include[1].system: There are multiple different potential matches for the url 'https://n-h-l.github.io/streamlink-oneaquahealth/fhir/CodeSystem/streamlink'. It might be a good idea to fix to the correct version to reduce the likelihood of a wrong version being selected by an implementation/implementer, or use the [IG Parameter `pin-canonicals`](https://hl7.org/fhir/tools/CodeSystem-ig-parameters.html). Using version 'null', found versions: {{unversioned}}. Suggested fix: change the canonical reference from 'https://n-h-l.github.io/streamlink-oneaquahealth/fhir/CodeSystem/streamlink' to 'https://n-h-l.github.io/streamlink-oneaquahealth/fhir/CodeSystem/streamlink\|null'

### fhir/fsh-generated/resources/ValueSet-sl-citizen-observation-status-vs.json

- ValueSet.compose.include[0].system: There are multiple different potential matches for the url 'http://hl7.org/fhir/observation-status'. It might be a good idea to fix to the correct version to reduce the likelihood of a wrong version being selected by an implementation/implementer, or use the [IG Parameter `pin-canonicals`](https://hl7.org/fhir/tools/CodeSystem-ig-parameters.html). Using version '4.0.1', found versions: 4.0.1 (from hl7.fhir.r4.core#4.0.1), 5.0.0 (from hl7.fhir.uv.xver-r5.r4#0.1.0). Suggested fix: change the canonical reference from 'http://hl7.org/fhir/observation-status' to 'http://hl7.org/fhir/observation-status\|4.0.1'

### fhir/fsh-generated/resources/ValueSet-sl-flag-resolution-vs.json

- ValueSet.compose.include[0].system: There are multiple different potential matches for the url 'https://n-h-l.github.io/streamlink-oneaquahealth/fhir/CodeSystem/streamlink'. It might be a good idea to fix to the correct version to reduce the likelihood of a wrong version being selected by an implementation/implementer, or use the [IG Parameter `pin-canonicals`](https://hl7.org/fhir/tools/CodeSystem-ig-parameters.html). Using version 'null', found versions: {{unversioned}}. Suggested fix: change the canonical reference from 'https://n-h-l.github.io/streamlink-oneaquahealth/fhir/CodeSystem/streamlink' to 'https://n-h-l.github.io/streamlink-oneaquahealth/fhir/CodeSystem/streamlink\|null'

### fhir/fsh-generated/resources/ValueSet-sl-question-codes-vs.json

- ValueSet.compose.include[0].system: There are multiple different potential matches for the url 'https://n-h-l.github.io/streamlink-oneaquahealth/fhir/CodeSystem/streamlink'. It might be a good idea to fix to the correct version to reduce the likelihood of a wrong version being selected by an implementation/implementer, or use the [IG Parameter `pin-canonicals`](https://hl7.org/fhir/tools/CodeSystem-ig-parameters.html). Using version 'null', found versions: {{unversioned}}. Suggested fix: change the canonical reference from 'https://n-h-l.github.io/streamlink-oneaquahealth/fhir/CodeSystem/streamlink' to 'https://n-h-l.github.io/streamlink-oneaquahealth/fhir/CodeSystem/streamlink\|null'
- ValueSet.compose.include[1].system: There are multiple different potential matches for the url 'https://n-h-l.github.io/streamlink-oneaquahealth/fhir/CodeSystem/streamlink'. It might be a good idea to fix to the correct version to reduce the likelihood of a wrong version being selected by an implementation/implementer, or use the [IG Parameter `pin-canonicals`](https://hl7.org/fhir/tools/CodeSystem-ig-parameters.html). Using version 'null', found versions: {{unversioned}}. Suggested fix: change the canonical reference from 'https://n-h-l.github.io/streamlink-oneaquahealth/fhir/CodeSystem/streamlink' to 'https://n-h-l.github.io/streamlink-oneaquahealth/fhir/CodeSystem/streamlink\|null'

### fhir/fsh-generated/resources/ValueSet-sl-referral-status-vs.json

- ValueSet.compose.include[0].system: There are multiple different potential matches for the url 'http://hl7.org/fhir/request-status'. It might be a good idea to fix to the correct version to reduce the likelihood of a wrong version being selected by an implementation/implementer, or use the [IG Parameter `pin-canonicals`](https://hl7.org/fhir/tools/CodeSystem-ig-parameters.html). Using version '4.0.1', found versions: 4.0.1 (from hl7.fhir.r4.core#4.0.1), 5.0.0 (from hl7.fhir.uv.xver-r5.r4#0.1.0). Suggested fix: change the canonical reference from 'http://hl7.org/fhir/request-status' to 'http://hl7.org/fhir/request-status\|4.0.1'

### fhir/fsh-generated/resources/ValueSet-sl-trust-rules-vs.json

- ValueSet.compose.include[0].system: There are multiple different potential matches for the url 'https://n-h-l.github.io/streamlink-oneaquahealth/fhir/CodeSystem/streamlink'. It might be a good idea to fix to the correct version to reduce the likelihood of a wrong version being selected by an implementation/implementer, or use the [IG Parameter `pin-canonicals`](https://hl7.org/fhir/tools/CodeSystem-ig-parameters.html). Using version 'null', found versions: {{unversioned}}. Suggested fix: change the canonical reference from 'https://n-h-l.github.io/streamlink-oneaquahealth/fhir/CodeSystem/streamlink' to 'https://n-h-l.github.io/streamlink-oneaquahealth/fhir/CodeSystem/streamlink\|null'

### fhir/fsh-generated/resources/ValueSet-sl-wellbeing-components-vs.json

- ValueSet.compose.include[0].system: There are multiple different potential matches for the url 'https://n-h-l.github.io/streamlink-oneaquahealth/fhir/CodeSystem/streamlink'. It might be a good idea to fix to the correct version to reduce the likelihood of a wrong version being selected by an implementation/implementer, or use the [IG Parameter `pin-canonicals`](https://hl7.org/fhir/tools/CodeSystem-ig-parameters.html). Using version 'null', found versions: {{unversioned}}. Suggested fix: change the canonical reference from 'https://n-h-l.github.io/streamlink-oneaquahealth/fhir/CodeSystem/streamlink' to 'https://n-h-l.github.io/streamlink-oneaquahealth/fhir/CodeSystem/streamlink\|null'

### out/resources/Observation-sl-mugzvjx2-v.json

- Observation: Best Practice Recommendation: In general, all observations should have a performer

### out/resources/Observation-sl-mugzvjx9-x.json

- Observation.value.ofType(Quantity): UCUM Codes that contain human readable annotations like {CFU} can be misleading (e.g. they are ignored when comparing units). Best Practice is not to depend on annotations in the UCUM code, so this usage should be checked

### out/resources/Provenance-sl-mugzvjwr-s.json

- Provenance.reason[0]: No code provided, and a code should be provided from the value set 'PurposeOfUse' (http://terminology.hl7.org/ValueSet/v3-PurposeOfUse\|3.1.0)
- Provenance.activity: None of the codings provided are in the value set 'Provenance activity type' (http://hl7.org/fhir/ValueSet/provenance-activity-type\|4.0.1), and a coding should come from this value set unless it has no suitable code (note that the validator cannot judge what is suitable) (codes = https://n-h-l.github.io/streamlink-oneaquahealth/fhir/CodeSystem/streamlink#expert-verification)

