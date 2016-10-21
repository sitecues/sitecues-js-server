#!/usr/bin/env node

// The CLI for the JS server.

// TODO: Use port-drop when it becomes viable.
// https://github.com/hapijs/hapi/issues/3204

'use strict';

// Crash and burn, die fast if a rejected promise is not caught.
require('throw-rejects')();

const chalk = require('chalk');
const open = require('opn');
const rootCheck = require('root-check');
const handleQuit = require('handle-quit');
const cli = require('meow')(`
    Usage
      $ js-server

    Option
      --port           Listen on a specific HTTPS port for requests.
      --insecure-port  Listen on a specific HTTP port for requests.
      --open           Visit the server in your browser.

    Example
      $ js-server --port=7000
      ${chalk.bold.cyan('App available')} ${chalk.bold.grey('at')} ${chalk.bold.yellow('https://localhost:7000/')}
      $ js-server --open 'status'
      ${chalk.bold.cyan('App available')} ${chalk.bold.grey('at')} ${chalk.bold.yellow('https://localhost:3000/status')}
`);

const { Server } = require('../');
const { SecurityError } = require('../lib/error');

const serverOptions = Object.assign({}, cli.flags);
delete serverOptions.open;

const server = new Server(serverOptions);

handleQuit(() => {
    server.stop();
});

server.start().then(() => {
    // Attempt to set UID to a normal user now that we definitely
    // do not need elevated privileges.
    rootCheck(
        chalk.red.bold('I died trying to save you from yourself.\n') +
        (new SecurityError('Unable to let go of root privileges.')).stack
    );

    const openArg = cli.flags.open;
    const target = typeof openArg === 'string' ? openArg : '';
    const visitUrl = server.connections[0].info.uri + '/' + target;

    console.log(
        chalk.bold.cyan('App available'),
        chalk.bold.grey('at'),
        chalk.bold.yellow(visitUrl)
    );

    if (openArg) {
        open(visitUrl);
    }
});
