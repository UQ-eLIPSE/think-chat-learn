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

# Remove the directories then insert later
ssh $USER@$SERVER rm -rfv $SERVER_FOLDER/*
ssh $USER@$SERVER mkdir $SERVER_FOLDER/client
ssh $USER@$SERVER mkdir $SERVER_FOLDER/admin

# Copy config before building
cp "config/production/$2" config/Conf.ts
cp "../common/config/production/$2" "../common/config/Conf.ts"
cp "../client/config/production/$2" ../client/config/Conf.ts
cp "../client/envs/$2" ../client/.env.production

# Server
npm run build_server
scp -r ../build/* $USER@$SERVER:$SERVER_FOLDER
scp -r ../package.json $USER@$SERVER:$SERVER_FOLDER/server/package.json

# Client
npm run build_client
scp -r ../client/dist/* $USER@$SERVER:$STATIC_FOLDER

# Admin
npm run build_admin
scp -r ../admin/dist/* $USER@$SERVER:$ADMIN_FOLDER
# Unfortunately due to a dependency of the common folder
# We need to put in the name of the folder

ssh $USER@$SERVER "cd $SERVER_FOLDER/server && npm install --production"
ssh $USER@$SERVER "chmod 775 -R $SERVER_FOLDER/*"
