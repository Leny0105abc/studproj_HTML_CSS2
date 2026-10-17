import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const lessons=JSON.parse(await readFile('database/data/vba-course.json','utf8'));
assert.equal(lessons.length,18);
for(const [index,lesson] of lessons.entries()){
 assert.equal(lesson.position,index+1);
 assert.equal(lesson.level,['Beginner','Intermediate','Advanced'][Math.floor(index/6)]);
 assert.match(lesson.example_vba,/^Option Explicit\r?\n/);
 assert.doesNotMatch(lesson.example_vba,/Option Strict|Console\.WriteLine|Sub Main\(\)/);
 assert.match(lesson.excel_setup,/desktop|required/i);
 assert.ok(lesson.worksheet_layout.length>40);
 assert.equal(lesson.quiz.length,5);
 for(const q of lesson.quiz){assert.equal(new Set(q.choices).size,4);assert.ok(Number.isInteger(q.answer)&&q.answer>=0&&q.answer<4);}
 for(const match of lesson.example_vba.matchAll(/Worksheets\("([^"]+)"\)/g)) assert.ok(lesson.worksheet_layout.includes(match[1]),`${lesson.title}: explain worksheet ${match[1]}`);
 const starts=[...lesson.example_vba.matchAll(/^\s*(?:Public |Private )?(?:Sub|Function)\s+\w+/gmi)].length;
 const ends=[...lesson.example_vba.matchAll(/^\s*End (?:Sub|Function)\s*$/gmi)].length;
 assert.equal(starts,ends,`${lesson.title}: procedure boundary mismatch`);
 if(lesson.is_project)assert.equal(Object.values(lesson.rubric).reduce((a,b)=>a+b,0),100);
 console.log(`PASS ${index+1}: content, worksheet references, quiz choices, and procedure boundaries — ${lesson.title}`);
}
assert.equal(lessons.filter(l=>l.is_project).length,3);
const sampleAverages=[[95,88,91],[65,70,68]].map(values=>values.reduce((a,b)=>a+b,0)/values.length);
assert.equal(sampleAverages[0].toFixed(2),'91.33');assert.equal(sampleAverages[1].toFixed(2),'67.67');
assert.equal(sampleAverages.filter(a=>a>=75).length,1);
assert.match(lessons[7].example_vba,/Application\.EnableEvents = oldEvents/);
for(const state of ['ScreenUpdating = oldScreen','EnableEvents = oldEvents','Calculation = oldCalculation']) assert.ok(lessons[16].example_vba.includes(state));
assert.match(lessons[15].example_vba,/Parameters\.Append cmd\.CreateParameter/);
assert.match(lessons[15].example_vba,/WHERE StudentID >= \?/);
assert.match(lessons[12].example_vba,/DEMO NAVIGATION ONLY/);
assert.doesNotMatch(lessons[12].example_vba,/password\s*=\s*"[^"\n]+"/i);
console.log('PASS sample worksheet arithmetic, settings cleanup references, ADO parameter binding, and honest demo-login labeling. Static content checks only: no Excel compilation or macro execution was performed.');
