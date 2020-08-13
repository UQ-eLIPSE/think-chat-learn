/** Stores unique ids */
const UNIQUE_IDS: { [id: string]: boolean } = {}

const uuidv4 = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        let r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

export default function uniqueId(): any {
    let id: string = uuidv4();
    if (UNIQUE_IDS[id] === undefined) {
        UNIQUE_IDS[id] = true;
        return id;
    }
    return uniqueId();
}
