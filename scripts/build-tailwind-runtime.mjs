import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {rolldown} from 'rolldown';
const config=JSON.parse(await readFile('resources/tailwind/config.json','utf8'));
const pkg=JSON.parse(await readFile('node_modules/tailwindcss/package.json','utf8'));
if(config.version!==pkg.version)throw Error('Tailwind preview and installed compiler versions differ. Update the central config intentionally.');
// Use the existing package's fully resolved CSS, independently of the app's theme.
const base=await readFile('node_modules/tailwindcss/index.css','utf8');
await writeFile('resources/tailwind/base.generated.json',JSON.stringify(base+'\n@custom-variant dark (&:where(.dark, .dark *));\n'));
await mkdir('public/tailwind-runtime',{recursive:true});
const bundle=await rolldown({input:'resources/js/tailwind-worker.js',platform:'browser'});
await bundle.write({file:'public/tailwind-runtime/compiler.js',format:'iife',codeSplitting:false});await bundle.close();
await copyFile('node_modules/tailwindcss/LICENSE','public/tailwind-runtime/LICENSE.txt');
const source=await readFile('public/tailwind-runtime/compiler.js');
await writeFile('public/tailwind-runtime/version.json',JSON.stringify({...config,worker:createHash('sha256').update(source).digest('hex')})+'\n');
console.log('Tailwind '+pkg.version+' isolated local practice compiler built.');
