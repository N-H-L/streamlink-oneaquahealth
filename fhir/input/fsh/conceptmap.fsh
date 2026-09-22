RuleSet: MapTo(src, tgt, disp)
* group[0].element[+].code = #{src}
* group[0].element[=].target[0].code = #{tgt}
* group[0].element[=].target[0].display = "{disp}"
* group[0].element[=].target[0].equivalence = #wider

RuleSet: Unmatched(src, comment)
* group[1].element[+].code = #{src}
* group[1].element[=].target[0].equivalence = #unmatched
* group[1].element[=].target[0].comment = "{comment}"

Instance: sl-citizen-to-oah
InstanceOf: ConceptMap
Usage: #definition
Title: "StreamLink questions to OAH indicators"
Description: "Maps each stream-check question (linkId, as a StreamLink code) to the OAH indicator its answer is recorded under. Unmatched items are proposed additions to the OAH temporary code system."
* url = "https://n-h-l.github.io/streamlink-oneaquahealth/fhir/ConceptMap/sl-citizen-to-oah"
* version = "0.1.0"
* name = "SlCitizenToOah"
* title = "StreamLink questions to OAH indicators"
* status = #draft
* experimental = true
* date = "2026-09-23"
* sourceCanonical = "https://n-h-l.github.io/streamlink-oneaquahealth/fhir/ValueSet/sl-question-codes-vs"
* targetUri = "http://hl7.eu/fhir/ig/oah/ValueSet/temporarySystem-oah-eu"
* group[0].source = "https://n-h-l.github.io/streamlink-oneaquahealth/fhir/CodeSystem/streamlink"
* group[0].target = "http://hl7.eu/fhir/ig/oah/CodeSystem/temporarySystem-oah-eu"
* insert MapTo(channel-form, morophology, Morphology of the streams)
* insert MapTo(bottom-type, morophology, Morphology of the streams)
* insert MapTo(bank-type, morophology, Morphology of the streams)
* insert MapTo(habitats, morophology, Morphology of the streams)
* insert MapTo(natural-debris, morophology, Morphology of the streams)
* insert MapTo(water-flow, hydrology, Hydrology of the stream)
* insert MapTo(water-withdrawal, hydrology, Hydrology of the stream)
* insert MapTo(barriers, hydrology, Hydrology of the stream)
* insert MapTo(water-height, hydrology, Hydrology of the stream)
* insert MapTo(water-aspect, foam, Foam/colour/smell)
* insert MapTo(impervious-left, LandUse, Land use in the margins)
* insert MapTo(impervious-right, LandUse, Land use in the margins)
* insert MapTo(vegetated-left, riparianVegetation, Riparian vegetation)
* insert MapTo(vegetated-right, riparianVegetation, Riparian vegetation)
* insert MapTo(dominant-veg-left, riparianVegetation, Riparian vegetation)
* insert MapTo(dominant-veg-right, riparianVegetation, Riparian vegetation)
* insert MapTo(recent-cuts, riparianVegetation, Riparian vegetation)
* insert MapTo(invasive-plants, invasiveOrganisms, Invasive invertebrate\, plants and fish)
* group[1].source = "https://n-h-l.github.io/streamlink-oneaquahealth/fhir/CodeSystem/streamlink"
* group[1].target = "http://hl7.eu/fhir/ig/oah/CodeSystem/temporarySystem-oah-eu"
* insert Unmatched(sewage-discharge, No OAH code. Recorded as StreamLink sewage-discharge; proposed addition to the OAH temporary code system.)
* insert Unmatched(drain-pipes, No OAH code. Recorded as StreamLink drain-outflow; proposed addition to the OAH temporary code system.)
* insert Unmatched(construction, No OAH code. Recorded as StreamLink construction-works; proposed addition to the OAH temporary code system.)
* insert Unmatched(overall-health, No OAH code. Recorded as StreamLink citizen-overall-rating; proposed addition to the OAH temporary code system.)
