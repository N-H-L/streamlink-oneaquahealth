RuleSet: SurveyCategory
* category ^slicing.discriminator.type = #pattern
* category ^slicing.discriminator.path = "$this"
* category ^slicing.rules = #open
* category ^slicing.description = "Citizen-reported records carry the survey category."
* category contains survey 1..1
* category[survey] = $obscat#survey

RuleSet: SiteSubject
* subject 1..1
* subject only Reference(LocationOah)
* subject ^short = "The stream site (OAH LocationOah)"

// ---------------------------------------------------------------------------
Profile: SlCitizenScientist
Parent: Practitioner
Id: sl-citizen-scientist
Title: "StreamLink citizen scientist (pseudonymous)"
Description: "A volunteer who submits stream checks. Pseudonymous by design: a random identifier only, no name, telecom or address."
* ^url = "https://example.org/fhir/streamlink/StructureDefinition/sl-citizen-scientist"
* identifier 1..1
* identifier.system 1..1
* identifier.system = "https://example.org/fhir/streamlink/NamingSystem/volunteer"
* identifier.value 1..1
* identifier.value ^short = "Random pseudonym (no personal data)"
* name 0..0
* telecom 0..0
* address 0..0

// ---------------------------------------------------------------------------
Profile: SlStreamCheckResponse
Parent: QuestionnaireResponse
Id: sl-stream-check-response
Title: "StreamLink stream-check response"
Description: "A citizen's answers to the StreamLink stream check (Questionnaire oah-citizen-stream-check), kept complete and unmodified, including 'not sure' answers."
* ^url = "https://example.org/fhir/streamlink/StructureDefinition/sl-stream-check-response"
* questionnaire 1..1
* questionnaire = "https://example.org/fhir/streamlink/Questionnaire/oah-citizen-stream-check"
* insert SiteSubject
* author 1..1
* author only Reference(Practitioner)
* authored 1..1

// ---------------------------------------------------------------------------
Profile: SlCitizenObservation
Parent: Observation
Id: sl-citizen-observation
Title: "StreamLink citizen observation"
Description: """One answer of a citizen stream check, recorded under an OAH indicator code (or a StreamLink event code proposed for OAH).
Starts as `preliminary`; after expert verification it becomes `final` and then also claims (and must conform to) the OAH profile observation-indicators-oah."""
* ^url = "https://example.org/fhir/streamlink/StructureDefinition/sl-citizen-observation"
* status from SlCitizenStatusVS (required)
* insert SurveyCategory
* code from SlCitizenIndicatorsVS (required)
* code ^comment = "When the indicator is an OAH code, a second coding from sl-question-codes-vs names the question it came from."
* insert SiteSubject
* effective[x] 1..1
* performer 1..*
* derivedFrom 1..*
* derivedFrom only Reference(QuestionnaireResponse)
* value[x] 1..1
* value[x] only CodeableConcept or Quantity
* component 0..0
* note ^short = "e.g. 'left bank (facing downstream)'"

// ---------------------------------------------------------------------------
RuleSet: EmotionComponent(name)
* component[{name}].code = $sl#{name}
* component[{name}].value[x] 1..1
* component[{name}].value[x] only integer
* component[{name}].valueInteger ^minValueInteger = 0
* component[{name}].valueInteger ^maxValueInteger = 10

Profile: SlPerceivedWellbeing
Parent: Observation
Id: sl-perceived-wellbeing
Title: "StreamLink perceived wellbeing"
Description: "Self-reported emotions (joy, serenity, anger, fear; 0-10) felt by a visitor at a stream site. Self-reported, not clinical."
* ^url = "https://example.org/fhir/streamlink/StructureDefinition/sl-perceived-wellbeing"
* insert SurveyCategory
* code = $sl#perceived-wellbeing
* insert SiteSubject
* value[x] 0..0
* note 1..*
* note ^short = "States that the measure is self-reported, not clinical"
* component 1..*
* component ^slicing.discriminator.type = #pattern
* component ^slicing.discriminator.path = "code"
* component ^slicing.rules = #closed
* component contains joy 0..1 and serenity 0..1 and anger 0..1 and fear 0..1
* insert EmotionComponent(joy)
* insert EmotionComponent(serenity)
* insert EmotionComponent(anger)
* insert EmotionComponent(fear)

// ---------------------------------------------------------------------------
Invariant: sl-baseline-range
Description: "The baseline risk is a number between 0 and 1."
Severity: #error
Expression: "value.ofType(Quantity).value >= 0 and value.ofType(Quantity).value <= 1"

