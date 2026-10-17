import { readFile, writeFile } from 'node:fs/promises';
import { getQuickJS } from 'quickjs-emscripten';
import { createJavascriptEngine } from '../resources/js/javascript-engine.js';
const commonHtml =
    '<main><h1>JavaScript practice</h1><div id="output" role="status"></div></main>';
const commonCss =
    'body{font:16px system-ui;margin:20px;color:#172554} main{max-width:650px;margin:auto} label{display:block;margin-top:12px} input,button,select{font:inherit;padding:8px;margin:6px 0} button{background:#4338ca;color:white;border:0;border-radius:6px;cursor:pointer} table{border-collapse:collapse;width:100%} th,td{padding:8px;border:1px solid #cbd5e1}';
const items = [];
const add = (title, topics, explanation, code, activity, facts, extra = {}) =>
    items.push({ title, topics, explanation, code, activity, facts, ...extra });
add(
    'Introduction, Variables, and Data Types',
    'JavaScript uses; HTML/CSS/JS; script tags and external files; let/const/var; names and reassignment; strings, numbers, booleans, null, undefined, arrays, objects; typeof and conversion',
    'JavaScript adds behavior to web pages: HTML provides structure and CSS provides presentation. In a normal page, use <script src="main.js" defer></script> to load an external script after parsing; this lab loads its JavaScript editor separately in an interpreter. Prefer const for bindings you do not reassign and let when reassignment is needed. var is function-scoped and has older hoisting behavior. Names are case-sensitive identifiers and cannot be reserved words. Arrays store ordered values; objects group named properties. typeof gives type information, with historical exceptions: typeof null is "object" and arrays also report "object"; use Array.isArray for arrays. Number(text) converts numeric text; validate conversion before calculation.',
    'const studentName="Maria";\nconst course="BS Information Technology";\nlet yearLevel=1;\nlet grade=95.5;\nconsole.log(studentName);\nconsole.log(course);\nconsole.log(yearLevel,grade);\nconsole.log(typeof grade);\ndocument.getElementById("output").textContent=studentName+" — "+course;',
    'Declare student name, course, year level, and grade with appropriate let/const bindings. Log each value and its type, demonstrate one legitimate reassignment, and explain how HTML, CSS, and JavaScript cooperate.',
    [
        [
            'What does JavaScript add to a web page?',
            'Behavior and interaction',
            'Only document structure',
        ],
        [
            'Which binding should be preferred without reassignment?',
            'const',
            'var is always required',
        ],
        ['Which type does typeof 95.5 report?', 'number', 'integer'],
        [
            'How should arrays be identified?',
            'Array.isArray(value)',
            'typeof value === "array"',
        ],
        [
            'Can a const object have a property updated?',
            'Yes; the binding remains fixed',
            'No; const deeply freezes everything',
        ],
    ],
);
add(
    'Input, Output, and Operators',
    'console.log; alert; prompt; DOM textContent/innerHTML; numeric conversion; arithmetic, assignment, comparisons, logic, increments; precedence; == versus ===',
    'console.log prints values, alert normally displays a dialog, and prompt normally returns a string or null on cancellation. Here prompt consumes the JSON prompts array and alert prints a labeled console message, avoiding browser dialogs. Convert numeric text with Number and reject blank/canceled/non-finite values. + adds numbers but can concatenate strings. %, **, compound assignments, increments, comparisons, and logical operators support calculations and conditions. == can coerce types; === compares without that coercion and is the usual modern preference. Parentheses clarify precedence. Use textContent for untrusted text. innerHTML parses markup and requires careful sanitization in real applications.',
    'const first=prompt("First number");\nconst second=prompt("Second number");\nconst operation=prompt("Operation (+, -, *, /)");\nconst a=Number(first),b=Number(second);\nif(first===null||second===null||!first.trim()||!second.trim()||!Number.isFinite(a)||!Number.isFinite(b)){console.log("Invalid numbers");}\nelse {let result;switch(operation){case "+":result=a+b;break;case "-":result=a-b;break;case "*":result=a*b;break;case "/":result=b===0?"Cannot divide by zero":a/b;break;default:result="Unsupported operation";}console.log("Result:",result);document.getElementById("output").textContent="Result: "+result;}\nconsole.log(5=="5",5==="5");',
    'Build a two-number calculator with a selected operation. Validate canceled/blank/non-numeric inputs and division by zero. Demonstrate strict versus coercing equality and safe text output.',
    [
        [
            'What does prompt normally return?',
            'A string or null',
            'Always a number',
        ],
        [
            'What converts numeric input text?',
            'Number(value)',
            'Appending another string',
        ],
        [
            'What does === avoid?',
            'Type coercion during equality comparison',
            'All comparisons',
        ],
        [
            'What is safest for displaying untrusted text?',
            'textContent',
            'Unsanitized innerHTML',
        ],
        [
            'What should division by zero trigger?',
            'A handled validation message',
            'A silent successful grade',
        ],
    ],
    { input: { prompts: ['12', '4', '/'] } },
);
add(
    'Conditional Statements',
    'if/else if/else; switch; ternary; nested, comparison, and logical conditions; grade validation',
    'Conditions choose a branch based on a boolean expression. An else-if chain should check grade bands from highest to lowest: 90–100 Excellent, 85 to below 90 Very Good, 80 to below 85 Good, 75 to below 80 Passed, and below 75 Failed. First reject values outside 0–100 and non-finite values; fractional grades belong to continuous ranges. switch is suitable for discrete choices and normally needs break to avoid fall-through. A ternary selects one of two expressions. Nested conditions can be useful, but clear early validation usually improves readability.',
    'const grade=Number(prompt("Grade (0–100)"));\nlet description;\nif(!Number.isFinite(grade)||grade<0||grade>100)description="Invalid grade";\nelse if(grade>=90)description="Excellent";\nelse if(grade>=85)description="Very Good";\nelse if(grade>=80)description="Good";\nelse if(grade>=75)description="Passed";\nelse description="Failed";\nconsole.log(description);\ndocument.getElementById("output").textContent=description;',
    'Write a grade evaluator covering all five categories. Reject canceled/blank inputs and out-of-range grades. Test 0, 74.9, 75, 80, 85, 90, 100, -1, 101, and non-numeric input. Compare an if chain with a ternary for pass/fail.',
    [
        [
            'What should be checked before grade bands?',
            'Validity and the 0–100 range',
            'Only whether the name is long',
        ],
        [
            'Why check the highest band first?',
            'Prevent a lower band capturing it',
            'Force every branch to run',
        ],
        ['What usually stops switch fall-through?', 'break', 'continue'],
        [
            'What selects between two expressions?',
            'A ternary operator',
            'A CREATE TABLE statement',
        ],
        ['Which category includes 89.5?', 'Very Good', 'Excellent'],
    ],
    { input: { prompts: ['89.5'] } },
);
add(
    'Loops and Arrays',
    'for; while; do...while; break/continue; nested loops; for...of; arrays, indexing, length, push/pop/shift/unshift; statistics',
    'Arrays use zero-based indices and length counts their elements. push/pop operate at the end; unshift/shift operate at the beginning. for uses initialization, condition, and update; while checks before each iteration, and do...while runs at least once. for...of reads values directly. break ends a loop and continue skips to its next iteration. Nested loops multiply work, so keep bounds small. Validate an empty grade array before dividing by length. Total, average, minimum, and maximum can all be computed in one pass rather than repeatedly scanning data.',
    'const grades=[88,92,75,95];\ngrades.push(90);\nlet total=0,highest=grades[0],lowest=grades[0];\nfor(const grade of grades){total+=grade;if(grade>highest)highest=grade;if(grade<lowest)lowest=grade;}\nconsole.log("Count:",grades.length);\nconsole.log("Total:",total,"Average:",total/grades.length);\nconsole.log("Highest:",highest,"Lowest:",lowest);',
    'Store at least five valid grades in an array. Calculate total, average, highest, and lowest using a loop. Demonstrate array updates and each end-operation, and handle an empty array safely. Include a small while/do-while comparison and a bounded nested-loop example.',
    [
        ['Where does an array begin indexing?', '0', '1'],
        ['What adds an item at the end?', 'push', 'shift'],
        ['Which loop runs at least once?', 'do...while', 'while always'],
        ['What skips the current loop iteration?', 'continue', 'return always'],
        [
            'What must be checked before averaging?',
            'The array is nonempty',
            'The browser color',
        ],
    ],
);
add(
    'Functions',
    'declarations, calls, parameters/arguments, return, expressions, arrow functions, local scope, reuse',
    'Functions package a reusable operation. Parameters are named placeholders in a definition; arguments are values supplied in a call. return sends a result back and stops execution of that function. A function without a return produces undefined. Function expressions can be assigned to a binding, and arrow functions provide concise syntax; their this behavior differs from ordinary functions. Local let/const bindings are limited to their scope. Keep calculation functions separate from formatting and DOM updates so they can be tested independently.',
    'function calculateAverage(total,count){if(count<=0)throw new Error("Count must be positive");return total/count;}\nconst isPassing=average=>average>=75;\nconst formatResult=(name,average)=>`${name}: ${average.toFixed(2)} — ${isPassing(average)?"Passed":"Failed"}`;\nconst result=formatResult("Maria",calculateAverage(270,3));\nconsole.log(result);\ndocument.getElementById("output").textContent=result;',
    'Write separate reusable functions for averaging, pass/fail classification, and formatted student results. Use parameters and returns, demonstrate a function expression and arrow function, and test zero count and exact passing boundaries.',
    [
        [
            'What is a parameter?',
            'A named placeholder in a definition',
            'Only the displayed output',
        ],
        [
            'What is an argument?',
            'A supplied call value',
            'The function keyword',
        ],
        [
            'What does return provide?',
            'A result to the caller',
            'A browser notification automatically',
        ],
        ['What results from no return?', 'undefined', 'Always zero'],
        [
            'Why separate calculations from DOM updates?',
            'Independent testing and reuse',
            'To make functions unavailable',
        ],
    ],
);
const gradeHtml =
    '<main><h1>Student Grade Calculator</h1><form id="grade-form"><label for="student-name">Student name</label><input id="student-name" value="Maria" required><label for="grades">Grades separated by commas</label><input id="grades" value="90,95,85" required><button type="submit" id="calculate">Calculate</button></form><pre id="output" role="status"></pre></main>';
