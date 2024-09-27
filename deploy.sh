#!/usr/bin/env bash

# Quit on error
set -e

# Fail if a command fails inside a pipe
set -o pipefail


################################################################################
# Help and environment variables check                                         #
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
    echo "KEYFILE       Path to ssh key. Not required if ssh agent is configured appropriately. If no ssh key is available, password will have to be entered interactively for user USER."
    echo -e "\n"
    echo "Options:"
    echo "h | --help    Print this help"
    echo
}

if [ "$1" == "-h" ] || [ "$1" == "--help" ]; then
    Help
    exit 0
fi

if [[ -z "${USER}" ]]; then
    Help
    exit 1
fi

if [[ -z "${ZONE}" ]]; then
    Help
    exit 1
fi


################################################################################
# Main program                                                                 #
################################################################################



##########################
# Build step with Docker #
##########################
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
# Remote Logic         #
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

ssh \
  ${SSH_KEYFILE:+ -i "$SSH_KEYFILE"} \
  -t $USER@$SERVER "[ -d $REMOTE_ROOT ] && sudo cp -R $REMOTE_ROOT $REMOTE_BACKUP_FOLDER && sudo rm -rfv $REMOTE_ROOT && sudo mkdir -m775 $REMOTE_ROOT && sudo chgrp sysadmin $REMOTE_ROOT"

## Copy built files to server
echo -e "Copying built files to server"

scp \
  ${SSH_KEYFILE:+ -i "$SSH_KEYFILE"} \
  -r $TEMP/* $USER@$SERVER:$REMOTE_ROOT/

echo -e "Installing server dependencies"

ssh \
  ${SSH_KEYFILE:+ -i "$SSH_KEYFILE"} \
  $USER@$SERVER -t "cd $REMOTE_ROOT/server && npm i"


echo -e "\n\n######################\n# App is ready to be deployed.\n# To deploy, run sudo systemctl daemon-reload && sudo service tcl restart\n######################"