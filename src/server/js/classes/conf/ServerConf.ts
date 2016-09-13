import {IServerConf} from "../../interfaces/IServerConf";

// Configuration file is handled differently for imports due to it being a plain JSON file
export const ServerConf: IServerConf = require('../../../../../config/conf.json');
