import './config/Config';
import { Logger } from "../common/js/Logger";
import App from "./App";


// Initialise logger proxy for timestamping console output
Logger.Init({
  enableLogProxy: true,
  enableTimestamp: true
});

// If there are exceptions, we should try to have the whole stack outputted to the log
process.on("uncaughtException", (e: Error) => {
  console.error(e.stack || e);
});

console.log("Setting up server application...");

// Launch the app
//const app = express();
const app: App = new App();
app.init();
