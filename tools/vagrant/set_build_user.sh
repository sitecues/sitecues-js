#!/bin/bash
# Provisioning script used to add the VAGRANT_USER var to the vagrant user's env.
BASHRC=/home/vagrant/.bashrc
BUILD_USERNAME="${1}"

grep -q VAGRANT_USER "${BASHRC}"
if [[ $? -eq 1 ]]
then
	echo "Setting build username to '${BUILD_USERNAME}'..."
	cat >> "${BASHRC}" <<EOF

# Set the build user name.
export VAGRANT_USER='${BUILD_USERNAME}'
EOF
fi
