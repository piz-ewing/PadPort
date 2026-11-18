'use strict';

const fs = require('node:fs');
const path = require('node:path');
const esbuild = require('esbuild');
const root = __dirname;
const outdir = path.resolve(root, '../app/src/main/assets');

async function build() {
    const generated = path.join(root, 'build');
    fs.mkdirSync(generated, {recursive: true});
    const source = fs.readFileSync(path.join(root, 'src/path-browser.cjs'), 'utf8')
        .replace('__NODE_PATH_SOURCE__', () => fs.readFileSync(path.join(root, 'vendor/node-path.cjs'), 'utf8'));
    fs.writeFileSync(path.join(generated, 'path.cjs'), source);
    await esbuild.build({entryPoints: [path.join(root, 'src/client.cjs')], bundle: true, platform: 'browser',
        format: 'iife', target: ['chrome106', 'firefox115'], legalComments: 'inline',
        outfile: path.join(outdir, 'runtime-client.js'),
        plugins: [{name: 'browser-stdlib', setup(build) {
            build.onResolve({filter: /^path$/}, () => ({path: path.join(generated, 'path.cjs')}));
        }}]});
    await esbuild.build({entryPoints: [path.join(root, 'src/android.cjs')], bundle: true, platform: 'node',
        format: 'cjs', target: 'node18', legalComments: 'inline',
        external: ['original-fs'],
        outfile: path.join(outdir, 'runtime/node.cjs')});
    await esbuild.build({entryPoints: [path.join(root, 'src/tester.cjs')], bundle: true, platform: 'browser',
        format: 'iife', target: ['chrome106'], legalComments: 'inline',
        outfile: path.join(outdir, 'runtime/controller-tester.js')});
}

if (require.main === module) build().catch(error => { console.error(error); process.exitCode = 1; });
module.exports = {build};
