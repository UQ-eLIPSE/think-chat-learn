# MOOCchat

## Setting up

1. Clone repo
2. Install Nodejs 6.x LTS and MongoDB
3. Start MongoDB, usually the command to run is `mongod`
4. Run `npm install` from within MOOCchat folder
5. Ensure configuration files are set up correctly:
   * `common/config/Conf.ts` - shared configuration (PacSeqSocket, section timings, answers etc.)
   * `client/config/Conf.ts` - client config
   * `server/config/Conf.ts` - server config
6. Build source: `npm run build`
7. Seed the database by running `npm run seed` (only needs to be done once and will wipe existing tables)
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

* Change `config/conf.json` -> `lti.testMode` to `true`. Restart server if already running.
* Go to the URL `/lti-launch`. By default, you should submit via. "lti.php" which emulates what Blackboard would do, but you are also able to force trigger the standard or backup queue clients.

## Putting new question content in
Run `node util/db_incrInsert.js $DATA_DIR_HERE` for incremental insertions. All data JS files must exist in that directory; see `util/data` for the data files and their format expected.

## Piwik support
Piwik is now supported. To set this up, `config/conf.json` -> `piwik` needs to be set to point to the correct URL and site ID.

The URL is relative to the public URL the client sees. e.g. on staging, with `piwik.url` set to `/piwik`, this will load Piwik via. "https://mc-stg.uqcloud.net/piwik".
An absolute URL can also supplied.

The site ID can be found in Piwik -> Administration (cog icon in top right) -> Websites.

## Tests
All tests are currently broken. You can still find the old tests under `test`.

To execute tests: ensure mongo is running; then build; then run `npm run test`.

## Load testing

A simulation test script has been created in order to load test moocchat. This can be found under `server/test/moocchat-load-test`. Navigate to this directory, then run the test with `node test <number_of_connections>`. By default the test uses 1200 connections. After running the test, the logs can be found under the `server/test/moocchat-load-test/logs` directory.

### Test configuration file (required to run load test)
Ensure that a `config.js` file is set up correctly under `server/test/moocchat-load-test`. An example config file called `config.js.example` can be found in the same directory.

### The simulation script
The script simulates the (internal) protocol that moocchat uses to enable communication between the server and the client. This protocol involves emitting/receiving various socket events (these events depend on the user's current progress in the moocchat session). The script starts out by logging in the user using dummy LTI information. The formation of chat groups (i.e. all connections are allocated into chat groups) is the extent of the simulation.

## Database dumps and restores
`mongodump` is the command to use to dump the entirety of the database as BSON. The default directory is `./dump`, configurable by the `out` flag.

To restore, run `mongorestore`, with the `dir` flag if dump folder name was supplied. The `drop` flag will drop collections that already exist before inserting the restore data. 

    $ mongodump -o dump-folder-name
    $ mongorestore --drop --dir dump-folder-name

## Utilities
### MongoDB to PostgreSQL Translation
1. Install "pg" locally on machine (this is not provided by default in 
   "package.json" because it is not used in MOOCchat itself)
   * `npm install pg@7.3.0`
2. Configure the utility file directly at `server/util/m2p.js` to point to the
   databases to read from and write to.
3. To execute, run `npm run build_server` first to compile the necessary code 
   this utility relies on, then `npm run m2p`.

## Important notes
* Mongodb must be running before starting `npm start`