const gradeCode = `function summarize(grades){if(!grades.length||grades.some(g=>!Number.isFinite(g)||g<0||g>100))throw Error("Enter grades from 0 to 100");let total=0;for(const grade of grades)total+=grade;return {total,average:total/grades.length,highest:Math.max(...grades),lowest:Math.min(...grades)};}
function calculate(){try{const name=document.getElementById("student-name").value.trim();const raw=document.getElementById("grades").value;if(!name||!raw.trim()||raw.split(",").some(v=>!v.trim()))throw Error("Name and grades are required");const grades=raw.split(",").map(Number);const result=summarize(grades);const text=name+"\\nTotal: "+result.total+"\\nAverage: "+result.average.toFixed(2)+"\\nStatus: "+(result.average>=75?"Passed":"Failed")+"\\nHighest: "+result.highest+"\\nLowest: "+result.lowest;document.getElementById("output").textContent=text;console.log(text);}catch(error){document.getElementById("output").textContent=error.message;}}
document.getElementById("grade-form").addEventListener("submit",event=>{event.preventDefault();calculate();});
calculate();`;
add(
    'Beginner Project — Student Grade Calculator',
    'name and grade inputs; arrays; total/average/pass-fail/extrema; formatted output; validation and tests',
    'Combine the Beginner skills into a small grade calculator. Plan inputs, validation, a reusable statistics function, classification, and output before connecting the form. The sample uses Maria with 90, 95, and 85: total 270, mean 90, highest 95, lowest 85, Passed. Every grade must be finite and in range; empty comma-separated entries are invalid. Teacher review evaluates original work and testing, not merely whether the example prints.',
    gradeCode,
    'Build an HTML form for a student name and multiple grades. Store grades in an array; calculate total, average, highest, lowest, and pass/fail with reusable functions and a loop. Display a formatted result safely. Develop in this order: inputs → validation → calculation → formatting → event handler. Test blank name/grades, a single grade, 0/100, negative/over-100/non-numeric values, decimal values, empty entries, and the 75 passing boundary. Save all three files and submit for review.',
    [
        ['What stores several grades?', 'An array', 'Only one scalar variable'],
        [
            'What validates all grades?',
            'Finite values within 0–100',
            'Ignoring invalid entries silently',
        ],
        [
            'What produces the sample mean?',
            '270 divided by 3',
            'The highest grade alone',
        ],
        [
            'What should the calculate function return?',
            'A reusable summary',
            'An application password',
        ],
        [
            'What completes the project?',
            'Passed quiz and teacher approval',
            'Run alone',
        ],
    ],
    { html: gradeHtml, project: true },
);
add(
    'Objects, JSON, and Destructuring',
    'properties/methods; dot/bracket access; nested objects; JSON parse/stringify; destructuring; spread; shallow copies',
    'Objects group named data and behavior. Access known property names with dot notation and dynamic names with brackets. Destructuring extracts values, while spread makes a shallow copy: nested objects are still shared unless copied separately. JSON is a text interchange format, not executable JavaScript; stringify serializes suitable values and parse reads JSON text, which may be invalid and needs error handling. Functions, undefined properties, and circular structures are not ordinary JSON data. Validate the shape of parsed records before using them.',
    'const student={id:1,name:"Maria",course:"IT",grades:[90,95,85]};\nconst {name,course}=student;\nconst updated={...student,course:"Computer Science"};\nconst restored=JSON.parse(JSON.stringify(updated));\nconsole.log(name,course);\nconsole.log(restored.name,restored.course);',
    'Create and update student objects, destructure fields, serialize/restore a record, and validate malformed JSON. Demonstrate how a shallow copy can still share a nested grades array.',
    [
        [
            'How can a dynamic property be read?',
            'Bracket notation',
            'Only a fixed dot name',
        ],
        [
            'What does JSON.stringify produce?',
            'JSON text',
            'A database connection',
        ],
        [
            'What does JSON.parse require?',
            'Valid JSON text',
            'Any JavaScript statement',
        ],
        [
            'What kind of copy does object spread make?',
            'Shallow',
            'Automatically deep',
        ],
        [
            'What should follow parsing untrusted JSON?',
            'Shape and value validation',
            'Executing it with eval',
        ],
    ],
);
add(
    'Array Methods and Callbacks',
    'forEach; map; filter; find; some/every; reduce; sorting; callbacks; mutation',
    'Callbacks let another function invoke your behavior. map creates transformed values, filter keeps matches, find returns the first matching value or undefined, and reduce accumulates a result. some tests any match; every tests all and is true on an empty array. forEach is for side effects, not producing a mapped result. sort mutates its array and defaults to string comparison; copy first and supply (a,b)=>a-b for ascending numbers. Choose operations that express the report clearly and check empty inputs.',
    'const students=[{name:"Ana",grade:88},{name:"Ben",grade:72},{name:"Cara",grade:95}];\nconst passing=students.filter(s=>s.grade>=75).map(s=>s.name);\nconst mean=students.reduce((sum,s)=>sum+s.grade,0)/students.length;\nconst ordered=[...students].sort((a,b)=>b.grade-a.grade);\nconsole.log(passing.join(", "));\nconsole.log("Average:",mean.toFixed(2));\nconsole.log(ordered.map(s=>s.name).join(", "));',
    'Filter passing students, map formatted labels, find a chosen record, check validity with every, calculate an average with reduce, and sort a copied list numerically without changing the original.',
    [
        [
            'What transforms each item into a new array?',
            'map',
            'forEach returns mapped values',
        ],
        ['What keeps matching elements?', 'filter', 'reduce always'],
        [
            'What can find return when unmatched?',
            'undefined',
            'Always an empty array',
        ],
        [
            'How should numbers be sorted ascending?',
            'A numeric comparator',
            'Default string sorting always',
        ],
        [
            'What does sort modify?',
            'The array it is called on',
            'Only a separate hidden copy',
        ],
    ],
);
add(
    'DOM Selection and Manipulation',
    'document; getElementById/querySelector/querySelectorAll; textContent; innerHTML safety; createElement; append/remove; attributes; classList; style',
    'The DOM represents an HTML document as objects. getElementById selects an ID; querySelector selects the first CSS match; querySelectorAll returns matching nodes. Missing selections return null, so confirm the markup before accessing a property. Create elements and set textContent for safe data insertion. appendChild inserts nodes and remove deletes them; setAttribute, classList, and style update appearance. innerHTML parses markup and should not receive untrusted text without sanitization. This lab uses a practice DOM model and renders its result in an isolated preview; browser layout, canvas, and navigation APIs are not included.',
    'const names=["Ana","Ben","Cara"];\nconst list=document.getElementById("students");\nfor(const name of names){const li=document.createElement("li");li.textContent=name;list.appendChild(li);}\ndocument.querySelector("h1").classList.add("highlight");\nconsole.log("Rendered",document.querySelectorAll("li").length,"students");',
    'Render student names into a list using createElement and textContent. Update attributes and a class, remove a temporary item, and safely display a name containing HTML-looking text.',
    [
        [
            'What does querySelector return?',
            'The first match or null',
            'Every matching element always',
        ],
        [
            'What safely inserts a student name?',
            'textContent',
            'Unsanitized innerHTML',
        ],
        [
            'What creates a new DOM element?',
            'document.createElement',
            'JSON.stringify',
        ],
        ['What changes classes conveniently?', 'classList', 'An SQL index'],
        [
            'What is outside this practice DOM?',
            'Browser layout measurement',
            'Common element selection',
        ],
    ],
    { html: '<main><h1>Student list</h1><ul id="students"></ul></main>' },
);
add(
    'Events, Forms, and Validation',
    'addEventListener; click/input/change/submit; event target; bubbling/delegation; preventDefault; input values; validation; safe output',
    'Events connect user interaction with program behavior. addEventListener registers a callback; event.target identifies the source and bubbling lets ancestors observe child events. Delegation uses one ancestor listener for changing lists. submit is the appropriate form event and preventDefault avoids normal navigation. Input values are strings; validate them before conversion. Use accessible labels and clear feedback, and keep validation separate from the DOM handler. Client validation improves usability; real servers must validate again. The preview forwards basic events into the practice DOM.',
    'document.getElementById("student-form").addEventListener("submit",event=>{event.preventDefault();const name=document.getElementById("name").value.trim();const raw=document.getElementById("grade").value;const grade=Number(raw);const valid=name&&raw.trim()&&Number.isFinite(grade)&&grade>=0&&grade<=100;document.getElementById("output").textContent=valid?`${name}: ${grade>=75?"Passed":"Failed"}`:"Enter a name and valid grade";console.log(valid?"Valid submission":"Invalid input");});\nconsole.log("Form ready");',
    'Build a labeled student form with name and grade fields. Handle submit, reject blank/out-of-range input, show a safe result, and demonstrate a delegated click or input handler.',
    [
        [
            'What registers an event listener?',
            'addEventListener',
            'CREATE EVENT',
        ],
        [
            'What identifies the original event source?',
            'event.target',
            'The array length',
        ],
        [
            'What prevents normal form navigation?',
            'preventDefault',
            'JSON.parse',
        ],
        ['What type is an input value?', 'String', 'Always number'],
        ['Does client validation replace server validation?', 'No', 'Yes'],
    ],
    {
        html: '<main><h1>Grade evaluator</h1><form id="student-form"><label for="name">Name</label><input id="name" value="Maria"><label for="grade">Grade</label><input id="grade" value="90"><button id="evaluate" type="submit">Evaluate</button></form><p id="output" role="status"></p></main>',
    },
);
add(
    'Scope, Closures, and Error Handling',
    'block/function scope; lexical scope; closures; callbacks; try/catch/finally; throw; Error; debugging',
    'Lexical scope determines which bindings a function can access based on where it was defined. A closure retains access to its outer bindings after that call finishes, useful for controlled state. let and const are block scoped; var is function scoped. Avoid confusing shadowed names and accidental globals. throw reports invalid operations, try/catch handles expected failures, and finally performs cleanup. Catching every error silently hides defects: present a useful message and preserve debugging context.',
    'function createCounter(){let count=0;return ()=>++count;}\nconst next=createCounter();\nconsole.log(next(),next());\nfunction validateGrade(grade){if(!Number.isFinite(grade)||grade<0||grade>100)throw Error("Grade out of range");return grade;}\ntry{validateGrade(101);}catch(error){console.log(error.message);}finally{console.log("Validation finished");}',
    'Create a closure maintaining a private count, show block scoping, and write a validating function with try/catch/finally. Explain an error rather than silently suppressing it.',
    [
        [
            'What determines lexical scope?',
            'Where code is defined',
            'Only where the browser is opened',
        ],
        [
            'What does a closure retain?',
            'Access to outer bindings',
            'A production session cookie',
        ],
        ['What is the scope of let?', 'Block scope', 'Always global'],
        ['What deliberately reports an error?', 'throw', 'filter'],
        [
            'What should an expected error handler provide?',
            'Useful feedback',
            'Silent success',
        ],
    ],
);
const recordsHtml =
    '<main><h1>Student Records</h1><form id="record-form"><label for="record-name">Name</label><input id="record-name"><label for="record-grade">Grade</label><input id="record-grade"><button type="submit" id="add-record">Add student</button></form><label for="search">Search name</label><input id="search"><ul id="records"></ul><p id="summary"></p><p id="output" role="status"></p></main>';
