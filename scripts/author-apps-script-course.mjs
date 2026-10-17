import {writeFile} from 'node:fs/promises';
const config=`function requireConfig(key) {
  const value = PropertiesService.getScriptProperties().getProperty(key);
  if (!value || value.startsWith('YOUR_')) throw new Error('Configure practice resource: ' + key);
  return value;
}`;
const draft=`function getPracticeDraft(key, title) {
  const properties = PropertiesService.getScriptProperties();
  const id = properties.getProperty(key);
  if (id) return FormApp.openById(id);
  const form = FormApp.create(title, false); // unpublished practice form
  properties.setProperty(key, form.getId());
  return form;
}`;
const safeCells=`function safeSheetCell(value) {
  if (typeof value !== 'string') return value;
  return /^\\s*[=+\\-@]/.test(value) ? "'" + value : value;
}`;
const registration=`${draft}
function buildRegistration() {
  const form = getPracticeDraft('REGISTRATION_FORM_ID', 'Practice Student Registration');
  if (form.getItems().length) {
    if (form.getItems().length !== 7 || !form.getDestinationId()) throw new Error('Partial/modified registration draft: review and repair it before reuse.');
    PropertiesService.getScriptProperties().setProperty('SPREADSHEET_ID', form.getDestinationId());
    return form.getId(); // reuse only the inspected seven-field linked setup
  }
  form.setDescription('Fictional student records only. Review before publishing.');
  form.setConfirmationMessage('Practice registration recorded.');
  const fields = ['Student Number', 'First Name', 'Last Name'];
  for (const title of fields) form.addTextItem().setTitle(title).setRequired(true);
  form.addTextItem().setTitle('Email').setRequired(true)
      .setValidation(FormApp.createTextValidation().requireTextIsEmail().build());
  form.addListItem().setTitle('Course').setChoiceValues(['IT', 'CS']).setRequired(true);
  form.addListItem().setTitle('Year Level').setChoiceValues(['1', '2', '3', '4']).setRequired(true);
  form.addListItem().setTitle('Section').setChoiceValues(['A', 'B']).setRequired(true);
  form.getItems(FormApp.ItemType.TEXT)[0].asTextItem().setValidation(
      FormApp.createTextValidation().requireTextMatchesPattern('^P[0-9]{3}$')
          .setHelpText('Use a fictional ID such as P001.').build());
  const sheet = SpreadsheetApp.create('Practice Registration Responses');
  form.setDestination(FormApp.DestinationType.SPREADSHEET, sheet.getId());
  PropertiesService.getScriptProperties().setProperty('SPREADSHEET_ID', sheet.getId());
  Logger.log('Draft setup complete; review its title, items, destination, and responder permissions.');
  return form.getId();
}`;
const trigger=`${config}
function ensurePracticeTrigger() {
  const formId = requireConfig('FORM_ID');
  const found = ScriptApp.getProjectTriggers().some(trigger =>
    trigger.getHandlerFunction() === 'onPracticeFormSubmit' &&
    trigger.getTriggerSourceId() === formId &&
    trigger.getEventType() === ScriptApp.EventType.ON_FORM_SUBMIT);
  if (!found) ScriptApp.newTrigger('onPracticeFormSubmit')
      .forForm(FormApp.openById(formId)).onFormSubmit().create();
}
function removePracticeTrigger() {
  const formId = requireConfig('FORM_ID');
  for (const trigger of ScriptApp.getProjectTriggers()) {
    if (trigger.getHandlerFunction() === 'onPracticeFormSubmit' &&
        trigger.getTriggerSourceId() === formId &&
        trigger.getEventType() === ScriptApp.EventType.ON_FORM_SUBMIT) {
      ScriptApp.deleteTrigger(trigger); // only this owner's matching practice trigger
    }
  }
}
function onPracticeFormSubmit(e) {
  if (!e || !e.response) throw new Error('Use a Forms installable submit trigger, not the editor Run button.');
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) throw new Error('Processing busy; review Executions and retry safely.');
  try {
    const spreadsheet = SpreadsheetApp.openById(requireConfig('SPREADSHEET_ID'));
    const sheet = spreadsheet.getSheetByName('Processing') || spreadsheet.insertSheet('Processing');
    if (!sheet.getLastRow()) sheet.appendRow(['Response ID', 'Submitted At', 'Processed At', 'Status']);
    const responseId = e.response.getId();
    const ids = sheet.getLastRow() > 1 ? sheet.getRange(2, 1, sheet.getLastRow()-1, 1).getValues().flat() : [];
    if (ids.includes(responseId)) return; // idempotent record write for repeated events
    sheet.appendRow([responseId, e.response.getTimestamp(), new Date(), 'RECEIVED']);
  } finally { lock.releaseLock(); }
}`;
const email=`function sendPracticeConfirmation() {
  const properties = PropertiesService.getScriptProperties();
  const recipient = properties.getProperty('TEST_RECIPIENT');
  const sendApproved = properties.getProperty('SEND_TEST_EMAIL') === 'true';
  const message = {subject: 'CodeLab practice registration',
    body: 'Fictional student: Maria Santos\\nStatus: RECEIVED\\nSubmitted at: 2026-10-12T00:00:00Z'};
  if (!sendApproved) {
    Logger.log('DRY RUN: confirmation prepared; no email sent.');
    return message;
  }
  if (!recipient || !/^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$/.test(recipient)) throw new Error('Configure one approved TEST_RECIPIENT.');
  if (MailApp.getRemainingDailyQuota() < 1) throw new Error('Mail quota unavailable; defer instead of retrying repeatedly.');
  MailApp.sendEmail({to: recipient, subject: message.subject, body: message.body});
  return {sent: true};
}`;
const questionValidator=`function validateQuestionRows(rows) {
  return rows.filter(row => String(row[0]).trim()).map((row, index) => {
    const title = String(row[0]).trim(), type = String(row[1]).trim().toUpperCase();
    if (!['TEXT','MULTIPLE_CHOICE','CHECKBOX','DROPDOWN'].includes(type)) throw new Error('Unsupported type at row ' + (index+2));
    const choices = row.slice(2,6).map(value => String(value).trim()).filter(Boolean);
    if (type !== 'TEXT' && (choices.length < 2 || new Set(choices).size !== choices.length)) throw new Error('Unique choices required.');
    return {title, type, choices, required: row[6] === true || String(row[6]).toLowerCase() === 'true'};
  });
}`;
const dynamic=`${config}
${draft}
${questionValidator}
function generatePracticeForm() {
  const sheet = SpreadsheetApp.openById(requireConfig('SPREADSHEET_ID')).getSheetByName('Questions');
  if (!sheet || sheet.getLastRow() < 2) throw new Error('Questions data is missing.');
  const rows = sheet.getRange(2,1,sheet.getLastRow()-1,7).getValues();
  const questions = validateQuestionRows(rows); // validate before creating/updating resources
  if (!questions.length) throw new Error('At least one question is required.');
  const form = getPracticeDraft('DYNAMIC_FORM_ID','Practice Dynamic Form');
  if (form.getItems().length) return form.getId(); // change an existing form only in a reviewed migration
  for (const question of questions) {
    let item;
    switch (question.type) {
      case 'TEXT': item = form.addTextItem(); break;
      case 'MULTIPLE_CHOICE': item = form.addMultipleChoiceItem(); break;
      case 'CHECKBOX': item = form.addCheckboxItem(); break;
      case 'DROPDOWN': item = form.addListItem(); break;
    }
    item.setTitle(question.title).setRequired(question.required);
    if (question.type !== 'TEXT') item.setChoiceValues(question.choices);
  }
  return form.getId();
}`;
const quizValidator=`function validateQuizRows(rows) {
  return rows.filter(row => String(row[0]).trim()).map((row, index) => {
    const title = String(row[0]).trim(), choices = row.slice(1,5).map(value => String(value).trim());
    const answer = String(row[5]).trim().toUpperCase(), correctIndex = ['A','B','C','D'].indexOf(answer);
    const points = Number(row[6]);
    if (choices.some(value => !value) || new Set(choices).size !== 4 || correctIndex < 0 || !Number.isInteger(points) || points < 1) {
      throw new Error('Invalid quiz question at row ' + (index+2));
    }
    return {title, choices, correctIndex, points, feedback: String(row[7] || '')};
  });
}
function shuffledCopy(values) {
  const copy = values.slice();
  for (let i = copy.length-1; i > 0; i--) {
    const j = Math.floor(Math.random()*(i+1));
    [copy[i],copy[j]] = [copy[j],copy[i]];
  }
  return copy;
}`;
const quizBuilder=`${config}
${draft}
${quizValidator}
function buildPracticeQuiz() {
  const sheet = SpreadsheetApp.openById(requireConfig('SPREADSHEET_ID')).getSheetByName('QuizBank');
  if (!sheet || sheet.getLastRow() < 2) throw new Error('QuizBank data missing.');
  const questions = validateQuizRows(sheet.getRange(2,1,sheet.getLastRow()-1,8).getValues());
  if (!questions.length) throw new Error('At least one validated question required.');
  const form = getPracticeDraft('QUIZ_FORM_ID','Practice Programming Quiz');
  if (form.getItems().length) return form.getId();
  form.setIsQuiz(true);
  form.addTextItem().setTitle('Student Number').setRequired(true)
      .setValidation(FormApp.createTextValidation().requireTextMatchesPattern('^P[0-9]{3}$').build());
  form.addTextItem().setTitle('Student Name').setRequired(true);
  for (const question of questions) {
    const item = form.addMultipleChoiceItem().setTitle(question.title).setRequired(true).setPoints(question.points);
    const choiceRecords = question.choices.map((value,index) => ({value, correct: index === question.correctIndex}));
    item.setChoices(shuffledCopy(choiceRecords).map(choice => item.createChoice(choice.value, choice.correct)));
    if (question.feedback) item.setFeedbackForCorrect(FormApp.createFeedback().setText(question.feedback).build());
  }
  // FormApp supports whole-form question shuffling, which can also move identification items.
  // This example preserves identification order; option order was shuffled before creation.
  return form.getId();
}`;
const results=`${config}
${safeCells}
function processPracticeResults() {
  const form = FormApp.openById(requireConfig('FORM_ID'));
  const questions = form.getItems(FormApp.ItemType.MULTIPLE_CHOICE)
      .map(item => item.asMultipleChoiceItem()).filter(item => item.getPoints() > 0);
  const maximum = questions.reduce((sum,item) => sum + item.getPoints(), 0);
  if (!maximum) throw new Error('Use a quiz with positive-point multiple-choice questions.');
  const rows = [['Student Number','Student Name','Score','Percentage','Status','Submitted At']];
  const seen = new Set();
  for (const response of form.getResponses().slice().sort((a,b) => a.getTimestamp() - b.getTimestamp())) {
    const answers = Object.fromEntries(response.getItemResponses().map(item => [item.getItem().getTitle(), item.getResponse()]));
    const number = String(answers['Student Number'] || '').trim();
    const name = String(answers['Student Name'] || '').trim();
    let score = 0, pending = false;
    for (const item of response.getGradableItemResponses()) {
      if (item.getItem().getType() !== FormApp.ItemType.MULTIPLE_CHOICE) continue;
      if (item.getItem().asMultipleChoiceItem().getPoints() <= 0) continue;
      const points = item.getScore();
      if (points === null || points === '') pending = true;
      else if (Number.isFinite(Number(points))) score += Number(points);
      else pending = true;
    }
    let status;
    const percentage = pending ? '' : score / maximum * 100;
    if (!/^P[0-9]{3}$/.test(number) || !name) status = 'INVALID';
    else if (seen.has(number)) status = 'DUPLICATE';
    else { seen.add(number); status = pending ? 'PENDING_GRADING' : (percentage >= 75 ? 'PASS' : 'FAIL'); }
    rows.push([safeSheetCell(number),safeSheetCell(name),pending ? '' : score,percentage,status,response.getTimestamp()]);
  }
  const spreadsheet = SpreadsheetApp.openById(requireConfig('SPREADSHEET_ID'));
  const sheet = spreadsheet.getSheetByName('Results') || spreadsheet.insertSheet('Results');
  sheet.getRange(1,1,Math.max(sheet.getLastRow(),rows.length),6).clearContent();
  sheet.getRange(1,1,rows.length,6).setValues(rows);
  return rows.length - 1;
}`;
const docs=`${config}
function createPracticeSummary() {
  const folder = DriveApp.getFolderById(requireConfig('FOLDER_ID')); // owned, restricted My Drive practice folder
  const document = DocumentApp.create('Practice result P001');
  document.getBody().appendParagraph('Fictional student: Maria Santos');
  document.getBody().appendParagraph('Student number: P001; status: RECEIVED');
  document.saveAndClose();
  DriveApp.getFileById(document.getId()).moveTo(folder);
  Logger.log('Summary created. Review folder permissions; no public-sharing API was called.');
  return document.getId();
}`;
const pdf=`${config}
function createPracticePDF() {
  const folder = DriveApp.getFolderById(requireConfig('FOLDER_ID'));
  const template = DriveApp.getFileById(requireConfig('TEMPLATE_DOCUMENT_ID'));
  const fileName = 'Practice_Result_P001.pdf';
  if (folder.getFilesByName(fileName).hasNext()) throw new Error('Result PDF already exists; review before replacing it.');
  const copy = template.makeCopy('Practice result P001', folder);
  const document = DocumentApp.openById(copy.getId());
  const body = document.getBody(); // use a single-tab practice template
  body.replaceText('\\\\{\\\\{NAME\\\\}\\\\}', 'Maria Santos');
  body.replaceText('\\\\{\\\\{STUDENT_NUMBER\\\\}\\\\}', 'P001');
  body.replaceText('\\\\{\\\\{STATUS\\\\}\\\\}', 'COMPLETED PRACTICE');
  document.saveAndClose();
  const pdf = copy.getAs(MimeType.PDF).setName(fileName);
  const saved = folder.createFile(pdf);
  Logger.log('Practice PDF created; folder permissions must remain restricted.');
  return saved.getId();
}`;
const baseSheets=`Student-owned practice resources only. Replace YOUR_SPREADSHEET_ID by the ID of a dedicated Google Sheet, configured as SPREADSHEET_ID in Script Properties. Do not use CodeLab/production data or real classmates' details.\nRaw linked responses are retained; generated output goes to dedicated Student Summary, Processing, or Results sheets. Do not rename/edit Google's response destination casually. Use fictional P001 Maria Santos / IT / Year 1 and P002 Joel Cruz / CS / Year 2.`;
const dynamicSheet=`Questions A:G headers: Question | Type | Choice A | Choice B | Choice C | Choice D | Required\nRow 2: Preferred language | MULTIPLE_CHOICE | JavaScript | Python | Java | SQL | TRUE\nRow 3: Practice course | DROPDOWN | IT | CS | blank | blank | TRUE\nRow 4: Comment | TEXT | blank | blank | blank | blank | FALSE\nCreate these values in a student-owned Sheet; configure SPREADSHEET_ID. Supported example types: TEXT, MULTIPLE_CHOICE, CHECKBOX, DROPDOWN.`;
const quizSheet=`QuizBank A:H headers: Question | Choice A | Choice B | Choice C | Choice D | Correct Answer | Points | Feedback\nRow 2: Which declaration prevents rebinding? | var | const | let | return | B | 2 | const prevents rebinding.\nRow 3: Which service operates Sheets? | FormApp | DriveApp | SpreadsheetApp | DocumentApp | C | 3 | SpreadsheetApp manages Sheets.\nCorrect Answer is exactly A/B/C/D. All choices are nonempty/distinct and points are positive integers. Add only practice question keys. Do not expose production answer banks to student accounts.`;
const lessons=[];
function add(title,topics,explanation,code,activity,expected,facts,extra={}){if(facts.length!==5)throw Error(title);lessons.push({title,topics,explanation,code,activity,expected,facts,...extra});}
add('Introduction to Google Apps Script','Apps Script editor, JavaScript syntax, bound/standalone projects, functions, authorization, logs/debugging',
 'Google Apps Script is Google-hosted scripting for Workspace automation using JavaScript. Standalone projects are independent; bound projects belong to a Sheet/Form/Doc and can expose that container context. Create a practice project in the Apps Script editor, select helloCodeLab, and run it there. Logger.log or console.log sends text to the execution log; it does not create a Google Form. Access to Workspace services may require consent; review scopes and use only an account/resources you are authorized to use. CodeLab only stores source and expected results and never grants Google permissions or executes these services.',
 `function helloCodeLab() {
  Logger.log('Hello from Google Apps Script');
  Logger.log('Fictional student: Maria Santos; course: IT; year: 1; school: CodeLab Practice School');
}`,
 'Create a standalone practice project and log the four suggested fictional student details. Identify the function/run/log controls and compare bound versus standalone projects. Explain why a Forms/Sheets operation could request authorization while logging alone does not need those service scopes.',
 'Google Apps Script execution log shows Hello from Google Apps Script and the fictional details. CodeLab does not generate a log by executing the example.',
 [['Where does privileged Apps Script code execute?','Google Apps Script with authorized access','The CodeLab source textarea'],['What does Logger.log do?','Write to the execution log','Send an email'],['What is a bound project attached to?','A Workspace container','Every browser tab'],['Why can authorization be required?','The script accesses protected Google services','Every variable declaration is secret'],['What data should practice use?','Fictional records','Real private class records']],{objectives:['Explain Apps Script and common Workspace automation uses.','Identify the editor, functions, execution log, and debugging controls.','Create and run a simple logging function in Apps Script.','Explain Google authorization and the CodeLab execution boundary.'],services:'Logging only; no Forms/Sheets/Drive/Mail calls.',form:'No Google Form is required for this first logging example.',sheet:'No Sheet is required. Create a standalone practice script; logs stay in its Executions/editor log.'});
