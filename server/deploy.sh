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

########################

# Current revision information
CURRENT_COMMIT="\nBranch: $(git rev-parse --abbrev-ref HEAD) \n\
Commit SHA: $(git rev-parse HEAD)\n\
Deployed by: $USER \n\
On: $(date)\n"

echo -e "Building and deploying MOOCchat using node $NODE_VERSION"

# Remove previously built files
rm -rf ./$TEMP

# Create local directory for deployment
mkdir "$TEMP" "$TEMP/$STATIC_FOLDER" "$TEMP/$ADMIN_FOLDER" "$TEMP/$INTERMEDIATE_FOLDER"

# Copy config before building
cp "config/production/$SERVER" config/Conf.ts
cp "../common/config/production/$SERVER" ../common/config/Conf.ts
cp "../client/config/production/$SERVER" ../client/config/Conf.ts

# Set environment files based on deployment address
cp "../client/envs/$SERVER" "../client/.env.$MODE"
cp "../admin/envs/$SERVER" "../admin/.env.$MODE"
cp "../intermediate/envs/$SERVER" "../intermediate/.env.$MODE"

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

echo -e "Logging deployment information"
echo -e "$CURRENT_COMMIT" > $TEMP/README.txt

# Remove existing directories on the server
echo -e "Removing existing directories"

ssh $USER@$SERVER "mkdir -p $APP_ROOT && rm -rfv $APP_ROOT/*"

echo -e "Copying built files to server"

# Copy built files to server
scp -r $TEMP/* $USER@$SERVER:$APP_ROOT/

# Unfortunately due to a dependency of the common folder
# We need to put in the name of the folder
echo -e "Installing server dependencies"

ssh $USER@$SERVER "cd $APP_ROOT/server && npm install --production && sudo chmod 775 -R $APP_ROOT"