const recordsCode = `const students=[{id:1,name:"Ana",grade:88},{id:2,name:"Ben",grade:72}];let nextId=3;
function render(){const query=document.getElementById("search").value.toLowerCase();const list=document.getElementById("records");list.textContent="";for(const student of students.filter(s=>s.name.toLowerCase().includes(query))){const li=document.createElement("li");li.textContent=student.name+": "+student.grade+" ";const button=document.createElement("button");button.textContent="Delete";button.setAttribute("data-id",String(student.id));li.appendChild(button);list.appendChild(li);}const mean=students.length?students.reduce((sum,s)=>sum+s.grade,0)/students.length:0;document.getElementById("summary").textContent=students.length+" students; average "+mean.toFixed(2);}
document.getElementById("record-form").addEventListener("submit",event=>{event.preventDefault();const name=document.getElementById("record-name").value.trim(),raw=document.getElementById("record-grade").value,grade=Number(raw);if(!name||!raw.trim()||!Number.isFinite(grade)||grade<0||grade>100){document.getElementById("output").textContent="Invalid name or grade";return;}students.push({id:nextId++,name,grade});document.getElementById("output").textContent="Student added";render();});
document.getElementById("search").addEventListener("input",render);
document.getElementById("records").addEventListener("click",event=>{const id=Number(event.target.getAttribute("data-id"));const index=students.findIndex(s=>s.id===id);if(index>=0){students.splice(index,1);render();}});
render();console.log("Student records ready");`;
add(
    'Intermediate Project — Interactive Student Records',
    'objects and arrays; DOM reports; validated forms; search; deletion; grouped state; readable functions; testing',
    'Build an interactive record manager using the Intermediate tools. Keep an array of student objects as the state, a render function as the view, and event handlers as the controller. Stable numeric IDs identify records even when names are duplicated or rows are filtered. Re-render after changes and use delegation for dynamic delete buttons. This practice project keeps fictional data in its lab session and does not write to CodeLab records.',
    recordsCode,
    'Create labeled add/search controls, a student list or table, validated name/grade input, stable IDs, deletion, pass/fail filtering, sorting, and count/average reports. Divide state, validation, and rendering into functions. Add JSON export/import with validation. Test duplicate names, empty lists, missing matches, invalid grades, HTML-looking names, and deleting a filtered row. Document how each handler updates state and display.',
    [
        [
            'What is the source of record state?',
            'An array of student objects',
            'The application users table',
        ],
        [
            'Why use stable IDs?',
            'Distinguish records independently of names',
            'To sort every record alphabetically',
        ],
        [
            'What handles dynamic delete buttons conveniently?',
            'Event delegation',
            'A separate database trigger',
        ],
        [
            'What follows a state change?',
            'Render updated output',
            'Assume the old list changes itself',
        ],
        [
            'What should imported JSON receive?',
            'Shape and value validation',
            'Unrestricted eval',
        ],
    ],
    { html: recordsHtml, project: true },
);
add(
    'Modern JavaScript Modules and Classes',
    'named/default exports; imports; module scope; classes; constructor; methods; instances; encapsulation; composition',
    'Modules organize code into explicit imports and exports and use strict mode. Named exports use braces in an import; a default export has its own import name. Classes define constructors and shared methods for instances; they do not replace all useful functions. Keep validation near the data and prefer clear composition over unnecessary inheritance. This lab resolves only local .js modules supplied in Lab inputs or lesson fixtures; it never downloads modules from the web. Enter a modules object to experiment with your own ./math.js source.',
    'import {average} from "./math.js";\nclass Student{constructor(name,grades){this.name=name;this.grades=[...grades];}report(){return `${this.name}: ${average(this.grades).toFixed(2)}`;}}\nconst student=new Student("Maria",[90,95,85]);\nconsole.log(student.report());',
    'Create a local module exporting a calculation helper, import it into main.js, and build a Student class with constructor validation and a reporting method. Demonstrate a default export in a separate local module and explain class versus function choices.',
    [
        ['What exposes a named module binding?', 'export', 'console.log alone'],
        ['What references another module?', 'import', 'DECLARE'],
        ['What initializes a class instance?', 'constructor', 'querySelector'],
        [
            'Where does this lab load modules from?',
            'Provided local module text',
            'Unrestricted remote URLs',
        ],
        ['Do classes replace every function?', 'No', 'Yes'],
    ],
    {
        rules: {
            module: true,
            modules: {
                './math.js':
                    'export function average(values){if(!values.length)throw Error("No values");return values.reduce((sum,value)=>sum+value,0)/values.length;}',
            },
        },
    },
);
add(
    'Asynchronous JavaScript',
    'callbacks; event loop; promises; then/catch/finally; async/await; microtasks; timers; failure handling',
    'Asynchronous programming describes operations that complete later without blocking ordinary UI work. Promises represent pending fulfillment or rejection; then/catch attach handlers, and async functions return promises. await waits within an async function; errors should be handled with try/catch or a returned catch chain. Promise jobs are microtasks and normally run before queued timer callbacks. The lab advances bounded timers in virtual time, so timing examples teach ordering rather than real elapsed delay. Avoid unbounded intervals, endless promise chains, and synchronous loops that block event processing.',
    'console.log("Start");\nsetTimeout(()=>console.log("Timer"),100);\nPromise.resolve("Promise").then(value=>console.log(value));\nasync function load(){const value=await Promise.resolve(90);console.log("Loaded:",value);}\nload().catch(error=>console.error(error.message));\nconsole.log("End");',
    'Write a promise chain and an async/await function, handle a rejected promise, and predict console ordering with a timer and synchronous logs. Use a bounded interval that clears itself and explain virtual versus real timing.',
    [
        [
            'What does an async function return?',
            'A promise',
            'Always a plain string',
        ],
        [
            'What handles promise rejection?',
            'catch or async try/catch',
            'Ignoring it',
        ],
        [
            'Where can await be used here?',
            'Inside an async function',
            'Every ordinary function automatically',
        ],
        [
            'What usually runs before timer tasks?',
            'Promise microtasks',
            'Every future timer',
        ],
        [
            'What should stop a repeating interval?',
            'clearInterval',
            'An unrelated array sort',
        ],
    ],
);
add(
    'Fetch, APIs, and Reliable Data Loading',
    'HTTP requests/status; fetch; JSON responses; async/await; loading/error/empty states; schema validation; mock APIs',
    'fetch normally requests data from an HTTP endpoint and returns a promise for a response. HTTP errors such as 404 or 500 generally require checking response.ok; network failure rejects the promise. Parse response JSON, validate the expected shape, and provide loading, error, and empty states. Never put application secrets in frontend code. For safe reproducible practice, this lab fetch reads named mock fixtures only; there is no live network. A fixture contains status and data, and can be changed in Lab inputs to test failures without contacting a server.',
    'async function loadStudents(){document.getElementById("output").textContent="Loading…";try{const response=await fetch("/api/students");if(!response.ok)throw Error("HTTP "+response.status);const students=await response.json();if(!Array.isArray(students)||students.some(s=>typeof s.name!=="string"))throw Error("Invalid student data");document.getElementById("output").textContent=students.length?students.map(s=>s.name).join(", "):"No students";console.log("Loaded",students.length,"students");}catch(error){document.getElementById("output").textContent="Load failed: "+error.message;console.error(error.message);}}\nloadStudents();',
    'Load fictional students with async/await and a named mock API. Test success, HTTP 500, empty data, malformed data, and an unavailable endpoint. Show loading/error/empty messages and explain how real fetch differs from the lab fixture.',
    [
        [
            'What must be checked for HTTP failure?',
            'response.ok or status',
            'Only promise fulfillment',
        ],
        ['What reads JSON response data?', 'response.json()', 'JSON.eval()'],
        [
            'What should parsed API data receive?',
            'Shape validation',
            'Immediate trusted insertion into innerHTML',
        ],
        [
            'What does lab fetch contact?',
            'Only a provided mock fixture',
            'CodeLab production APIs',
        ],
        [
            'What should an empty response display?',
            'A useful empty state',
            'A silent error every time',
        ],
    ],
    {
        rules: {
            fixtures: {
                '/api/students': {
                    status: 200,
                    data: [
                        { id: 1, name: 'Ana' },
                        { id: 2, name: 'Ben' },
                    ],
                },
            },
        },
    },
);
add(
    'Browser Storage and JavaScript Security',
    'localStorage/sessionStorage; JSON storage; privacy; XSS; safe text; secrets; least privilege; lab isolation',
    'Real localStorage stores origin-scoped strings across browser sessions; sessionStorage has a shorter tab-session lifetime. Store JSON text when suitable, but validate restored values and handle unavailable/quota-limited storage. Neither is secure storage for passwords or tokens against scripts running in the same origin. XSS happens when attacker-controlled text becomes executable markup or script. Prefer textContent and explicit validation. This lab provides temporary virtual storage, reset on Run, with no access to real site cookies or storage; localStorage and sessionStorage use the same practice store here. Production security belongs in the application and server as well as the frontend.',
    'const preferences={sort:"name",showPassing:true};\nlocalStorage.setItem("preferences",JSON.stringify(preferences));\nconst restored=JSON.parse(localStorage.getItem("preferences"));\nconsole.log(restored.sort,restored.showPassing);\nconst name="<img src=x onerror=alert(1)>";\ndocument.getElementById("output").textContent=name;\nconsole.log("Untrusted name displayed as text");',
    'Save and restore non-sensitive preferences as JSON in practice storage, validate them, remove a key, and demonstrate safely displaying HTML-looking text. Explain real storage lifetimes and why passwords/tokens do not belong here.',
    [
        [
            'What type does real localStorage store?',
            'Strings',
            'Arbitrary objects without serialization',
        ],
        [
            'What safely displays HTML-looking names?',
            'textContent',
            'Unsanitized innerHTML',
        ],
        [
            'What should restored preferences receive?',
            'Validation',
            'Automatic trust',
        ],
        [
            'What should not be stored as a preference?',
            'A password or secret token',
            'A non-sensitive sort choice',
        ],
        [
            'What survives a fresh lab Run?',
            'Saved source, not practice storage',
            'All virtual storage automatically',
        ],
    ],
);
add(
    'Testing, Debugging, and Performance',
    'test cases; assertions; boundaries; devtools concepts; stack traces; pure functions; refactoring; DOM efficiency; measured performance',
    'Test functions with known inputs, boundaries, and expected errors. A small assert helper can throw a useful failure instead of printing an unexplained boolean. Separate pure calculations from side effects to make tests easier. Read the first error and stack trace, then check the smallest relevant case. Real browser DevTools offer breakpoints and performance measurements; this interpreter lab provides console/error feedback and does not simulate browser timing or layout. Avoid excessive DOM reconstruction for large interfaces, but measure representative workloads before optimizing.',
    'function average(values){if(!values.length)throw Error("Empty grades");return values.reduce((sum,v)=>sum+v,0)/values.length;}\nfunction assert(condition,message){if(!condition)throw Error(message);}\nassert(average([90,80])===85,"Average calculation");\nassert(average([0,100])===50,"Boundary values");\nlet rejected=false;try{average([]);}catch{rejected=true;}\nassert(rejected,"Empty input should be rejected");\nconsole.log("3 tests passed");',
    'Create assertions for normal, boundary, empty, invalid, and regression cases. Deliberately introduce one bug, interpret its failure, repair it, and document how real DevTools would help. Refactor a repeated calculation without changing results.',
    [
        [
            'What makes an assertion useful?',
            'A checked condition and failure message',
            'An unrelated log',
        ],
        [
            'What should a test suite include?',
            'Normal, boundary, and failure cases',
            'Only one happy path',
        ],
        [
            'What makes pure functions easier to test?',
            'Outputs depend on supplied inputs',
            'Hidden DOM and global changes',
        ],
        [
            'When should optimization be justified?',
            'After correctness and representative measurement',
            'Before understanding the result',
        ],
        [
            'What does this lab provide for debugging?',
            'Console and interpreter errors',
            'Full browser DevTools emulation',
        ],
    ],
);
const finalCode =
    recordsCode +
    `\nasync function importStudents(){try{const response=await fetch("/api/students");if(!response.ok)throw Error("HTTP "+response.status);const incoming=await response.json();if(!Array.isArray(incoming)||incoming.some(s=>typeof s.name!=="string"||!Number.isFinite(s.grade)||s.grade<0||s.grade>100))throw Error("Invalid API data");for(const item of incoming)students.push({id:nextId++,name:item.name,grade:item.grade});localStorage.setItem("students",JSON.stringify(students));render();console.log("Imported",incoming.length,"records");}catch(error){document.getElementById("output").textContent=error.message;}}\ndocument.getElementById("import-students").addEventListener("click",importStudents);\nconsole.log("Final app ready");`;
