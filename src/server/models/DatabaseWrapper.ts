/**
 * DatabaseWrapper
 * 
 * Base class for DB wrappers contained in /models/database.
 */
export class DatabaseWrapper<IData> {
    private tableName: string;
    private db: any;

    constructor(tableName: string) {
        this.tableName = tableName;
    }

    private get table() {
        return this.db[this.tableName];
    }

    /**
     * @param {Object} data
     * @param {Function} callback
     */
    public create(data: IData, callback?: Function) {
        this.table.insert(data, function(err: any, res: any) {
            if (err) {
                console.log("Failed to save data: " + err);
            }

            if (callback) {
                callback(err, res);
            }
        });
    }

    /**
     * @param {Object} data
     * @param {Function} callback
     */
    public read(query: Object, callback?: Function) {
        this.table.find(query, function(err: any, res: any) {
            if (err) {
                console.log("Failed to read data: " + err);
            }

            if (callback) {
                callback(err, res);
            }
        });
    }

    /**
     * @param {Object} data
     * @param {Function} callback
     */
    public readEach(query: Object, callback?: Function) {
        this.table.find(query, function(err: any, res: any) {
            if (err) {
                console.log("Failed to read data: " + err);
            }

            if (callback) {
                for (var i = 0; i < res.length; i++) {
                    callback(err, res[i]);
                }
            }
        });
    }

    /**
     * @param {Object} query
     * @param {Object} data
     * @param {Function} callback
     */
    public update(query: Object, data: IData, callback?: Function) {
        this.table.update(query, data, function(err: any, res: any) {
            if (err) {
                console.log("Failed to update data: " + err);
            }

            if (callback) {
                callback(err, res);
            }
        });
    }

    /**
     * @param {Object} data
     * @param {Function} callback
     */
    public delete(query: Object, callback?: Function) {
        this.table.remove(query, function(err: any, res: any) {
            if (err) {
                console.log("Failed to delete data: " + err);
            }
            
            if (callback) {
                callback(err, res);
            }
        });
    }

    /**
     * Connects the wrapper to the database.
     * 
     * **Must be run before anything can be done to the tables.**
     */
    public init(database: any) {
        this.db = database;
    }
}
