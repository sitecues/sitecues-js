#!/bin/bash
# Determines the name of the user for this run, accounting for the possible use of vagrant and sudo.
CONVERT=0
if [[ "${1}" = '-c' ]]
then
	CONVERT=1
fi

CURRENT_USERNAME="UNKNOWN"
if [[ -n "${VAGRANT_USER}" ]]
then
	CURRENT_USERNAME="${VAGRANT_USER}"
elif [[ -n "${SUDO_USER}" ]]
then
	CURRENT_USERNAME="${SUDO_USER}"
elif [[ -n "${USER}" ]]
then
	CURRENT_USERNAME="${USER}"
elif [[ -n "${LOGNAME}" ]]
then
	CURRENT_USERNAME="${LOGNAME}"
fi

if [[ ${CONVERT} -eq 1 ]]
then
	CURRENT_USERNAME="$(echo "${CURRENT_USERNAME}" | tr '[:lower:]' '[:upper:]')"
fi
echo "${CURRENT_USERNAME}"