add('Creating and Accessing Google Forms','FormApp create/openById/openByUrl, IDs, title/description/confirmation, basic required questions',
 'FormApp creates or opens Forms accessible to the authorized script user. A Form ID is a resource identifier, not a password; openById/openByUrl still require permission. The example creates an unpublished practice draft and remembers its ID in Script Properties, so rerunning does not append duplicate items. Set title/description/confirmation and required questions deliberately. Reuse a student-created ID rather than a private production ID. Review responder permissions and publish in the Google Forms UI only after testing setup and getting appropriate approval; a responder URL does not bypass access restrictions.',
 `${draft}
function createStudentForm() {
  const form = getPracticeDraft('LESSON02_FORM_ID', 'Practice Student Registration');
  if (form.getItems().length) return form.getId();
  form.setDescription('Fictional student registration exercise.');
  form.setConfirmationMessage('Thank you for the practice response.');
  for (const title of ['Student Name','Student Number']) form.addTextItem().setTitle(title).setRequired(true);
  form.addListItem().setTitle('Course').setChoiceValues(['IT','CS']).setRequired(true);
  form.addListItem().setTitle('Year Level').setChoiceValues(['1','2','3','4']).setRequired(true);
  return form.getId();
}`,
 'Create the four-field draft in your own Google environment; inspect required flags and the stored ID. Open the draft with openById, then demonstrate openByUrl using your authorized editor URL. Test rerunning without duplicate questions. Review/publish for only authorized test responders when appropriate.',
 'An unpublished four-question practice Form is created once, with title, description, required fields, and confirmation message. It is not a public live form created by CodeLab.',
 [['Which service manages Forms?','FormApp','DriveApp only'],['What is needed beyond a Form ID?','Permission to access the form','No authorization ever'],['What prevents duplicate creation here?','A saved practice ID and existing-item check','A new form every retry'],['Which method sets required input?','setRequired(true)','setPrivate(false)'],['Who reviews responder access?','The authorized owner/teacher','The CodeLab editor automatically']],{services:'Forms access; Script Properties configuration.',form:'Draft: Student Name and Student Number text; Course IT/CS dropdown; Year Level 1–4 dropdown. LESSON02_FORM_ID is created in Script Properties. Keep unpublished while inspecting; do not approve unknown scripts.'});
