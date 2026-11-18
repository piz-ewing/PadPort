'use strict';

const path = require('node:path');
const {RuntimeServer} = require('./server.cjs');

async function main() {
    const folder = process.argv[2], id = process.argv[3];
    if (!folder || !id) throw new Error('Usage: node main.cjs <game-folder> <game-id>');
    const server = new RuntimeServer({folder, id, assets: path.resolve(__dirname, '../../app/src/main/assets'),
        onMessage: (name, value) => process.stdout.write(JSON.stringify({event: name, value}) + '\n')});
    await server.listen();
    process.stdout.write(JSON.stringify({event: 'ready', url: server.url(), controlToken: server.controlToken}) + '\n');
    process.once('SIGTERM', () => server.close().catch(error => { console.error(error); process.exitCode = 1; }));
    process.once('SIGINT', () => server.close().catch(error => { console.error(error); process.exitCode = 1; }));
}

if (require.main === module) main().catch(error => { console.error(error); process.exitCode = 1; });
module.exports = {main};
