Deliberately invalid resources. `scripts/validate.sh` validates them and FAILS if any of them passes
(proves the validator is really checking our profiles, bindings and the Questionnaire).
- neg-citizen-observation: bad status, question code only (not in sl-citizen-indicators-vs), no performer/derivedFrom, valueString.
- neg-citizen-scientist-named: name + telecom on a pseudonymous volunteer; wrong identifier system.
- neg-check-provenance: trust score 1.5, unknown rule and resolution codes, activity UPDATE, no source entity.
- neg-stream-check-response: answer not in the options, emotion 14 > 10, unknown linkId.
- neg-verified-still-preliminary: claims both sl-citizen-observation and OAH observation-indicators-oah but is preliminary with no performer (OAH fixes status=final, requires performer).
