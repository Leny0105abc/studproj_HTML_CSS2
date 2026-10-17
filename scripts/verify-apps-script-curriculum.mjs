import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const lessons=JSON.parse(await readFile('database/data/apps-script-course.json','utf8'));
assert.equal(lessons.length,18);
for(const [index,lesson] of lessons.entries()){
 new vm.Script(lesson.example_apps_script,{filename:`lesson-${index+1}.gs`}); // syntax only, no Google service execution
 assert.equal(lesson.position,index+1);
 assert.equal(lesson.level,['Beginner','Intermediate','Advanced'][Math.floor(index/6)]);
 for(const key of ['workspace_setup','form_setup','sheet_setup','authorization_note','quota_note','expected_result'])assert.ok(lesson[key].length>20,`${lesson.title}: ${key}`);
 assert.equal(lesson.quiz.length,5);
 for(const question of lesson.quiz){assert.equal(new Set(question.choices).size,4);assert.ok(Number.isInteger(question.answer)&&question.answer>=0&&question.answer<=3);}
 if(lesson.is_project)assert.equal(Object.values(lesson.rubric).reduce((sum,value)=>sum+value,0),100);
 assert.doesNotMatch(lesson.example_apps_script,/addFileUploadItem|setShuffleOptions|setSharing\(|Access\.ANYONE|['"][A-Za-z0-9_-]{35,}['"]/);
 console.log(`PASS ${index+1}: JavaScript syntax, setup/permission/quota notes, and quiz/rubric structure — ${lesson.title}`);
}
assert.equal(lessons.filter(lesson=>lesson.is_project).length,3);
// Only pure, authored helpers are called in Node's isolated context. No fake Google service is supplied.
const dynamic=vm.createContext({});
new vm.Script(lessons[10].example_apps_script).runInContext(dynamic,{timeout:1000});
assert.equal(vm.runInContext(`validateQuestionRows([['Preferred language','MULTIPLE_CHOICE','JS','Python','','',true]])[0].choices.length`,dynamic,{timeout:1000}),2);
assert.throws(()=>vm.runInContext(`validateQuestionRows([['Bad','UNKNOWN','','','','',true]])`,dynamic,{timeout:1000}),/Unsupported/);
assert.throws(()=>vm.runInContext(`validateQuestionRows([['Bad','CHECKBOX','JS','JS','','',true]])`,dynamic,{timeout:1000}),/Unique/);
const quiz=vm.createContext({});
new vm.Script(lessons[12].example_apps_script).runInContext(quiz,{timeout:1000});
assert.equal(vm.runInContext(`validateQuizRows([['Q','a','b','c','d','B',2,'Feedback']])[0].correctIndex`,quiz,{timeout:1000}),1);
assert.throws(()=>vm.runInContext(`validateQuizRows([['Q','a','b','c','d','Z',2,'']])`,quiz,{timeout:1000}),/Invalid/);
assert.throws(()=>vm.runInContext(`validateQuizRows([['Q','a','a','c','d','A',2,'']])`,quiz,{timeout:1000}),/Invalid/);
assert.throws(()=>vm.runInContext(`validateQuizRows([['Q','a','b','c','d','A',0,'']])`,quiz,{timeout:1000}),/Invalid/);
for(let index=0;index<20;index++)assert.equal(vm.runInContext(`shuffledCopy([{value:'a',correct:false},{value:'b',correct:true},{value:'c',correct:false}]).find(choice=>choice.correct).value`,quiz,{timeout:1000}),'b');
const safe=vm.createContext({});
new vm.Script(lessons[16].example_apps_script).runInContext(safe,{timeout:1000});
assert.equal(vm.runInContext(`safeSheetCell('=IMPORTXML("example","x")')`,safe,{timeout:1000}),"'=IMPORTXML(\"example\",\"x\")");
assert.equal(vm.runInContext(`safeSheetCell('  =1+1')`,safe,{timeout:1000}),"'  =1+1");
assert.equal(vm.runInContext('safeSheetCell(42)',safe,{timeout:1000}),42);
// Capture the literal template patterns without running createPracticePDF or any Google methods.
const patterns=[...lessons[15].example_apps_script.matchAll(/body\.replaceText\(('(?:[^'\\]|\\.)*')/g)].map(match=>vm.runInNewContext(match[1],{}, {timeout:1000}));
assert.equal(patterns.length,3);
for(const [index,name] of ['NAME','STUDENT_NUMBER','STATUS'].entries()) assert.ok(new RegExp(patterns[index]).test('{{'+name+'}}'),'Template replacement pattern '+name);
assert.match(lessons[7].example_apps_script,/e\.response/);
assert.match(lessons[7].example_apps_script,/getTriggerSourceId/);
assert.match(lessons[7].example_apps_script,/finally \{ lock\.releaseLock\(\); \}/);
assert.match(lessons[9].example_apps_script,/SEND_TEST_EMAIL/);
assert.match(lessons[9].example_apps_script,/DRY RUN/);
assert.match(lessons[13].example_apps_script,/PENDING_GRADING/);
assert.match(lessons[13].example_apps_script,/DUPLICATE/);
assert.match(lessons[12].example_apps_script,/createChoice\(choice.value, choice.correct\)/);
assert.equal(5/5*100,100);assert.equal(2/5*100,40);
console.log('PASS pure bank validation, correctness-preserving shuffle, literal Sheet text, template patterns, and documented trigger/mail/grade guards. No Google services, email, triggers, sharing, or OAuth were executed. Syntax and pure-function checks are not live Google integration verification.');