add('Form Items and Question Types','text, paragraph, multiple choice, checkboxes, list/date/time/scale items, required flags and help text',
 'Choose question types based on answer shape. Text/ParagraphText accept short/long text; MultipleChoice selects one option; Checkbox selects several; List provides a dropdown. Date/Time/Scale collect structured values. Required flags do not replace validation or data minimization. Use setHelpText where supported to clarify practice input. Avoid collecting actual birth dates or other personal information just to demonstrate DateItem; use a fictional practice date. The example is an unpublished survey, not a form rendered inside CodeLab.',
 `${draft}
function createPracticeSurvey() {
  const form = getPracticeDraft('SURVEY_FORM_ID','Practice Programming Survey');
  if (form.getItems().length) return form.getId();
  form.addTextItem().setTitle('Fictional Name').setRequired(true).setHelpText('Use a made-up identity.');
  form.addListItem().setTitle('Course').setChoiceValues(['IT','CS']).setRequired(true);
  form.addMultipleChoiceItem().setTitle('Year').setChoiceValues(['1','2','3','4']).setRequired(true);
  form.addMultipleChoiceItem().setTitle('Preferred Language').setChoiceValues(['JavaScript','Python','Java','SQL']);
  form.addCheckboxItem().setTitle('Practice Skills').setChoiceValues(['Loops','Forms','Sheets']);
  form.addDateItem().setTitle('Fictional Practice Date');
  form.addTimeItem().setTitle('Preferred Practice Time');
  form.addScaleItem().setTitle('Practice Confidence').setBounds(1,5);
  form.addParagraphTextItem().setTitle('Comments');
  return form.getId();
}`,
 'Build the survey, justify every item type/required flag, add help text, and test single versus multiple choices. If demonstrating birth date, enter only a fictitious date; explain how removing unnecessary personal fields improves privacy.',
 'The owner sees a nine-item unpublished survey using appropriate text, choice, date/time, scale, and paragraph inputs. No real respondent information is required.',
 [['Which type allows multiple choices?','CheckboxItem','TextItem only'],['Which type provides a dropdown?','ListItem','ParagraphTextItem'],['Which type suits longer comments?','ParagraphTextItem','TimeItem'],['What does required imply?','An answer must be supplied','Any supplied value is valid'],['Should a type demo collect real birth dates?','No; use fictional/minimized data','Always']],{services:'Forms creation and practice metadata.',form:'Practice Programming Survey with the nine documented items; optional fields stay optional. Keep SURVEY_FORM_ID distinct from registration exercises.'});
