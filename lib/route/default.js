'use strict';

const buildConf = require('../build-conf');

// Headers that will NOT be copied from the inResponse to the outResponse.
const ignoredResponseHeaders = [
    // Hapi will negotiate this with the client for us.
    'content-encoding',
    // Hapi prefers chunked encoding, but also re-calculates size
    // when necessary, which is important if we modify it.
    'content-length',
    // Hapi will negotiate this with the client for us.
    'transfer-encoding'
];

// Ensure that the client receives a reasonable representation
// of what the target server sends back.
const mapResponseData = (from, to) => {
    const { headers } = from;

    Object.keys(headers).filter((name) => {
        return !ignoredResponseHeaders.includes(name);
    }).forEach((name) => {
        to.header(name, headers[name]);
    });

    to.code(from.statusCode);
};

// This style rule is disabled because we don't control Hapi's API.
// eslint-disable-next-line max-params
const onResponse = (err, inResponse, inRequest, reply) => {
    if (err) {
        throw err;
    }

    const outResponse = reply(inResponse);

    // Pass along response metadata from the upstream server,
    // such as the Content-Type.
    mapResponseData(inResponse, outResponse);
};

const onRequest = (inRequest, reply) => {
    const { appName, siteId, file } = inRequest.params;
    const { branch, version } = buildConf(appName, siteId);

    reply.proxy({
        uri         : `https://s3.amazonaws.com/${appName}/${branch}/${version}/${file}`,
        // Shovel headers between the client and upstream server.
        passThrough : true,
        onResponse
    });
};

module.exports = {
    method  : '*',
    path    : '/{appName}/s;id={siteId}/~default/default/{file*}',
    handler : onRequest,
    config  : {
        cors : {
            headers        : ['Accept', 'If-None-Match'],
            exposedHeaders : []
        },
        // Pretty print JSON responses (namely, errors) for a friendly UX.
        json : {
            space : 4
        },
        // Workaround reply.proxy() not supporting the default payload config.
        // https://github.com/hapijs/hapi/issues/2647
        payload : {
            output : 'stream',
            parse  : false
        }
    }
};
