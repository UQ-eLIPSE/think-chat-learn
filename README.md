# MoocChat

## Setting up

See `Notes for build on zones` below as well if you're running MOOCchat on zones (e.g. webproject/2.0.4).

1. Clone repo
2. Install Nodejs and MongoDB
3. Start Mongodb, usually the command to run is `mongod`
4. Run `npm install` from within Moocchat folder
5. Seed the database by running `npm run seed` (only needs to be done once)
6. Build source: `npm run build`
7. Run `npm start`

## Notes for build on zones

Because our zones run Solaris/SunOS/SmartOS which has limited support by some packages, you will need to do the following:

* Install Sass on the system instead of using the "node-sass" package:
  * `sudo pkgin install ruby212-sass-3.2.15`
* When building, use the `~_on_zone` suffixed npm scripts. For example:
  * `npm run build` becomes `npm run build_on_zone`
  * `npm run build_client` becomes `npm run build_client_on_zone`

## Compiling client-side code
After any changes to the SASS or TypeScript code, run `npm run build_client`.

## Running tests
To run the database tests, run `npm run db_test`, if the tests don't run make sure to run `npm install` to pull down the test runner dependencies.

## Important notes
* PHP must be on your system path
* Mongodb must be running before starting `npm start`
* If the 'There are no sessions available' message is displayed, change the quiz times within `views/session_config.php` to the current time