add(
    'Advanced Project — Student Information Frontend',
    'modular design; records and classes; validation; events; filtering/sorting; reports; async mock API; storage; safe rendering; tests',
    'Develop an integrated student frontend using all three modules. Plan state and stable IDs, validation, rendering, asynchronous data loading, and non-sensitive preferences. Keep school records fictional and local to the sandbox. The example extends the records project with an import button and mock API; your final activity should add original modular structure and tests. Clearly distinguish a practice import from a real authenticated production integration. Document limitations, privacy choices, and test evidence.',
    finalCode,
    'Build a student-record frontend with add/edit/delete, validated grades, search, pass/fail filtering, sorting, count/mean/extrema reports, safe DOM output, a local calculation module, and a class or clearly composed data model. Include async mock API loading with loading/error/empty handling, JSON preference storage, and original assertions. Test all grade boundaries, empty/duplicate-name records, imported malformed data, HTML-looking text, and repeated actions. Submit HTML/CSS/JS plus Lab-input modules/fixtures and a commented design/testing summary. No real school records or credentials.',
    [
        [
            'What separates safe imported data from trusted state?',
            'Validation of every record',
            'Blind assignment',
        ],
        [
            'What should organize the app?',
            'Clear state, validation, rendering, and modules',
            'One unexplained global handler',
        ],
        [
            'What API environment is used for practice?',
            'Named fictional mock fixtures',
            'Production student records',
        ],
        [
            'What provides regression evidence?',
            'Documented assertions and UI cases',
            'A screenshot alone',
        ],
        [
            'What determines completion?',
            'Teacher rubric approval and a passed quiz',
            'A matching example alone',
        ],
    ],
    {
        html: recordsHtml.replace(
            '<label for="search">',
            '<button type="button" id="import-students">Import sample students</button><label for="search">',
        ),
        rules: {
            fixtures: {
                '/api/students': {
                    status: 200,
                    data: [
                        { name: 'Cara', grade: 95 },
                        { name: 'Dan', grade: 80 },
                    ],
                },
            },
        },
        project: true,
    },
);
if (items.length !== 18) throw Error('Expected eighteen lessons');
const QuickJS = await getQuickJS(),
    dom = await readFile('public/javascript-runtime/dom.js', 'utf8');