add('Variables, Conditions, and Loops','const/let, arrays/objects, if/else/switch, for/for-of/forEach and repeated question creation',
 'const prevents rebinding a variable; it does not make an array/object immutable. let supports deliberate reassignment. Arrays hold ordered data and objects named fields. if/else chooses branches, switch maps cases, and loops visit subjects/items. Prefer modern syntax in the V8 Apps Script environment. Validate configuration arrays before using them to build questions, and keep reruns from appending duplicate choices/items. This example combines a subject array, a for-of loop, and a dropdown built from that same array.',
 `${draft}
function createSubjectChoices() {
  const subjects = ['Programming','Database','Web Development'];
  let count = 0;
  for (const subject of subjects) { Logger.log(subject); count += 1; }
  const form = getPracticeDraft('SUBJECT_FORM_ID','Practice Subject Choice');
  if (!form.getItems().length) form.addListItem().setTitle('Subject').setChoiceValues(subjects).setRequired(true);
  if (count > 0) Logger.log('Subjects configured: ' + count);
  return form.getId();
}`,
 'Predict the subject log, use an array/loop to generate choices, and refactor one branch using switch. Add a configuration object and a forEach example, validate empty/duplicate subjects, and explain why const array elements can still change.',
 'Google logs the three subjects and count 3. The unpublished practice draft contains a required subject dropdown with those values.',
 [['What does const prevent?','Variable rebinding','Every array modification'],['What does for-of visit here?','Array values','Only property indexes'],['Where are named settings represented?','An object','A required DateItem'],['How should empty choices be handled?','Validate before form updates','Create invalid items anyway'],['What prevents repeated items?','Reusing/checking the practice form','Running setup from every event']],{services:'Forms plus execution logs.',form:'One Subject dropdown: Programming, Database, Web Development. SUBJECT_FORM_ID is a separate practice resource.'});
add('Form Responses','getResponses, FormResponse/ItemResponse, getItemResponses, timestamps, response destination, fictional answer processing',
 'Form.getResponses returns submissions visible to the authorized owner. Each FormResponse has a timestamp and ItemResponses, whose item titles/IDs identify answers. Answer values may be strings or arrays depending on the item type; do not assume every answer is a scalar. A linked Sheet is a response destination and its columns should be inspected, not guessed. Practice logs may show selected fictional data but production logs should avoid full answers or personal information. Empty response collections are valid; changing titles can break title-based mapping, so advanced applications should store stable item IDs.',
 `${config}
function readPracticeResponses() {
  const form = FormApp.openById(requireConfig('FORM_ID'));
  for (const response of form.getResponses()) {
    const answers = Object.fromEntries(response.getItemResponses().map(item => [item.getItem().getTitle(),item.getResponse()]));
    Logger.log(JSON.stringify({submittedAt: response.getTimestamp().toISOString(),
      studentName: answers['Student Name'] || '(not supplied)', course: answers['Course'] || '(not supplied)'}));
  }
}`,
 'Review/publish only your practice form for authorized test responders, submit fictional answers, link the response destination if needed, and read timestamp/name/course/selected-answer values. Test an empty form and an array answer; explain stable IDs versus renamed question titles.',
 'Google logs selected fictional response fields and UTC timestamps, or no rows if no submissions exist. CodeLab does not read any Form responses.',
 [['What does getResponses return?','FormResponse objects','Sheet worksheets'],['Where are individual answers obtained?','getItemResponses()','getFolders()'],['Can a checkbox answer be an array?','Yes','Never'],['What does getTimestamp identify?','Submission time','CodeLab grading time'],['What should production logs minimize?','Personal response content','Only whitespace']],{services:'Authorized Forms read access; Sheets only if linking a destination.',form:'Use your practice Student Name/Course form. Set FORM_ID to YOUR_FORM_ID in Script Properties, replacing the placeholder with your owned resource. Publish/respond only under the approved audience.',sheet:baseSheets});
add('Beginner Project — Automated Student Registration Form','registration draft, fields/validation, descriptions/required choices, confirmation, linked response Sheet, tests',
 'Build an original registration workflow in your own Google environment. Separate resource setup from response handling, retain practice resource IDs, and avoid recreating forms/sheets on every run. The reference creates a draft with seven specified fields, ID/email validation, fixed choices, and a linked response spreadsheet. Review the stored FORM_ID/SPREADSHEET_ID, publish permissions, and test collection using only fictional identities and an approved test email. This is a learner-owned Google project; no actual Google resources are created by adding the course to CodeLab.',
 registration,
 'Milestones: create the practice script → define seven fields/choices/validation → create the unpublished Form → link a new practice Sheet → inspect configuration → review responder access/publish for approved testers → submit valid/invalid fictional entries → check destination/confirmation. Submit original source, restricted teacher-accessible script/form/sheet links and screenshots/tests. Check missing fields, invalid ID/email, reruns, empty data, and unauthorized access.',
 'The practice Form has Student Number, First Name, Last Name, Email, Course, Year Level, and Section; required flags/validation and linked response destination work in Google after authorized setup and test publication.',
 [['Which destination stores linked responses?','A practice Google Sheet','CodeLab production database'],['What should reruns avoid?','Duplicating forms and questions','Reading saved IDs'],['What must precede test collection?','Audience/authorization review','Making all files public'],['Where is ID format enforced?','Text validation plus later processing checks','Only the question title'],['What is required project evidence?','Source links and actual Google tests','A claimed CodeLab FormApp run']],{project:true,services:'Forms and Sheets creation; Script Properties.',form:'Seven fields as listed in the reference. Store REGISTRATION_FORM_ID; set FORM_ID to that same practice ID for later response/trigger lessons. Keep the draft unpublished until the owner reviews access.',sheet:baseSheets+'\nSPREADSHEET_ID is set to the new response spreadsheet. Inspect the generated response tab and its exact header row; retain raw responses.'});
add('Google Forms and Google Sheets Integration','SpreadsheetApp create/open/active context, Sheet/ranges, batch getValues/setValues, appendRow, last row/search/update',
 'SpreadsheetApp opens student-owned Sheets by ID; getActiveSpreadsheet is useful in bound contexts and may be null in a standalone script. A Spreadsheet contains Sheets, and a Range exposes rectangular getValues/setValues arrays. The output dimensions must match the range exactly, and empty datasets require guards. Read a linked response tab once, process in memory, and write a separate summary in a batch. Protect raw responses, identify columns by exact headers, and store untrusted text literally rather than letting a leading equals sign become a formula.',
 `${config}
${safeCells}
function summarizePracticeStudents() {
  const spreadsheet = SpreadsheetApp.openById(requireConfig('SPREADSHEET_ID'));
  const source = spreadsheet.getSheetByName(requireConfig('RESPONSE_SHEET_NAME'));
  if (!source || !source.getLastRow()) throw new Error('Linked response sheet/header missing.');
  const values = source.getDataRange().getValues(), headers = values[0];
  const columns = ['Student Number','First Name','Last Name','Course'].map(title => {
    const index = headers.indexOf(title);
    if (index < 0) throw new Error('Expected response header: ' + title);
    return index;
  });
  const output = [['Student Number','Student Name','Course']];
  for (const row of values.slice(1)) {
    output.push([safeSheetCell(String(row[columns[0]])),
      safeSheetCell(String(row[columns[1]]) + ' ' + String(row[columns[2]])),safeSheetCell(String(row[columns[3]]))]);
  }
  const summary = spreadsheet.getSheetByName('Student Summary') || spreadsheet.insertSheet('Student Summary');
  summary.getRange(1,1,Math.max(summary.getLastRow(),output.length),3).clearContent();
  summary.getRange(1,1,output.length,3).setValues(output);
}`,
 'Configure the exact linked response tab name and create Student Summary using batch operations. Add stable-ID search and controlled updates to a separate processed sheet; compare appendRow for one event with setValues for a batch. Test empty responses, renamed headers, and formula-looking names.',
 'Student Summary contains ID, combined fictional name, and course for each response, with raw linked responses preserved. Empty responses leave only the summary header.',
 [['What does getValues return?','A rectangular 2D array','Only the active cell'],['What must setValues dimensions match?','The target range','The script line count'],['Can standalone active spreadsheet be null?','Yes','Never'],['Where should processed output go?','A dedicated summary sheet','Over raw responses blindly'],['How should formula-looking text be stored?','As literal text','Evaluated as a formula']],{services:'Sheets read/write; known practice response destination.',form:'Use the Beginner registration form and its owned linked Sheet.',sheet:baseSheets+'\nSet RESPONSE_SHEET_NAME to the actual linked-response tab name in Script Properties. Expected headers include Student Number, First Name, Last Name, Course. Output Student Summary A:C is owned by this practice generator.'});
