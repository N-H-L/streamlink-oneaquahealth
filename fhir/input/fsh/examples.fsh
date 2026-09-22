// One full record lifecycle at OAH site C1 (Coimbra). All demo data.
RuleSet: Demo
* meta.tag[+] = $sltag#demo "StreamLink demo record"

RuleSet: CitizenObs
* insert Demo
* status = #preliminary
* category[survey] = $obscat#survey "Survey"
* subject = Reference(site-c1-coimbra) "Coimbra C1"
* effectiveDateTime = "2026-09-20T09:30:00+01:00"
* performer[0] = Reference(volunteer-7f3a9c)
* derivedFrom[0] = Reference(check-c1-2026-09-20)

// ---------------------------------------------------------------- actors
Instance: site-c1-coimbra
InstanceOf: LocationOah
Title: "OAH site C1, Coimbra"
Description: "An OneAquaHealth urban stream site in Coimbra (Resilience Map code C1)."
* insert Demo
* identifier[0].system = $ns-site
* identifier[0].value = "C1"
* status = #active
* name = "Coimbra C1"
* description = "Urban stream monitoring site C1, Coimbra"
* mode = #instance
* position.latitude = 40.19787
* position.longitude = -8.42865

Instance: volunteer-7f3a9c
InstanceOf: SlCitizenScientist
Title: "Citizen scientist (pseudonymous)"
Description: "A volunteer known only by a random pseudonym."
* insert Demo
* identifier[0].system = $ns-volunteer
* identifier[0].value = "v-7f3a9c"
* active = true

Instance: reviewer-ana
InstanceOf: Practitioner
Title: "Expert reviewer (demo persona)"
Description: "A demo ecologist who verifies citizen checks."
* insert Demo
* identifier[0].system = $ns-staff
* identifier[0].value = "reviewer-ana"
* active = true
* name[0].text = "Ana Reviewer (demo)"

Instance: coordinator-rui
InstanceOf: Practitioner
Title: "Monitoring coordinator (demo persona)"
Description: "A demo municipal coordinator who requests lab visits."
* insert Demo
* identifier[0].system = $ns-staff
* identifier[0].value = "coordinator-rui"
* active = true
* name[0].text = "Rui Coordinator (demo)"

Instance: lab-coimbra
InstanceOf: Organization
Title: "Demo municipal lab"
Description: "A demo municipal water lab."
* insert Demo
* identifier[0].system = $ns-staff
* identifier[0].value = "lab-coimbra"
* active = true
* name = "Coimbra municipal water lab (demo)"

// ---------------------------------------------------------------- step 0: baseline
Instance: sl-baseline-v1-model-card
InstanceOf: Library
Usage: #definition
Title: "StreamLink baseline v1 model card"
Description: "Model card for the map-context baseline risk."
* url = "https://n-h-l.github.io/streamlink-oneaquahealth/fhir/Library/sl-baseline-v1-model-card"
* version = "1.0.0"
* name = "StreamLinkBaselineV1"
* title = "StreamLink baseline v1 model card"
* status = #active
* experimental = true
* type = $libtype#logic-library "Logic Library"
* date = "2026-09-23"
* description = """**Data.** OneAquaHealth Resilience Map: 96 sites in 5 cities, one lab campaign per site (95 in 2023), plus OpenStreetMap features (wastewater treatment plants, farmland, built-up land).

**Method.** A rule-based score in [0, 1] from distance to the nearest wastewater plant, distance to the nearest farmland and the built-up share within 2 km. Weights were calibrated against OAH lab risk.

**Evaluation.** Spearman rho of about 0.3 between the score and OAH lab risk across the 96 sites. Citizen bank observations did not track lab risk (|rho| <= 0.12), so citizen reports are treated as event signals, not as lab substitutes.

**Limits.** One lab sample per site; a small sample of cities; OSM completeness varies. This is not a health-risk assessment."""

