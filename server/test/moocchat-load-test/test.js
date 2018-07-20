const fs = require("fs");
const process = require('process');
const Client = require("./data/Client.js");

const url = "http://localhost:8080";
const getUserData = require("./utils/user");

const sessionWaitTime = 5.5 * 60 * 1000;
const time = Date.now();
const logsDirectoryPath = './logs';
const DEFAULT_CONNECTIONS = 1200;

/** Defines a moocchat test session */
class MoocchatTestSession {
    constructor(i, total, connectionWaitTime) {
        this.id = i;
        this.total = total;
        this.connectionWaitTime = connectionWaitTime;
        this.stats = {
            numberOfPeopleInChatGroup: 0
        }

        this.clients = []
    }
}

/** Creates (if does not exist) a logs directory and primes the log with session details */
function prepareLogFile(moocchatTestSession) {
    if (!fs.existsSync(logsDirectoryPath)) {
        fs.mkdirSync(logsDirectoryPath);
    }

    // Add test information
    const moocchatTestSessionInformation = "Process ID: " + process.pid + '\nTime span for connections: ' + moocchatTestSession.connectionWaitTime + '\nTotal connections: ' + moocchatTestSession.total;
    fs.appendFileSync(logsDirectoryPath + '/' + time + '_log_' + moocchatTestSession.id + '.txt', moocchatTestSessionInformation);

    // Add columns
    const moocchatLogColumns = "\n\n#users in chat groups (/" + moocchatTestSession.total + "), Time of connection\n\n"
    fs.appendFileSync(logsDirectoryPath + '/' + time + '_log_' + moocchatTestSession.id + '.txt', moocchatLogColumns);
}

/** Initiates a moocchat test session and logs data */
function runTestSession(session, i) {
    const moocchatTestSession = new MoocchatTestSession(i, session.total, session.connectionWaitTime);
    prepareLogFile(moocchatTestSession);

    for (let i = 0; i < moocchatTestSession.total; i++) {
        setTimeout(() => {
            const c = new Client(getUserData(), i);
            c.on('addedToChatGroup', (_connectedId) => {
                moocchatTestSession.stats.numberOfPeopleInChatGroup++;
                const moocchatLogEntry = moocchatTestSession.stats.numberOfPeopleInChatGroup + ',' + Date.now() + '\n';
                fs.appendFile(logsDirectoryPath + '/' + time + '_log_' + moocchatTestSession.id + '.txt', moocchatLogEntry, (_err) => { });
            });

            c.initSocket(url);
            moocchatTestSession.clients.push(c);

        }, (Math.random() * moocchatTestSession.connectionWaitTime) >>> 0);
    }
}

/** Checks if a command line argument was passed, otherwise return the default number of connections */
function getTotalConnections() {
    if(process.argv[2] !== undefined && process.argv[2].trim().length > 0) {
        return parseInt(process.argv[2]);
    }

    return DEFAULT_CONNECTIONS;
}

/** An array of test sessions that execute one after the other */
const testSessions = [{ total: getTotalConnections(), connectionWaitTime: 0 }];

testSessions.forEach((session, i) => {
    runTestSession(session, i);
});



