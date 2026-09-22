// The StreamLink stream check. Mirrors the OneAquaHealth Citizen Science App form.
// Item order and linkIds match src/core/fhir.ts (the validator checks QR item order).
RuleSet: Opt(code, display)
* item[=].answerOption[+].valueCoding = $sl#{code} {display}

RuleSet: NotSure
* item[=].answerOption[+].valueCoding = $sl#not-sure "Not sure"

RuleSet: Choice(linkId, text)
* item[+].linkId = "{linkId}"
* item[=].text = {text}
* item[=].type = #choice
* item[=].code = $sl#{linkId}

RuleSet: YesNo(linkId, text)
* insert Choice({linkId}, {text})
* insert Opt(yes, "Yes")
* insert Opt(no, "No")
* insert NotSure

RuleSet: Emotion(code, text)
* item[=].item[+].linkId = "emotion-{code}"
* item[=].item[=].text = {text}
* item[=].item[=].type = #integer
* item[=].item[=].code = $sl#{code}
* item[=].item[=].extension[0].url = "http://hl7.org/fhir/StructureDefinition/minValue"
* item[=].item[=].extension[0].valueInteger = 0
* item[=].item[=].extension[1].url = "http://hl7.org/fhir/StructureDefinition/maxValue"
* item[=].item[=].extension[1].valueInteger = 10

Instance: oah-citizen-stream-check
InstanceOf: Questionnaire
Usage: #definition
Title: "StreamLink stream check"
Description: "A 3-minute citizen check of an urban stream site, mirroring the OneAquaHealth Citizen Science App fields. Every choice question allows 'not sure'."
* url = "https://example.org/fhir/streamlink/Questionnaire/oah-citizen-stream-check"
* version = "0.1.0"
* name = "OahCitizenStreamCheck"
* title = "StreamLink stream check"
* status = #active
* experimental = true
* date = "2026-09-23"
* publisher = "StreamLink (OneAquaHealth IEEE Global Hackathon 2026 entry)"
* subjectType = #Location
* description = "A 3-minute citizen check of an urban stream site, mirroring the OneAquaHealth Citizen Science App fields. Answers map to OAH indicators via ConceptMap sl-citizen-to-oah."

* item[+].linkId = "site"
* item[=].text = "Site"
* item[=].type = #reference
* item[=].required = true

// Step 1: channel
* insert Choice(channel-form, "Shape of the channel")
* insert Opt(flat, "Flat")
* insert Opt(u-shape, "U shape")
* insert Opt(v-shape, "V shape")
* insert NotSure
* insert Choice(bottom-type, "Stream bed")
* insert Opt(natural, "Natural")
* insert Opt(artificial, "Artificial")
* insert NotSure
* insert Choice(bank-type, "Banks")
* insert Opt(natural, "Natural")
* insert Opt(laid-stones, "Laid stones")
* insert Opt(artificial, "Artificial")
* insert NotSure
* insert Choice(habitats, "Habitats you can see")
* item[=].repeats = true
* insert Opt(sand-banks, "Sand banks")
* insert Opt(sand-islands, "Sand islands")
* insert Opt(stone-deposits, "Stone deposits")
* insert Opt(riffles, "Riffles\, rapids or small falls")
* insert Opt(aquatic-vegetation, "Plants growing in the water")
* insert NotSure
* insert Choice(natural-debris, "Natural debris in the water")
* item[=].repeats = true
* insert Opt(fallen-trees, "Fallen trees")
* insert Opt(fallen-branches, "Fallen branches")
* insert Opt(leaf-deposits, "Piles of fallen leaves")
* insert NotSure

// Step 2: water
* insert Choice(water-flow, "How is the water moving?")
* insert Opt(fast, "Fast")
* insert Opt(slow, "Slow")
* insert Opt(stagnant, "Still or on and off")
* insert Opt(dry, "Dry")
* insert NotSure
* insert Choice(water-aspect, "How does the water look?")
* insert Opt(clear, "Clear")
* insert Opt(turbid, "Muddy or cloudy")
* insert Opt(foam, "Foam on the surface")
* insert Opt(altered-colour, "Unusual colour")
* insert NotSure
* insert YesNo(sewage-discharge, "Sewage flowing in")
* insert YesNo(drain-pipes, "Pipes discharging polluted water")
* insert YesNo(construction, "Construction or works in the stream")
* insert YesNo(water-withdrawal, "Water being pumped or taken out")
* insert YesNo(barriers, "Dams or weirs")
* item[+].linkId = "water-height"
* item[=].text = "Water depth (rough guess)"
* item[=].type = #decimal
* item[=].code = $sl#water-height

// Step 3: margins (left/right facing downstream)
* insert YesNo(impervious-left, "Left bank: more than a third paved or built on")
* insert YesNo(impervious-right, "Right bank: more than a third paved or built on")
* insert YesNo(vegetated-left, "Left bank: covered by plants")
* insert YesNo(vegetated-right, "Right bank: covered by plants")
* insert Choice(dominant-veg-left, "Left bank: main plants")
* insert Opt(herbs, "Grass and herbs")
* insert Opt(shrubs, "Shrubs")
* insert Opt(trees, "Trees")
* insert NotSure
* insert Choice(dominant-veg-right, "Right bank: main plants")
* insert Opt(herbs, "Grass and herbs")
* insert Opt(shrubs, "Shrubs")
* insert Opt(trees, "Trees")
* insert NotSure
* insert YesNo(invasive-plants, "Invasive or non-native plants")
* insert YesNo(recent-cuts, "Vegetation recently cut")

// Step 4: feel
* insert Choice(overall-health, "Overall\, this stream looks…")
* insert Opt(good, "Good")
* insert Opt(moderate, "Moderate")
* insert Opt(poor, "Poor")
* insert NotSure
* item[+].linkId = "invasive-which"
* item[=].text = "Which invasive plants?"
* item[=].type = #string
* item[+].linkId = "emotions"
* item[=].text = "How does this place make you feel? (0–10)"
* item[=].type = #group
* insert Emotion(joy, "Joy")
* insert Emotion(serenity, "Calm")
* insert Emotion(anger, "Anger")
* insert Emotion(fear, "Unease")
* item[+].linkId = "photos"
* item[=].text = "Photos taken"
* item[=].type = #integer
* item[+].linkId = "gps"
* item[=].text = "Location when submitted (rounded to about 100 m)"
* item[=].type = #string
