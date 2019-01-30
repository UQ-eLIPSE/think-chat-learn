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
# The path to the static folder
SERVER_FOLDER=/var/www/server
STATIC_FOLDER=/var/www/server/client
ADMIN_FOLDER=/var/www/server/admin
# Copy config before building
cp "config/production/$2" config/Conf.ts
cp "../common/config/production/$2" "../common/config/Conf.ts"
cp "../client/config/production/$2" ../client/config/Conf.ts
cp "../client/envs/$2" ../client/.env.production
npm run build_server
npm run build_client
npm run build_admin
ssh $USER@$SERVER rm -rfv $SERVER_FOLDER/*
ssh $USER@$SERVER mkdir $SERVER_FOLDER/client
ssh $USER@$SERVER mkdir $SERVER_FOLDER/admin
# Unfortunately due to a dependency of the common folder
# We need to put in the name of the folder
scp -r ../build/* $USER@$SERVER:$SERVER_FOLDER
scp -r ../package.json $USER@$SERVER:$SERVER_FOLDER/server/package.json
scp -r ../client/dist/* $USER@$SERVER:$STATIC_FOLDER
scp -r ../admin/dist/* $USER@$SERVER:$ADMIN_FOLDER
ssh $USER@$SERVER "cd $SERVER_FOLDER/server && npm install --production"
ssh $USER@$SERVER "chmod 775 -R $SERVER_FOLDER/*"
