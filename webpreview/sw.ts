//@ts-nocheck
///<reference lib="WebWorker"/>
var d = self as unknown as ServiceWorkerGlobalScope;
/**
 * see https://fetch.spec.whatwg.org/#methods
 *
 * @export
 * @param {any} options
 * @returns {string}
 */
const generateMethod = (options) => {
    const method = options.method;
    if (!method) return '';
    const type = {
        GET: ' -X GET',
        POST: ' -X POST',
        PUT: ' -X PUT',
        PATCH: ' -X PATCH',
        DELETE: ' -X DELETE',
        HEAD: ' -X HEAD',
        OPTIONS: ' -X OPTIONS'
    };
    return type[method.toUpperCase()] || '';
}

/**
 * @export
 * @param {any} val
 * @returns true if the envirtonment supports Headers and val is of instance Headers
 */
const isInstanceOfHeaders = (val) => {
    if (typeof Headers !== "function") {
        /**
         * Environment does not support the Headers constructor
         * old internet explorer?
         */
        return false;
    }
    return val instanceof Headers;
}

/**
 * @typedef {Object} HeaderParams
 * @property {Boolean} isEncode - A flag which is set to true if the request should set the --compressed flag
 * @property {String} params - The header params as string
 */

const getHeaderString = (name, val) => ` -H "${name}: ${`${val}`.replace(/(\\|")/g, '\\$1')}"`;

/**
 * @export
 * @param {object={}} options
 * @param {object|Headers} options.headers
 * @returns {HeaderParams} An Object with the header info
 */
const generateHeader = (options = {}) => {
    const { headers } = options;
    let isEncode = false;
    let headerParam = '';
    if (isInstanceOfHeaders(headers)) {
        headers.forEach((val, name) => {
            if (name.toLocaleLowerCase() !== 'content-length') {
                headerParam += getHeaderString(name, val);
            }
            if (name.toLocaleLowerCase() === 'accept-encoding') {
                isEncode = true;
            }
        })
    } else if (headers) {
        Object.keys(headers).map(name => {
            if (name.toLocaleLowerCase() !== 'content-length') {
                headerParam += getHeaderString(name, headers[name]);
            }
            if (name.toLocaleLowerCase() === 'accept-encoding') {
                isEncode = true;
            }
        });
    }
    return {
        params: headerParam,
        isEncode,
    };
}

/**
 * @export
 * @param {Object} body
 * @returns {string}
 */
function escapeBody(body) {
    if (typeof body !== 'string') return body
    return body.replace(/'/g, `'\\''`)
}

/**
 * @export
 * @param {Object} body
 * @returns {string}
 */
function generateBody(body) {
    if (!body) return '';
    if (typeof body === "object") {
        return ` --data-binary '${escapeBody(JSON.stringify(body))}'`;
    }
    return ` --data-binary '${escapeBody(body)}'`;
}

/**
 * @export
 * @param {boolean} isEncode
 * @return {string}
 */
function generateCompress(isEncode) {
    return isEncode ? ' --compressed' : '';
}

/**
 * @export
 * @param {string|object} requestInfo
 * @param {object={}} requestInit
 */
const fetchToCurl = (requestInfo, requestInit) => {
    let url, options;
    /**
     * initialization with an empty object is done here to
     * keep everything backwards compatible to 0.4.0 and below
     */
    if (typeof requestInfo === "string" || requestInfo instanceof URL) {
        url = requestInfo;
        options = requestInit || {};
    } else {
        url = (requestInfo || {}).url
        options = requestInfo || {}
    }
    const { body } = options;
    const headers = generateHeader(options);
    return `curl -sSi '${url}'${generateMethod(options)}${headers.params || ''}${generateBody(body)}${generateCompress(headers.isEncode)}`;
}


async function fetchToRawSocket(url: string, options: RequestInit) {
    const {
        method = 'GET',
        headers = {},
        body = null,
    } = options;

    const parsedUrl = new URL(url);
    const host = parsedUrl.hostname;
    const port = parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80);
    const path = parsedUrl.pathname + parsedUrl.search;
    const isSecure = parsedUrl.protocol === 'https:';

    let request = `${method} ${path} HTTP/1.1\r\n`;
    request += `Host: ${host}\r\n`;

    for (const [header, v] of (headers.entries as unknown as () => Iterable<string>)()) {
        request += `${header}: ${v}\r\n`;
    }

    if (body && body instanceof Uint8Array) {
        request += 'Content-Length: ' + body.length + '\r\n';
    }

    request += 'Connection: close\r\n'; // to close socket after response
    request += '\r\n';

    if (body && body instanceof Uint8Array) {
        request += new TextDecoder().decode(body);
    }
    request += "\r\n\r\n";
    return request;
}

d.addEventListener('activate', (ev) => {
    ev.waitUntil((async()=>{
        await     d.skipWaiting();
        await d.clients.claim();
    })())
})
d.addEventListener('install', (ev) => {
    d.skipWaiting();
});
function softFetch(request: Request) {
    if (!softFetch.port) {
        return fetch(request);
    }
    let str = fetchToCurl(request.url, request);
    return new Promise((resolve) => {
        let id = softFetch.handlers.push((resp) => {
            let textDecoder = new TextDecoder().decode(resp);
            let h = textDecoder.split("\r\n\r\n");
            if (h.length === 1) {
                resolve(new Response(resp, { "status": 200, "statusText": "OK" }));
                return;
            }
            let headers = h[0];
            let headerLines = headers.split('\r\n');
            console.log(headerLines);
            let dict = {};
            let resultH = new Headers();

            for (let i = 1; i < headerLines.length;i++) {
                let [head, val] = headerLines[i].split(': ');
                try {
                resultH.set(head, val);
                } finally {
                 console.log(head, val);
                }
            }

            resolve(new Response(h[1], {"headers": resultH, status: parseInt(headerLines[0].split(" ")[1]), statusText: headerLines[0].split(" ")[2]}));

        }) - 1;
        if (softFetch.port) {
            softFetch.port.postMessage({ id, str })
        }
    })
    // return fetch(request);

}
softFetch.port = null as unknown as MessagePort;
softFetch.handlers = [] as ((data: Uint8Array) => void)[];
d.addEventListener('message', (ev) => {
    if (ev.ports.length === 0) {
        softFetch.port.onmessage = ()=>{}
        softFetch.port = null;
        softFetch.handlers = [];
    }
    if (ev.ports.length > 0) {
        console.log("FOUND PORT TO BOOTSTRAPd");
        console.log(ev.ports);
        let port = ev.ports[0];
        port.onmessage = (ev) => {
            console.log(ev);
            let binaryData = ev.data;
            softFetch.handlers[binaryData.id](binaryData.real)
        };
        port.start();
        softFetch.port = port;
    }
})
d.addEventListener('fetch', (ev) => {
    ev.respondWith((async () => {
        return softFetch(ev.request);

    })());
})