Instance: baseline-c1
InstanceOf: SlContextBaseline
Title: "Baseline context risk, C1"
Description: "Map-context baseline risk for site C1."
* insert Demo
* status = #final
* code = $sl#map-context-risk "Map-context baseline risk"
* subject = Reference(site-c1-coimbra) "Coimbra C1"
* effectiveDateTime = "2026-09-19"
* valueQuantity = 0.62 '1' "1"
* method.text = "StreamLink baseline v1 (Library/sl-baseline-v1-model-card)"
* component[dist-wastewater-plant].code = $sl#dist-wastewater-plant "Distance to nearest wastewater plant"
* component[dist-wastewater-plant].valueQuantity = 850 'm' "m"
* component[dist-farmland].code = $sl#dist-farmland "Distance to nearest farmland"
* component[dist-farmland].valueQuantity = 420 'm' "m"
* component[urban-fraction-2km].code = $sl#urban-fraction-2km "Built-up share within 2 km"
* component[urban-fraction-2km].valueQuantity = 64 '%' "%"

// ---------------------------------------------------------------- step 1: citizen check
Instance: check-c1-2026-09-20
InstanceOf: SlStreamCheckResponse
Title: "Stream check at C1"
Description: "A citizen's answers, including 'not sure'."
* insert Demo
* questionnaire = "https://n-h-l.github.io/streamlink-oneaquahealth/fhir/Questionnaire/oah-citizen-stream-check"
* status = #completed
* subject = Reference(site-c1-coimbra) "Coimbra C1"
* authored = "2026-09-20T09:30:00+01:00"
* author = Reference(volunteer-7f3a9c)
* item[+].linkId = "site"
* item[=].text = "Site"
* item[=].answer[0].valueReference = Reference(site-c1-coimbra) "Coimbra C1"
* item[+].linkId = "channel-form"
* item[=].text = "Shape of the channel"
* item[=].answer[0].valueCoding = $sl#u-shape "U shape"
* item[+].linkId = "habitats"
* item[=].text = "Habitats you can see"
* item[=].answer[0].valueCoding = $sl#riffles "Riffles, rapids or small falls"
* item[=].answer[1].valueCoding = $sl#aquatic-vegetation "Plants growing in the water"
* item[+].linkId = "water-flow"
* item[=].text = "How is the water moving?"
* item[=].answer[0].valueCoding = $sl#slow "Slow"
* item[+].linkId = "water-aspect"
* item[=].text = "How does the water look?"
* item[=].answer[0].valueCoding = $sl#foam "Foam on the surface"
* item[+].linkId = "sewage-discharge"
* item[=].text = "Sewage flowing in"
* item[=].answer[0].valueCoding = $sl#yes "Yes"
* item[+].linkId = "drain-pipes"
* item[=].text = "Pipes discharging polluted water"
* item[=].answer[0].valueCoding = $sl#not-sure "Not sure"
* item[+].linkId = "water-height"
* item[=].text = "Water depth (rough guess)"
* item[=].answer[0].valueDecimal = 0.3
* item[+].linkId = "dominant-veg-left"
* item[=].text = "Left bank: main plants"
* item[=].answer[0].valueCoding = $sl#trees "Trees"
* item[+].linkId = "overall-health"
* item[=].text = "Overall, this stream looks…"
* item[=].answer[0].valueCoding = $sl#moderate "Moderate"
* item[+].linkId = "emotions"
* item[=].text = "How does this place make you feel? (0–10)"
* item[=].item[+].linkId = "emotion-joy"
* item[=].item[=].answer[0].valueInteger = 4
* item[=].item[+].linkId = "emotion-serenity"
* item[=].item[=].answer[0].valueInteger = 3
* item[=].item[+].linkId = "emotion-anger"
* item[=].item[=].answer[0].valueInteger = 6
* item[=].item[+].linkId = "emotion-fear"
* item[=].item[=].answer[0].valueInteger = 2
* item[+].linkId = "photos"
* item[=].text = "Photos taken"
* item[=].answer[0].valueInteger = 0
* item[+].linkId = "gps"
* item[=].text = "Location when submitted (rounded to about 100 m)"
* item[=].answer[0].valueString = "40.19801,-8.42850"

