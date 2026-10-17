// Content verification only: never called by Laravel or given student/editor input.
// Executes only the curated console examples; Windows Forms sources are compile-only.
import {readFile,writeFile,mkdir,readdir,copyFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
const root=resolve('storage/app/private/vbnet-validation');
const compiler=join(root,'microsoft.net.compilers.toolset-4.11.0/tasks/netcore/bincore/vbc.dll');
const ref=join(root,'microsoft.netcore.app.ref-8.0.19/ref/net8.0');
const desktop=join(root,'microsoft.windowsdesktop.app.ref-8.0.19/ref/net8.0');
const libraries=[join(root,'microsoft.data.sqlite.core-8.0.19/lib/net8.0/Microsoft.Data.Sqlite.dll'),join(root,'sqlitepclraw.core-2.1.6/lib/netstandard2.0/SQLitePCLRaw.core.dll')];
const baseReferences=(await readdir(ref)).filter(n=>n.endsWith('.dll')).map(n=>join(ref,n));
const desktopReferences=(await readdir(desktop)).filter(n=>n.endsWith('.dll')).map(n=>join(desktop,n));
const normalized=s=>s.replace(/\r\n/g,'\n').trimEnd();
const command=(args,cwd,input='',timeout=20000)=>new Promise((ok,fail)=>{
    const child=spawn('dotnet',args,{cwd,windowsHide:true,stdio:['pipe','pipe','pipe'],env:{...process.env,DOTNET_CLI_TELEMETRY_OPTOUT:'1',DOTNET_NOLOGO:'1'}});
    let output='',size=0,expired=false;
    const timer=setTimeout(()=>{expired=true;child.kill();},timeout);
    for(const stream of [child.stdout,child.stderr])stream.on('data',chunk=>{size+=chunk.length;if(size>262144){child.kill();return;}output+=chunk.toString();});
    child.on('error',error=>{clearTimeout(timer);fail(error);});
    child.on('close',code=>{clearTimeout(timer);if(expired||size>262144)fail(Error('Trusted validation timeout/output limit'));else ok({code,output});});
    child.stdin.end(input);
});
const lessons=JSON.parse(await readFile('database/data/vbnet-course.json','utf8'));
await mkdir(join(root,'checks'),{recursive:true});
for(const lesson of lessons){
    const work=join(root,'checks',String(lesson.position));await mkdir(work,{recursive:true});
    await writeFile(join(work,'Program.vb'),lesson.example_vbnet);
    const references=[...baseReferences,...(lesson.vbnet_mode==='winforms'?desktopReferences:[]),...(lesson.validation_rules.vbnet.libraries.length?libraries:[])];
    const response=['/nologo','/noconfig','/nostdlib+','/optionexplicit+','/optionstrict+','/optioninfer+','/imports:System,Microsoft.VisualBasic,System.Collections.Generic,System.Linq','/define:_MYTYPE=\\"Empty\\"',`/sdkpath:"${ref}"`,`/vbruntime:"${join(ref,'Microsoft.VisualBasic.dll')}"`,lesson.vbnet_mode==='winforms'?'/target:library':'/target:exe','/out:Program.dll',...references.map(r=>`/reference:"${r}"`),'Program.vb'];
    await writeFile(join(work,'compile.rsp'),response.join('\n'));
    const build=await command([compiler,'@compile.rsp'],work);
    if(build.code!==0)throw Error(`Lesson ${lesson.position} failed compilation:\n${build.output}`);
    if(lesson.vbnet_mode==='console'){
        await writeFile(join(work,'Program.runtimeconfig.json'),JSON.stringify({runtimeOptions:{tfm:'net8.0',framework:{name:'Microsoft.NETCore.App',version:'8.0.0'}}}));
        if(lesson.validation_rules.vbnet.libraries.length){
            for(const file of libraries)await copyFile(file,join(work,file.split(/[\\/]/).pop()));
            for(const [packageDir,relative] of [
                ['sqlitepclraw.bundle_e_sqlite3-2.1.6','lib/netstandard2.0/SQLitePCLRaw.batteries_v2.dll'],
                ['sqlitepclraw.provider.e_sqlite3-2.1.6','lib/net6.0/SQLitePCLRaw.provider.e_sqlite3.dll'],
                ['sqlitepclraw.lib.e_sqlite3-2.1.6','runtimes/win-x64/native/e_sqlite3.dll'],
            ])await copyFile(join(root,packageDir,relative),join(work,relative.split('/').pop()));
        }
        for(const test of lesson.validation_rules.vbnet.test_cases){
            const run=await command(['Program.dll'],work,test.input,10000);
            assert.equal(run.code,0,`Lesson ${lesson.position} runtime failed: ${run.output}`);
            assert.equal(normalized(run.output),normalized(test.expected),`Lesson ${lesson.position} output mismatch`);
        }
        console.log(`PASS ${lesson.position}: compiled and ran curated console example — ${lesson.title}`);
    }else console.log(`PASS ${lesson.position}: desktop source compiled only — ${lesson.title}`);
}
console.log('PASS all 18 curated VB.NET examples compiled; 13 console examples ran, including isolated practice files and in-memory ADO.NET SQLite. Five Windows Forms sources were compile-only; no browser desktop execution is claimed.');
