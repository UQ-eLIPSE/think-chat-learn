#!/usr/bin/env bash
#

# Quit on error and if unset variables are referenced
set -eu

# Fail if a command fails inside a pipe
set -o pipefail

if [ $# -eq 0 ]; then
    echo "Expected user and server as a parameter (e.g. 'username server_to_point_to')"
    exit 1
fi

# The server and to deploy to
USER=$1
SERVER=$2
# The path to the static folder
# Note that htdocs should be the end point
STATIC_FOLDER=/var/www/server/client
cp "config/production/$2" .env.production
npm run build
ssh $USER@$SERVER rm -rfv $STATIC_FOLDER/*
scp -r dist/* $USER@$SERVER:$STATIC_FOLDER
ssh $USER@$SERVER "chmod 775 -R $STATIC_FOLDER/*"