Instance: obs-c1-channel-form
InstanceOf: SlCitizenObservation
Title: "Citizen observation: channel form"
Description: "OAH morphology indicator, from the channel-form question."
* insert CitizenObs
* code.coding[0] = $oah#morophology "Morphology of the streams"
* code.coding[1] = $sl#channel-form "Shape of the channel"
* code.text = "Shape of the channel"
* valueCodeableConcept = $sl#u-shape "U shape"

Instance: obs-c1-water-aspect
InstanceOf: SlCitizenObservation
Title: "Citizen observation: water aspect"
Description: "OAH foam/colour/smell indicator."
* insert CitizenObs
* code.coding[0] = $oah#foam "Foam/colour/smell"
* code.coding[1] = $sl#water-aspect "How does the water look?"
* code.text = "How does the water look?"
* valueCodeableConcept = $sl#foam "Foam on the surface"

Instance: obs-c1-sewage
InstanceOf: SlCitizenObservation
Title: "Citizen observation: sewage discharge (preliminary)"
Description: "Proposed StreamLink event indicator, before verification."
* insert CitizenObs
* code = $sl#sewage-discharge "Sewage discharge observed"
* code.text = "Sewage flowing in"
* valueCodeableConcept = $oah#present "Present"

Instance: obs-c1-water-height
InstanceOf: SlCitizenObservation
Title: "Citizen observation: water height"
Description: "OAH hydrology indicator, as a quantity in metres."
* insert CitizenObs
* code.coding[0] = $oah#hydrology "Hydrology of the stream"
* code.coding[1] = $sl#water-height "Water depth (rough guess)"
* code.text = "Water depth (rough guess)"
* valueQuantity = 0.3 'm' "m"

Instance: obs-c1-veg-left
InstanceOf: SlCitizenObservation
Title: "Citizen observation: dominant vegetation, left bank"
Description: "OAH riparian vegetation indicator; side in note."
* insert CitizenObs
* code.coding[0] = $oah#riparianVegetation "Riparian vegetation"
* code.coding[1] = $sl#dominant-veg-left "Left bank: main plants"
* code.text = "Left bank: main plants"
* valueCodeableConcept = $oah#trees "Trees (height >3m)"
* note[0].text = "left bank (facing downstream)"

Instance: wellbeing-c1
InstanceOf: SlPerceivedWellbeing
Title: "Perceived wellbeing at C1"
Description: "Self-reported emotions at the stream."
* insert Demo
* status = #preliminary
* category[survey] = $obscat#survey "Survey"
* code = $sl#perceived-wellbeing "Perceived wellbeing at the stream"
* subject = Reference(site-c1-coimbra) "Coimbra C1"
* effectiveDateTime = "2026-09-20T09:30:00+01:00"
* performer[0] = Reference(volunteer-7f3a9c)
* derivedFrom[0] = Reference(check-c1-2026-09-20)
* note[0].text = "Self-reported by a volunteer; not a clinical measure."
* component[joy].code = $sl#joy "Joy"
* component[joy].valueInteger = 4
* component[serenity].code = $sl#serenity "Calm"
* component[serenity].valueInteger = 3
* component[anger].code = $sl#anger "Anger"
* component[anger].valueInteger = 6
* component[fear].code = $sl#fear "Unease"
* component[fear].valueInteger = 2

Instance: prov-check-c1
InstanceOf: SlCheckProvenance
Title: "Provenance of the C1 check, with trust assessment"
Description: "Created by the citizen from the QuestionnaireResponse; one trust flag (no photos) dismissed by the expert."
* insert Demo
* target[+] = Reference(check-c1-2026-09-20)
* target[+] = Reference(obs-c1-channel-form)
* target[+] = Reference(obs-c1-water-aspect)
* target[+] = Reference(obs-c1-sewage)
* target[+] = Reference(obs-c1-water-height)
* target[+] = Reference(obs-c1-veg-left)
* target[+] = Reference(wellbeing-c1)
* recorded = "2026-09-20T09:31:00+01:00"
* activity = $dataop#CREATE "create"
* agent[author].type = $provagent#author "Author"
* agent[author].who = Reference(volunteer-7f3a9c)
* entity[source].role = #source
* entity[source].what = Reference(check-c1-2026-09-20)
* extension[trustAssessment].extension[score].valueDecimal = 0.9
* extension[trustAssessment].extension[flag][0].extension[rule].valueCode = #no-photos
* extension[trustAssessment].extension[flag][0].extension[message].valueString = "No photos attached."
* extension[trustAssessment].extension[flag][0].extension[resolution].valueCode = #dismissed-by-expert

