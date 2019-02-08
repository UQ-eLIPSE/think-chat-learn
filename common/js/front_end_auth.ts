import decode from "jwt-decode";
import { LoginResponse, AdminLoginResponse } from "../interfaces/ToClientData";
const ID_TOKEN_KEY = "id_token";

export function logout(): void {
    clearIdToken();
}

export function getIdToken(): string | null {
    return localStorage.getItem(ID_TOKEN_KEY);
}

function clearIdToken(): void {
    localStorage.removeItem(ID_TOKEN_KEY);
}

// Get and store id_token in local storage
export function setIdToken(idToken: string) {
  localStorage.setItem(ID_TOKEN_KEY, idToken);
}

// Check if user is actively logged in
export function isLoggedIn(): boolean {
    const idToken = getIdToken();
    return !!idToken && !isTokenExpired(idToken);
}

export function getLoginResponse(): LoginResponse | null {
    const idToken = getIdToken();
    if (!idToken) {
        return null;
    }
    const token = decode(idToken) as LoginResponse;
    return token;
}

export function getAdminLoginResponse(): AdminLoginResponse | null {
    const idToken = getIdToken();
    if (!idToken) {
        return null;
    }
    const token = decode(idToken) as AdminLoginResponse;
    return token;
}

function getTokenExpirationDate(encodedToken: string) {
    const token = decode(encodedToken) as {
        exp: number
    };
    if (!token.exp) {
        return null;
    }

    const date = new Date(0);
    date.setUTCSeconds(token.exp);

    return date;
}

function isTokenExpired(token: string): boolean {
    const expirationDate = getTokenExpirationDate(token);
    if (!expirationDate) {
        return false;
    }
    return expirationDate < new Date();
}

export function decodeToken(token: string): any {
    return decode(token);
}