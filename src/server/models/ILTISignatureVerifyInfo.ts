export interface ILTISignatureVerifyInfo {
    method: "POST" | "GET";
    url: string;
    consumer: {
        key: string;
        secret: string;
    };
    token?: {
        secret?: string;
    }
}