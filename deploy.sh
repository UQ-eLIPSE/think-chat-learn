#!/usr/bin/env bash


# Quit on error and if unset variables are referenced
set -e

# Fail if a command fails inside a pipe
set -o pipefail


################################################################################
# Help                                                                         #
################################################################################
Help()
{
   # Display Help
   echo "Builds and deploys Think.Chat.Learn to provided ZONE"
   echo
   echo "Usage: USER=<root/your username> ZONE=<zone_name>.zones.eait.uq.edu.au KEYFILE=<path_to_ssh_key> ./deploy.sh"
   echo -e "\n"
   echo "Environment variables:"
   echo "USER          The user deploying TCL"
   echo "ZONE          Zone where TCL has to be deployed"
   echo "KEYFILE       Local path to ssh key used for ssh"
   echo -e "\n"
   echo "Options:"
   echo "h | --help    Print this help"
   echo
}

if [ "$1" == "-h" ] || [ "$1" == "--help" ]; then
  Help
  exit 0
fi

################################################################################
# Main program                                                                 #
################################################################################

if [[ -z "${USER}" ]]; then
  Help
  exit 1
fi

if [[ -z "${ZONE}" ]]; then
  Help
  exit 1
fi


########################
# BUILD STEP WITH DOCKER
########################
TEMP="__deploy"

# Remove old deploy dist files
rm -rf "./$TEMP/"

TCL_USER=${USER} TCL_SERVER=${ZONE} docker-compose -f docker-compose.deploy.yml up --build --exit-code-from deploy
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
USER="${USER}"
SERVER="${ZONE}"
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

  echo -e "Installing server dependencies"
  ssh $USER@$SERVER -t "cd $REMOTE_ROOT/server && yarn"
else
  ssh -i "$SSH_KEYFILE" -t $USER@$SERVER "[ -d $REMOTE_ROOT ] && sudo cp -R $REMOTE_ROOT $REMOTE_BACKUP_FOLDER && sudo rm -rfv $REMOTE_ROOT && sudo mkdir -m775 $REMOTE_ROOT && sudo chgrp sysadmin $REMOTE_ROOT"
  # # Copy built files to server
  echo -e "Copying built files to server"
  scp -i "$SSH_KEYFILE" -r $TEMP/* $USER@$SERVER:$REMOTE_ROOT/  

  echo -e "Installing server dependencies"
  ssh -i "$SSH_KEYFILE" $USER@$SERVER -t "cd $REMOTE_ROOT/server && yarn"
fi

echo -e "App is ready to be deployed. To deploy, run sudo systemctl daemon-reload && sudo service <service-name> restart"