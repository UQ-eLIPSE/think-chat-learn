# MOOCchat

## Setting up

1. Clone repo
2. Install Nodejs 0.10.x and MongoDB
3. Start MongoDB, usually the command to run is `mongod`
4. Run `npm install` from within MOOCchat folder
5. Build source: `npm run build`
6. Seed the database by running `npm run seed` (only needs to be done once and will wipe existing tables)
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

## Database dumps and restores
`mongodump` is the command to use to dump the entirety of the database as BSON. The default directory is `./dump`, configurable by the `out` flag.

To restore, run `mongorestore`, with the `dir` flag if dump folder name was supplied. The `drop` flag will drop collections that already exist before inserting the restore data. 

    $ mongodump -o dump-folder-name
    $ mongorestore --drop --dir dump-folder-name

## Important notes
* Mongodb must be running before starting `npm start`
