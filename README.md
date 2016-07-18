# MoocChat

## Setting up

1. Clone repo
2. Install Nodejs and MongoDB
3. Start Mongodb, usually the command to run is `mongod`
4. Run `npm install` from within Moocchat folder
5. Seed the database by running `npm run seed` (only needs to be done once)
6. Build source: `npm run build`
7. Ensure `/config/conf.json` file has correct configuration
8. Run `npm start`

## Compiling code
Code must now be compiled prior to running the server or serving the client.

* `npm run build_client` builds client code;
* `npm run build_server` builds server code;
* `npm run build` runs a clean before building both above.

Where a clean of compiled code is needed, run `npm run clean`.

## Logging in & bypassing LTI verification on dev/test machines
Since MOOCchat now uses LTI for log ins, the LTI requests must be faked to initiate a MOOCchat session.
To do this, LTI test mode must be enabled. This will enable a manual launch page and disables LTI verification checks (e.g. signatures).

* Change `config/conf.json` -> `lti.testMode` to `true`.
* Go to the URL `/lti-launch`. By default, you should submit via. "lti.php" which emulates what Blackboard would do, but you are also able to force trigger the standard or backup queue clients.

## Running tests
Ensure mongo is running; then run `npm run tests`.

This will first build the project before running the relevant tests.

### Tests available
* /models/* (incomplete)
* database^
* server^
* util^

Those marked [^] are tests written before the MOOCchat rewrite for older code. Failures are to be expected.

## Important notes
* Mongodb must be running before starting `npm start`