add('Triggers and Form Submission Events','simple/installable triggers, Forms versus Sheets events, owner authorization, duplicate-safe trigger setup/removal and processing',
 'Form-submit automation uses an installable trigger, not a simple reserved-name trigger. A Forms event exposes e.response; a Sheets form-submit event exposes e.namedValues/e.values/e.range. Do not substitute one event structure for the other or manually press Run on a handler expecting an event. Installable triggers execute as their creator and consume that account quotas. The reference installs at most one matching current-owner practice trigger and writes one Processing record per response ID under a lock. Existing triggers owned by other accounts may not be visible; use one agreed trigger owner. Script-created submissions usually do not fire submit triggers, so test a real authorized respondent action.',
 trigger,
 'Install the Forms version once, inspect the Triggers page, submit a fictional practice response, and inspect Processing. Compare documented Forms and Sheets event objects, test duplicate event processing, and remove only your matching practice trigger when done. Do not install a trigger inside its own handler.',
 'One owned Forms submit trigger records response ID, submitted/processed timestamps and RECEIVED once; retries do not append duplicate response IDs. Manual handler execution without e.response fails clearly.',
 [['Which event property belongs to a Forms submit trigger?','e.response','e.namedValues always'],['Which belongs to Sheets form-submit events?','e.range and e.namedValues','e.response always'],['Whose authorization does an installable trigger use?','Its creator','Every responder automatically'],['What prevents duplicate processing here?','Response-ID checks under a lock','Only the function name'],['Does naming a function onFormSubmit install a trigger?','No','Yes']],{services:'Forms/Sheets plus ScriptApp trigger management and LockService.',form:'Set FORM_ID to YOUR_FORM_ID after replacing it with your practice registration ID. Handler is onPracticeFormSubmit; install with ensurePracticeTrigger only.',sheet:baseSheets+'\nProcessing A:D: Response ID | Submitted At | Processed At | Status. Raw destination is not edited. Lock timeout is an example wait budget, not a Google quota value.'});
add('Form Validation','TextValidation, ID patterns, number/email/length checks, help messages, required fields and data minimization',
 'FormApp validation builders attach rules to compatible item types. Required checks presence; email syntax is not ownership verification, and numeric validation is not a reason to collect sensitive data. Anchor ID patterns to the entire string and test valid/boundary/invalid examples. Pick constraints that accommodate real naming conventions; avoid rejecting legitimate names with overly narrow letters-only rules. Revalidate business rules during response processing because front-end validation is only one layer. The example builds a new practice validation draft rather than modifying a live production form.',
 `${draft}
function createValidatedPracticeForm() {
  const form = getPracticeDraft('VALIDATION_FORM_ID','Practice Validation');
  if (form.getItems().length) return form.getId();
  form.addTextItem().setTitle('Student Number').setRequired(true).setValidation(
    FormApp.createTextValidation().requireTextMatchesPattern('^P[0-9]{3}$').setHelpText('Use P001 format.').build());
  form.addTextItem().setTitle('Approved Test Email').setRequired(true).setValidation(
    FormApp.createTextValidation().requireTextIsEmail().build());
  form.addTextItem().setTitle('Fictional Practice Age').setValidation(
    FormApp.createTextValidation().requireNumberBetween(16,100).setHelpText('Fictional number from 16 to 100.').build());
  form.addTextItem().setTitle('Fictional Display Name').setRequired(true).setValidation(
    FormApp.createTextValidation().requireTextLengthGreaterThanOrEqualTo(2).build());
  return form.getId();
}`,
 'Add/test ID, email, fictional numeric range, and minimum-name-length rules. Explain anchored regular expressions and why unnecessary personal data should be removed. Test blank and malformed values and clearly label which checks need server-side business validation.',
 'The unpublished practice Form enforces the shown text/email/number/length rules when tested in authorized Google Forms. Email format acceptance is not verified identity.',
 [['What does ^...$ do in the ID pattern?','Anchor the entire string','Match any partial ID'],['Does email syntax prove ownership?','No','Yes'],['Which API builds text validation?','FormApp.createTextValidation()','DriveApp.createValidation()'],['What does required enforce?','Presence','Every business rule'],['Should downstream logic revalidate?','Yes','Never']],{services:'Forms validation builders.',form:'VALIDATION_FORM_ID: Student Number Pnnn; approved test email; optional fictional age 16–100; fictional display name minimum length 2. These are lesson constraints, not global policy.'});
add('Automatic Emails and Notifications','MailApp sendEmail, subjects/plain/HTML body, GmailApp scope differences, confirmation/teacher notification, quotas and responsible testing',
 'MailApp sends mail without needing inbox access; GmailApp can require broader mailbox permissions. Prefer the least privilege needed. Construct a personalized plain-text confirmation first; HTML bodies need escaping and no unnecessary recipient disclosure. The reference prepares one fictional message in dry-run mode by default and sends only if the owner explicitly enables the test flag and configures one approved test recipient. Never send to arbitrary unverified addresses from form input, build bulk mail loops, or log private recipient lists. Check remaining mail quota and defer failures; automatic event delivery needs deduplication/outbox state to avoid repeated sends.',
 email,
 'Prepare a name/status/submission-time confirmation. Inspect it in dry-run mode; after an explicit recipient/permission review, optionally send one test message to an approved account. Design a separate concise teacher notification and HTML escaping without bulk recipients. Document a retry/outbox approach for a trigger workflow.',
 'Default execution logs DRY RUN and returns prepared subject/body without sending. A real email occurs only in Google when the approved test flag, recipient, authorization, and quota permit it.',
 [['Which service can send without inbox access?','MailApp','GmailApp always requires less access'],['What is the default behavior here?','Dry run with no email','Send to every response address'],['Does remaining quota stay constant?','No','Yes permanently'],['What must be avoided?','Bulk unverified recipient sending','One approved test message'],['What helps retries avoid duplicate sends?','Explicit delivery/outbox state','Repeated blind attempts']],{services:'MailApp send permission only when needed; GmailApp discussed without mailbox-reading code.',form:'Use fictional student metadata; do not automatically send to unverified form email fields.',sheet:'Configure Script Properties TEST_RECIPIENT=YOUR_APPROVED_TEST_EMAIL; leave SEND_TEST_EMAIL absent/false for dry run. This example does not read any real response sheet.'});
add('Dynamic Forms and Question Generation','question bank rows/types/choices/required flags, mapped columns, setChoiceValues, sections and controlled updates',
 'Store question definitions in a dedicated Questions sheet with explicit column mapping. Batch-read rows, validate supported type/choice requirements, then create a reviewed practice draft. Switch routes TEXT/MULTIPLE_CHOICE/CHECKBOX/DROPDOWN to supported builders. Form sections use page-break items and need deliberate navigation rules; native random question-bank selection is not automatically supplied by Forms. Changing an existing form can disrupt responses, so the reference refuses to append on rerun and leaves migrations to an explicitly reviewed exercise. Option order can be shuffled before creating choices without inventing an unsupported item method.',
 dynamic,
 'Reproduce Questions A:G, generate a draft, and validate type/choices/required flags before mutation. Add a page-break section and a controlled existing-item update by stored item ID in a separate practice copy. Test empty bank, unsupported type, duplicate options, optional text, and reruns.',
 'Three documented sample questions become an unpublished practice form. Validation errors are detected before creation, and reruns do not duplicate items.',
 [['What defines the column mapping?','The documented Questions A:G schema','ActiveCell alone'],['When should bank validation occur?','Before creating or changing resources','After publication'],['What API writes plain option values?','setChoiceValues()','setShuffleOptions() assumed on every item'],['What represents a form section?','A supported page-break item','A worksheet named section automatically'],['What should happen on rerun?','Avoid duplicate item creation','Append all questions again']],{services:'Sheets read plus Forms creation.',form:'Generated types are TEXT, MULTIPLE_CHOICE, CHECKBOX, DROPDOWN only. DYNAMIC_FORM_ID stores the practice draft ID.',sheet:dynamicSheet});
