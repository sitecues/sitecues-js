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

_update_version() {
	WORKSPACE_VERSION="${1}"
	echo "${WORKSPACE_VERSION}" > "${WORKSPACE_VERSION_FILE}"
}

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
	echo "  No   : (Default) Abort processing and exit the vangrant command"
	echo "  Yes  : Appply chanmges and trigger a hard reset"
	echo "  Skip : Skip the update (for example, you have already applied the changes)"

	RESULT=
	while [[ -z "${RESULT}" ]]
	do
		echo -n "Do you want to continue? [N|y|s]: "
		read -n 1 RESULT
		if [[ -z "${RESULT}" ]]
		then
			RESULT=n
		else
			echo
			RESULT=$(echo "${RESULT}" | tr '[:upper:]' '[:lower:]' | grep -E 'n|y|s')
		fi
	done

	case "${RESULT}" in
		y)
			echo "Updating git workspace:"
			(cd "${WORKSPACE_DIR}" && git rm --cached -r . && git reset --hard)
			if [[ ${?} -eq 0 ]]
			then
				echo "Git workspace update completed."
				_update_version 1
			else
				echo "Unable to successfully perform the update. Aborting." 1>&2
			fi
			;;
		s)
			echo "Skipping." 1>&2
			_update_version 1
			;;
		n)
			echo "Aborting. Please either commit or stash your changes and rerun this update." 1>&2
			exit 1
			;;
	esac
fi

exit 0