Profile: SlContextBaseline
Parent: Observation
Id: sl-context-baseline
Title: "StreamLink map-context baseline"
Description: "Baseline context risk (0-1) of a stream site computed from map features (StreamLink baseline v1). The model card is Library/sl-baseline-v1-model-card."
* ^url = "https://example.org/fhir/streamlink/StructureDefinition/sl-context-baseline"
* obeys sl-baseline-range
* code = $sl#map-context-risk
* insert SiteSubject
* value[x] 1..1
* value[x] only Quantity
* valueQuantity = $ucum#1
* valueQuantity.value 1..1
* method 1..1
* method.text 1..1
* method ^short = "Names the model, e.g. 'StreamLink baseline v1 ...'"
* component ^slicing.discriminator.type = #pattern
* component ^slicing.discriminator.path = "code"
* component ^slicing.rules = #closed
* component contains dist-wastewater-plant 0..1 and dist-farmland 0..1 and urban-fraction-2km 0..1
* component[dist-wastewater-plant].code = $sl#dist-wastewater-plant
* component[dist-wastewater-plant].value[x] only Quantity
* component[dist-wastewater-plant].valueQuantity = $ucum#m
* component[dist-farmland].code = $sl#dist-farmland
* component[dist-farmland].value[x] only Quantity
* component[dist-farmland].valueQuantity = $ucum#m
* component[urban-fraction-2km].code = $sl#urban-fraction-2km
* component[urban-fraction-2km].value[x] only Quantity
* component[urban-fraction-2km].valueQuantity = $ucum#%

// ---------------------------------------------------------------------------
Profile: SlCheckProvenance
Parent: Provenance
Id: sl-check-provenance
Title: "StreamLink check provenance"
Description: "Who created a citizen stream check, from which QuestionnaireResponse, and the automated trust assessment."
* ^url = "https://example.org/fhir/streamlink/StructureDefinition/sl-check-provenance"
* extension contains SlTrustAssessment named trustAssessment 1..1
* target 1..*
* recorded 1..1
* activity 1..1
* activity = $dataop#CREATE
* agent ^slicing.discriminator.type = #pattern
* agent ^slicing.discriminator.path = "type"
* agent ^slicing.rules = #open
* agent contains author 1..1
* agent[author].type 1..1
* agent[author].type = $provagent#author
* agent[author].who only Reference(SlCitizenScientist)
* entity 1..*
* entity ^slicing.discriminator.type = #value
* entity ^slicing.discriminator.path = "role"
* entity ^slicing.rules = #open
* entity contains source 1..1
* entity[source].role = #source
* entity[source].what only Reference(QuestionnaireResponse)

Profile: SlVerificationProvenance
Parent: Provenance
Id: sl-verification-provenance
Title: "StreamLink verification provenance"
Description: "An expert verified citizen Observations (preliminary -> final)."
* ^url = "https://example.org/fhir/streamlink/StructureDefinition/sl-verification-provenance"
* target 1..*
* target only Reference(Observation)
* activity 1..1
* activity = $sl#expert-verification
* agent ^slicing.discriminator.type = #pattern
* agent ^slicing.discriminator.path = "type"
* agent ^slicing.rules = #open
* agent contains verifier 1..1
* agent[verifier].type 1..1
* agent[verifier].type = $provagent#verifier
* agent[verifier].who only Reference(Practitioner)
* reason ^short = "Optional free-text note from the reviewer (reason.text)"

// ---------------------------------------------------------------------------
Profile: SlLabSamplingReferral
Parent: ServiceRequest
Id: sl-lab-sampling-referral
Title: "StreamLink lab-sampling referral"
Description: "A request for a lab team to sample a stream site, with the citizen and baseline evidence that motivated it. Closed (completed) when the lab result, which references it via basedOn, arrives."
* ^url = "https://example.org/fhir/streamlink/StructureDefinition/sl-lab-sampling-referral"
* extension contains SlPriorityExplanation named priorityExplanation 0..*
* status from SlReferralStatusVS (required)
* intent = #order
* code 1..1
* code = $sl#stream-lab-sampling
* insert SiteSubject
* authoredOn 1..1
* requester 1..1
* requester only Reference(Practitioner)
* performer only Reference(Organization)
* reasonReference only Reference(Observation)
* supportingInfo only Reference(Observation)

// ---------------------------------------------------------------------------
Profile: SlCitizenFeedback
Parent: Communication
Id: sl-citizen-feedback
Title: "StreamLink citizen feedback"
Description: "Tells a citizen what happened because of their report (e.g. 'Your report led to a lab visit')."
* ^url = "https://example.org/fhir/streamlink/StructureDefinition/sl-citizen-feedback"
* status = #completed
* recipient 1..*
* recipient only Reference(SlCitizenScientist)
* about 1..*
* about only Reference(ServiceRequest or Observation)
* payload 1..*
* payload.content[x] only string
