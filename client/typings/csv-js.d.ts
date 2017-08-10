type LabelledObject = { [header: string]: any };
type DataRow = LabelledObject | any[];
type InputData = DataRow[] | string;

type CastValue = "String" | "Number" | "Boolean" | "Primitive" | "Null";

type CSVForEachCallback = (row: DataRow) => void;

interface CSVOptions {
    cast?: boolean | CastValue[];
    lineDelimiter?: string;
    cellDelimiter?: string;
    header?: boolean | string[];
}

declare class CsvJs {
    static parse(data: InputData, options?: CSVOptions): DataRow[];
    static encode(data: InputData, options?: CSVOptions): string;
    static forEach(data: InputData, options?: CSVOptions, callback?: CSVForEachCallback): void;

    constructor(data: InputData, options?: CSVOptions);

    parse(options?: CSVOptions): DataRow[];
    encode(options?: CSVOptions): string;
    forEach(options?: CSVOptions, callback?: CSVForEachCallback): void;
}

declare module CsvJs {}

declare module "csv-js" {
    export = CsvJs;
}
