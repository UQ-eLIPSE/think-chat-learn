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
* Docker (recommended memory for Docker: 4GB)

### Steps to set up locally

1. Clone repo `think-chat-learn` and checkout desired branch
2. Setup configuration files - (copy example files and rename)
    * server.env (server.env.example)
    * common.env (common.env.example)

3. Run `docker-compose up` from project root


---

## Log into TCL
### Log in through LTI connector
1. Go to https://ltilib.uqcloud.net/connector/ and set the URL as `http://localhost:<PORT_NUMBER>/user/login`
2. To access the instructor view, make sure the role is "instructor"
3. If you need to access a specific quiz, another parameter with key `custom_quizid` and value `<quiz_id>` needs to be added to the LTI form.

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
* Docker (recommended memory for Docker: 4GB)


### Deploy using script

1. Clone repo `think-chat-learn` and checkout desired branch
2. Setup configuration files
    * server.env (get values from Confluence)
    * common.env (get values from Confluence)

3. Run deploy script
    * Run `./deploy -h` for help
        * Usage:
            * ```USER=root ZONE=<zone_name>.zones.eait.uq.edu.au KEYFILE=~/.ssh/id_rsa ./deploy.sh```
                * Note: If no `KEYFILE` is provided, password will have to be entered for the user interactively



---
## Appendix

### Testing

#### Server
* `jest` package is used for testing the server.
* Run command in server container `server-app` (`docker-compose` should be running)
    * `docker exec -it server-app /bin/bash -c "yarn test"`

#### Client-side Vue Apps (`client`, `admin`, `intermediate`) using Cypress

##### ** Running Cypress E2E testing with Docker seems problematic and will require additional investigation (it requires X11 and complicated dependencies)

