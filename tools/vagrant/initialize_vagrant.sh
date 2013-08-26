#!/bin/bash
# This script preforms some basic workspace initialization for vagrant.
ROOT_DIR=$(cd $(dirname "${0}") && pwd)
WORKSPACE_DIR=$(cd "${ROOT_DIR}/../.." && pwd)
INIT_VERSION_FILE="${ROOT_DIR}/.vagrant-init-ver"
INIT_VERSION=

if [[ -s "${INIT_VERSION_FILE}" ]]
then
	INIT_VERSION=$(cat "${INIT_VERSION_FILE}")
fi

if [[ -z "${INIT_VERSION}" ]]
then
	INIT_VERSION=0
fi

if [[ ${INIT_VERSION} -lt 1 ]]
then
	# Make sure the .gitattributes file is processed
	echo "Ensuring the directives in .gitattributes are processed..."
	RESULT=

	while [[ -z "${RESULT}" ]]
	do
		echo -n "This process will trigger a hard reset of your workspace. Do you want to continue? [y|N]: "
		read -n 1 RESULT
		if [[ -z "${RESULT}" ]]
		then
			RESULT=n
		else
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
			echo "Unable to perform update. Aborting." 1>&2
		else
			INIT_VERSION=1
			echo "${INIT_VERSION}" > "${INIT_VERSION_FILE}"
		fi
	fi
fi

exit 0