const output = items.map((item, index) => {
    const html = item.html ?? commonHtml,
        css = commonCss,
        rules = {
            ...item.rules,
            sample_input: JSON.stringify(item.input ?? {}, null, 2),
        };
    const engine = createJavascriptEngine(QuickJS, dom, {
        code: item.code,
        html,
        css,
        input: rules.sample_input,
        rules,
    });
    let result;
    try {
        result = engine.snapshot();
    } finally {
        engine.dispose();
    }
    const quiz = item.facts.map(([question, correct, wrong], q) => {
        const choices = [
                ...new Set([
                    correct,
                    wrong,
                    ...item.facts
                        .filter((_, i) => i !== q)
                        .flatMap((f) => [f[1], f[2]]),
                ]),
            ].slice(0, 4),
            answer = (index + q) % 4;
        return {
            question,
            choices: choices
                .slice(4 - answer)
                .concat(choices.slice(0, 4 - answer)),
            answer,
            explanation: correct + '. ' + item.explanation.split('. ')[0] + '.',
        };
    });
    return {
        title: item.title,
        level: ['Beginner', 'Intermediate', 'Advanced'][Math.floor(index / 6)],
        position: index + 1,
        is_project: !!item.project,
        objectives:
            index === 0
                ? [
                      'Explain the purpose of JavaScript.',
                      'Declare variables using let and const.',
                      'Identify common JavaScript data types.',
                      'Use typeof to inspect values.',
                  ]
                : [
                      'Explain ' + item.topics + '.',
                      'Write and test an original JavaScript activity.',
                      'Check errors, safety, and the practice-browser limitations.',
                  ],
        introduction:
            'Learn ' +
            item.topics +
            '. Practice the example, then write your own activity.',
        explanation: item.explanation,
        syntax: item.code,
        example_javascript: item.code,
        starter_javascript:
            index === 0
                ? item.code
                : '// ' +
                  item.title +
                  '\n// Write your original solution below.\n',
        starter_html: html,
        starter_css: css,
        example_html: html,
        example_css: css,
        guided_practice:
            'Load the example into the editor, inspect HTML/CSS and the Lab inputs JSON, run it, and compare the console and preview. Change one value and predict the result. For forms, interact with the preview. Each Run starts fresh.',
        activity: item.activity,
        expected_result:
            'Example console output:\n' +
            result.output +
            '\nInspect the interactive preview as well. Event-driven examples may produce additional output after interaction.',
        important_notes:
            'Common mistakes: ' +
            item.facts
                .slice(0, 2)
                .map((f) => f[2])
                .join('; ') +
            '. Check quotes, brackets, selector IDs, conversions, and empty values. Run does not save work or award completion.',
        security_note:
            'Use fictional data, validate inputs, and render untrusted values with textContent. This isolated interpreter has no application session, host files, or live network; DOM, storage, timers, and API fixtures are educational models. Save source and submit for teacher review.',
        debugging_tip:
            'Read the first syntax/runtime error, inspect types and input values, and test one small case. Check HTML IDs before DOM access. Prompt inputs come from JSON; modules and API fixtures must be supplied locally.',
        challenge: item.project
            ? 'Add an original feature and document at least five edge-case tests and one limitation.'
            : 'Add a boundary/failure case and explain its expected outcome.',
        completion_requirements:
            'Save and submit the current HTML/CSS/JavaScript and Lab inputs. Pass the five-question quiz with at least 4/5 and obtain teacher approval; practice output never grants completion.',
        quiz,
        guide: {
            steps: [
                'Read explanation and example.',
                'Run and inspect console/preview.',
                'Write original activity and tests.',
                'Save, submit, and pass quiz for review.',
            ],
        },
        validation_rules: {
            javascript: { ...rules, expected_output: result.output },
        },
        rubric: item.project
            ? {
                  functionality: 30,
                  javascript_concepts: 25,
                  input_validation: 15,
                  interface_and_accessibility: 10,
                  readability: 10,
                  testing: 10,
              }
            : null,
    };
});
await writeFile(
    'database/data/javascript-course.json',
    JSON.stringify(output, null, 2) + '\n',
);
console.log(
    'Authored and ran 18 JavaScript examples; 90 questions; 3 project rubrics.',
);