// ---------------------------------------------------------------- step 2: verification
Instance: obs-c1-sewage-verified
InstanceOf: SlCitizenObservation
Title: "Citizen observation: sewage discharge (verified)"
Description: "The same record after expert verification: status final, and it also conforms to the OAH indicator profile. (A separate id only because examples cannot share one; in the running system it is the same resource, updated.)"
* meta.profile[0] = "https://n-h-l.github.io/streamlink-oneaquahealth/fhir/StructureDefinition/sl-citizen-observation"
* meta.profile[1] = $oah-obs
* insert CitizenObs
* status = #final
* code = $sl#sewage-discharge "Sewage discharge observed"
* code.text = "Sewage flowing in"
* valueCodeableConcept = $oah#present "Present"

Instance: prov-verification-c1
InstanceOf: SlVerificationProvenance
Title: "Verification provenance, C1"
Description: "An expert verified the citizen's sewage observation."
* insert Demo
* target[0] = Reference(obs-c1-sewage-verified)
* recorded = "2026-09-21T10:00:00+01:00"
* activity = $sl#expert-verification "Expert verification of citizen observations"
* agent[verifier].type = $provagent#verifier "Verifier"
* agent[verifier].who = Reference(reviewer-ana)
* reason[0].text = "Photo sent by message; grey water visible at the outfall."

// ---------------------------------------------------------------- step 4-5: referral, result, feedback
Instance: referral-c1
InstanceOf: SlLabSamplingReferral
Title: "Lab-sampling referral for C1"
Description: "Referral ranked by baseline x fresh event signal x data age. Shown here completed, after the result arrived."
* insert Demo
* extension[priorityExplanation].valueString = "Verified sewage discharge (event weight 0.5); baseline risk 0.62 (top third of OAH sites); last lab visit 2023 (data age > 2 years)."
* status = #completed
* intent = #order
* priority = #urgent
* code = $sl#stream-lab-sampling "Lab sampling visit to a stream site"
* code.text = "Lab sampling visit"
* subject = Reference(site-c1-coimbra) "Coimbra C1"
* authoredOn = "2026-09-21T11:00:00+01:00"
* requester = Reference(coordinator-rui)
* performer[0] = Reference(lab-coimbra)
* reasonReference[0] = Reference(obs-c1-sewage-verified)
* supportingInfo[0] = Reference(baseline-c1)

Instance: lab-result-c1-coliforms
InstanceOf: ObservationIndicatorsOah
Title: "Lab result: coliforms at C1 (simulated)"
Description: "A SIMULATED lab result that closes the referral."
* insert Demo
* meta.tag[+] = $sltag#simulated "Simulated data (demo only)"
* status = #final
* basedOn[0] = Reference(referral-c1)
* code = $oah#coliforms "Coliforms"
* subject = Reference(site-c1-coimbra) "Coimbra C1"
* effectiveDateTime = "2026-09-24T08:00:00+01:00"
* performer[0] = Reference(lab-coimbra)
* valueQuantity = 2400 '{CFU}/dL' "CFU/100 mL"
* note[0].text = "SIMULATED result for demonstration. No real sample was taken."

Instance: feedback-c1
InstanceOf: SlCitizenFeedback
Title: "Feedback to the citizen"
Description: "Your report led to a lab visit."
* insert Demo
* status = #completed
* recipient[0] = Reference(volunteer-7f3a9c)
* about[0] = Reference(referral-c1)
* about[1] = Reference(lab-result-c1-coliforms)
* sent = "2026-09-24T12:00:00+01:00"
* payload[0].contentString = "Your report at Coimbra C1 led to a lab visit. Thank you: the result is now part of this stream's record."
