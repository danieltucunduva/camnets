#!/usr/bin/env node

/**
 * creates ExpressJS backend API server
 */

const appExpress = require('./server/app');
const http = require('http');
const apiPort = process.env.PORT || 8080;

appExpress.set('port', apiPort);

const server = http.createServer(appExpress);

server.listen(apiPort);

console.log('Server listening on port ' + apiPort);
