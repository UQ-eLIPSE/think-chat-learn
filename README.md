# Think.Chat.Learn

## Project components

### Client-side
* `client` - Vue SPA
* `admin` - Vue SPA
* `intermediate` - Vue SPA

## Requirements (development)
Docker

## Requirements (production)
Node v12.x
MongoDB v4.x

## Setting up

1. Clone repo `think-chat-learn`
2. Setup configuration files (See "Development Configuration" section below)

### Install components
Installation is automatically handled by `Dockerfile`s present in `/client`, `/intermediate`, `/server`, `/admin`

#### Development configuration
Set up environment and configuration files (Examples files included in repository.)
    /server/config/Conf.ts (make a copy of /server/config/Conf.ts.example)
    /common/config/Conf.ts

#### Production configuration
Production configuration on `Confluence`.

## Building and Running locally

### Docker
(Make sure Development configuration is set up before proceeding)

From project root, run `docker-compose up`

## Logging in through LTI
1. Go to https://ltilib.uqcloud.net/connector/ and set the URL as `http://localhost:<PORT_NUMBER>/user/login`
2. If you need to access a specific quiz, another parameter with key `custom_quizid` and value `<quiz_id>` needs to be added to the LTI form.

## End to End Testing with Cypress
Run `yarn test` from `client`, `admin` or `intermediate` folders to run cypress test suite.

## Deploying on production / test zone

Deployment steps and configurations on `Confluence`.


# Testing

## E2E using Cypress

Navigate to the FE app docker containers `client`, `admin` or `intermediate`. To test: -

`yarn run test:e2e`