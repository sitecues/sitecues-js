#!/bin/bash

################################################################################
# Obtain build version information.
################################################################################
. "${bamboo.BUILD_DATA_FILE}"

################################################################################
# Settings.
################################################################################
SC_BRANCH_NAME="${bamboo.repository.branch.name}"
SC_BUILD_NUMBER="${bamboo.buildNumber}"
SC_S3_DEPLOY_KEY_PREFIX="${bamboo.JS_S3_DEPLOY_KEY_PREFIX}"
SC_AWS_ACCESS_KEY_PASSWORD="${bamboo.AWS_ACCESS_KEY_PASSWORD}"
SC_AWS_SECRET_KEY_PASSWORD="${bamboo.AWS_SECRET_KEY_PASSWORD}"
SC_JIRA_PROJECT_KEY="${bamboo.JIRA_PROJECT_KEY}"
SC_JIRA_USERNAME="${bamboo.JIRA_USERNAME}"
SC_JIRA_PASSWORD="${bamboo.JIRA_PASSWORD}"

################################################################################
# Helper functions.
################################################################################
_exit_error() {
  [[ $# -ge 1 ]] && echo "ERROR: $1" 1>&2
  exit 1
}

_tgz_entry_content() {
  tar --wildcards -O -zxf "$1" "$2" 2> /dev/null
}

_deploy_artifact() {
  s3deploy -c -d 1 -f "${1}" -a "${SC_AWS_ACCESS_KEY_PASSWORD}" -s "${SC_AWS_SECRET_KEY_PASSWORD}" -b "${SC_S3_BUCKET}" -k "${2}/" || \
    _exit_error "Unable to deploy artifact '${1}' to S3 location: ${SC_S3_BUCKET}/${2}"

    if [ -n "${SC_CONFIG_FILES-unset}" ]; then
     echo "There are no configuration files to deploy for ${2}"
    else
  s3put -a "${SC_AWS_ACCESS_KEY_PASSWORD}" -s "${SC_AWS_SECRET_KEY_PASSWORD}" -b "${SC_S3_BUCKET}" -k "${2}" -p 'source/' -g 'public-read' "${SC_CONFIG_FILES[@]}" || \
    _exit_error "Unable to deploy configuration files ${SC_CONFIG_FILES[@]} to S3 location: ${SC_S3_BUCKET}/${2}"
    fi
}

################################################################################
# Determine the set of needed configuration files. These are not bundled in the
# artifacts, as they are envionment-specific. Also, do not deploy the hosts.js
# file, as this file is also environment-specific.
################################################################################
SC_CONFIG_FILES=( $(find source/js/_config -type f | grep -Ev '/(README\.TXT|hosts\.js)$') )
echo "===== Configuration Files ======================================================"
for _F in "${SC_CONFIG_FILES[@]}" ; do echo "$_F" ; done

################################################################################
# Deploy the artifacts(s).
################################################################################
for SC_ARTIFACT in "${SC_ARTIFACTS[@]}"
do
  echo "===== Deploying Artifact ======================================================="
  echo "Artifact name: ${SC_ARTIFACT}"

  SC_ARTIFACT_VERSION="$(_tgz_entry_content "${SC_ARTIFACT}" '*/VERSION.TXT')"
  [[ -n "${SC_ARTIFACT_VERSION}" ]] || \
    _exit_error "Unable to determine artifact version."

  # Obtain the artifact-specific build information.
  eval "$(_tgz_entry_content "${SC_ARTIFACT}" '*/BUILD.TXT')"

  SC_S3_DEPLOY_KEY="${SC_S3_DEPLOY_KEY_PREFIX}/${SC_BRANCH_NAME}/${SC_ARTIFACT_VERSION}"

  # Deploy the artifact.
  echo "S3 key: ${SC_S3_BUCKET}/${SC_S3_DEPLOY_KEY}"
  _deploy_artifact "${SC_ARTIFACT}" "${SC_S3_DEPLOY_KEY}"

  SC_S3_DEPLOY_KEY="${SC_S3_DEPLOY_KEY_PREFIX}/${SC_BRANCH_NAME}/latest${SC_BUILD_SUFFIX}"
  SC_LATEST_CI_FILE_URL="http://s3.amazonaws.com/${SC_S3_BUCKET}/${SC_S3_DEPLOY_KEY}/CI.TXT"
  eval "$(curl -f "${SC_LATEST_CI_FILE_URL}" 2> /dev/null | sed 's%^SC_CI_%SC_CI_LATEST_%g')"

  echo "===== Deploying 'latest' Version ==============================================="
  echo "S3 key                : ${SC_S3_BUCKET}/${SC_S3_DEPLOY_KEY}"
  echo "Build number          : ${SC_BUILD_NUMBER}"
  echo "Deployed build number : ${SC_CI_LATEST_BUILD_NUMBER}"

  if [[ -z "${SC_CI_LATEST_BUILD_NUMBER}" || ( ${SC_CI_LATEST_BUILD_NUMBER} -le ${SC_BUILD_NUMBER} ) ]]
  then
    echo "This build will replace the deployed '${SC_S3_DEPLOY_KEY}' version."
    _deploy_artifact "${SC_ARTIFACT}" "${SC_S3_DEPLOY_KEY}"
  else
    echo "This is a re-run of a previous build, and will not be deployed to '${SC_S3_DEPLOY_KEY}'."
  fi

  if [[ ${SC_CREATE_JIRA_VERSION} -ne 0 ]]
  ############################################################################
  # Create a version in JIRA for this build.
  ############################################################################
  then
    echo "===== Create JIRA Version ======================================================"
    echo "Version: ${SC_ARTIFACT_VERSION}"
    createJiraVersion -k "${SC_JIRA_PROJECT_KEY}" -u "${SC_JIRA_USERNAME}" -p "${SC_JIRA_PASSWORD}" -n "${SC_ARTIFACT_VERSION}"
    SC_CREATE_VERSION_RESULT="${?}"

    # If the version creation encountered a communication error, error out.
    if [[ ${SC_CREATE_VERSION_RESULT} -ge 127 ]]
    then
      _exit_error "Unable to create JIRA version."
    fi
  fi
done
echo "================================================================================"
exit 0
