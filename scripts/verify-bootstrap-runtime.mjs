import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {newQuickJSWASMModuleFromVariant,newVariant} from 'quickjs-emscripten-core';
import RELEASE_SYNC from '@jitl/quickjs-wasmfile-release-sync';
import {createJavascriptEngine} from '../resources/js/javascript-engine.js';
import {parseHTML} from 'linkedom';
const QuickJS=await newQuickJSWASMModuleFromVariant(newVariant(RELEASE_SYNC,{wasmBinary:await readFile('public/javascript-runtime/quickjs.wasm'),wasmMemory:new WebAssembly.Memory({initial:256,maximum:2048})}));
const dom=await readFile('public/javascript-runtime/dom.js','utf8'),lessons=JSON.parse(await readFile('database/data/bootstrap-course.json','utf8'));
assert.equal(lessons.length,18);
const engines=[];
try {
 for(const [i,l] of lessons.entries()){
  assert.equal(l.position,i+1);assert.equal(l.level,['Beginner','Intermediate','Advanced'][Math.floor(i/6)]);assert.equal(l.quiz.length,5);
  for(const q of l.quiz){assert.equal(new Set(q.choices).size,4);assert.ok(q.answer>=0&&q.answer<=3);}
  const doc=parseHTML(l.example_html).document;assert.ok(doc.querySelector('main'));assert.ok(doc.querySelector('h1'));assert.ok(doc.querySelector('meta[name="viewport"]'));
  assert.ok(!/data-toggle=|data-target=|col-xs-|\bjQuery\b/.test(l.example_html));
  for(const label of doc.querySelectorAll('label[for]'))assert.ok(doc.getElementById(label.getAttribute('for')));
  const ids=[...doc.querySelectorAll('[id]')].map(n=>n.id);assert.equal(ids.length,new Set(ids).size);
  if(l.is_project)assert.equal(Object.values(l.rubric).reduce((a,b)=>a+b,0),100);
  const engine=createJavascriptEngine(QuickJS,dom,{code:l.example_javascript,html:l.example_html,css:l.example_css,rules:{bootstrapPreview:true,dom_checks:l.validation_rules.bootstrap.dom_checks}});engines.push(engine);
  const result=engine.snapshot();assert.ok(result.domChecks.every(c=>c.passed));console.log(`PASS ${i+1}: ${l.title}`);
 }
 const runtime=engines[14];let snapshot=runtime.snapshot();let doc=parseHTML('<html><body>'+snapshot.html+'</body></html>').document;
 let result=runtime.event({type:'click',key:doc.getElementById('openDetails').getAttribute('data-codelab-key'),fields:[]});assert.equal(result.bootstrapCommands[0].type,'Modal');assert.equal(result.bootstrapCommands[0].action,'show');assert.ok(result.html.includes('Maria Santos'));
 doc=parseHTML('<html><body>'+result.html+'</body></html>').document;result=runtime.event({type:'shown.bs.modal',key:doc.getElementById('detailModal').getAttribute('data-codelab-key'),fields:[]});assert.ok(result.html.includes('Student details opened.'));
 const dashboard=engines[17];snapshot=dashboard.snapshot();doc=parseHTML('<html><body>'+snapshot.html+'</body></html>').document;
 const fields=[...doc.querySelectorAll('input,select,textarea')].map(n=>({key:n.getAttribute('data-codelab-key'),value:n.id==='studentSearch'?'zz-no-match':n.id==='courseFilter'?'':n.id==='sortOrder'?'name':n.value??'',checked:false}));
 result=dashboard.event({type:'input',key:doc.getElementById('studentSearch').getAttribute('data-codelab-key'),fields});assert.ok(result.html.includes('No students match.'));assert.ok(!parseHTML('<html><body>'+result.html+'</body></html>').document.querySelector('#studentRows tr'));
 doc=parseHTML('<html><body>'+result.html+'</body></html>').document;
 assert.equal(doc.querySelector('#recordCourse option').getAttribute('value'),null);
 const recordFields=[...doc.querySelectorAll('input,select,textarea')].map(n=>({key:n.getAttribute('data-codelab-key'),value:({studentSearch:'',courseFilter:'',sortOrder:'name',recordName:'Practice Student',recordCourse:'IT',recordGrade:'88'})[n.id]??'',checked:false}));
 result=dashboard.event({type:'submit',key:doc.getElementById('studentForm').getAttribute('data-codelab-key'),fields:recordFields});
 assert.equal(parseHTML('<html><body>'+result.html+'</body></html>').document.getElementById('studentCount').textContent,'4');
 assert.ok(result.bootstrapCommands.some(c=>c.type==='Toast'&&c.action==='show'));
 const security=createJavascriptEngine(QuickJS,dom,{code:'console.log(typeof parent,typeof document.cookie,typeof process,typeof postMessage);',rules:{bootstrapPreview:true}});engines.push(security);assert.equal(security.snapshot().output,'undefined undefined undefined undefined\n');
 console.log('Bootstrap curriculum, guest DOM, component commands/lifecycle, filtering/empty state and isolated globals passed. Native Bootstrap layout/plugins require browser verification.');
}finally{for(const e of engines)e.dispose();}
