import axios, { AxiosPromise } from "axios";
import { getIdToken, setIdToken } from "./front_end_auth";

// TODO replace with an actual link
const API_URL = "http://localhost:8080/api/";

export interface IApi {
    // HTTP verbs
    POST: string;
    GET: string;
    DELETE: string;
    PUT: string;

    // API routes
    USER: string;

    request(method: string, url: string, data: {}, contentType?: string | undefined): any;
}

export const API: IApi = {
    request(method: string, url: string, data: object|undefined, contentType?: string|undefined): AxiosPromise {
        return axios({
            method,
            url: API_URL + url,
            headers: {
                "Authorization": "Bearer " + getIdToken(),
                "Content-Type": contentType ? contentType : "application/json"
            },
            data
        })
        .then((res: any) => {
            setIdToken(res.headers["access-token"]);
            return res;
        })
        .then((res: any) => res.data);
    },

    POST: "post",
    GET: "get",
    DELETE: "delete",
    PUT: "put",

    USER: "users/",
};

export default API;
