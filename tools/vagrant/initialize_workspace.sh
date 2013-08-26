#!/bin/bash
# This script preforms some basic workspace initialization for vagrant.
ROOT_DIR=$(cd $(dirname "${0}") && pwd)
WORKSPACE_DIR=$(cd "${ROOT_DIR}/../.." && pwd)
VAGRANT_DIR="${WORKSPACE_DIR}/.vagrant"
VAGRANT_WORKSPACE_DIR="${VAGRANT_DIR}/workspace"
WORKSPACE_VERSION_FILE="${VAGRANT_WORKSPACE_DIR}/version.txt"

mkdir -p "${VAGRANT_WORKSPACE_DIR}"
touch "${WORKSPACE_VERSION_FILE}"
WORKSPACE_VERSION=$(cat "${WORKSPACE_VERSION_FILE}")

if [[ -z "${WORKSPACE_VERSION}" ]]
then
	WORKSPACE_VERSION=0
fi

if [[ ${WORKSPACE_VERSION} -lt 1 ]]
then
	# Make sure the .gitattributes file is processed
	echo "Ensuring the directives in .gitattributes are processed."
	echo "This process will trigger a hard reset of your workspace. If you have any"
	echo "unsaved changes, answer 'n' and either commit or stash your changes."

	RESULT=
	while [[ -z "${RESULT}" ]]
	do
		echo -n "Do you want to continue? [y|N]: "
		read -n 1 RESULT
		if [[ -z "${RESULT}" ]]
		then
			RESULT=n
		else
			echo
			RESULT=$(echo "${RESULT}" | tr '[:upper:]' '[:lower:]' | grep -E 'n|y')
		fi
	done

	if [[ "${RESULT}" = "n" ]]
	then
		echo "Aborting. Please either commit or stash your changes and rerun this update." 1>&2
		exit 1
	else
		echo "Updating git workspace:"
		(cd "${WORKSPACE_DIR}" && git rm --cached -r . && git reset --hard)
		if [[ ${?} -eq 0 ]]
		then
			echo "Git workspace update completed."
			WORKSPACE_VERSION=1
			echo "${WORKSPACE_VERSION}" > "${WORKSPACE_VERSION_FILE}"
		else
			echo "Unable to perform update. Aborting." 1>&2
		fi
	fi
fi

exit 0
