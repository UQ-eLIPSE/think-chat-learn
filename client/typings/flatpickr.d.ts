type FlatpickrStringOrDate = string | Date;
type FlatpickrModeValue = "single" | "multiple" | "range";
type FlatpickrEventCallback = (selectedDates?: Date[], dateStr?: string, instance?: Flatpickr) => void;
type FlatpickrDateParseFunc = (dateStr: string) => Date;
type FlatpickrDateFilterFunc = (date: Date) => boolean;

type FlatpickrDateRange = { from: FlatpickrStringOrDate, to: FlatpickrStringOrDate };
type FlatpickrDateOrDateRange = FlatpickrStringOrDate | FlatpickrDateRange;

interface FlatpickrOptions {
    altFormat?: string,
    altInput?: boolean,
    altInputClass?: string,
    allowInput?: boolean,
    clickOpens?: boolean,
    dateFormat?: string,
    defaultDate?: FlatpickrStringOrDate | number,
    disable?: (FlatpickrDateOrDateRange | FlatpickrDateFilterFunc)[],
    enable?: (FlatpickrDateOrDateRange | FlatpickrDateFilterFunc)[],
    enableTime?: boolean,
    enableSeconds?: boolean,
    hourIncrement?: number,
    inline?: boolean,
    maxDate?: FlatpickrStringOrDate,
    minDate?: FlatpickrStringOrDate,
    minuteIncrement?: number,
    mode?: FlatpickrModeValue,
    nextArrow?: string,
    noCalendar?: boolean,
    onChange?: FlatpickrEventCallback | FlatpickrEventCallback[],
    onClose?: FlatpickrEventCallback | FlatpickrEventCallback[],
    onOpen?: FlatpickrEventCallback | FlatpickrEventCallback[],
    onReady?: FlatpickrEventCallback | FlatpickrEventCallback[],
    parseDate?: FlatpickrDateParseFunc,
    prevArrow?: string,
    shorthandCurrentMonth?: boolean,
    static?: boolean,
    time_24hr?: boolean,
    utc?: boolean,
    weekNumbers?: boolean,
    wrap?: boolean,
}

declare class Flatpickr {
    constructor(element: string | Element, config?: FlatpickrOptions);
    
    selectedDates: Date[];

    changeMonth(monthNum: number, is_offset: boolean): void;
    clear(): void;
    close(): void;
    destroy(): void;
    formatDate(formatStr: string, dateObj: Date): string;
    jumpToDate(date?: FlatpickrStringOrDate): void;
    open(): void;
    parseDate(date: string | number): Date;
    redraw(): void;
    set(option: string, value: any): void;
    setDate(date: FlatpickrStringOrDate | FlatpickrStringOrDate[]): void;
    toggle(): void;
}

declare module Flatpickr {}

declare module "Flatpickr" {
    export = Flatpickr;
}