import {readFile}from'node:fs/promises';
import assert from'node:assert/strict';
import {newQuickJSWASMModuleFromVariant,newVariant}from'quickjs-emscripten-core';
import RELEASE_SYNC from'@jitl/quickjs-wasmfile-release-sync';
import {parseHTML}from'linkedom';
import {compileTailwind}from'../resources/js/tailwind-compiler.js';
import {createJavascriptEngine}from'../resources/js/javascript-engine.js';
const QuickJS=await newQuickJSWASMModuleFromVariant(newVariant(RELEASE_SYNC,{wasmBinary:await readFile('public/javascript-runtime/quickjs.wasm'),wasmMemory:new WebAssembly.Memory({initial:256,maximum:2048})}));
const dom=await readFile('public/javascript-runtime/dom.js','utf8'),lessons=JSON.parse(await readFile('database/data/tailwind-course.json','utf8'));
const engines=[];
const documentFrom=result=>parseHTML('<html><body>'+result.html+'</body></html>').document;
const fields=(doc,values={})=>[...doc.querySelectorAll('input,select,textarea')].map(n=>({key:n.getAttribute('data-codelab-key'),value:values[n.id]??n.getAttribute('value')??n.value??'',checked:n.hasAttribute('checked')}));
try{
 assert.equal(lessons.length,18);
 for(const[i,l]of lessons.entries()){
  assert.equal(l.position,i+1);assert.equal(l.level,['Beginner','Intermediate','Advanced'][Math.floor(i/6)]);assert.equal(l.quiz.length,5);
  for(const q of l.quiz){assert.equal(new Set(q.choices).size,4);assert.ok(q.answer>=0&&q.answer<=3);}
  if(l.is_project)assert.equal(Object.values(l.rubric).reduce((a,b)=>a+b),100);
  const doc=parseHTML(l.example_html).document;assert.ok(doc.querySelector('meta[name="viewport"]'));const ids=[...doc.querySelectorAll('[id]')].map(n=>n.id);assert.equal(ids.length,new Set(ids).size);
  for(const label of doc.querySelectorAll('label[for]'))assert.ok(doc.getElementById(label.getAttribute('for')));
  const engine=createJavascriptEngine(QuickJS,dom,{code:l.example_javascript,html:l.example_html,css:l.example_css,rules:{tailwindPreview:true,dom_checks:l.validation_rules.tailwind.dom_checks}});engines.push(engine);
  const result=engine.snapshot();assert.ok(result.domChecks.every(c=>c.passed));
  const css=await compileTailwind({html:result.html,source:l.example_html+'\n'+l.example_javascript,css:l.example_css});assert.ok(css.includes('font-weight'));assert.ok(css.length<1000000);
  if(i===3){assert.ok(css.includes('.md\\:grid-cols-2'));assert.ok(css.includes('.lg\\:grid-cols-3'));}
  if(i===6){assert.ok(css.includes('peer-invalid'));assert.ok(css.includes('group-hover'));}
  if(i===10)assert.ok(css.includes('prefers-reduced-motion'));
  if(i===12)assert.ok(css.includes('--color-school-primary'));
  if(i===14)assert.ok(css.includes('data-state="ready"'));
  console.log('PASS '+(i+1)+': '+l.title);
 }
 let runtime=engines[14],doc=documentFrom(runtime.snapshot());let result=runtime.event({type:'click',key:doc.getElementById('themeToggle').getAttribute('data-codelab-key'),fields:fields(doc)});assert.ok(documentFrom(result).getElementById('themeRoot').classList.contains('dark'));assert.equal(documentFrom(result).getElementById('themeToggle').getAttribute('aria-pressed'),'true');
 runtime=engines[15];doc=documentFrom(runtime.snapshot());result=runtime.event({type:'change',key:doc.getElementById('statusSelect').getAttribute('data-codelab-key'),fields:fields(doc,{statusSelect:'graduated'})});assert.equal(documentFrom(result).getElementById('statusBadge').textContent,'Graduated');assert.ok(documentFrom(result).getElementById('statusBadge').classList.contains('bg-indigo-100'));
 runtime=engines[17];doc=documentFrom(runtime.snapshot());result=runtime.event({type:'click',key:doc.getElementById('addStudentButton').getAttribute('data-codelab-key'),fields:fields(doc)});doc=documentFrom(result);assert.equal(doc.getElementById('studentModal').hidden,false);
 result=runtime.event({type:'submit',key:doc.getElementById('studentForm').getAttribute('data-codelab-key'),fields:fields(doc,{recordName:'Practice Student',recordCourse:'IT',recordGrade:'88',courseFilter:'',sortOrder:'name'})});doc=documentFrom(result);assert.equal(doc.getElementById('studentCount').textContent,'4');assert.equal(doc.getElementById('studentModal').hidden,true);assert.ok(doc.getElementById('statusMessage').textContent.includes('memory only'));
 result=runtime.event({type:'input',key:doc.getElementById('studentSearch').getAttribute('data-codelab-key'),fields:fields(doc,{studentSearch:'zz-none',courseFilter:'',sortOrder:'name'})});assert.ok(documentFrom(result).getElementById('listStatus').textContent.includes('No students match'));
 const security=createJavascriptEngine(QuickJS,dom,{code:'console.log(typeof parent,typeof document.cookie,typeof process,typeof postMessage);',rules:{tailwindPreview:true}});engines.push(security);assert.equal(security.snapshot().output,'undefined undefined undefined undefined\n');
 await assert.rejects(()=>compileTailwind({html:'<main></main>',css:'@import "https://example.test/evil.css";'}));
 await assert.rejects(()=>compileTailwind({html:'<main></main>',css:'@plugin "untrusted";'}));
 console.log('All examples compile with installed Tailwind; DOM, themes, complete mappings, mock CRUD, empty state and isolation checks passed. Native layout/focus/pseudo-states require browser verification.');
}finally{for(const engine of engines)engine.dispose();}