add('Intermediate Project — Online Quiz and Registration System','registration plus question bank, linked responses, trigger confirmation records, validation/timestamps/status and optional mail',
 'Combine the registration and validated dynamic-question workflows in an original learner-owned project. Use dedicated sheet schemas, record form/item IDs, validate before mutation, and install one agreed-owner submit trigger. Required confirmation is a processing record with timestamps/status; an email is optional and must remain dry-run until approved. The reference shows a complete small setup/processing foundation; extend it with the validated Questions bank generator from Lesson 11 and write your own integration/tests. Graded quiz-mode question keys are taught in the Advanced module.',
 registration+'\n\n'+trigger,
 'Milestones: question-bank schema → validated original registration form → dynamic questions → linked Sheet → set FORM_ID from REGISTRATION_FORM_ID → install one matching trigger → process confirmation/timestamp/status → optional approved dry-run mail integration → failure/retry tests. Include source, restricted teacher review links, screenshots, and tests for malformed bank, missing fields, reruns, duplicate events, wrong trigger shape, failed authorization, and quota failures.',
 'Your Google project includes student information, dynamically loaded questions, required validation, linked responses and a once-per-response Processing record. Optional email is independently consented and quota-aware; CodeLab only reviews evidence.',
 [['Which confirmation is required without email?','A timestamp/status processing record','A public Drive file'],['What links the trigger to the created form?','FORM_ID set to the practice registration ID','A private production ID'],['What belongs in the question bank?','Validated question/type/choice/required definitions','Passwords'],['When is mail allowed?','Only with approved recipient and authorization','Every retry automatically'],['What proves the project works?','Actual Google tests and restricted review evidence','A CodeLab Run button']],{project:true,services:'Forms/Sheets/ScriptApp/LockService; optional MailApp only with explicit approval.',form:'Registration seven fields plus validated dynamic question section; store practice IDs and inspect existing-item updates before editing.',sheet:baseSheets+'\n'+dynamicSheet+'\nProcessing has Response ID, Submitted At, Processed At, Status. The displayed foundation must be extended with your own validated question-bank generation.'});
add('Automated Quiz Generation','setIsQuiz, point values, correct choice objects, feedback, bank mapping, supported shuffling and assessment creation',
 'setIsQuiz(true) enables supported Google Forms grading features. For multiple-choice quiz items, createChoice(value, isCorrect) marks a correct answer and setPoints sets scoring. Feedback is built with FormApp.createFeedback and applied through supported methods. Read QuizBank in a batch and validate distinct choices, one A–D correct key, and positive integer points. Shuffle choice records before adding items so the correct flag follows the answer. Whole-form setShuffleQuestions is supported but may move identification items; this reference keeps their order. Google does not provide native per-respondent random bank sampling here; select a subset programmatically before generation if needed.',
 quizBuilder,
 'Create the documented two-question practice quiz, verify keys/points/feedback in Google, and test option shuffling while preserving correctness. Explain whole-form question shuffling versus script-selected subsets. Leave unpublished until reviewing access, answer release, and test audience.',
 'An unpublished practice quiz has two student text fields, two MC questions worth 2 and 3 points, correct choice flags, and feedback. Option order may vary but correct values remain correct.',
 [['What enables quiz mode?','setIsQuiz(true)','setPrivate(false)'],['How is a correct MC answer marked?','createChoice(value,true)','The first option is always correct'],['What must survive option shuffling?','The answer correctness flag','The original numeric index only'],['Does native FormApp sample a random bank per respondent here?','No','Yes automatically'],['Why preserve identification order?','Whole-form shuffling can also move those items','Text items cannot be moved']],{services:'Sheets bank read and Forms quiz APIs.',form:'QUIZ_FORM_ID stores the generated draft. Student Number uses Pnnn validation; Student Name text required. Inspect release/permission settings manually before authorized test use.',sheet:quizSheet});
add('Advanced Response Processing','gradable responses/scores, max points, percentages/status, duplicate IDs, pending grading, results summaries',
 'Process assessment submissions separately from raw data. Derive maximum points from positive-point quiz items, aggregate scores, and distinguish pending grading from a genuine zero. The reference uses multiple-choice auto-graded questions only; other item types require an explicit extension. Validate student IDs/names, identify duplicates by policy, and retain duplicate rows with an explicit status rather than silently deleting evidence. Percentages require a nonzero maximum; use numeric outputs and avoid treating ungraded responses as failures. Student IDs are labels, not identity verification; email matching is also not authentication without an approved verification process.',
 results,
 'Process the two-question quiz into Results with exact headers, test 5/5 PASS and 2/5 FAIL, pending scores, invalid IDs, and duplicate IDs. Document first-valid-submission policy versus retake rules and add class-average/high/low/pass/fail summaries for graded valid records only.',
 'Results contains Student Number, Student Name, Score, Percentage, Status, Submitted At. A 5/5 valid result is 100% PASS; 2/5 is 40% FAIL. Ungraded values remain PENDING_GRADING and duplicates remain labeled.',
 [['What is an ungraded score?','Pending, not automatically zero','Always failed'],['How is percentage calculated?','Score divided by maximum times 100','Score times maximum'],['What avoids zero-division?','A positive maximum-points check','Ignoring empty quizzes'],['What happens to duplicates here?','They are retained with DUPLICATE status','Raw submissions are deleted'],['Does a student-number string prove identity?','No','Yes']],{services:'Forms responses/grade read plus Sheets batch output.',form:'Set FORM_ID to your QUIZ_FORM_ID after approved test publication/submission. This reference supports positive-point MULTIPLE_CHOICE quiz items only.',sheet:baseSheets+'\nResults A:F: Student Number | Student Name | Score | Percentage | Status | Submitted At. Owned generated Results range is refreshed; raw response tabs are preserved.'});
add('Working with Multiple Google Workspace Services','Forms/Sheets/Drive/Docs/Mail integration, resource IDs, templates, reporting and cross-service scope minimization',
 'Compose services deliberately: FormApp reads responses, SpreadsheetApp writes results, DocumentApp generates text, DriveApp organizes the result, and MailApp optionally confirms it. Each additional service may add OAuth scopes; broad GmailApp mailbox access is unnecessary for a send-only practice message. This reference creates a fictional summary Doc in an owner-controlled My Drive practice folder; combine it with response/results logic only after authorization and input validation. Folder inheritance can expose data, so inspect the folder audience instead of assuming moved files are private. Do not automatically change files to anyone-with-link sharing.',
 docs,
 'Design the five-step response → Sheet → Doc → Drive → optional approved mail workflow. Implement a small fictional-data path, verify the restricted folder, add deduplication and failure/outbox state, and compare required scopes before adding each service.',
 'An authorized Google run creates one fictional summary Doc in the designated practice folder. It does not make the Doc public or send email automatically; the complete workflow is the student activity.',
 [['Which service writes Doc content?','DocumentApp','MailApp'],['What can broaden file access after moving it?','Destination folder permissions','Only the filename'],['Why prefer MailApp for send-only practice?','Avoid unnecessary mailbox access','Read all inbox messages'],['What should resource IDs identify?','Authorized practice resources','Reusable production IDs'],['What must precede more services?','Scope and purpose review','Approving every possible permission']],{services:'Docs and Drive for the reference; Forms/Sheets/Mail discussed as separately authorized integration steps.',form:'Use your approved assessment form; validate/process a response before generating a report.',sheet:baseSheets+'\nSet FOLDER_ID=YOUR_FOLDER_ID to a restricted, owner-controlled My Drive practice folder. This reference uses fictional static summary values, not live personal response data.'});
