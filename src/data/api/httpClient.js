import { API_URL } from '../../core/network/urls.js';
import { USER_TOKEN_KEY } from '../../core/network/keys.js';

function authHeaders(extra = {}) {
    const token = localStorage.getItem(USER_TOKEN_KEY);
    return {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...extra,
    };
}

async function request(method, path, { body, auth = false, query } = {}) {
    // Most endpoints are relative to API_URL, but a couple (special/
    // discounted prices) live on a different subdomain entirely — allow
    // passing a full URL through untouched instead of double-prefixing it.
    let url = /^https?:\/\//i.test(path) ? path : API_URL + path;
    if (query) {
        const qs = new URLSearchParams(query).toString();
        url += (path.includes('?') ? '&' : '?') + qs;
    }
    const response = await fetch(url, {
        method,
        headers: auth ? authHeaders() : { 'Content-Type': 'application/json' },
        body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    let data = null;
    try {
        data = await response.json();
    } catch {
        // some endpoints (payment redirect) may not return JSON
    }

    if (!response.ok) {
        const message = data?.message || data?.title || 'Server connection error';
        const err = new Error(typeof message === 'string' ? message : 'Server connection error');
        err.status = response.status;
        err.data = data;
        throw err;
    }
    return data;
}

export const httpClient = {
    get: (path, opts) => request('GET', path, opts),
    post: (path, opts) => request('POST', path, opts),
    put: (path, opts) => request('PUT', path, opts),
};
