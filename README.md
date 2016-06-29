# MoocChat

## Setting up

1. Clone repo
2. Install Nodejs and MongoDB
3. Start Mongodb, usually the command to run is `mongod`
4. Run `npm install` from within Moocchat folder
5. Seed the database by running `npm run seed` (only needs to be done once)
6. Download the dependencies for the client, `npm run dependencies`. This will download bootstrap, jquery, etc.
7. Run `npm start`

## Compiling client-side code

After any changes to the SASS or TypeScript code, run `npm run build_client`.

## Running tests
To run the database tests, run `npm run db_test`, if the tests don't run make sure to run `npm install` to pull down the test runner dependencies.

## Important notes
* PHP must be on your system path
* Mongodb must be running before starting `npm start`
* If the 'There are no sessions available' message is displayed, change the quiz times within `views/session_config.php` to the current time
