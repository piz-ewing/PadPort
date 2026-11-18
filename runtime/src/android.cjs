'use strict';

const fs = require('node:fs');
const path = require('node:path');
const native = process._linkedBinding('padport');
const {RuntimeServer} = require('./server.cjs');
const {DocumentFiles} = require('./documents.cjs');
const {GameFiles} = require('./files.cjs');

async function main() {
    const config = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
    const server = await new RuntimeServer({id: config.id, config,
        files: new GameFiles(new DocumentFiles(native)), assets: path.dirname(process.argv[1]),
        onMessage: (event, value) => native.message(JSON.stringify({event, value}))}).listen();
    native.onControl(value => {
        const message = JSON.parse(value);
        if (message.op === 'publish') server.publish(message.value);
        else if (message.op === 'command') server.command(message.value);
        else if (message.op === 'stop') server.close().catch(error => {
            native.message(JSON.stringify({event: 'failed', value: error.stack})); process.exitCode = 1;
        });
        else throw new Error('Unknown runtime control: ' + message.op);
    });
    process.once('SIGTERM', () => server.close().catch(error => {
        native.message(JSON.stringify({event: 'failed', value: error.stack})); process.exitCode = 1;
    }));
    native.message(JSON.stringify({event: 'ready', url: server.url(), base: server.url(''),
        origin: server.origin, controlToken: server.controlToken}));
}

main().catch(error => {
    native.message(JSON.stringify({event: 'failed', value: error.stack}));
    process.exitCode = 1;
});
