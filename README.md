# MoocChat

## Setting up

See `Notes for build on zones` below as well if you're running MOOCchat on zones (e.g. webproject/2.0.4).

1. Clone repo
2. Install Nodejs and MongoDB
3. Start Mongodb, usually the command to run is `mongod`
4. Run `npm install` from within Moocchat folder
5. Seed the database by running `npm run seed` (only needs to be done once)
6. Build source: `npm run build`
7. Ensure `/config/conf.json` file has correct configuration
8. Run `npm start`

## Notes for build on zones

Because our zones run Solaris/SunOS/SmartOS which has limited support by some packages, you will need to do the following:

* Install Sass on the system instead of using the "node-sass" package:
  * `sudo pkgin install ruby212-sass-3.2.15`
* When building, use the `~_on_zone` suffixed npm scripts. For example:
  * `npm run build` becomes `npm run build_on_zone`
  * `npm run build_client` becomes `npm run build_client_on_zone`

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
To run the database tests, run `npm run db_test`, if the tests don't run make sure to run `npm install` to pull down the test runner dependencies.

## Important notes
* Mongodb must be running before starting `npm start`
