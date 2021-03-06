#!/bin/bash

# Colours
CYAN="\033[96m"
YELLOW="\033[93m"
RED="\033[91m"
RESET="\033[0m"
BOLD="\033[1m"

# Program Paths:
PROG=$(basename ${BASH_SOURCE[0]})
PROG_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
STRATOS_DIR="$( cd "${PROG_DIR}/../.." && pwd )"
CHANGELOG="${STRATOS_DIR}/CHANGELOG.md"

echo -e "${CYAN}${BOLD}===================================${RESET}"
echo -e "${CYAN}${BOLD}Generating Changelog from Milestone${RESET}"
echo -e "${CYAN}${BOLD}===================================${RESET}"

echo -e "${YELLOW}Stratos Directory: ${STRATOS_DIR}${RESET}"
echo ""

# Get the version number from the package.json file

REPO=${1:-cloudfoundry/stratos}

MILESTONE=$(cat "${STRATOS_DIR}/package.json" | jq -r .version)
echo -e "${YELLOW}Current version  : ${BOLD}${MILESTONE}${RESET}"

# Find the last release from the Changelog
CURRENT=$(cat "${STRATOS_DIR}/CHANGELOG.md" | grep -m1  '## [0-9]*.[0-9]*.[0-9]*')
CURRENT="${CURRENT:3}"
if [ "$CURRENT" == "$MILESTONE" ]; then
  CURRENT=$(cat "${STRATOS_DIR}/CHANGELOG.md" | grep -m2  '## [0-9]*.[0-9]*.[0-9]*' | tail -n1)
  CURRENT="${CURRENT:3}"

  # There is already a section for this release - so remove it
  echo "Removing old changelog for release ${MILESTONE}"
  sed -i.bak '/^# Change Log/,/^\## '"${CURRENT}"'/{//!d;};' ${CHANGELOG}
fi

echo -e "${YELLOW}Previous version : ${BOLD}$CURRENT${RESET}"

function search() {
  QUERY=$1
  curl -s "https://api.github.com/search/issues?q=${QUERY}" | jq -r '.items | .[] | "- \(.title) [\\#\(.number)](\(.html_url))"' | tee -a ${CHANGELOG}
}

function log() {
  echo $1 | tee -a ${CHANGELOG}
}

QUERY="repo:${REPO}+milestone:3.1.0+state:closed"

BUGS="$QUERY+label:bug"
NON_BUGS="$QUERY+-label:bug"

mv ${CHANGELOG} CHANGELOG.old

echo ""
echo -e "${CYAN}${BOLD}Generating Change log - content for version ${MILESTONE} will be shown below"
echo -e "---------------------------------------------------------------------${RESET}"

echo  "# Change Log" > ${CHANGELOG}
log ""
log "## ${MILESTONE}"
log ""
log "[Full Changelog](https://github.com/${REPO}/compare/${CURRENT}...${MILESTONE})"
log ""
log "This release contains a number of fixes and improvements:"
log ""
log "**Improvements:**"
log ""
search $NON_BUGS

log ""

log "**Fixes:**"
log ""
search $BUGS

log ""

tail -n +2 CHANGELOG.old >> ${CHANGELOG}
rm CHANGELOG.old 

sed -i.bak 's/\# Change Log.*\#\# ${CURRENT}//' ${CHANGELOG}