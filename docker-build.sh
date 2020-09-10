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

USER="${TCL_USER}"
SERVER="${TCL_SERVER}"

########################
# SET UP VARIABLES
########################

# Navigate to directory
DOCKER_ROOT=${DOCKER_ROOT}

# Temporary local deploy folder name
TEMP="$DOCKER_ROOT/__deploy"


NODE_VERSION="$(node -v)"

# Deployment mode
# `production` or `development`
MODE=production

# Application root on remote server
REMOTE_ROOT=/var/www/server

# Server directory
SERVER_FOLDER=server

# SPA's
CLIENT_FOLDER=client
ADMIN_FOLDER=admin
INTERMEDIATE_FOLDER=intermediate

# Common
COMMON_FOLDER=common



# Current revision information
CURRENT_COMMIT="\nBranch: $(git rev-parse --abbrev-ref HEAD) \n\
Commit SHA: $(git rev-parse HEAD)\n\
Deployed by: $USER \n\
On: $(date)\n"

######################################
# BACK UP ORIGINAL LOCAL CONFIGURATION
######################################

##############
# INSTALL DEPS
##############
cd "$DOCKER_ROOT"
cd "$COMMON_FOLDER" && yarn
cd "../$SERVER_FOLDER" && yarn 
cd "../$CLIENT_FOLDER" && yarn 
cd "../$ADMIN_FOLDER" && yarn 
cd "../$INTERMEDIATE_FOLDER" && yarn 


#######
# BUILD
#######
echo -e "Building and deploying using node $NODE_VERSION"

# Remove previously built files
# rm -rf $TEMP/

# Create local directory for deployment
mkdir "$TEMP/$CLIENT_FOLDER" "$TEMP/$ADMIN_FOLDER" "$TEMP/$INTERMEDIATE_FOLDER" "$TEMP/$SERVER_FOLDER"

# Server
echo -e "Building server"

cd "$DOCKER_ROOT/$SERVER_FOLDER"
yarn run build_server_main
cp -r build/* "$TEMP/"
# Need this on production ?

cp "$DOCKER_ROOT/$SERVER_FOLDER/package.json" "$TEMP/$SERVER_FOLDER/package.json"

# Client
echo -e "Building client SPA"

cd "$DOCKER_ROOT/$CLIENT_FOLDER"
yarn run build
cp -r dist/* "$TEMP/$CLIENT_FOLDER/"

# Admin
echo -e "Building admin SPA"

cd "$DOCKER_ROOT/$ADMIN_FOLDER"
yarn run build
cp -r dist/* "$TEMP/$ADMIN_FOLDER/"

# Intermediate
echo -e "Building Intermediate SPA"

cd "$DOCKER_ROOT/$INTERMEDIATE_FOLDER"
yarn run build
cp -r dist/* "$TEMP/$INTERMEDIATE_FOLDER/"



######################################
# RESTORE ORIGINAL LOCAL CONFIGURATION
# (since build process is complete)
######################################
cd "$DOCKER_ROOT"

echo -e "Logging deployment information"
echo -e "$CURRENT_COMMIT" > $TEMP/README.txt
