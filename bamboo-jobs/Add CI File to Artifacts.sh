#!/bin/bash
set -e

################################################################################
# Settings.
################################################################################
SC_CI_FILE="${bamboo.CI_FILE}"
SC_BUILD_DATA_FILE="${bamboo.BUILD_DATA_FILE}"

################################################################################
# Helper functions.
################################################################################
_exit_error() {
  [[ $# -ge 1 ]] && echo "ERROR: $1" 1>&2
  exit 1
}

################################################################################
# Populate the build data.
################################################################################
. "${SC_BUILD_DATA_FILE}"

################################################################################
# Determine the created artifacts.
################################################################################
SC_ARTIFACTS=( $(ls target/sitecues-js*.tgz | sort) )
if [[ ${#SC_ARTIFACTS[@]} -eq 0 ]]
then
  _exit_error "No artifacts found for version: ${SC_VERSION}"
fi

################################################################################
# Update the build data file with the artifact names.
################################################################################
echo "SC_ARTIFACTS=( ${SC_ARTIFACTS[@]} )" >> "${SC_BUILD_DATA_FILE}"

################################################################################
# Add the CI data file to the artifacts.
################################################################################
SC_CI_FILE_DIR="$(dirname "${SC_CI_FILE}")/"
for SC_ARTIFACT in "${SC_ARTIFACTS[@]}"
do
  SC_ARTIFACT_TAR="$(echo "${SC_ARTIFACT}" | sed 's%tgz$%tar%g')"
  SC_ARCHIVE_ROOT_DIR="$(tar -ztf "${SC_ARTIFACT}" | head -n 1 | sed 's%/.*%%g')/"
  gunzip "${SC_ARTIFACT}"
  tar rf "${SC_ARTIFACT_TAR}" --xform "s%${SC_CI_FILE_DIR}%${SC_ARCHIVE_ROOT_DIR}%gx" "${SC_CI_FILE}"
  gzip "${SC_ARTIFACT_TAR}"
  mv "${SC_ARTIFACT_TAR}.gz" "${SC_ARTIFACT}"
done
