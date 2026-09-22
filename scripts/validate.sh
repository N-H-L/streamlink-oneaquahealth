#!/usr/bin/env bash
# StreamLink FHIR validation.
#   1. SUSHI builds fhir/ (our IG) -> fhir/fsh-generated/resources
#   2. ONE HL7 validator run (one JVM) over:
#        (a) every generated resource in fhir/fsh-generated/resources  -> must have 0 errors
#        (b) every out/bundles/*.json (emitted by src/)                  -> must have 0 errors
#        (c) every fhir/negative-tests/*.json                            -> must have >= 1 error
#      with our IG and the OAH IG (hl7.eu.fhir.oah#0.1.0-ci-build, local package) loaded.
#   3. out/validation/summary.md (+ results.json, validator.log); non-zero exit on failure.
#
# Usage: bash scripts/validate.sh            (offline terminology: -tx n/a, the default)
#        TX=https://tx.fhir.org/r4 bash scripts/validate.sh   (online terminology server)
set -uo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

JAVA="tools/jre/bin/java"
JAR="tools/validator_cli.jar"
TX="${TX:-n/a}"
OUT="out/validation"
mkdir -p "$OUT"

[ -x "$JAVA" ] || [ -x "$JAVA.exe" ] || JAVA="java"
command -v "$JAVA" >/dev/null 2>&1 || [ -x "$JAVA" ] || { echo "No Java: unzip a JRE (Temurin 21) into tools/jre"; exit 2; }
[ -f "$JAR" ] || { echo "Missing $JAR: curl -L -o $JAR https://github.com/hapifhir/org.hl7.fhir.core/releases/latest/download/validator_cli.jar"; exit 2; }

CACHE="${FHIR_PACKAGE_CACHE:-$HOME/.fhir/packages}"
if [ ! -f "$CACHE/hl7.eu.fhir.oah#0.1.0-ci-build/package/package.json" ]; then
  echo "== Installing OAH package into the local FHIR cache"
  bash scripts/fhir-install-oah.sh || exit 2
fi

echo "== SUSHI (fhir/)"
if ! npx -y fsh-sushi@3 fhir > "$OUT/sushi.log" 2>&1; then
  tail -30 "$OUT/sushi.log"; echo "SUSHI failed (see $OUT/sushi.log)"; exit 1
fi
grep -E "Errors|Warnings" "$OUT/sushi.log" | tail -1

POS=(); BUN=(); NEG=()
for f in fhir/fsh-generated/resources/*.json; do
  case "$f" in */ImplementationGuide-*) continue;; esac  # SUSHI IG-Publisher input, not a data artifact
  POS+=("$f")
done
for f in out/bundles/*.json; do [ -f "$f" ] && BUN+=("$f"); done
for f in fhir/negative-tests/*.json; do [ -f "$f" ] && NEG+=("$f"); done
echo "== Validating ${#POS[@]} IG resources, ${#BUN[@]} bundles, ${#NEG[@]} negative tests (tx: $TX)"

"$JAVA" -Xmx4g -jar "$JAR" \
  -version 4.0.1 \
  -ig "hl7.eu.fhir.oah#0.1.0-ci-build" \
  -ig fhir/fsh-generated/resources \
  -tx "$TX" \
  -allow-example-urls true \
  -display-issues-are-warnings \
  -output "$OUT/results.json" \
  "${POS[@]}" "${BUN[@]}" "${NEG[@]}" > "$OUT/validator.log" 2>&1
VRC=$?
if [ ! -s "$OUT/results.json" ]; then
  tail -40 "$OUT/validator.log"; echo "Validator produced no results (exit $VRC); see $OUT/validator.log"; exit 2
fi

SUSHI_LINE="$(grep -E "Errors .*Warning" "$OUT/sushi.log" | tail -1 | tr -s ' |')"
VALIDATOR_VERSION="$(grep -m1 -oE "FHIR Validation tool Version [^ ]+" "$OUT/validator.log")"
node scripts/fhir-summary.mjs "$OUT/results.json" "$OUT/summary.md" "$TX" "$SUSHI_LINE" "$VALIDATOR_VERSION"
