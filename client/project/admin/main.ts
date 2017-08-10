import { Conf } from "../../config/Conf";
import * as $ from "jquery";

import { AdminPanel } from "./components/AdminPanel";

const adminPanel = new AdminPanel(Conf.combinedHTML.url, $("#content"));
adminPanel.init();
