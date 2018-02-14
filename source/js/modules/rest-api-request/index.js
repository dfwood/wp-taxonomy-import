import 'whatwg-fetch';

function doFetch(request) {
    // Make our fetch request.
    return fetch(request).then(response => {
        // Verify returned content type and setup response.
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            return response;
        }
        // Invalid content received!
        throw new TypeError(`ERROR: Expected JSON response, received '${contentType}' instead!`);
    });
}

export function GET(url, data = {}, nonce = '') {
    let query = [];
    Object.keys(data).map(k => query.push(`${k}=${data[k]}`));

    url += url.includes('?') ? `&${query.join('&')}` : `?${query.join('&')}`;

    const headers = new Headers();
    if (nonce) {
        headers.set('X-WP-Nonce', nonce);
    }

    const request = new Request(url, {
        credentials: 'same-origin',
        headers,
        method: 'GET',
    });

    return doFetch(request);
}

export function POST(url, data = {}, nonce = '') {
    // Set data as body content
    const body = new FormData();
    Object.keys(data).map(k => body.append(k, data[k]));

    // Create request
    const request = new Request(url, {
        credentials: 'same-origin',
        body,
        headers: new Headers({
            'X-WP-Nonce': nonce,
        }),
        method: 'POST',
    });

    return doFetch(request);
}
