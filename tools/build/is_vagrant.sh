#!/bin/bash
# Determines whether of not this is a vagrant VM.
RESULT=0
if [[ -n "${IS_VAGRANT}" ]]
then
	RESULT="${IS_VAGRANT}"
fi
echo "${RESULT}"
