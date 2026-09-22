// ---------------------------------------------------------------------------
// StreamLink code system: questions (linkIds double as codes), answers, proposed
// indicator codes, wellbeing/baseline components, workflow codes, trust rules.
// Displays mirror src/core/questions.ts labels; display mismatches are warnings only.
// ---------------------------------------------------------------------------
CodeSystem: StreamLinkCS
Id: streamlink
Title: "StreamLink codes"
Description: "Codes used by StreamLink: stream-check questions and answers, proposed additions to the OAH temporary code system, wellbeing and baseline components, workflow and trust-rule codes."
* ^url = "https://example.org/fhir/streamlink/CodeSystem/streamlink"
* ^status = #draft
* ^experimental = true
* ^caseSensitive = true
* ^content = #complete
* ^hierarchyMeaning = #grouped-by
// --- Questions (linkIds of Questionnaire oah-citizen-stream-check)
* #question "Stream-check question" "Grouper for the questions of the StreamLink stream check (codes equal the Questionnaire linkIds)."
  * #channel-form "Shape of the channel" "Question: shape of the channel."
  * #bottom-type "Stream bed" "Question: type of stream bed."
  * #bank-type "Banks" "Question: type of banks."
  * #habitats "Habitats you can see" "Question: habitats present."
  * #natural-debris "Natural debris in the water" "Question: natural debris present."
  * #water-flow "How is the water moving?" "Question: flow type."
  * #water-aspect "How does the water look?" "Question: water aspect."
  * #drain-pipes "Pipes discharging polluted water" "Question: pipes discharging polluted water."
  * #construction "Construction or works in the stream" "Question: construction or works in the stream."
  * #water-withdrawal "Water being pumped or taken out" "Question: water withdrawal."
  * #barriers "Dams or weirs" "Question: barriers (dams, weirs)."
  * #water-height "Water depth (rough guess)" "Question: water height in metres."
  * #impervious-left "Left bank: more than a third paved or built on" "Question: impervious surface, left bank."
  * #impervious-right "Right bank: more than a third paved or built on" "Question: impervious surface, right bank."
  * #vegetated-left "Left bank: covered by plants" "Question: vegetated, left bank."
  * #vegetated-right "Right bank: covered by plants" "Question: vegetated, right bank."
  * #dominant-veg-left "Left bank: main plants" "Question: dominant vegetation, left bank."
  * #dominant-veg-right "Right bank: main plants" "Question: dominant vegetation, right bank."
  * #invasive-plants "Invasive or non-native plants" "Question: invasive plants present."
  * #recent-cuts "Vegetation recently cut" "Question: vegetation recently cut."
  * #overall-health "Overall, this stream looks…" "Question: overall impression of stream health."
// --- Answers
* #answer "Stream-check answer" "Grouper for answer codes."
  * #yes "Yes" "Yes."
  * #no "No" "No."
  * #not-sure "Not sure" "The citizen could not tell. Creates no Observation."
  * #flat "Flat" "Channel form: flat (wide and shallow)."
  * #u-shape "U shape" "Channel form: U shape."
  * #v-shape "V shape" "Channel form: V shape (deep and narrow)."
  * #natural "Natural" "Natural bed or banks."
  * #artificial "Artificial" "Artificial bed or banks (concrete, cemented stones)."
  * #laid-stones "Laid stones" "Banks of laid stones without concrete."
  * #sand-banks "Sand banks" "Habitat: sand banks."
  * #sand-islands "Sand islands" "Habitat: sand islands."
  * #stone-deposits "Stone deposits" "Habitat: stone deposits."
  * #riffles "Riffles, rapids or small falls" "Habitat: riffles, rapids or small falls."
  * #aquatic-vegetation "Plants growing in the water" "Habitat: aquatic vegetation."
  * #fallen-trees "Fallen trees" "Debris: fallen trees."
  * #fallen-branches "Fallen branches" "Debris: fallen branches."
  * #leaf-deposits "Piles of fallen leaves" "Debris: leaf deposits."
  * #fast "Fast" "Flow: fast."
  * #slow "Slow" "Flow: slow."
  * #stagnant "Still or on and off" "Flow: stagnant or intermittent."
  * #dry "Dry" "Flow: dry bed."
  * #clear "Clear" "Water aspect: clear."
  * #turbid "Muddy or cloudy" "Water aspect: turbid."
  * #foam "Foam on the surface" "Water aspect: foam."
  * #altered-colour "Unusual colour" "Water aspect: altered colour."
  * #herbs "Grass and herbs" "Dominant vegetation: herbs (maps to OAH herbaceous)."
  * #shrubs "Shrubs" "Dominant vegetation: shrubs (maps to OAH bushes)."
  * #trees "Trees" "Dominant vegetation: trees (maps to OAH trees)."
  * #good "Good" "Overall rating: good."
  * #moderate "Moderate" "Overall rating: moderate."
  * #poor "Poor" "Overall rating: poor."