add('File Uploads, Drive, and Document Generation','folders/files, upload restrictions, Docs templates/placeholders, PDF conversion, duplication and sharing controls',
 'Google Form file uploads can require sign-in and account/domain permissions. FormApp does not supply an addFileUploadItem builder here; create any supported upload question manually in Google Forms under the applicable account policy rather than inventing that method. Do not promise universal upload access or fetch untrusted files into CodeLab. Use a restricted practice folder and single-tab Docs template, copy the template, replace validated text placeholders, save/close, and convert the file with getAs(MimeType.PDF). Copies/PDFs inherit destination permissions; verify audiences and avoid silent replacement/duplicate output.',
 pdf,
 'Create a restricted practice folder and a single-tab Docs template with {{NAME}}, {{STUDENT_NUMBER}}, {{STATUS}}. Generate a fictional result PDF and inspect access. Explain upload sign-in/domain restrictions, manually add an upload item only if supported/approved, and test missing template, denied folder access, missing placeholder, and existing output.',
 'A template copy and Practice_Result_P001.pdf are created in the designated folder by an authorized Google run. Existing PDFs are not silently overwritten; no automatic public-sharing call or CodeLab file upload occurs.',
 [['Does this lesson use addFileUploadItem?','No; unsupported builder is not invented','Yes universally'],['What converts a Drive file to PDF?','getAs(MimeType.PDF)','setIsQuiz(true)'],['What should be checked before file creation?','Folder audience and existing output','Only the public URL'],['What is the template format here?','A single-tab Google Doc with documented placeholders','Any executable file'],['Are upload questions available universally?','No; account/domain restrictions apply','Yes without sign-in']],{services:'Docs template editing, Drive read/copy/create and PDF conversion.',form:'File-upload questions, if available, are created manually in Google Forms. Keep access limited; do not require public file sharing for teacher review.',sheet:'Script Properties: FOLDER_ID=YOUR_FOLDER_ID; TEMPLATE_DOCUMENT_ID=YOUR_TEMPLATE_DOCUMENT_ID. Template body contains {{NAME}}, {{STUDENT_NUMBER}}, {{STATUS}}. Folder must be an approved restricted My Drive practice folder.'});
add('Security, Authorization, and Best Practices','OAuth/scopes, Script/User Properties, quota/limits, try-catch/logging, locks/cache, batching, minimal data/sharing',
 'Review only required scopes and never bypass Google authorization warnings. Script Properties configure a project for its editors; User Properties isolate user-specific settings. Properties are not a universal secret vault, and project editors may access configuration. Keep secrets out of source and logs, keep Drive sharing restricted, and consult current account quotas instead of permanent copied limits. Use batch reads/writes, lock-protected mutation, explicit retry state, and meaningful non-sensitive logs. CacheService can reduce repeated reads but is an optional, expiring performance aid, never the authoritative ledger for grading or deduplication.',
 `${config}
${safeCells}
function safeBatchPracticeCopy() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) throw new Error('Busy; retry deliberately.');
  try {
    const spreadsheet = SpreadsheetApp.openById(requireConfig('SPREADSHEET_ID'));
    const source = spreadsheet.getSheetByName('PracticeData');
    if (!source || !source.getLastRow()) throw new Error('PracticeData/header missing.');
    const values = source.getDataRange().getValues().map(row => row.map(safeSheetCell));
    const destination = spreadsheet.getSheetByName('SafeCopy') || spreadsheet.insertSheet('SafeCopy');
    destination.getRange(1,1,Math.max(destination.getLastRow(),values.length),values[0].length).clearContent();
    destination.getRange(1,1,values.length,values[0].length).setValues(values);
    console.log('Practice batch copied; rows including header: ' + values.length);
  } catch (error) {
    console.error('Practice copy failed. Review resource access, headers, and current quotas.');
    throw new Error('Practice copy failed; no private configuration was logged.');
  } finally { lock.releaseLock(); }
}`,
 'Review an intentionally described bad design (plaintext-like configuration, excessive scopes, repeated cell calls, broad catch/logging). Refactor it into properties-based configuration, minimal services, batches, locks, sanitized errors, and a restricted sharing/retention plan. Test missing resources, concurrent calls, stale cache, and quota failures without real secrets.',
 'A dedicated SafeCopy sheet receives a batch of fictional PracticeData with formula-like strings stored as text. Locks release on success/error and logs omit private IDs/values. CodeLab does not execute the copy.',
 [['Are Script Properties a universal secret vault?','No','Yes'],['What should log messages omit?','Secrets and unnecessary personal data','All error context'],['What is a cache suitable for?','Expiring performance hints','Permanent duplicate/grade authority'],['Where does lock release belong?','finally','Only successful processing'],['Where are current quota values checked?','Official documentation and the account environment','Permanent lesson constants']],{services:'Sheets/Properties/LockService; CacheService/User Properties explained as optional extensions.',form:'No new Form is created. Review existing practice scripts/scopes and remove unnecessary owned triggers deliberately.',sheet:'PracticeData: Student Number | Fictional Name | Course; P001 | Maria Santos | IT. SafeCopy is a dedicated generated output sheet. Set SPREADSHEET_ID to this practice Sheet.'});
add('Advanced Project — Google Forms Student Assessment System','validated bank/quiz, selection/shuffling, triggers/results/status, mail/outbox, summaries/dashboard, optional Docs/PDF and security',
 'Build an original student assessment workflow with a full question bank, reviewed unpublished quiz generation, stable item-ID mappings, real authorized test submissions, idempotent trigger processing, pending-grade handling, duplicate policy, and numeric results. Use a dedicated Summary/Dashboard sheet for class average, extrema and pass/fail counts of valid graded responses. Programmatic bank selection and pre-creation option shuffling are distinct from native Forms question shuffling. Keep mail optional/dry-run until consented, record delivery state, and restrict Docs/Drive outputs. The reference provides validated two-question generation and batch result processing; extend it with the documented full schema, event orchestration, summaries, and original tests.',
 quizBuilder+'\n\n'+results.replace(config+'\n',''),
 'Milestones: full bank/schema → normalize/validate to the quiz helper shape → choose questions before adding them → create draft/key/points/feedback → record item IDs → review access/release/publish for approved tests → install one agreed-owner trigger → validate IDs/duplicates/grade state → Results batch → Summary/chart-ready counts → optional consented mail with retry/outbox → optional restricted Docs/PDF → failure/security tests. Integrate the earlier trigger and dry-run mail helpers in separate files; avoid duplicate helper definitions. Submit source, teacher-accessible project/form/sheet links, screenshots, workflow description, and tests for malformed bank, unauthorized resources, duplicate triggers/events, empty results, pending grading, formula text, quotas, and retry failures.',
 'Your completed Google project has a generated assessment, question bank, Results and dashboard statistics, responsible notifications if enabled, and optional restricted reports. The reference is a foundation, not a claim that CodeLab runs or hosts the complete Google workflow.',
 [['What is the real execution environment?','Authorized Google Apps Script','A CodeLab textarea'],['When should bank validation occur?','Before resource mutation','After collecting live grades'],['Which records enter final class summaries?','Valid graded records under the duplicate policy','Pending and invalid rows as zero'],['What must mail retries use?','Delivery/outbox state and quota-aware handling','Unlimited blind resending'],['Should teacher review require public files?','No; appropriate restricted sharing','Yes everyone-with-link']],{project:true,services:'Forms/Sheets/Properties for the reference; ScriptApp/LockService/Mail/Drive/Docs are separately authorized project extensions.',form:'Assessment draft: Student Number, Student Name, and selected positive-point quiz questions. Store question IDs to form-item IDs. Set FORM_ID to QUIZ_FORM_ID for processing. Review responder access and answer release before authorized tests.',sheet:quizSheet+'\nFinal QuestionBank A:K: Question ID | Question | Choice A | Choice B | Choice C | Choice D | Correct Answer | Points | Category | Difficulty (A:J; add Feedback in K). Example: Q001 | Which declaration prevents rebinding? | var | const | let | return | B | 2 | JavaScript | Beginner | const prevents rebinding. Normalize to QuizBank helper A:H before generation. Results A:F uses the prior schema; Summary stores valid graded count, average percent, highest, lowest, PASS/FAIL counts. Do not include invalid/duplicate/pending rows in graded statistics.'});

