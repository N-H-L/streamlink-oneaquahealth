Extension: SlTrustAssessment
Id: sl-trust-assessment
Title: "StreamLink trust assessment"
Description: "Automated plausibility assessment of a citizen stream check: a score (0-1) and the rule flags raised, each with its resolution. Score = 1 - sum(weight of open flags), floored at 0 (weights in src/core/trust.ts)."
Context: Provenance
* ^url = "https://n-h-l.github.io/streamlink-oneaquahealth/fhir/StructureDefinition/sl-trust-assessment"
* extension contains
    score 1..1 and
    flag 0..*
* extension[score] ^short = "Trust score 0-1 (1 = no open flags)"
* extension[score].value[x] only decimal
* extension[score].value[x] 1..1
* extension[score] obeys sl-trust-score-range
* extension[flag] ^short = "A trust rule that fired"
* extension[flag].extension contains
    rule 1..1 and
    message 0..1 and
    resolution 1..1
* extension[flag].extension[rule].value[x] only code
* extension[flag].extension[rule].value[x] 1..1
* extension[flag].extension[rule].valueCode from SlTrustRulesVS (required)
* extension[flag].extension[message].value[x] only string
* extension[flag].extension[message].value[x] 1..1
* extension[flag].extension[resolution].value[x] only code
* extension[flag].extension[resolution].value[x] 1..1
* extension[flag].extension[resolution].valueCode from SlFlagResolutionVS (required)

Invariant: sl-trust-score-range
Description: "The trust score is between 0 and 1."
Severity: #error
Expression: "(value as decimal) >= 0 and (value as decimal) <= 1"

Extension: SlPriorityExplanation
Id: sl-priority-explanation
Title: "StreamLink priority explanation"
Description: "Human-readable reasons why a lab-sampling referral was ranked and prioritised as it was (evidence behind each weight)."
Context: ServiceRequest
* ^url = "https://n-h-l.github.io/streamlink-oneaquahealth/fhir/StructureDefinition/sl-priority-explanation"
* value[x] only string
* value[x] 1..1