// --- Proposed additions to the OAH temporary code system (event indicators)
* #proposed-indicator "Proposed OAH indicator" "Grouper for indicator codes proposed for addition to the OAH temporary code system."
  * #sewage-discharge "Sewage discharge observed" "Sewage flowing into the stream observed by a citizen (event)."
  * #drain-outflow "Draining pipe outflow observed" "A pipe discharging polluted water observed (event)."
  * #construction-works "Construction or works in the stream" "Construction or works in or next to the stream (event)."
  * #citizen-overall-rating "Citizen overall stream-health rating" "The citizen's overall impression of stream health (good/moderate/poor)."
// --- Wellbeing
* #perceived-wellbeing "Perceived wellbeing at the stream" "Self-reported emotions felt at the stream (not a clinical measure)."
* #joy "Joy" "Wellbeing component: joy (0-10)."
* #serenity "Calm" "Wellbeing component: serenity/calm (0-10)."
* #anger "Anger" "Wellbeing component: anger (0-10)."
* #fear "Unease" "Wellbeing component: fear/unease (0-10)."
// --- Baseline
* #map-context-risk "Map-context baseline risk" "Baseline risk (0-1) from map features, StreamLink baseline v1."
* #dist-wastewater-plant "Distance to nearest wastewater plant" "Distance in metres to the nearest wastewater treatment plant."
* #dist-farmland "Distance to nearest farmland" "Distance in metres to the nearest farmland."
* #urban-fraction-2km "Built-up share within 2 km" "Percentage of built-up land within 2 km."
// --- Workflow
* #stream-lab-sampling "Lab sampling visit to a stream site" "A request for a lab team to sample a stream site."
* #expert-verification "Expert verification of citizen observations" "An expert reviewed and confirmed citizen observations."
// --- Trust rules
* #trust-rule "Trust rule" "Grouper for StreamLink trust-check rules."
  * #far-from-site "Far from site" "GPS position more than 300 m from the chosen site."
  * #dry-but-wet "Dry but wet" "Flow is dry but a water aspect or a water height > 0 was given."
  * #stagnant-riffles "Stagnant with riffles" "Flow is stagnant but riffles were reported."
  * #no-veg-dominant "No vegetation but dominant type" "Bank not vegetated but a dominant vegetation type given (same side)."
  * #good-but-sewage "Good but sewage" "Overall rating good but sewage or drain outflow reported."
  * #implausible-height "Implausible water height" "Water height greater than 3 m."
  * #no-photos "No photos" "No photos attached."
  * #future-time "Future time" "Authored time is in the future."
// --- Trust-flag resolution
* #flag-resolution "Trust flag resolution" "Grouper for trust-flag resolution states."
  * #open "Open" "Flag not yet resolved."
  * #corrected "Corrected" "The citizen corrected the answer."
  * #confirmed-by-citizen "Confirmed by citizen" "The citizen confirmed the answer as correct."
  * #dismissed-by-expert "Dismissed by expert" "An expert reviewed and dismissed the flag."

CodeSystem: StreamLinkTagsCS
Id: streamlink-tags
Title: "StreamLink tags"
Description: "meta.tag codes used on StreamLink records."
* ^url = "https://example.org/fhir/streamlink/CodeSystem/streamlink-tags"
* ^status = #draft
* ^experimental = true
* ^caseSensitive = true
* ^content = #complete
* #demo "StreamLink demo record" "Written by the StreamLink demo."
* #simulated "Simulated data (demo only)" "Synthetic data; no real measurement was made."

// ---------------------------------------------------------------------------
// Value sets
// ---------------------------------------------------------------------------
ValueSet: SlCitizenIndicatorsVS
Id: sl-citizen-indicators-vs
Title: "StreamLink citizen indicators"
Description: "Observation codes for citizen stream checks: the OAH indicators a citizen can report, plus StreamLink event codes proposed for addition to the OAH temporary code system."
* ^url = "https://example.org/fhir/streamlink/ValueSet/sl-citizen-indicators-vs"
* ^status = #draft
* $oah#morophology "Morphology of the streams"
* $oah#hydrology "Hydrology of the stream"
* $oah#foam "Foam/colour/smell"
* $oah#LandUse "Land use in the margins"
* $oah#riparianVegetation "Riparian vegetation"
* $oah#invasiveOrganisms "Invasive invertebrate, plants and fish"
* $sl#sewage-discharge
* $sl#drain-outflow
* $sl#construction-works
* $sl#citizen-overall-rating

