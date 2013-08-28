#!/bin/bash
# Provisioning script used to set the VAGRANT_USER value in the vagrant user's env.
BASHRC=/home/vagrant/.bashrc
BUILD_USERNAME="${1}"
echo "Setting build username to '${BUILD_USERNAME}'..."
sed -i -r "s/VAGRANT_USER='UNKNOWN'/VAGRANT_USER='"${BUILD_USERNAME}"'/g" "${BASHRC}"
