#!/usr/bin/env bash

# Quit on error and if unset variables are referenced
set -eu

# Fail if a command fails inside a pipe
set -o pipefail

if [ $# -eq 0 ]; then
    echo "Expected user and server as a parameter (e.g. 'username server_to_point_to')"
    exit 1
fi

# The server to deploy to
USER=$1
SERVER=$2

# Current revision information
CURRENT_COMMIT="\nBranch: $(git rev-parse --abbrev-ref HEAD) \n\
Commit SHA: $(git rev-parse HEAD)\n\
Deployed by: $USER \n\
On: $(date)\n"

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

rm -rf ./$TEMP

# Create local directory for deployment
mkdir "$TEMP" "$TEMP/$STATIC_FOLDER" "$TEMP/$ADMIN_FOLDER" "$TEMP/$INTERMEDIATE_FOLDER"

# Copy config before building
cp "config/production/$2" config/Conf.ts
cp "../common/config/production/$2" ../common/config/Conf.ts
cp "../client/config/production/$2" ../client/config/Conf.ts

# Set environment files based on deployment address
cp "../client/envs/$2" "../client/.env.$MODE"
cp "../admin/envs/$2" "../admin/.env.$MODE"
cp "../intermediate/envs/$2" "../intermediate/.env.$MODE"

# Server
echo -e "\nBuilding server ...\n"
npm run build_server
cp -r ../build/* "$TEMP"
cp ../package.json "$TEMP/server/package.json"

# Client
echo -e "\nBuilding client SPA ...\n"
npm run build_client
cp -r ../client/dist/* "$TEMP/$STATIC_FOLDER"

# Admin
echo -e "\nBuilding admin panel SPA ...\n"
npm run build_admin
cp -r ../admin/dist/* "$TEMP/$ADMIN_FOLDER"


# Intermediate
echo -e "\n\nBuilding backup queue intermediate SPA ...\n"
npm run build_intermediate
cp -r ../intermediate/dist/* "$TEMP/$INTERMEDIATE_FOLDER"


echo -e "\n\nLogging deployment information ..."
echo -e "$CURRENT_COMMIT" > $TEMP/README.txt

# Remove existing directories on the server
echo -e "\n\nRemoving existing directories ...\n"
ssh $USER@$SERVER "mkdir -p $APP_ROOT && rm -rfv $APP_ROOT/*"

echo -e "\n\nCopying built files to server ...\n"
# Copy built files to server
scp -r $TEMP/* $USER@$SERVER:$APP_ROOT/

# Unfortunately due to a dependency of the common folder
# We need to put in the name of the folder
echo -e "Installing server dependencies ..."
ssh $USER@$SERVER "cd $APP_ROOT/server && npm install --production && chmod 775 -R $APP_ROOT"
