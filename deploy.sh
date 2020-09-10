#!/usr/bin/env bash

# Quit on error and if unset variables are referenced
set -eu

# Fail if a command fails inside a pipe
set -o pipefail

if [[ -z "${TCL_USER}" ]]; then
  echo "Expected user and server as a parameter (e.g. 'username server_to_point_to')"
  exit 1
fi

if [[ -z "${TCL_SERVER}" ]]; then
  echo "Expected user and server as a parameter (e.g. 'username server_to_point_to')"
  exit 1
fi


########################
# BUILD STEP WITH DOCKER
########################
TEMP="__deploy"

# Remove old deploy dist files
rm -rf "./$TEMP/"

TCL_USER=${TCL_USER} TCL_SERVER=${TCL_SERVER} docker-compose -f docker-compose.deploy.yml up --build --exit-code-from deploy
rc=$?;
echo "$rc"
if [[ $rc != 0 ]]; then
  echo "Docker build failed"
  exit 1
fi

########################
# REMOTE COMMANDS
########################
# The server to deploy to
USER="${TCL_USER}"
SERVER="${TCL_SERVER}"
SSH_KEYFILE="${KEYFILE}"
# Application root on remote server
REMOTE_ROOT=/var/www/server

REMOTE_BACKUP_FOLDER="$REMOTE_ROOT-BACKUP-$(date +%s)"

echo -e "\nBacking up in folder $REMOTE_BACKUP_FOLDER ..."
echo -e "\nCreating new folder $REMOTE_ROOT"

if [[ -z "$SSH_KEYFILE" ]]; then
  ssh -t $USER@$SERVER "[ -d $REMOTE_ROOT ] && sudo cp -R $REMOTE_ROOT $REMOTE_BACKUP_FOLDER && sudo rm -rfv $REMOTE_ROOT && sudo mkdir -m775 $REMOTE_ROOT && sudo chgrp sysadmin $REMOTE_ROOT"
  # # Copy built files to server
  echo -e "Copying built files to server"
  scp -r $TEMP/* $USER@$SERVER:$REMOTE_ROOT/  
  ssh $USER@$SERVER -t "cd $REMOTE_ROOT/server && yarn"
else
  ssh -i "$SSH_KEYFILE" -t $USER@$SERVER "[ -d $REMOTE_ROOT ] && sudo cp -R $REMOTE_ROOT $REMOTE_BACKUP_FOLDER && sudo rm -rfv $REMOTE_ROOT && sudo mkdir -m775 $REMOTE_ROOT && sudo chgrp sysadmin $REMOTE_ROOT"
  # # Copy built files to server
  echo -e "Copying built files to server"
  scp -i "$SSH_KEYFILE" -r $TEMP/* $USER@$SERVER:$REMOTE_ROOT/  
  ssh -i "$SSH_KEYFILE" $USER@$SERVER -t "cd $REMOTE_ROOT/server && yarn"
fi
# Remove existing directories on the server
# echo -e "Removing existing directories on $SERVER"

# REMOTE_BACKUP_FOLDER="$REMOTE_ROOT-BACKUP-$(date +%s)"
# echo -e "\nBacking up in folder $REMOTE_BACKUP_FOLDER ..."
# echo -e "\nCreating new folder $REMOTE_ROOT"
# ssh -t $USER@$SERVER "[ -d $REMOTE_ROOT ] && sudo cp -R $REMOTE_ROOT $REMOTE_BACKUP_FOLDER && sudo rm -rfv $REMOTE_ROOT && sudo mkdir -m775 $REMOTE_ROOT && sudo chgrp sysadmin $REMOTE_ROOT"

# echo -e "Copying built files to server"

# # Copy built files to server
# scp -r $TEMP/* $USER@$SERVER:$REMOTE_ROOT/

# echo -e "Installing server dependencies"

# ssh $USER@$SERVER -t "cd $REMOTE_ROOT/server && yarn"

# echo -e "App is ready to be deployed. To deploy, run sudo systemctl daemon-reload && sudo service <service-name> restart"