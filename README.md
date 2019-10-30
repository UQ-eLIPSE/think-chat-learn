# MOOCchat (DeepConcepts project)

## Setting up

1. Clone repo
2. Install Nodejs 10.x LTS and MongoDB
3. Start MongoDB, usually the command to run is `mongod`
4. Install the root-level/common packages `npm install`
5. Go to client `cd client`
6. Install the client packages `npm install`
7. Go to admin `cd ../admin`
8. Install the admin packages `npm install`
9. Change the config files for the common, admin, client and server. Examples are provided.

## Building and Running (DeepConcepts)

1. Go to root directory
2. Run `npm run build` for production or `npm run build_dev` for dev
3. Run `npm run start`
4. If watchers are needed for client. `cd /client` and then `npm run build_dev_watch`
3. If watchers are needed for admin. `cd /admin` and then `npm run build_dev_watch`
3. If watchers are needed for intermediate. `cd /intermediate` and then `npm run build_dev_watch`


## Deploying

1. Go to server `cd server`
2. See relevant production/test configuration values from `Confluence`.
2. Run deploy script `./deploy.sh $some_user $some_server`

Note: If watchers are needed for admin. `cd ./admin` and then `npm run build_dev_watch`
