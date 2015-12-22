#!/bin/bash
set -e

################################################################################
# Settings.
################################################################################
SC_DEV_S3_BUCKET="${bamboo.DEV_S3_BUCKET}"
SC_CIT_S3_BUCKET="${bamboo.CIT_S3_BUCKET}"
SC_BUILD_DATA_FILE="${bamboo.BUILD_DATA_FILE}"
SC_CI_FILE="${bamboo.CI_FILE}"
SC_BRANCH_NAME="${bamboo.repository.branch.name}"
SC_BUILD_NUMBER="${bamboo.buildNumber}"
SC_SPRINT_NUMBER="${bamboo.SPRINT_NUMBER}"

################################################################################
# Helper functions.
################################################################################
_exit_error() {
  [[ $# -ge 1 ]] && echo "ERROR: $1" 1>&2
  exit 1
}

_ucase() {
  echo "$1" | tr '[:lower:]' '[:upper:]'
}

_lcase() {
  echo "$1" | tr '[:upper:]' '[:lower:]'
}

################################################################################
# Determine the version of the build.
################################################################################
SC_BRANCH_NAME_UCASE="$(_ucase "${SC_BRANCH_NAME}")"
SC_CREATE_JIRA_VERSION=0

[[ -n "${SC_BRANCH_NAME}" ]] || \
  _exit_error "Unable to determine branch name. This is needed to generate a build version."

if [[ "${SC_BRANCH_NAME}" = "master" ]]
# Master (i.e., trunk) branch. This is used for coordination of the latest
# released code among the other branches. Nothing is directly released from this
# this branch.
then
  SC_VERSION="${SC_BUILD_NUMBER}-${SC_BRANCH_NAME_UCASE}"
  SC_S3_BUCKET="${SC_DEV_S3_BUCKET}"
  SC_CREATE_JIRA_VERSION=0


elif [[ "${SC_BRANCH_NAME}" = "dev" ]]
# The development branch. This is used by engineering for all sprint,
# etc... work. Release branches are created off of this branch once
# a release candidate is determined.
then
  SC_VERSION="${SC_SPRINT_NUMBER}.${SC_BUILD_NUMBER}-DEV"
  SC_S3_BUCKET="${SC_DEV_S3_BUCKET}"
  SC_CREATE_JIRA_VERSION=1


elif [[ "${SC_BRANCH_NAME}" =~ ^release-(.+)$ ]]
# Release branches. These are created from the development branch once a release
# candidate is determined from the development branch.
then
  SC_RELEASE_BASE_VERSION="${BASH_REMATCH[1]}"
  SC_VERSION="${SC_RELEASE_BASE_VERSION}.${SC_BUILD_NUMBER}-RELEASE"
  SC_S3_BUCKET="${SC_DEV_S3_BUCKET}"
  SC_CREATE_JIRA_VERSION=1


elif [[ "${SC_BRANCH_NAME}" =~ ^hotfix-([^-]+)-0*([0-9]+)$ ]]
# Hotfix branches. These are created from the master branch when customer issues
# that require immediate attention are encountered with released code.
then
  SC_HOTFIX_BASE_VERSION="${BASH_REMATCH[1]}"
  SC_HOTFIX_NUMBER="${BASH_REMATCH[2]}"

  SC_VERSION="${SC_HOTFIX_BASE_VERSION}-HF-${SC_HOTFIX_NUMBER}.${SC_BUILD_NUMBER}-RELEASE"
  SC_S3_BUCKET="${SC_DEV_S3_BUCKET}"
  SC_CREATE_JIRA_VERSION=1

################################################################################
# START: Customer Integration Branches
#   These branches are deployed to the customer staging environment so that
#   the CIT group may work with customers to resolve issues specific to
#   the characteristics of those websites.
################################################################################

elif [[ "${SC_BRANCH_NAME}" = "cit" ]]
# The CIT development branch. This is used by CIT for all sprint, etc... work.
# Once features, etc... are completed by the CIT group, engineering will pull
# the updates into the 'development' branch for release preparation.
then
  SC_VERSION="${SC_SPRINT_NUMBER}.${SC_BUILD_NUMBER}-CIT"
  SC_S3_BUCKET="${SC_CIT_S3_BUCKET}"
  SC_CREATE_JIRA_VERSION=0

elif [[ "${SC_BRANCH_NAME}" =~ ^cit-release-(.+)$ ]]
# CIT release branches, branched from engineering release candidate branches.
then
  SC_RELEASE_BASE_VERSION="${BASH_REMATCH[1]}"

  SC_VERSION="${SC_RELEASE_BASE_VERSION}.${SC_BUILD_NUMBER}-CIT-RELEASE"
  SC_S3_BUCKET="${SC_CIT_S3_BUCKET}"
  SC_CREATE_JIRA_VERSION=0


elif [[ "${SC_BRANCH_NAME}" =~ ^cit-hotfix-([^-]+)-0*([0-9]+)$ ]]
# CIT hotfix branches, branched from engineering hotfix branches.
then
  SC_HOTFIX_BASE_VERSION="${BASH_REMATCH[1]}"
  SC_HOTFIX_NUMBER="${BASH_REMATCH[2]}"

  SC_VERSION="${SC_HOTFIX_BASE_VERSION}-HF-${SC_HOTFIX_NUMBER}.${SC_BUILD_NUMBER}-CIT-RELEASE"
  SC_S3_BUCKET="${SC_CIT_S3_BUCKET}"
  SC_CREATE_JIRA_VERSION=0


elif [[ "${SC_BRANCH_NAME}" =~ ^cit-.+$ ]]
# General use CIT branches.
then
  SC_VERSION="${SC_SPRINT_NUMBER}.${SC_BUILD_NUMBER}-BRANCH-${SC_BRANCH_NAME_UCASE}"
  SC_S3_BUCKET="${SC_CIT_S3_BUCKET}"
  SC_CREATE_JIRA_VERSION=0

################################################################################
# END: Customer Integration Branches
################################################################################

else
  # General use development branches.
  SC_VERSION="${SC_SPRINT_NUMBER}.${SC_BUILD_NUMBER}-BRANCH-${SC_BRANCH_NAME_UCASE}"
  SC_S3_BUCKET="${SC_DEV_S3_BUCKET}"
  SC_CREATE_JIRA_VERSION=0
fi

################################################################################
# Print the version information to the build log.
################################################################################
cat <<EOF
===== VERSION INFORMATION ======================================================
Branch              : ${SC_BRANCH_NAME}
Version             : ${SC_VERSION}
S3 Bucket           : ${SC_S3_BUCKET}
Create JIRA Version : ${SC_CREATE_JIRA_VERSION}
================================================================================
EOF

################################################################################
# Save the version information for later tasks, jobs, builds, etc...
################################################################################
mkdir -p "$(dirname "${SC_BUILD_DATA_FILE}")"
cat > "${SC_BUILD_DATA_FILE}" <<EOF
SC_VERSION=${SC_VERSION}
SC_S3_BUCKET=${SC_S3_BUCKET}
SC_CREATE_JIRA_VERSION=${SC_CREATE_JIRA_VERSION}
EOF

################################################################################
# Save the general CI informaton.
################################################################################
mkdir -p "$(dirname "${SC_CI_FILE}")"
cat > "${SC_CI_FILE}" <<EOF
SC_CI_BUILD_TIMESTAMP=${bamboo.buildTimeStamp}
SC_CI_GIT_BRANCH=${SC_BRANCH_NAME}
SC_CI_GIT_COMMIT_HASH=${bamboo.repository.revision.number}
SC_CI_BUILD_NUMBER=${SC_BUILD_NUMBER}
SC_CI_BUILD_KEY=${bamboo.buildKey}
SC_CI_BUILD_RESULT_KEY=${bamboo.buildResultKey}
SC_CI_BUILD_URL=${bamboo.buildResultsUrl}
EOF