ValueSet: SlQuestionCodesVS
Id: sl-question-codes-vs
Title: "StreamLink stream-check question codes"
Description: "Codes naming the stream-check question an Observation came from (sent as an additional coding in Observation.code)."
* ^url = "https://example.org/fhir/streamlink/ValueSet/sl-question-codes-vs"
* ^status = #draft
* codes from system $sl where concept is-a #question
* $sl#sewage-discharge "Sewage discharge observed"

ValueSet: SlCitizenStatusVS
Id: sl-citizen-observation-status-vs
Title: "StreamLink citizen Observation status"
Description: "Allowed statuses for citizen Observations: preliminary until verified, then final (or amended / entered-in-error)."
* ^url = "https://example.org/fhir/streamlink/ValueSet/sl-citizen-observation-status-vs"
* ^status = #draft
* $obsstatus#preliminary
* $obsstatus#final
* $obsstatus#amended
* $obsstatus#entered-in-error

ValueSet: SlReferralStatusVS
Id: sl-referral-status-vs
Title: "StreamLink referral status"
Description: "Allowed statuses for lab-sampling referrals: active until the result arrives, then completed."
* ^url = "https://example.org/fhir/streamlink/ValueSet/sl-referral-status-vs"
* ^status = #draft
* $srstatus#active
* $srstatus#completed

ValueSet: SlTrustRulesVS
Id: sl-trust-rules-vs
Title: "StreamLink trust rules"
Description: "Trust-check rules applied to a citizen stream check."
* ^url = "https://example.org/fhir/streamlink/ValueSet/sl-trust-rules-vs"
* ^status = #draft
* codes from system $sl where concept descendent-of #trust-rule

ValueSet: SlFlagResolutionVS
Id: sl-flag-resolution-vs
Title: "StreamLink trust-flag resolution"
Description: "How a trust flag was resolved."
* ^url = "https://example.org/fhir/streamlink/ValueSet/sl-flag-resolution-vs"
* ^status = #draft
* codes from system $sl where concept descendent-of #flag-resolution

ValueSet: SlWellbeingComponentsVS
Id: sl-wellbeing-components-vs
Title: "StreamLink wellbeing components"
Description: "Emotion components of the perceived-wellbeing Observation."
* ^url = "https://example.org/fhir/streamlink/ValueSet/sl-wellbeing-components-vs"
* ^status = #draft
* $sl#joy
* $sl#serenity
* $sl#anger
* $sl#fear

// ---------------------------------------------------------------------------
// Identifier namespaces (R4 NamingSystem has no url; the uniqueId is the system URI)
// ---------------------------------------------------------------------------
Instance: oah-site-code
InstanceOf: NamingSystem
Usage: #definition
Title: "OAH site codes"
* name = "OahSiteCode"
* status = #draft
* kind = #identifier
* date = "2026-09-23"
* description = "Site codes used by the OneAquaHealth Resilience Map (e.g. C1 = Coimbra site 1)."
* uniqueId.type = #uri
* uniqueId.value = "https://example.org/fhir/streamlink/NamingSystem/oah-site-code"
* uniqueId.preferred = true

Instance: volunteer
InstanceOf: NamingSystem
Usage: #definition
Title: "StreamLink volunteer pseudonyms"
* name = "StreamLinkVolunteer"
* status = #draft
* kind = #identifier
* date = "2026-09-23"
* description = "Random pseudonyms for citizen scientists. They carry no personal data."
* uniqueId.type = #uri
* uniqueId.value = "https://example.org/fhir/streamlink/NamingSystem/volunteer"
* uniqueId.preferred = true

Instance: staff
InstanceOf: NamingSystem
Usage: #definition
Title: "StreamLink staff identifiers"
* name = "StreamLinkStaff"
* status = #draft
* kind = #identifier
* date = "2026-09-23"
* description = "Identifiers for demo staff (reviewers, coordinators) and lab organizations."
* uniqueId.type = #uri
* uniqueId.value = "https://example.org/fhir/streamlink/NamingSystem/staff"
* uniqueId.preferred = true
