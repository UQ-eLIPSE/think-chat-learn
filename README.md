# Think.Chat.Learn

## Project components

### Client-side
* `client` - Vue + TypeScript SPA
* `admin` - Vue + TypeScript SPA
* `intermediate` - Vue + TypeScript SPA

### Server
* `server` - Node js + Express + TypeScript application

---
## Local Development

### Requirements (development)
Docker

### Steps to set up locally

1. Clone repo `think-chat-learn` and checkout desired branch
2. Setup configuration files - (copy example files and rename)
    * server.env (server.env.example)
    * common.env (common.env.example)

3. Run `docker-compose up` from project root

---
## Deployment

### Server Pre-Requisites (production)
* Packages should be present
    * Node v12.x
    * MongoDB v4.x
* Nginx configuration
* SystemD service setup
* Manta key available in `/var/www`

### Local Requirements
* Docker


### Deploy using script

1. Clone repo `think-chat-learn` and checkout desired branch
2. Setup configuration files
    * server.env (get values from Confluence)
    * common.env (get values from Confluence)

3. Run deploy script
    * ```TCL_USER=root TCL_SERVER=<zone_name>.zones.eait.uq.edu.au KEYFILE=~/.ssh/id_rsa ./deploy.sh```
    * Note: If no `KEYFILE` is provided, password will have to be entered for the user interactively


---
## Usage
### Logging in through LTI connector
1. Go to https://ltilib.uqcloud.net/connector/ and set the URL as `http://localhost:<PORT_NUMBER>/user/login`
2. If you need to access a specific quiz, another parameter with key `custom_quizid` and value `<quiz_id>` needs to be added to the LTI form.

### End to End Testing with Cypress
Run `yarn test` from `client`, `admin` or `intermediate` folders to run cypress test suite.

### Deploying on production / test zone

Deployment steps and configurations on `Confluence`.


## Testing

### E2E using Cypress

Navigate to the FE app docker containers `client`, `admin` or `intermediate`. To test: -

`yarn run test:e2e`