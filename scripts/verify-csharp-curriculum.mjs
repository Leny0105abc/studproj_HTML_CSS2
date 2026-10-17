// Compile authored reference files only. This is not a student-code runner.
import {readFile,writeFile,mkdir,readdir} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import assert from 'node:assert/strict';
const exec=promisify(execFile), lessons=JSON.parse(await readFile('database/data/csharp-course.json','utf8'));
assert.equal(lessons.length,18);
for (const [i,l] of lessons.entries()) {
 assert.equal(l.position,i+1); assert.equal(l.level,['Beginner','Intermediate','Advanced'][Math.floor(i/6)]);
 assert.ok(l.objectives.length>=2&&l.objectives.length<=4); assert.equal(l.quiz.length,5);
 assert.equal(l.csharp_mode,i===17?'external':'console');
 for(const field of ['explanation','syntax','example_csharp','starter_csharp','csharp_project_guide','guided_practice','activity','expected_result','security_note','debugging_tip','completion_requirements']) assert.ok(l[field]?.trim(),`${l.title}: ${field}`);
 for(const q of l.quiz) {assert.equal(new Set(q.choices).size,4);assert.ok(Number.isInteger(q.answer)&&q.answer>=0&&q.answer<4);assert.ok(q.explanation);}
 assert.equal(l.is_project,(i+1)%6===0);if(l.is_project)assert.equal(Object.values(l.rubric).reduce((a,b)=>a+b,0),100);
 assert.ok(!l.example_csharp.includes('studproj_html_css')&&!l.example_csharp.includes('DB_PASSWORD'));
}
assert.ok(lessons[15].example_csharp.includes('Data Source=:memory:'));
assert.ok(lessons[15].example_csharp.includes('Parameters.AddWithValue'));
assert.ok(lessons[17].example_csharp.includes('FixedTimeEquals'));
assert.ok(lessons[17].example_csharp.includes('Rfc2898DeriveBytes.Pbkdf2'));
assert.ok(lessons[17].example_csharp.includes('role != "admin"'));
assert.equal((95+89+91)/3,91.66666666666667);
const area=resolve('storage/framework/testing/csharp-validation');
const compiler=process.env.CSHARP_VALIDATION_COMPILER??join(area,'roslyn/tasks/netcore/bincore/csc.dll');
const runtime=process.env.CSHARP_VALIDATION_REFERENCE_DIR??'C:/Program Files/dotnet/shared/Microsoft.NETCore.App/8.0.19';
const sqlite=process.env.CSHARP_VALIDATION_SQLITE??join(area,'sqlite/lib/net8.0/Microsoft.Data.Sqlite.dll');
const refs=(await readdir(runtime)).filter(n=>n.endsWith('.dll') && !n.includes('.Native') && (n.startsWith('System.') || n.startsWith('Microsoft.CSharp') || n.startsWith('Microsoft.VisualBasic') || ['netstandard.dll','mscorlib.dll'].includes(n))).map(n=>join(runtime,n));
for(const [i,l] of lessons.entries()) {
 const directory=join(area,`lesson-${i+1}`);await mkdir(directory,{recursive:true});
 const source=join(directory,'Program.cs');await writeFile(source,l.example_csharp);
 const args=['/nologo','/target:exe','/langversion:12','/nullable:enable',`/out:"${join(directory,'Reference.dll')}"`,...refs.map(p=>`/r:"${p}"`),...(i===15||i===17?[`/r:"${sqlite}"`]:[]),`"${source}"`];
 const rsp=join(directory,'compile.rsp');await writeFile(rsp,args.join('\n'));
 try {const result=await exec('dotnet',[compiler,'@'+rsp],{timeout:30000,maxBuffer:100000});console.log(`${i+1}: ${l.title} — compiled${result.stdout.trim()?' (diagnostics below)':''}`);if(result.stdout.trim())console.log(result.stdout.trim());}
 catch(e){console.error(`${i+1}: ${l.title}\n${e.stdout??e.message}`);process.exitCode=1;break;}
}
if(!process.exitCode)console.log('18 authored references compiled against .NET 8 compatibility assemblies; curriculum structure passed. No reference/student programs executed and no .NET sandbox verified. Configure reference/compiler paths for other local validation installations.');
