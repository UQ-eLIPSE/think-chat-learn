#!/usr/bin/env bash

# Quit on error and if unset variables are referenced
set -eu

# Fail if a command fails inside a pipe
set -o pipefail

if [ $# -eq 0 ]; then
    echo "Expected user and server as a parameter (e.g. 'username server_to_point_to')"
    exit 1
fi

########################
# SET UP VARIABLES
########################

# The server to deploy to
USER=$1
SERVER=$2

NODE_VERSION="$(node -v)"

# Deployment mode
# `production` or `development`
MODE=production

# Application root on remote server
APP_ROOT=/var/www/server

# Server directory
SERVER_FOLDER=server

# SPA's
STATIC_FOLDER=client
ADMIN_FOLDER=admin
INTERMEDIATE_FOLDER=intermediate

# Temporary local deploy folder name
TEMP=__deploy

# Current revision information
CURRENT_COMMIT="\nBranch: $(git rev-parse --abbrev-ref HEAD) \n\
Commit SHA: $(git rev-parse HEAD)\n\
Deployed by: $USER \n\
On: $(date)\n"

######################################
# BACK UP ORIGINAL LOCAL CONFIGURATION
######################################

# Copy local config before building (if exists)
[ -f "config/Conf.ts" ] && cp config/Conf.ts config/temp.Conf.ts
[ -f "../common/config/Conf.ts" ] && cp ../common/config/Conf.ts ../common/config/temp.Conf.ts
[ -f "../client/config/Conf.ts" ] && cp ../client/config/Conf.ts ../client/config/temp.Conf.ts
[ -f "../client/.env.$MODE" ] && cp "../client/.env.$MODE" "../client/temp.env.$MODE"
[ -f "../admin/.env.$MODE" ] && cp "../admin/.env.$MODE" "../admin/temp.env.$MODE"
[ -f "../intermediate/.env.$MODE" ] && cp "../intermediate/.env.$MODE" "../intermediate/temp.env.$MODE"

# Set environment files based on deployment address
cp "config/production/$SERVER" config/Conf.ts
cp "../common/config/production/$SERVER" ../common/config/Conf.ts
cp "../client/config/production/$SERVER" ../client/config/Conf.ts
cp "../client/envs/$SERVER" "../client/.env.$MODE"
cp "../admin/envs/$SERVER" "../admin/.env.$MODE"
cp "../intermediate/envs/$SERVER" "../intermediate/.env.$MODE"

#######
# BUILD
#######
echo -e "Building and deploying MOOCchat using node $NODE_VERSION"

# Remove previously built files
rm -rf ./$TEMP

# Create local directory for deployment
mkdir "$TEMP" "$TEMP/$STATIC_FOLDER" "$TEMP/$ADMIN_FOLDER" "$TEMP/$INTERMEDIATE_FOLDER"

# Server
echo -e "Building server"

npm run build_server
cp -r ../build/* "$TEMP"
cp ../package.json "$TEMP/server/package.json"

# Client
echo -e "Building client SPA"

npm run build_client
cp -r ../client/dist/* "$TEMP/$STATIC_FOLDER"

# Admin
echo -e "Building admin SPA"
npm run build_admin
cp -r ../admin/dist/* "$TEMP/$ADMIN_FOLDER"


# Intermediate
echo -e "Building backup queue intermediate SPA"

npm run build_intermediate
cp -r ../intermediate/dist/* "$TEMP/$INTERMEDIATE_FOLDER"

######################################
# RESTORE ORIGINAL LOCAL CONFIGURATION
# (since build process is complete)
######################################

echo -e "\nRestore all original local config ...\n"

mv config/temp.Conf.ts config/Conf.ts
mv ../client/config/temp.Conf.ts ../client/config/Conf.ts
mv ../common/config/temp.Conf.ts ../common/config/Conf.ts

mv "../client/temp.env.$MODE" "../client/.env.$MODE"
mv "../admin/temp.env.$MODE" "../admin/.env.$MODE"
mv "../intermediate/temp.env.$MODE" "../intermediate/.env.$MODE"


echo -e "Logging deployment information"
echo -e "$CURRENT_COMMIT" > $TEMP/README.txt

########################
# REMOTE COMMANDS
########################

# Remove existing directories on the server
echo -e "Removing existing directories on $SERVER"

REMOTE_BACKUP_FOLDER="$APP_ROOT-BACKUP-$(date +%s)"
echo -e "\nBacking up in folder $REMOTE_BACKUP_FOLDER ..."
echo -e "\nCreating new folder $APP_ROOT"
ssh -t $USER@$SERVER "[ -d $APP_ROOT ] && sudo cp -R $APP_ROOT $REMOTE_BACKUP_FOLDER && sudo rm -rfv $APP_ROOT && sudo mkdir -m775 $APP_ROOT && sudo chgrp sysadmin $APP_ROOT"

echo -e "Copying built files to server"

# Copy built files to server
scp -r $TEMP/* $USER@$SERVER:$APP_ROOT/

echo -e "Installing server dependencies"

ssh $USER@$SERVER -t "cd $APP_ROOT/server && npm install --production"
