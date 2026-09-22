#!/usr/bin/env bash
# Builds the OAH IG (github.com/hl7-eu/oah @ b907cf0, cloned in tools/oah) with SUSHI and
# installs it into the local FHIR package cache as hl7.eu.fhir.oah#0.1.0-ci-build,
# because the package is not published on any registry (build.fhir.org is 404).
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OAH="$ROOT/tools/oah"
[ -d "$OAH" ] || { echo "tools/oah missing: git clone https://github.com/hl7-eu/oah tools/oah && git -C tools/oah checkout b907cf0"; exit 1; }
if [ "${SKIP_OAH_SUSHI:-0}" != 1 ] || ! grep -q "\"snapshot\"" "$OAH/fsh-generated/resources/StructureDefinition-location-oah.json" 2>/dev/null; then
  (cd "$OAH" && npx -y fsh-sushi@3 --snapshot . >/dev/null) || { echo "SUSHI failed on OAH IG"; exit 1; }
fi
CACHE="${FHIR_PACKAGE_CACHE:-$HOME/.fhir/packages}"
DEST="$CACHE/hl7.eu.fhir.oah#0.1.0-ci-build/package"
rm -rf "$CACHE/hl7.eu.fhir.oah#0.1.0-ci-build"
mkdir -p "$DEST/example"
for f in "$OAH"/fsh-generated/resources/*.json; do
  b="$(basename "$f")"
  case "$b" in
    StructureDefinition-*|ValueSet-*|CodeSystem-*|ConceptMap-*|ImplementationGuide-*|SearchParameter-*|NamingSystem-*) cp "$f" "$DEST/";;
    *) cp "$f" "$DEST/example/";;
  esac
done
cat > "$DEST/package.json" <<JSON
{
  "name": "hl7.eu.fhir.oah",
  "version": "0.1.0-ci-build",
  "canonical": "http://hl7.eu/fhir/ig/oah",
  "url": "http://hl7.eu/fhir/ig/oah",
  "title": "OneAquaHealth Project (local build of github.com/hl7-eu/oah b907cf0)",
  "fhirVersions": ["4.0.1"],
  "type": "IG",
  "dependencies": {
    "hl7.fhir.r4.core": "4.0.1",
    "hl7.fhir.uv.xver-r5.r4": "0.1.0"
  },
  "author": "OneAquaHealth Project",
  "license": "CC0-1.0"
}
JSON
echo "Installed $(ls "$DEST"/*.json | wc -l) conformance files + $(ls "$DEST"/example | wc -l) examples into $DEST"
