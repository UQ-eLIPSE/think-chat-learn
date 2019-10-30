# MOOCchat (DeepConcepts project)

## Requirements
Node version 10.x
MongoDB v 4.x

## Setting up

1. Clone repo
2. Install Nodejs 10.x LTS and MongoDB
3. Start MongoDB, usually the command to run is `mongod`
4. Install the root-level/common packages `npm install`
5. Go to client `cd client` and install packages `npm install`
6. Go to admin `cd ../admin` and install the admin packages `npm install`
7. Go to admin `cd ../intermediate` and install the admin packages `npm install`

Quick command for installing everything:
`cd <project_root> && cd client && npm i && cd ../intermediate && npm i && cd ../admin && npm i && cd .. && npm i`

8. Change the config files for the common, admin, client and server. The configuration seems tedious but given the fact that there are actually three different SPAs 

#### Development configuration
Set up environment variables (Examples files included in repository.)
    /server/config/Conf.ts
    /common/config/Conf.ts

    /client/config/Conf.ts
    /client/.env.development
    /client/vue.config.js

    /admin/.env.development
    /admin/vue.config.js

    /intermediate/.env.development
    /intermediate/vue.config.js

#### Production configuration
Production configuration on `Confluence`.

## Building and Running (DeepConcepts)

1. Go to root directory
2. Run `npm run build` for production or `npm run build_dev` for dev
3. Run `npm run start`
4. If watchers are needed for client. `cd /client` and then `npm run build_dev_watch`
3. If watchers are needed for admin. `cd /admin` and then `npm run build_dev_watch`
4. If watchers are needed for intermediate. `cd /intermediate` and then `npm run build_dev_watch`

## Logging in through LTI
1. Go to https://ltilib.uqcloud.net/connector/ and set the URL as `http://localhost:<PORT_NUMBER>/user/login`
2. If you need to access a specific quiz, another parameter with key `custom_quizid` and value `<quiz_id>` needs to be added to the LTI form.

## Deploying

1. Go to server `cd server`
2. See relevant production/test configuration values from `Confluence`.
2. Run deploy script `./deploy.sh $some_user $some_server`

Note: If watchers are needed for admin. `cd ./admin` and then `npm run build_dev_watch`