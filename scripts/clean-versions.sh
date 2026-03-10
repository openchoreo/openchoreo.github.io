#!/usr/bin/env bash
#
# Removes old Docusaurus versions, keeping only the latest 4.
# Usage: ./scripts/clean-versions.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

VERSIONS_FILE="${ROOT_DIR}/versions.json"
VERSIONED_DOCS_DIR="${ROOT_DIR}/versioned_docs"
VERSIONED_SIDEBARS_DIR="${ROOT_DIR}/versioned_sidebars"

KEEP=4

if [ ! -f "${VERSIONS_FILE}" ]; then
  echo "Error: ${VERSIONS_FILE} not found"
  exit 1
fi

if ! command -v jq &>/dev/null; then
  echo "Error: jq is required but not installed"
  exit 1
fi

total=$(jq 'length' "${VERSIONS_FILE}")

if [ "${total}" -le "${KEEP}" ]; then
  echo "Nothing to clean. Found ${total} version(s), keeping ${KEEP}."
  exit 0
fi

# Get versions to remove (everything after the first KEEP entries)
versions_to_remove=$(jq -r ".[${KEEP}:][]" "${VERSIONS_FILE}")

for version in ${versions_to_remove}; do
  echo "Removing version: ${version}"

  docs_dir="${VERSIONED_DOCS_DIR}/version-${version}"
  if [ -d "${docs_dir}" ]; then
    rm -rf "${docs_dir}"
    echo "  Removed ${docs_dir}"
  fi

  sidebar_file="${VERSIONED_SIDEBARS_DIR}/version-${version}-sidebars.json"
  if [ -f "${sidebar_file}" ]; then
    rm -f "${sidebar_file}"
    echo "  Removed ${sidebar_file}"
  fi
done

# Update versions.json to keep only the first KEEP entries
jq ".[0:${KEEP}]" "${VERSIONS_FILE}" >"${VERSIONS_FILE}.tmp"
mv "${VERSIONS_FILE}.tmp" "${VERSIONS_FILE}"
echo ""
echo "Updated ${VERSIONS_FILE}:"
cat "${VERSIONS_FILE}"
echo ""
echo "Done. Removed $((total - KEEP)) version(s), kept ${KEEP}."
echo ""
echo "NOTE: Manually remove the old version entries from the 'versions' map in docusaurus.config.ts"
