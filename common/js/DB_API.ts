import axios, { AxiosPromise, AxiosRequestConfig } from "axios";
import { getIdToken, setIdToken } from "./front_end_auth";
import { Conf } from "../config/Conf";

const API_URL = Conf.server.url;

export interface IApi {
  // HTTP verbs
  POST: string;
  GET: string;
  DELETE: string;
  PUT: string;

  // API routes
  USER: string;
  QUIZ: string;
  QUESTION: string;
  USERSESSION: string;
  QUIZSESSION: string;
  RESPONSE: string;
  CHATGROUP: string;
  MARKS: string;
  CRITERIA: string;
  RUBRIC: string;

  request(
    method: string,
    url: string,
    data: {},
    contentType?: string | undefined,
    token?: string | null
  ): Promise<any>;

  uploadForm(url: string, data: FormData): Promise<any>;
}

export const API: IApi = {
  request(
    method: string,
    url: string,
    data: object | undefined,
    contentType?: string | undefined,
    token?: string | null
  ): AxiosPromise {
    // TODO, change the verbs to correct typing
    const methodProxy: any = method;

    const payload: AxiosRequestConfig = {
      method: methodProxy,
      url: API_URL + url,
      headers: {
        "Authorization": "Bearer " + (token ? token : getIdToken()),
        "Content-Type": contentType ? contentType : "application/json"
      },
      data
    };

    return axios(payload)
      .then((res: any) => {
        setIdToken(res.headers["access-token"]);
        return res;
      })
      .then((res: any) => res.data)
      .catch((e: Error) => {
        console.error(e);
      });
  },

  uploadForm(url: string, data: FormData): any {
    const config: AxiosRequestConfig = {
      url: API_URL + url,
      headers: {
        "Authorization": "Bearer " + getIdToken(),
        "Content-Type" : "multipart/form-data"
      }
    };

    return axios.post(API_URL + url, data, config).then((res) => {
      return res.data;
    });
  },

  POST: "post",
  GET: "get",
  DELETE: "delete",
  PUT: "put",

  QUIZ: "quiz",
  USER: "user",
  QUESTION: "question",
  USERSESSION: "usersession",
  QUIZSESSION: "quizsession",
  RESPONSE: "response",
  CHATGROUP: "chatgroup",
  MARKS: "marks",
  CRITERIA: "criteria",
  RUBRIC: "rubric"
};

export default API;