const errors=[
 'Selecting the wrong entry function or confusing a bound container with a standalone project changes context. Logs are Google output, not CodeLab execution.',
 'A valid ID is not permission. Do not append questions on every rerun or assume an unpublished draft can receive responses before owner review/publication.',
 'Checkbox answers can be arrays; required does not mean validated. Use fictional dates and correct item builders instead of collecting unnecessary personal data.',
 'const arrays can still change. Validate empty/duplicate choices and keep setup outside event handlers.',
 'Renaming a question can break title-based mapping. Do not dump real response objects into logs; handle empty submissions and array answers.',
 'Keep practice form/Sheet IDs consistent and avoid duplicate resources. Test invalid required fields and inspect access before publishing the test form.',
 'Standalone active contexts can be null. Batch shapes must match ranges; guard empty data and escape formula-looking response text.',
 'Forms and Sheets event objects differ. A handler cannot be tested with the editor Run button without an event; current-owner trigger inspection cannot see every other owner trigger.',
 'Email syntax is not identity. Anchor patterns, use helpful errors, and revalidate business rules downstream.',
 'Leave mail in dry run until an approved recipient/permission review. Check quota and delivery state; a sent flag alone cannot guarantee exactly-once delivery across a crash.',
 'Reject unsupported types/duplicate choices before creating a form. Review updates in a practice copy rather than deleting or appending all live questions.',
 'Install one trigger owner and separate configuration from event processing. Complete your original bank integration; mail is optional and never a bulk loop.',
 'Shuffling numeric indexes without correctness flags can change answer keys. Use genuine FormApp APIs and document unsupported random-bank behavior.',
 'Do not turn null scores into zero or divide by a zero maximum. Keep duplicate/pending/invalid statuses separate and document retake policy.',
 'A moved file inherits folder permissions. Validate practice resources and review each added service scope; do not auto-share generated files publicly.',
 'FormApp does not create file-upload items here. Upload account restrictions, template tabs, placeholder patterns, conversion quotas, and destination access must be checked.',
 'Script editors can access configuration. Cache is not a durable ledger; release locks in finally and avoid logs containing IDs, secrets, or full response payloads.',
 'Complete bank normalization, item-ID mapping, event orchestration, summaries, and notification retry tests. Do not claim the reference is a hosted Google production system.'
];
const authorization='Execution occurs in your own Google Apps Script account/project. Review requested service scopes and use only resources you are authorized to access. Do not approve unknown scripts, bypass security warnings, or request unnecessary scopes. CodeLab requests no Google OAuth permissions. Installable triggers execute as their creator; additional Forms/Sheets/Drive/Docs/Mail services may require additional consent.';
const quota='Google quotas, email allowances, trigger execution budgets and service limits vary by account and can change. Check current official Apps Script quota documentation and your Executions environment rather than treating lesson numbers as permanent Google limits. Batch calls, guard empty ranges, avoid duplicate triggers/retries, and defer quota failures. Example lock waits and grade thresholds are application choices, not Google quota claims.';
const out=lessons.map((lesson,index)=>{
 const quiz=lesson.facts.map(([question,correct,wrong],q)=>{
  const base=[...new Set([correct,wrong,...lesson.facts.filter((_,i)=>i!==q).flatMap(f=>[f[1],f[2]])])].slice(0,4),answer=(index+q)%4;
  return {question,choices:base.slice(4-answer).concat(base.slice(0,4-answer)),answer,explanation:correct+'. Review the documented setup, API behavior, and reference example.'};
 });
 return {title:lesson.title,level:['Beginner','Intermediate','Advanced'][Math.floor(index/6)],position:index+1,is_project:!!lesson.project,
  objectives:lesson.objectives??['Explain '+lesson.topics+'.','Build and test the stated workflow in an authorized Google practice project.','Validate data and document expected results, access boundaries, and failures.'],
  introduction:'Learn '+lesson.topics+' with fictional, student-owned Google Workspace resources.',
  explanation:lesson.explanation,syntax:lesson.code,example_apps_script:lesson.code,
  starter_apps_script:index===0?lesson.code:'function studentActivity() {\n  // Write your original Apps Script activity for your authorized practice project.\n}\n',
  workspace_setup:`Execution environment: Google Apps Script editor / Google Workspace. CodeLab stores/copies source and never executes privileged Google services.\nCreate a dedicated practice project using a Google account you are authorized to use; use V8 JavaScript. Keep each lesson in a separate practice project or merge shared helpers deliberately without duplicate declarations.\nRequired services: ${lesson.services}\nReview the example, setup, permissions and expected effects before selecting its entry function in Google. For configuration, replace YOUR_FORM_ID/YOUR_SPREADSHEET_ID/YOUR_FOLDER_ID/YOUR_TEMPLATE_DOCUMENT_ID only with your authorized practice resources, usually in Project Settings > Script Properties. No production IDs or passwords belong in submissions.`,
  form_setup:lesson.form??'Use only the documented learner-owned practice Form; keep draft/access settings reviewed and do not publish unrelated production forms.',
  sheet_setup:lesson.sheet??'No Sheet input is needed for this reference. Later exercises use explicit, student-owned schemas and batch operations.',
  authorization_note:authorization,quota_note:quota,
  guided_practice:`1. Reproduce the documented Google Form/Sheet/configuration setup with fictional data.\n2. Read the source explanation and review only the required authorization scopes; do not bypass warnings.\n3. Copy the full reference into your Apps Script practice project, choose the setup/entry function (not an event handler), and inspect the Google Executions/log/resource results.\n4. Compare with Expected Result and test a boundary/failure case.\n5. ${errors[index]}\n6. Record actual Google evidence; save your original source and restricted teacher-review links in CodeLab.`,
  activity:lesson.activity,expected_result:lesson.expected,important_notes:errors[index],
  debugging_tip:'Inspect Google Executions and the first meaningful error. Verify resource permission, property names, sheet headers, item types, array dimensions and trigger event shape. Use small fictional tests and sanitized logs; never log secrets or full private responses. A CodeLab save is not Google execution.',
  security_note:'Use fictional data, minimum required scopes, reviewed account permissions, and restricted teacher sharing. Never embed production IDs/passwords/API secrets, make generated Drive files public automatically, or send bulk/unverified email. Properties are configuration rather than a universal secret vault; folder inheritance matters. CodeLab does not request Google access, fetch project links, or execute submitted scripts.',
  challenge:'Summary: '+lesson.explanation.split('. ').slice(0,2).join('. ')+'.\nChallenge: '+(lesson.project?'Add an original workflow improvement; document at least five boundary/failure cases and one permission/quota trade-off.':'Add one original boundary/failure test and explain the actual Google resource/log behavior.'),
  completion_requirements:'Save original source, an optional restricted teacher-accessible project URL, and Form/Sheet/screenshots/documentation/testing links in notes. Pass the five-question quiz with at least 4/5 and receive teacher approval of the current submission; projects also require rubric grading. Do not require public Google files or claim CodeLab execution.',
  guide:{steps:['Set up authorized fictional practice resources.','Review service scopes and run in Google Apps Script only.','Complete the original activity and record actual evidence.','Save/submit source and restricted links; pass the quiz for teacher review.']},
  quiz,validation_rules:{apps_script:{instructional_only:true,requires_teacher_review:true}},
  rubric:lesson.project?{program_functionality:25,correct_apps_script:20,workspace_integration:15,automation_workflow:15,validation_error_handling:10,security_authorization:5,code_organization:5,testing_documentation:5}:null};
});
if(out.length!==18)throw Error('Exactly eighteen lessons required.');
await writeFile('database/data/apps-script-course.json',JSON.stringify(out,null,2)+'\n');
console.log('Authored Google Apps Script: 18 lessons, 90 questions, 3 projects; no Google services were executed.');
