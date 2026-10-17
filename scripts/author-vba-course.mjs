import {writeFile} from 'node:fs/promises';
const gradesLayout = `Workbook: StudentGrades.xlsm\nWorksheet: Grades\nRow 1 headers: A Student ID | B Student Name | C Grade 1 | D Grade 2 | E Grade 3 | F Average | G Status\nRow 2: P001 | Maria Santos | 95 | 88 | 91 | blank | blank\nRow 3: P002 | Joel Cruz | 65 | 70 | 68 | blank | blank\nI1 Highest average, J1 blank; I2 Lowest average, J2 blank. Do not place other records below this practice table.\nExpected after processing: Maria 91.33 PASSED; Joel 67.67 FAILED. Source grades must be numeric and in 0–100.`;
const studentsLayout = `Workbook: StudentRecords.xlsm\nSheets: Students, Lists, Dashboard\nStudents row 1: A Student ID | B First Name | C Last Name | D Year Level | E Section | F Enrollment Date | G Average\nRow 2: P001 | Maria | Santos | 1 | A | enter a real Excel date, 2026-08-01 | 91.33\nRow 3: P002 | Joel | Cruz | 2 | B | enter a real Excel date, 2026-08-02 | 67.67\nLists A1 Year Levels; A2:A5 values 1,2,3,4. Lists B1 Sections; B2:B3 A,B.\nDashboard A1 Total students; B1 blank. Student IDs are text, unique and nonempty. Use only fictional records.`;
const macro=(body,name='StudentActivity')=>`Option Explicit\n\nPublic Sub ${name}()\n${body}\nEnd Sub\n`;
const validGrade=`Private Function ValidGrade(ByVal value As Variant) As Boolean
    If IsError(value) Or IsEmpty(value) Then Exit Function
    If Len(Trim$(CStr(value))) = 0 Then Exit Function
    If Not IsNumeric(value) Then Exit Function
    ValidGrade = CDbl(value) >= 0 And CDbl(value) <= 100
End Function`;
const findRow=`Public Function FindStudentRow(ByVal studentID As String) As Long
    Dim ws As Worksheet, r As Long, lastRow As Long
    Set ws = ThisWorkbook.Worksheets("Students")
    lastRow = ws.Cells(ws.Rows.Count, 1).End(xlUp).Row
    For r = 2 To lastRow
        If Not IsError(ws.Cells(r, 1).Value2) Then
            If StrComp(Trim$(CStr(ws.Cells(r, 1).Value2)), Trim$(studentID), vbTextCompare) = 0 Then
                FindStudentRow = r
                Exit Function
            End If
        End If
    Next r
End Function`;
const crud=`Option Explicit
' Location: standard module modStudents
${findRow}

Public Sub SaveStudent(ByVal studentID As String, ByVal firstName As String, ByVal lastName As String, ByVal yearLevel As Long, ByVal section As String)
    Dim ws As Worksheet, r As Long
    studentID = Trim$(studentID): firstName = Trim$(firstName): lastName = Trim$(lastName)
    If studentID = "" Or firstName = "" Or lastName = "" Then Err.Raise vbObjectError + 101, , "Required fields missing"
    If yearLevel < 1 Or yearLevel > 4 Then Err.Raise vbObjectError + 102, , "Year must be 1 to 4"
    If section <> "A" And section <> "B" Then Err.Raise vbObjectError + 103, , "Choose a listed section"
    If FindStudentRow(studentID) > 0 Then Err.Raise vbObjectError + 104, , "Duplicate student ID"
    Set ws = ThisWorkbook.Worksheets("Students")
    r = ws.Cells(ws.Rows.Count, 1).End(xlUp).Row + 1
    ws.Range(ws.Cells(r, 1), ws.Cells(r, 3)).NumberFormat = "@"
    ws.Cells(r, 1).Value2 = studentID
    ws.Cells(r, 2).Value2 = firstName: ws.Cells(r, 3).Value2 = lastName
    ws.Cells(r, 4).Value2 = yearLevel: ws.Cells(r, 5).Value2 = section
    ws.Cells(r, 6).Value = Date
End Sub

Public Sub UpdateStudentSection(ByVal studentID As String, ByVal section As String)
    Dim r As Long
    If section <> "A" And section <> "B" Then Err.Raise vbObjectError + 105, , "Choose A or B"
    r = FindStudentRow(studentID)
    If r = 0 Then Err.Raise vbObjectError + 106, , "Student not found"
    ThisWorkbook.Worksheets("Students").Cells(r, 5).Value2 = section
End Sub

Public Sub DeleteStudent(ByVal studentID As String)
    Dim r As Long
    r = FindStudentRow(studentID)
    If r = 0 Then Err.Raise vbObjectError + 107, , "Student not found"
    If MsgBox("Delete this fictional student record?", vbYesNo + vbQuestion) <> vbYes Then Exit Sub
    ThisWorkbook.Worksheets("Students").Range("A" & r & ":G" & r).Delete Shift:=xlUp
End Sub

Public Sub RefreshDashboard()
    Dim ws As Worksheet, count As Long, r As Long
    Set ws = ThisWorkbook.Worksheets("Students")
    For r = 2 To ws.Cells(ws.Rows.Count, 1).End(xlUp).Row
        If Len(Trim$(CStr(ws.Cells(r, 1).Value2))) > 0 Then count = count + 1
    Next r
    ThisWorkbook.Worksheets("Dashboard").Range("B1").Value2 = count
End Sub`;
const registrationGuide=`UserForm name: frmRegistration\nCreate using Insert > UserForm in Excel's Visual Basic Editor (desktop Excel for Windows reference workflow).\nLayout: labels on the left; ID/name inputs top to bottom; Year/Section choices below; Save, Clear, Close along the bottom.\nLabels: lblStudentID Caption=Student ID; lblFirstName Caption=First Name; lblLastName Caption=Last Name; lblYear Caption=Year; lblSection Caption=Section.\nTextBoxes: txtStudentID, txtFirstName, txtLastName.\nComboBoxes: cboYearLevel (Style=2, fixed list 1–4), cboSection (Style=2, A/B).\nCommandButtons: btnSave Caption=Save; btnClear Caption=Clear; btnClose Caption=Close. Set logical TabIndex, captions, and accessible instructions.\nUserForm_Initialize fills fixed choices. btnSave_Click validates, checks ID uniqueness, writes a row; btnClear_Click resets/focuses; btnClose_Click Unload Me.\nAdd a standard module procedure ShowRegistration with frmRegistration.Show. Place event handlers in frmRegistration, never in a standard module.\nFor the project add lstStudents (ColumnCount=7), txtSearch, btnSearch, btnUpdate, btnDelete. Load IDs with rows; select an ID, never rely on the visible row index after filtering. Keep data logic in modStudents.\nWorkbook worksheets and exact columns are listed in Worksheet Layout. Check save, duplicate, invalid year, clear, close, search, update, and delete cancellation in actual Excel. Submit .xlsm via a workbook link, source, and real screenshots/testing notes. No CodeLab form designer or browser execution exists.`;
const registration=`Option Explicit
' Location: frmRegistration UserForm code
Private Sub UserForm_Initialize()
    Dim year As Long
    For year = 1 To 4
        cboYearLevel.AddItem CStr(year)
    Next year
    cboSection.AddItem "A": cboSection.AddItem "B"
End Sub

Private Sub btnSave_Click()
    On Error GoTo Failed
    Dim ws As Worksheet, r As Long, lastRow As Long, studentID As String
    studentID = Trim$(txtStudentID.Text)
    If studentID = "" Or Trim$(txtFirstName.Text) = "" Or Trim$(txtLastName.Text) = "" Then
        MsgBox "Complete the ID and names.": Exit Sub
    End If
    If cboYearLevel.ListIndex < 0 Or cboSection.ListIndex < 0 Then
        MsgBox "Choose year and section.": Exit Sub
    End If
    Set ws = ThisWorkbook.Worksheets("Students")
    lastRow = ws.Cells(ws.Rows.Count, 1).End(xlUp).Row
    For r = 2 To lastRow
        If StrComp(CStr(ws.Cells(r, 1).Value2), studentID, vbTextCompare) = 0 Then
            MsgBox "Duplicate ID.": Exit Sub
        End If
    Next r
    r = lastRow + 1
    ws.Range(ws.Cells(r, 1), ws.Cells(r, 3)).NumberFormat = "@"
    ws.Cells(r, 1).Value2 = studentID
    ws.Cells(r, 2).Value2 = Trim$(txtFirstName.Text)
    ws.Cells(r, 3).Value2 = Trim$(txtLastName.Text)
    ws.Cells(r, 4).Value2 = CLng(cboYearLevel.Value)
    ws.Cells(r, 5).Value2 = cboSection.Value
    ws.Cells(r, 6).Value = Date
    MsgBox "Fictional student saved.": Exit Sub
Failed:
    MsgBox "Unable to save. Check the practice worksheet and required controls."
End Sub

Private Sub btnClear_Click()
    txtStudentID.Text = "": txtFirstName.Text = "": txtLastName.Text = ""
    cboYearLevel.ListIndex = -1: cboSection.ListIndex = -1
    txtStudentID.SetFocus
End Sub

Private Sub btnClose_Click()
    Unload Me
End Sub`;
const projectGrades=`Option Explicit
${validGrade}

Public Function GradeAverage(ByVal a As Double, ByVal b As Double, ByVal c As Double) As Double
    GradeAverage = (a + b + c) / 3
End Function

Public Sub ProcessGrades()
    On Error GoTo Failed
    Dim ws As Worksheet, r As Long, lastRow As Long, average As Double
    Dim highest As Double, lowest As Double, processed As Long
    Set ws = ThisWorkbook.Worksheets("Grades")
    lastRow = ws.Cells(ws.Rows.Count, 1).End(xlUp).Row
    ws.Range("J1:J2").ClearContents
    For r = 2 To lastRow
        If Len(Trim$(CStr(ws.Cells(r, 2).Value2))) > 0 And ValidGrade(ws.Cells(r, 3).Value2) And ValidGrade(ws.Cells(r, 4).Value2) And ValidGrade(ws.Cells(r, 5).Value2) Then
            average = GradeAverage(CDbl(ws.Cells(r, 3).Value2), CDbl(ws.Cells(r, 4).Value2), CDbl(ws.Cells(r, 5).Value2))
            ws.Cells(r, 6).Value2 = average
            ws.Cells(r, 6).NumberFormat = "0.00"
            If average >= 75 Then
                ws.Cells(r, 7).Value2 = "PASSED"
                ws.Range("F" & r & ":G" & r).Interior.Color = RGB(198, 239, 206)
            Else
                ws.Cells(r, 7).Value2 = "FAILED"
                ws.Range("F" & r & ":G" & r).Interior.Color = RGB(255, 199, 206)
            End If
            If processed = 0 Then highest = average: lowest = average
            If average > highest Then highest = average
            If average < lowest Then lowest = average
            processed = processed + 1
        Else
            ws.Cells(r, 6).ClearContents: ws.Cells(r, 7).Value2 = "INVALID INPUT"
            ws.Range("F" & r & ":G" & r).Interior.Color = RGB(255, 235, 156)
        End If
    Next r
    If processed > 0 Then
        ws.Range("J1").Value2 = highest: ws.Range("J2").Value2 = lowest
        ws.Range("J1:J2").NumberFormat = "0.00"
    End If
    MsgBox "Processed " & processed & " valid students.": Exit Sub
Failed:
    MsgBox "Processing failed. Check the Grades practice sheet and source cells."
End Sub`;
const items=[];
function add(title,topics,explanation,code,activity,expected,facts,extra={}){if(facts.length!==5)throw Error(title);items.push({title,topics,explanation,code,activity,expected,facts,...extra});}
add('Introduction to Excel VBA','VBA, macros, automation, Developer tab, VBE windows, modules, recorded/manual macros, .xlsm',
 'Visual Basic for Applications automates Excel desktop. A macro is a callable procedure; recording captures actions, while writing code makes logic deliberate and reusable. Enable the Developer ribbon tab in Excel options to access the Visual Basic Editor. Project Explorer organizes the workbook, sheets, forms, and standard modules; the Properties window edits object names; the code window contains procedures. Save as .xlsm to retain code. Paste HelloVBA into Insert > Module, then invoke it from Developer > Macros. This course displays source and expected results; neither CodeLab nor Excel for the web runs VBA. Review your own source and follow local macro policy without globally enabling all macros.',
 macro('    MsgBox "Hello from Excel VBA!"','HelloVBA'),
 'Write a MsgBox macro displaying fictional Student Name, Course, Year Level, and School on separate lines using vbCrLf. Identify the module/procedure and the VBE windows; compare a recorded macro with manually written code.',
 'Excel desktop shows a Hello from Excel VBA! dialog. Your original activity shows four fictional student details; CodeLab displays instructions only.',
 [['What does VBA stand for?','Visual Basic for Applications','Virtual Browser Automation'],['Where is HelloVBA pasted?','A standard module in the Excel VBE','A worksheet cell'],['Which workbook type retains macros?','.xlsm','.csv'],['What does the recorder capture?','Actions as generated VBA code','All possible validation rules'],['Where does the macro actually run?','Microsoft Excel desktop','This CodeLab browser page']],
 {objectives:['Explain VBA automation in Excel.','Identify VBE Project Explorer, Properties, modules, and code windows.','Differentiate recorded macros from written procedures.','Create and run a simple desktop macro.'],layout:'Workbook: HelloVBA.xlsm\nAny blank worksheet. Insert a standard module named modIntroduction; no cell data is required.'});
add('Variables, Constants, and Data Types','Dim, Const, naming, Integer/Long/Double/String/Boolean/Date/Variant/Currency, Option Explicit, conversions',
 'Dim declares variables; Const declares values that cannot be reassigned. Declare each variable with its own As clause: in Dim a, b As Long only b is Long. Integer has a small range; use Long for worksheet row numbers. Double suits measurements, Currency fixed-point amounts, Date date/time, Boolean flags, and Variant heterogeneous cell values. Option Explicit requires declarations. CInt/CLng/CDbl/CStr/CDate convert values but can raise type or overflow errors; validate first and note locale-sensitive dates. DateSerial avoids ambiguous date strings. The example concatenates a name and formatted grade, not numeric addition.',
 macro(`    Const School As String = "CodeLab Practice School"
    Dim studentName As String, age As Long, grade As Double
    Dim enrolled As Boolean, enrollmentDate As Date, fee As Currency
    studentName = "Maria Santos": age = 19: grade = 95.5
    enrolled = True: enrollmentDate = DateSerial(2026, 8, 1): fee = 1250.5
    MsgBox studentName & " - " & Format$(grade, "0.0") & vbCrLf & School
    Debug.Print age, enrolled, Format$(enrollmentDate, "yyyy-mm-dd"), fee`,'StudentInfo'),
 'Declare all the suggested student fields, print them to a dialog/Immediate Window, predict their types, and fix an undeclared variable under Option Explicit. Demonstrate one validated conversion and an overflow case.',
 'Dialog: Maria Santos - 95.5 and the fictional school. Immediate Window includes age 19, True, 2026-08-01, and the fee.',
 [['What enforces declarations?','Option Explicit','Option Automatic'],['Which type suits an Excel row number?','Long','Integer for every possible row'],['What does Const prevent?','Reassigning the declared value','Reading the value'],['What does CDbl return?','A Double value','A date string'],['Why use DateSerial?','Construct a date without ambiguous text order','Encrypt a date']],{layout:'Workbook: StudentInfo.xlsm\nStandard module modTypes. No worksheet inputs; open View > Immediate Window in VBE for Debug.Print output.'});
add('Working with Cells and Ranges','Range, Cells, references, Value/Value2, Select/Activate, copying, ClearContents, Font/Interior/NumberFormat, rows/columns',
 'Qualify Range and Cells with the intended Worksheet. Range uses addresses; Cells uses row and column indexes. Value can expose Currency/Date subtypes, whereas Value2 avoids those conversions and often exposes dates as serial numbers. Assigning Value2 copies values without formats. ClearContents removes values/formulas but keeps formats; Clear removes more. Font, Interior, NumberFormat, Rows, and Columns format directly. Select/Activate change the UI selection and depend on active context, so understand them but prefer direct references. This example writes a practice header and record, copies to a scratch range, then clears only that scratch copy.',
 macro(`    Dim ws As Worksheet
    Set ws = ThisWorkbook.Worksheets("Students")
    ws.Range("A1").Value2 = "Student ID": ws.Range("B1").Value2 = "Student Name"
    ws.Cells(2, 1).Value2 = "P001": ws.Cells(2, 2).Value2 = "Maria Santos"
    ws.Range("A1:B1").Font.Bold = True
    ws.Range("A1:B1").Interior.Color = RGB(221, 235, 247)
    ws.Range("D1:E2").Value2 = ws.Range("A1:B2").Value2
    ws.Range("D1:E2").ClearContents
    ws.Columns("A:B").AutoFit`,'BuildStudentTable'),
 'Add headings/data to the exact Students sheet, format headers, copy values to a scratch area and clear that area. Explain why clearing A1:B5 would destroy source data. Compare Value and Value2 for an Excel date.',
 'Students A1:B2 contains ID/name headings and Maria; headers are bold/light blue, columns fit, D1:E2 is empty.',
 [['What does Cells(2,1) address?','A2','B1'],['What does ClearContents retain?','Formatting','All formulas'],['Why qualify Range?','Target the intended worksheet','Force the active worksheet'],['What does Value2 avoid?','Date/Currency subtype conversion','All numeric values'],['Is Select required for direct formatting?','No','Always']],{layout:'Workbook: StudentCells.xlsm\nWorksheet: Students, blank before practice. A1:B2 is the source table. D1:E2 is disposable scratch space. Standard module modRanges.'});
add('Conditional Statements and Loops','If/ElseIf/nested If, Select Case, For/For Each, Do While/Until, Exit For/Do, counters/accumulators',
 'If chooses branches; ElseIf evaluates later conditions only when preceding branches fail. Select Case expresses multiple cases. For counts iterations, For Each visits objects/items, and Do While/Until tests continuation or stopping conditions. Counters count records; accumulators total values. Exit For/Do leaves a loop. VBA And/Or do not short-circuit, so validate potentially unsafe conversions in separate statements. This example uses a For loop and a validated numeric grade in column C; final projects extend it to three grades.',
 `Option Explicit\n${validGrade}\n\nPublic Sub MarkStatuses()
    Dim ws As Worksheet, r As Long, lastRow As Long, passed As Long
    Set ws = ThisWorkbook.Worksheets("Grades")
    lastRow = ws.Cells(ws.Rows.Count, 1).End(xlUp).Row
    For r = 2 To lastRow
        If ValidGrade(ws.Cells(r, 3).Value2) Then
            If CDbl(ws.Cells(r, 3).Value2) >= 75 Then
                ws.Cells(r, 7).Value2 = "PASSED": passed = passed + 1
            Else
                ws.Cells(r, 7).Value2 = "FAILED"
            End If
        Else
            ws.Cells(r, 7).Value2 = "INVALID"
        End If
    Next r
    MsgBox passed & " passed using Grade 1."
End Sub`,
 'Predict results for 74, 75, 100, blank, text, and an error cell. Write statuses for all records, count passing students, demonstrate a terminating Do loop and For Each formatting, then refactor a grade-band branch with Select Case.',
 'For the sample Grade 1 values Maria passes and Joel fails; dialog reports 1 passed. Invalid values are explicitly marked.',
 [['Which grade passes at threshold 75?','75','74'],['What stops a For loop early?','Exit For','Continue Forever'],['What does a counter track?','Number of processed records','Only the last text value'],['Does VBA And short-circuit?','No','Always'],['Which loop visits collection items?','For Each','Select Case']],{layout:gradesLayout});
add('Subs, Functions, and Basic Automation','Sub/Function, parameters, arguments, return values, Public/Private, scope, reuse, Form/ActiveX buttons, recorded macros',
 'A Sub performs work; a Function returns a value by assigning its own name. Parameters describe inputs and arguments provide values. ByVal copies a value for the procedure; scope controls visibility. A Public parameterless Sub in a standard module can be assigned to a worksheet Form Control button. Functions can be reused in other macros; a worksheet UDF should not mutate unrelated cells. Form Controls are simpler and portable compared with Windows-only ActiveX controls; current Excel policies may restrict ActiveX. Review recorded Select/Activate code and replace it with qualified objects.',
 `Option Explicit
Public Function GetAverage(ByVal score1 As Double, ByVal score2 As Double) As Double
    GetAverage = (score1 + score2) / 2
End Function
Public Function GradeStatus(ByVal average As Double) As String
    If average >= 75 Then GradeStatus = "PASSED" Else GradeStatus = "FAILED"
End Function
Public Sub ProcessFirstStudent()
    Dim ws As Worksheet, average As Double
    Set ws = ThisWorkbook.Worksheets("Grades")
    If IsError(ws.Range("C2").Value2) Or IsError(ws.Range("D2").Value2) Then Exit Sub
    If Not IsNumeric(ws.Range("C2").Value2) Or Not IsNumeric(ws.Range("D2").Value2) Then Exit Sub
    average = GetAverage(CDbl(ws.Range("C2").Value2), CDbl(ws.Range("D2").Value2))
    ws.Range("F2").Value2 = average: ws.Range("F2").NumberFormat = "0.00"
    ws.Range("G2").Value2 = GradeStatus(average)
End Sub`,
 'Add validated average/status/format procedures and a worksheet Form Control button assigned to the main macro. Record simple formatting in a practice copy, inspect it, and rewrite qualified statements without Select. Add 0–100 validation to the two-score reference.',
 'The two-score reference writes 91.50 and PASSED for Maria. Clicking the assigned Form Control button invokes the same main Sub.',
 [['What distinguishes a Function?','It returns a value','It must display a form'],['What sets a VBA function result?','Assigning its function name','Return keyword required'],['Which macro can a Form button invoke?','A Public parameterless standard-module Sub','Any Private parameterized function'],['Why refactor recorded Select calls?','Reduce dependence on active UI context','Remove every object reference'],['Are ActiveX controls universally available?','No; platform/policy dependent','Yes in Excel for the web']],{layout:gradesLayout});
add('Beginner Project — Automated Student Grade Sheet','grade sheet automation, validated grades, three-score averages, statuses, extrema, highlights, button and completion message',
 'Build an original StudentGrades.xlsm workbook around the specified Grades layout. Separate validation, average calculation, and orchestration. Highest/lowest summaries describe valid student averages rather than silently treating blank or invalid grades as zero. The reference initializes extrema from the first valid average, rejects invalid rows, formats averages, colors status cells, and reports the count. Source grades are retained; tests must cover an empty class, invalid rows, threshold 75, zero, and 100. Add the Run Grade Processing Form Control button after testing the public Sub.',
 projectGrades,
 'Milestones: create the exact workbook/table and fictional sample data → validate grades → add reusable average/status procedures → loop records → format/highlight → calculate extrema → assign the Run Grade Processing button → test. Independently implement and document at least five boundary/failure cases. Submit source, .xlsm workbook link, screenshots, and test results.',
 'Maria: F2 91.33, G2 PASSED, green. Joel: F3 67.67, G3 FAILED, red. J1 91.33; J2 67.67. Dialog: Processed 2 valid students. Invalid rows show INVALID INPUT and do not enter extrema.',
 [['Which rows enter the extrema?','Only valid processed students','Every blank row as zero'],['What average do 95,88,91 give?','91.333…','274'],['What passes the project threshold?','Average at least 75','Every nonempty name'],['Why use a reusable validation function?','Consistent checks before conversion','Suppress all errors'],['What must project evidence include?','Source workbook link and actual tests','A claimed browser macro run']],{layout:gradesLayout,project:true});
add('Advanced Range and Worksheet Manipulation','ThisWorkbook/ActiveWorkbook, Worksheet/Worksheets, qualified dynamic ranges, last row, UsedRange, rows/formulas/AutoFit/sort/filter',
 'ThisWorkbook is the workbook containing the macro; ActiveWorkbook/ActiveSheet depend on the current UI. Obtain a Worksheet variable and qualify both Range endpoints and Rows.Count. End(xlUp) locates the last nonempty cell in a chosen key column, but a blank table returns header row 1. UsedRange may include formatted empty cells and is not an exact record count. Insert/Delete shift worksheet data and require practice copies/confirmation for destructive actions. Formula assigns a formula, while Value2 assigns data. Sort and AutoFilter must include correct headers/range; clear obsolete filter criteria before comparing results.',
 macro(`    Dim ws As Worksheet, r As Long
    Set ws = ThisWorkbook.Worksheets("Grades")
    r = ws.Cells(ws.Rows.Count, 1).End(xlUp).Row + 1
    ws.Cells(r, 1).NumberFormat = "@": ws.Cells(r, 1).Value2 = "P003"
    ws.Cells(r, 2).Value2 = "Ana Reyes"
    ws.Cells(r, 3).Value2 = 80: ws.Cells(r, 4).Value2 = 85: ws.Cells(r, 5).Value2 = 90
    ws.Cells(r, 6).Formula = "=AVERAGE(C" & r & ":E" & r & ")"
    ws.Cells(r, 6).NumberFormat = "0.00"
    ws.Columns("A:G").AutoFit`,'AppendPracticeStudent'),
 'Find the last record, append a unique student, insert/fill formulas and format the range. Prevent duplicate P003 on repeated runs. Add a header-aware sort/filter in a practice copy and explain UsedRange versus a key-column last row.',
 'One run adds Ana at the next row with average 85.00. The reference is a one-run append demonstration; your activity must reject a repeated ID.',
 [['Which workbook contains the running code?','ThisWorkbook','Always ActiveWorkbook'],['Why qualify Rows.Count?','Use the intended sheet boundary','Count records exactly'],['What can expand UsedRange?','Formatting empty cells','Only numeric records'],['Which property writes a formula?','Formula','Caption'],['What must sort specify?','Range keys and header handling','Only the active cell']],{layout:gradesLayout});
add('Events in Excel VBA','Workbook_Open/BeforeClose, Worksheet_Change/SelectionChange, event locations, EnableEvents, recursion and cleanup',
 'Workbook event procedures belong in ThisWorkbook; worksheet events belong in that sheet module. Worksheet_Change receives Target, which can contain multiple cells after a paste; formula recalculation does not trigger it. Intersect limits the work to grade inputs. SelectionChange receives the selected cells, not changed values. Writing results inside Change can recurse, so save the original EnableEvents setting, disable events for the update, and restore the saved setting in both success and failure paths. Workbook_Open may initialize lists; BeforeClose has a Cancel parameter and should respect user work rather than force saving/closing.',
 `Option Explicit
' Location: Grades worksheet code module, not a standard module
Private Sub Worksheet_Change(ByVal Target As Range)
    Dim changed As Range, cell As Range, oldEvents As Boolean
    Dim value As Variant, message As String
    Set changed = Application.Intersect(Target, Me.Range("C2:C1000"))
    If changed Is Nothing Then Exit Sub
    oldEvents = Application.EnableEvents
    On Error GoTo Failed
    Application.EnableEvents = False
    For Each cell In changed.Cells
        value = cell.Value2
        If IsError(value) Then
            Me.Cells(cell.Row, 7).Value2 = "INVALID"
        ElseIf Len(Trim$(CStr(value))) = 0 Then
            Me.Cells(cell.Row, 7).ClearContents
        ElseIf Not IsNumeric(value) Then
            Me.Cells(cell.Row, 7).Value2 = "INVALID"
        ElseIf CDbl(value) < 0 Or CDbl(value) > 100 Then
            Me.Cells(cell.Row, 7).Value2 = "INVALID"
        ElseIf CDbl(value) >= 75 Then
            Me.Cells(cell.Row, 7).Value2 = "PASSED"
        Else
            Me.Cells(cell.Row, 7).Value2 = "FAILED"
        End If
    Next cell
CleanExit:
    Application.EnableEvents = oldEvents
    If message <> "" Then MsgBox message
    Exit Sub
Failed:
    message = "Check grade inputs and worksheet access."
    Resume CleanExit
End Sub`,
 'Place Change in Grades, test single-cell and multi-cell grade edits, reject invalid entries with visible status/feedback, and preserve EnableEvents after a deliberately induced worksheet failure. Add Workbook_Open in ThisWorkbook to display a practice welcome and a cancellable BeforeClose confirmation. Compare Change and SelectionChange.',
 'Editing Grade 1 updates its status automatically; blank clears it and invalid/error input marks INVALID. The prior EnableEvents value is restored after success or error.',
 [['Where does Worksheet_Change belong?','The worksheet code module','A standard module only'],['Can Target contain several cells?','Yes after a paste','Never'],['Does Change fire on formula recalculation?','No','Always'],['What prevents event recursion?','Temporarily disabling events with cleanup','Deleting the handler'],['What setting should cleanup restore?','The saved previous EnableEvents value','Always False']],{layout:gradesLayout,location:'Grades worksheet module; companion workbook events in ThisWorkbook'});
add('UserForms and Controls','UserForm design, labels/text/choices/list/buttons/check/options, Initialize, events, save/clear/close',
 'A UserForm is designed in desktop VBE and has its own code module. Name identifies controls in code; Caption labels buttons/forms, and Text/Value expose data. Initialize populates fixed choices, control events respond to actions, and validation must precede worksheet writes. ComboBox fixed lists avoid arbitrary choices. ListBoxes display records; CheckBoxes represent independent flags, grouped OptionButtons exclusive choices. Hide retains an instance, while Unload discards it. The guide describes the actual controls needed by the source; CodeLab does not render or emulate the UserForm.',
 registration,
 'Build frmRegistration exactly as specified. Add a standard-module ShowRegistration procedure, validate ID/names/year/section, find the next row, and write the fictional record. Demonstrate ListBox, CheckBox, and grouped OptionButtons on a separate practice form. Capture Save/Clear/Close behavior in real Excel.',
 'The form saves one validated, unique student to Students A:F, Clear resets/focuses, and Close unloads. No browser-generated workbook result is claimed.',
 [['Where is btnSave_Click written?','The UserForm code module','A cell formula'],['What fills choices when the form starts?','UserForm_Initialize','Worksheet recalculation only'],['What distinguishes Unload from Hide?','Unload discards the instance','They always preserve all state identically'],['What identifies the next row?','Qualified last key row plus one','Always row 2'],['What must happen before saving?','Validate fields and uniqueness','Accept every entered value']],{layout:studentsLayout,form:registrationGuide,location:'frmRegistration; ShowRegistration in a standard module'});
add('Arrays and Collections','1D/2D arrays, dynamic ReDim/Preserve, LBound/UBound, Collection Add/Item/Count/Remove/For Each, batch ranges',
 'A multi-cell Range.Value2 returns a two-dimensional Variant array indexed by row and column; LBound/UBound describe actual bounds. Dynamic arrays use ReDim. ReDim Preserve preserves data only when changing the last dimension of a multidimensional array; it does not freely resize every dimension. VBA Collection adds/removes items and enumerates them with a Variant or object; indexes shift after removal. Read/write worksheet values in batches to reduce expensive Excel calls, while validating elements and guarding an empty data range.',
 `Option Explicit\n${validGrade}\n\nPublic Sub ArrayGradeReport()
    Dim ws As Worksheet, lastRow As Long, grades As Variant, results() As Variant
    Dim r As Long, average As Double, passed As Long, failed As Long
    Dim outcomes As New Collection, item As Variant
    Set ws = ThisWorkbook.Worksheets("Grades")
    lastRow = ws.Cells(ws.Rows.Count, 1).End(xlUp).Row
    If lastRow < 2 Then Exit Sub
    grades = ws.Range("C2:E" & lastRow).Value2
    ReDim results(1 To UBound(grades, 1), 1 To 2)
    For r = LBound(grades, 1) To UBound(grades, 1)
        If ValidGrade(grades(r, 1)) And ValidGrade(grades(r, 2)) And ValidGrade(grades(r, 3)) Then
            average = (CDbl(grades(r, 1)) + CDbl(grades(r, 2)) + CDbl(grades(r, 3))) / 3
            results(r, 1) = average
            If average >= 75 Then
                results(r, 2) = "PASSED": passed = passed + 1
            Else
                results(r, 2) = "FAILED": failed = failed + 1
            End If
        Else
            results(r, 2) = "INVALID"
        End If
    Next r
    ws.Range("F2:G" & lastRow).Value2 = results
    ws.Range("F2:F" & lastRow).NumberFormat = "0.00"
    outcomes.Add passed: outcomes.Add failed
    For Each item In outcomes
        Debug.Print item
    Next item
End Sub`,
 'Process grades/averages/counts with a 2D array, write results in one assignment, and compare a cell-by-cell version. Demonstrate a dynamic 1D array with ReDim Preserve and a Collection with Add/Item/Count/Remove; test blank data and invalid grades.',
 'F:G receives Maria 91.33 PASSED and Joel 67.67 FAILED; Immediate Window shows passed 1 and failed 1. Invalid rows are marked separately.',
 [['What does a multi-cell Value2 read return?','A 2D Variant array','Always a single String'],['What does UBound inspect?','An array upper bound','Last worksheet row automatically'],['Which dimension may Preserve resize?','The last dimension','Every dimension arbitrarily'],['What reduces Excel object calls?','Batch range/array operations','Selecting each cell repeatedly'],['What happens to collection indexes after Remove?','Later indexes can shift','Every index stays permanent']],{layout:gradesLayout});
add('Error Handling and Validation','runtime/logical errors, On Error GoTo, Err, Resume, IsNumeric/IsDate/Len/Trim, duplicates, breakpoints/Immediate/Step',
 'Runtime errors interrupt execution; logical errors produce incorrect results without necessarily raising an error. On Error GoTo names a handler. Capture useful diagnostics internally with Err.Number/Description, but show user-friendly messages rather than private paths. Resume CleanExit resumes outside the active handler so cleanup runs. IsNumeric/IsDate validate convertibility, not business validity; check ranges and required names separately. Duplicate IDs require exact comparison, not wildcard CountIf behavior. Use breakpoints, Watches, Immediate Window, Debug.Print, and Step Into to inspect state. On Error Resume Next is reserved for a narrowly scoped operation such as cleanup and followed immediately by On Error GoTo 0.',
 `Option Explicit\n${findRow}\n\nPublic Sub ValidatePracticeRecord()
    On Error GoTo Failed
    Dim ws As Worksheet, studentID As String, value As Variant
    Set ws = ThisWorkbook.Worksheets("Students")
    studentID = Trim$(InputBox("Enter a new fictional student ID:"))
    If studentID = "" Then Exit Sub
    If FindStudentRow(studentID) > 0 Then Err.Raise vbObjectError + 201, , "Duplicate ID"
    If Len(Trim$(CStr(ws.Range("B2").Value2))) = 0 Then Err.Raise vbObjectError + 202, , "First name required"
    value = ws.Range("G2").Value2
    If IsError(value) Then Err.Raise vbObjectError + 203, , "Grade cell error"
    If Not IsNumeric(value) Then Err.Raise vbObjectError + 204, , "Numeric grade required"
    If CDbl(value) < 0 Or CDbl(value) > 100 Then Err.Raise vbObjectError + 205, , "Grade out of range"
    If Not IsDate(ws.Range("F2").Value) Then Err.Raise vbObjectError + 206, , "Valid enrollment date required"
    MsgBox "Validation succeeded; this demonstration does not insert a record."
CleanExit:
    Exit Sub
Failed:
    Debug.Print "Validation error number", Err.Number
    MsgBox "Record rejected. Check required fields, grade, date, and duplicate ID."
    Resume CleanExit
End Sub`,
 'Improve frmRegistration with grade/date fields and exact duplicate checking. Test blank names, error/text/negative/out-of-range grades, invalid dates, duplicates, and a missing sheet. Step into the handler and prove invalid input leaves records unchanged.',
 'A new ID and valid sample values pass the validation demonstration without inserting data. Duplicate or invalid fields produce friendly feedback and no new row.',
 [['Does IsNumeric enforce 0–100?','No; check range separately','Yes'],['What does Resume CleanExit do?','Resume at cleanup outside the handler','Disable all future errors'],['How should duplicates be compared?','Exact IDs with deliberate case handling','Wildcard text blindly'],['Where is Debug.Print visible?','VBE Immediate Window','An automatic browser terminal'],['Should Resume Next be global strategy?','No','Yes']],{layout:studentsLayout});
add('Intermediate Project — Student Record Management Workbook','workbook CRUD/search/filter, UserForm, validation, collections/arrays, dynamic ranges, confirmation/errors',
 'Create StudentRecords.xlsm with Students, Lists, and Dashboard. Separate the form from modStudents data procedures. Use unique IDs as keys; filtered display indexes are not stable identifiers. The supplied module demonstrates validated add, exact lookup, section edit, confirmed deletion, and dashboard refresh. Connect the form controls to those procedures, add full-field editing, ListBox view/search/filter, arrays for loading, and error feedback in event handlers. Store user text as literal data and treat workbook protection as accidental-edit protection rather than authentication.',
 crud,
 'Milestones: create sheets/list data → build named UserForm → add validated registration → implement ListBox view and exact-ID search → edit/delete with confirmation → filter/load via arrays → refresh Dashboard → test recovery. Submit your complete .xlsm via a workbook link, exported VBA source, real screenshots, and tests for duplicate/blank IDs, invalid fields, missing sheet, filtered selection, repeated save, and canceled deletion.',
 'Your completed desktop workbook supports Add/View/Search/Edit/Delete, rejects duplicate IDs, preserves unrelated records, asks before deletion, and refreshes an accurate count. The reference is a reusable data module, not the completed UserForm application.',
 [['What key survives filtering?','Unique student ID','Visible ListBox row index'],['Where should data logic live?','Reusable data module','Duplicated in every event'],['What precedes deletion?','Confirmation and exact lookup','Immediate whole-sheet deletion'],['What protects input before mutation?','Validation in the data procedure','Only colored controls'],['Does worksheet protection authenticate users?','No','Yes']],{layout:studentsLayout,form:registrationGuide,project:true});
add('Advanced UserForms and Application Design','multiple forms, login concept, modal/modeless Show/Hide/Unload, properties/data passing, navigation, dynamic controls, modules',
 'Separate form navigation from persistence and authentication. A modal form blocks its caller; modeless permits interaction with Excel. Hide retains state, Unload releases it; clear session/demo state on logout. Pass IDs or values through deliberate properties, not global ActiveCell assumptions. Controls.Add can create dynamic controls, but dynamic event handling requires an appropriate class/WithEvents design. The supplied navigation example is explicitly a simulation: username/role labels and a masked textbox do not authenticate anyone. Never put plaintext passwords in sheets or source or claim workbook protection is secure login. A real deployment needs a teacher-approved external authentication service and server-side role enforcement.',
 `Option Explicit
' Location: frmLogin, navigation simulation only; not credential verification
Private Sub UserForm_Initialize()
    lblMode.Caption = "DEMO NAVIGATION ONLY - no authentication"
    txtPassword.PasswordChar = "*"
End Sub
Private Sub btnLogin_Click()
    If Len(Trim$(txtUsername.Text)) = 0 Then MsgBox "Enter a fictional display name.": Exit Sub
    If Len(txtPassword.Text) > 0 Then
        txtPassword.Text = ""
        MsgBox "Do not enter passwords into this navigation demo.": Exit Sub
    End If
    frmDashboard.Caption = "Demo dashboard: " & Trim$(txtUsername.Text)
    Me.Hide
    frmDashboard.Show vbModal
    Unload Me
End Sub`,
 'Create frmLogin/frmDashboard/frmStudents with navigation, an explicit demo label, and logout that clears state. Compare modal/modeless behavior and expose a SelectedStudentID property to a search form. Document real authentication requirements; do not collect real passwords or present the demo as access control.',
 'A fictional display name opens a clearly marked demo dashboard; password entry is rejected. The desktop forms navigate but no identity or authorization is verified.',
 [['Does masking a password authenticate it?','No','Yes'],['What does Hide retain?','The form instance and state','Nothing at all'],['What does modal Show do?','Block the caller until the form closes/hides','Run browser VBA'],['How should selected records be passed?','An explicit stable ID/property','ActiveCell always'],['Where must real permissions be enforced?','A trusted authorization service/data layer','Only a hidden worksheet']],{layout:studentsLayout,form:registrationGuide+'\nAdditional forms: frmLogin controls lblMode, txtUsername, txtPassword (PasswordChar=*), btnLogin; frmDashboard btnStudents/btnLogout; frmStudents registration controls. Dashboard btnStudents opens frmStudents; btnLogout unloads the dashboard and clears demo state. Put each event in its named form module. Use actual screenshots.',location:'frmLogin code module'});
add('Advanced Excel Automation','multiple sheets/workbooks, report creation, summaries, sort/filter, dashboard, PageSetup/PrintArea, PDF/export concepts',
 'Use qualified source/destination Workbooks and Worksheets. Creating a worksheet does not create a new workbook; Workbooks.Add does. Data copying can assign arrays directly without clipboard selection. Report sheets should be named deliberately, validated before replacement, and exclude private records. PageSetup specifies print area/orientation and formatting; PDF availability and layout depend on the installed desktop Excel environment. PrintPreview previews without silently sending output to a printer. This reference creates a fresh named report, copies fictional student values, and prepares printing; optional PDF export must use an approved path and explicit overwrite confirmation.',
 macro(`    On Error GoTo Failed
    Dim source As Worksheet, report As Worksheet, lastRow As Long, name As String, sheet As Worksheet
    Set source = ThisWorkbook.Worksheets("Students")
    lastRow = source.Cells(source.Rows.Count, 1).End(xlUp).Row
    name = "Report_" & Format$(Now, "yymmdd_hhnnss")
    For Each sheet In ThisWorkbook.Worksheets
        If sheet.Name = name Then MsgBox "A report with that timestamp exists; try again.": Exit Sub
    Next sheet
    Set report = ThisWorkbook.Worksheets.Add(After:=source)
    report.Name = name
    report.Range("A:C").NumberFormat = "@"
    report.Range("A1:G" & lastRow).Value2 = source.Range("A1:G" & lastRow).Value2
    report.Range("A1:G1").Font.Bold = True: report.Columns("A:G").AutoFit
    report.PageSetup.PrintArea = report.Range("A1:G" & lastRow).Address
    report.PageSetup.Orientation = xlLandscape
    report.PageSetup.Zoom = False: report.PageSetup.FitToPagesWide = 1
    MsgBox "Report prepared: " & name
    Exit Sub
Failed:
    MsgBox "Unable to prepare report; check worksheet access."
`,'CreateStudentReport'),
 'Build a monthly performance report with independently calculated statistics, filters and sort order, dashboard refresh, print area and Print Preview. Copy to a separate practice workbook, then add an optional PDF export with a chosen path and confirmation before replacement.',
 'A new timestamp-named report sheet contains the sample records and landscape, one-page-wide print setup. No file or printer output occurs automatically.',
 [['Which API creates a new workbook?','Workbooks.Add','Worksheets.Add'],['What prepares print bounds?','PageSetup.PrintArea','A password textbox'],['What should overwrite require?','Explicit user confirmation','Silent replacement'],['What avoids clipboard dependence?','Direct range Value2 assignment','Selecting every cell'],['Is PDF export guaranteed in all environments?','No; verify desktop support','Yes in CodeLab']],{layout:studentsLayout});
add('Working with Files and External Data','Workbooks.Open/Close/Save/SaveAs, CSV/text, Dir/FileDialog, folder selection, extensions/paths, external workbook refs',
 'FileDialog/GetOpenFilename returns user-selected paths; cancellation must exit cleanly. Validate path, extension, existence, size, and expected columns before writing. Dir tests file existence; file paths do not guarantee safe content. The reference imports a deliberately restricted three-column CSV with no quoted fields, commas inside fields, or embedded newlines; it is not a general CSV parser. It validates the entire file before batch-writing and stores values as text to avoid formula interpretation. For external Excel workbooks use Workbooks.Open with UpdateLinks:=0 and read-only mode, temporarily force-disable their macros, restore AutomationSecurity in cleanup, and close without saving. Never change global macro policy or execute unknown workbook code.',
 `Option Explicit
Public Sub ImportSimpleCSV()
    On Error GoTo Failed
    Dim path As Variant, fileNumber As Integer, opened As Boolean, line As String
    Dim parts As Variant, rows As New Collection, item As Variant, data() As Variant
    Dim ws As Worksheet, r As Long, c As Long, startRow As Long
    path = Application.GetOpenFilename("CSV files (*.csv),*.csv")
    If VarType(path) = vbBoolean Then Exit Sub
    If LCase$(Right$(CStr(path), 4)) <> ".csv" Then Err.Raise vbObjectError + 301
    If Dir$(CStr(path)) = "" Then Err.Raise vbObjectError + 302
    If FileLen(CStr(path)) > 1048576 Then Err.Raise vbObjectError + 303
    fileNumber = FreeFile
    Open CStr(path) For Input Access Read As #fileNumber: opened = True
    If EOF(fileNumber) Then Err.Raise vbObjectError + 304
    Line Input #fileNumber, line
    If line <> "StudentID,FirstName,LastName" Then Err.Raise vbObjectError + 305
    Do Until EOF(fileNumber)
        Line Input #fileNumber, line
        If Len(Trim$(line)) > 0 Then
            If InStr(line, """") > 0 Then Err.Raise vbObjectError + 306
            parts = Split(line, ",")
            If UBound(parts) <> 2 Then Err.Raise vbObjectError + 307
            For c = 0 To 2
                If Len(Trim$(parts(c))) = 0 Then Err.Raise vbObjectError + 308
            Next c
            rows.Add parts
            If rows.Count > 10000 Then Err.Raise vbObjectError + 309
        End If
    Loop
    Close #fileNumber: opened = False
    If rows.Count = 0 Then Exit Sub
    ReDim data(1 To rows.Count, 1 To 3)
    For r = 1 To rows.Count
        item = rows(r)
        For c = 1 To 3
            data(r, c) = "'" & Trim$(CStr(item(c - 1)))
        Next c
    Next r
    Set ws = ThisWorkbook.Worksheets("ImportStaging")
    startRow = ws.Cells(ws.Rows.Count, 1).End(xlUp).Row + 1
    ws.Range(ws.Cells(startRow, 1), ws.Cells(startRow + rows.Count - 1, 3)).NumberFormat = "@"
    ws.Range(ws.Cells(startRow, 1), ws.Cells(startRow + rows.Count - 1, 3)).Value2 = data
    MsgBox rows.Count & " rows staged; validate IDs before merging."
    Exit Sub
Failed:
    If opened Then
        On Error Resume Next
        Close #fileNumber
        On Error GoTo 0
    End If
    MsgBox "Import rejected. Check the simple CSV format, file size, and practice sheet."
End Sub`,
 'Create the described simple CSV, select it and verify staging. Add unique-ID validation before merging into Students. Extend the activity to folder-selected, validated files and controlled workbook reads, with cleanup of open resources; prompt before every overwrite/deletion. Test cancellation, missing/oversized files, malformed headers/quotes, duplicate IDs, and formula-looking text.',
 'The two sample CSV rows append to ImportStaging as literal text; existing Students data is unchanged. Invalid files leave staging unchanged. No files are deleted or overwritten.',
 [['What must canceling a dialog do?','Exit without changing data','Open a default unknown file'],['What should validation precede?','Any record merge','Only the final screenshot'],['What does this CSV example reject?','Quoted or comma-containing fields','All three-column files'],['What prevents importing external workbook macros?','Forced macro disabling during read with restored state','Turning on all macros'],['What should formula-looking CSV text become?','Literal text','An automatically evaluated formula']],{layout:studentsLayout+'\nAdd sheet ImportStaging. A1:C1: StudentID, FirstName, LastName.\nCreate a small plain UTF-8/ASCII practice CSV:\nStudentID,FirstName,LastName\nP003,Ana,Reyes\nP004,Luis,Garcia\nNo quoted fields, embedded commas/newlines, or BOM in this restricted reference.'});
add('Database Concepts with VBA','ADO Connection/Command/Recordset, Access/SQL concepts, parameters, connections, SELECT/INSERT/UPDATE/DELETE, cleanup/security',
 'ADO connects desktop Excel to a separate educational database. Late-bound ADODB objects avoid a compile-time reference but still require Windows ADO and a compatible installed provider. This example uses an existing local Access .accdb selected by the student; ACE availability and Office bitness must match. A Connection opens the provider; a Command holds SQL and parameters; a Recordset exposes rows. Access uses positional ? placeholders, so append parameters in SQL order. SELECT copies records to a worksheet; INSERT/UPDATE/DELETE must use the same parameter pattern and controlled permissions. Never concatenate form values into SQL, connect to CodeLab databases, or embed credentials. Close Recordsets and Connections in cleanup, including failure paths.',
 `Option Explicit
Public Sub ReadPracticeStudents()
    On Error GoTo Failed
    Dim path As Variant, cn As Object, cmd As Object, rs As Object, ws As Worksheet
    path = Application.GetOpenFilename("Access practice (*.accdb),*.accdb")
    If VarType(path) = vbBoolean Then Exit Sub
    If LCase$(Right$(CStr(path), 6)) <> ".accdb" Then Err.Raise vbObjectError + 401
    If InStr(CStr(path), ";") > 0 Or InStr(CStr(path), """") > 0 Then Err.Raise vbObjectError + 402
    If Dir$(CStr(path)) = "" Then Err.Raise vbObjectError + 403
    Set cn = CreateObject("ADODB.Connection")
    cn.Mode = 1 ' adModeRead; SELECT practice only
    cn.Open "Provider=Microsoft.ACE.OLEDB.12.0;Data Source=" & CStr(path) & ";"
    Set cmd = CreateObject("ADODB.Command")
    Set cmd.ActiveConnection = cn: cmd.CommandType = 1
    cmd.CommandText = "SELECT StudentID,FirstName,LastName,YearLevel,Section,EnrollmentDate,Average FROM Students WHERE StudentID >= ? ORDER BY StudentID"
    cmd.Parameters.Append cmd.CreateParameter("pID", 202, 1, 20, "P001")
    Set rs = cmd.Execute
    Set ws = ThisWorkbook.Worksheets("DatabaseResults")
    ws.Range("A2:G1000").ClearContents
    ws.Range("A:C").NumberFormat = "@"
    If Not rs.EOF Then ws.Range("A2").CopyFromRecordset rs
CleanExit:
    On Error Resume Next ' narrow resource cleanup only
    If Not rs Is Nothing Then If rs.State <> 0 Then rs.Close
    If Not cn Is Nothing Then If cn.State <> 0 Then cn.Close
    On Error GoTo 0
    Set rs = Nothing: Set cmd = Nothing: Set cn = Nothing
    Exit Sub
Failed:
    MsgBox "Practice database unavailable. Check the approved provider, file, and schema."
    Resume CleanExit
End Sub

' Optional UPDATE pattern: only a separate writable educational connection
Public Sub UpdatePracticeAverage(ByVal cn As Object, ByVal studentID As String, ByVal average As Double)
    Dim cmd As Object
    If average < 0 Or average > 100 Then Err.Raise vbObjectError + 404
    If Len(Trim$(studentID)) = 0 Or Len(studentID) > 20 Then Err.Raise vbObjectError + 405
    Set cmd = CreateObject("ADODB.Command")
    Set cmd.ActiveConnection = cn: cmd.CommandType = 1
    cmd.CommandText = "UPDATE Students SET Average = ? WHERE StudentID = ?"
    cmd.Parameters.Append cmd.CreateParameter("pAverage", 5, 1, , average)
    cmd.Parameters.Append cmd.CreateParameter("pID", 202, 1, 20, studentID)
    cmd.Execute
End Sub`,
 'With a teacher-provided local practice .accdb and installed matching provider, retrieve records and explain object lifetimes/parameter ordering. Optionally implement controlled INSERT/UPDATE/DELETE with parameters and confirmation before deletion. If ADO is unavailable, complete a provider/schema/query-design exercise and document the limitation; never substitute the CodeLab DB.',
 'Windows Excel with a compatible ACE provider fills DatabaseResults from the separate practice DB. Cancellation changes nothing; missing provider/schema shows friendly feedback. The optional UPDATE does not run automatically.',
 [['Where may the lab connect?','A separate educational database','CodeLab production DB'],['How are input values bound?','Command parameters','Concatenated SQL strings'],['What matters for Access ? parameters?','Append order','Only the displayed parameter name'],['What reads returned rows?','A Recordset','A ComboBox alone'],['What must failure cleanup close?','Open Recordsets and Connections','Only the form']],{layout:studentsLayout+'\nAdd DatabaseResults with the same A:G headers. Teacher creates PracticeStudents.accdb: Students(StudentID TEXT(20) primary key, FirstName TEXT(50), LastName TEXT(50), YearLevel LONG, Section TEXT(20), EnrollmentDate DATETIME, Average DOUBLE). Seed the two fictional records. No .accdb download or credentials are supplied by CodeLab.',platform:'Excel desktop for Windows; installed compatible ACE OLE DB provider; separate teacher-created .accdb'});
add('Performance, Security, and Best Practices','Option Explicit, modularity, arrays, ScreenUpdating/EnableEvents/Calculation cleanup, macros/signatures/passwords/file validation/debugging',
 'Reduce repeated worksheet calls with arrays and batch writes. Save original ScreenUpdating, EnableEvents, and Calculation values before changing them; restore those exact values on success and failure, rather than forcing Automatic/True. Avoid Select/Activate, use meaningful names and constants, and keep procedures small. Timing with Timer wraps at midnight, so adjust elapsed time when comparing implementations. Only trusted, reviewed macros should run under the organization policy; signatures help identify publishers, and sheet/VBA-project protection is not secure credential storage. Do not store passwords or log sensitive details. Debug with breakpoints, Watches, Immediate Window, and Step execution.',
 macro(`    Dim oldScreen As Boolean, oldEvents As Boolean, oldCalculation As XlCalculation
    Dim ws As Worksheet, values As Variant, lastRow As Long, r As Long, started As Double, elapsed As Double
    oldScreen = Application.ScreenUpdating: oldEvents = Application.EnableEvents
    oldCalculation = Application.Calculation
    On Error GoTo Failed
    started = Timer
    Application.ScreenUpdating = False: Application.EnableEvents = False
    Application.Calculation = xlCalculationManual
    Set ws = ThisWorkbook.Worksheets("Grades")
    lastRow = ws.Cells(ws.Rows.Count, 1).End(xlUp).Row
    If lastRow < 2 Then GoTo CleanExit
    values = ws.Range("B2:B" & lastRow).Value2
    If lastRow = 2 Then
        ws.Range("B2").Value2 = Trim$(CStr(values))
    Else
        For r = LBound(values, 1) To UBound(values, 1)
            values(r, 1) = Trim$(CStr(values(r, 1)))
        Next r
        ws.Range("B2:B" & lastRow).Value2 = values
    End If
    elapsed = Timer - started
    If elapsed < 0 Then elapsed = elapsed + 86400
    Debug.Print "Seconds:", elapsed
CleanExit:
    Application.ScreenUpdating = oldScreen: Application.EnableEvents = oldEvents
    Application.Calculation = oldCalculation
    Exit Sub
Failed:
    Debug.Print "Processing error number:", Err.Number
    MsgBox "Processing failed; application settings will be restored."
    Resume CleanExit`,'OptimizedNameCleanup'),
 'Compare cell-by-cell and array-based cleanup on a fictional data copy, preserve correctness, and measure time over several runs. Force a missing-sheet error and verify all saved settings are restored. Review macro trust/signatures, plain-text-password risks, file handling, and non-sensitive logging.',
 'Names are trimmed and time is reported in the Immediate Window. The exact original ScreenUpdating/EnableEvents/Calculation values are restored, including on error and empty input.',
 [['What should cleanup restore?','Original application settings','Always disable events'],['What improves bulk processing?','Fewer worksheet calls via arrays','More Select calls'],['Does workbook protection securely store passwords?','No','Yes'],['Should all macros be globally enabled?','No','Yes'],['What happens to Timer at midnight?','It wraps, requiring elapsed adjustment','It always counts upward forever']],{layout:gradesLayout});
add('Advanced Project — Excel VBA Student Information System','integrated workbook, forms, demo/secure-auth boundary, dashboard CRUD/search/report print/export backup validation architecture',
 'Create an original macro-enabled Student Information System with Students, Lists, Dashboard, Report, and ImportStaging sheets; reusable modStudents/modReports/modFiles/modValidation modules; and frmLogin/frmDashboard/frmStudents/frmSearch/frmReports forms. Worksheet storage is the default learning mode; an external ADO practice database is an optional alternative. The login screen must explicitly identify demo navigation unless a genuine secure external credential/authorization provider is integrated; no worksheet passwords or hard-coded passwords. Implement full record editing/details, stable-ID search/filter, dashboard counts, printable/PDF reports where supported, and timestamped backups with overwrite confirmation. The reference combines the earlier tested-design data core with a backup routine; the complete multi-form project is the student deliverable, not a prebuilt production system.',
 crud+`\n\nPublic Sub BackupPracticeWorkbook()
    On Error GoTo Failed
    Dim folder As String, path As String
    folder = ThisWorkbook.Path
    If folder = "" Then MsgBox "Save the practice .xlsm first.": Exit Sub
    path = folder & Application.PathSeparator & "StudentBackup_" & Format$(Now, "yyyymmdd_hhnnss") & ".xlsm"
    If Dir$(path) <> "" Then
        If MsgBox("Replace the existing practice backup?", vbYesNo + vbQuestion) <> vbYes Then Exit Sub
    End If
    ThisWorkbook.SaveCopyAs path
    MsgBox "Practice backup saved.": Exit Sub
Failed:
    MsgBox "Backup failed. Check the chosen practice folder."
End Sub`,
 'Milestones: workbook schema/sample records → reusable validation/data layer → registration/edit/search/detail forms → labeled demo login/navigation or approved external authentication → dashboard/statistics → master/section/grade/pass-fail reports → print/PDF/export with confirmations → backup/restore rehearsal → security/failure testing. Use arrays/collections/events as appropriate with cleanup. Submit all exported VBA sources, .xlsm workbook link, real form/report screenshots, documentation, and tests. Cover duplicates, invalid dates/grades, unauthorized operations if true authentication is used, canceled deletion/export, corrupt/missing input, empty data, repeated clicks, and settings restoration.',
 'A real Excel desktop workbook supports the required CRUD/navigation/dashboard/reports/backup workflows with validation and documented tests. Authentication is either honestly demo-only or independently backed by secure storage/authorization; no plaintext passwords or claimed browser execution.',
 [['What is the project deliverable?','A tested desktop workbook with source and evidence','A browser macro simulation'],['Where may external database data live?','A separate practice database','Platform production tables'],['What must a demo login disclose?','It does not authenticate or authorize','It is production security'],['What precedes replacing a backup?','Explicit confirmation','Silent deletion'],['What demonstrates error recovery?','Failure tests with resources/settings restored','Only one successful screenshot']],{layout:studentsLayout+'\nAdd Report and ImportStaging. Backups are copies in the saved practice workbook folder; use only fictional data. Keep source and data copies separate from production records.',form:registrationGuide+'\nFinal forms: frmLogin (demo label or genuine external auth), frmDashboard (counts, navigation, logout), frmStudents (CRUD/detail), frmSearch (ID/text/filter), frmReports (report choice, preview/export). Wire all controls to small reusable procedures and clear session/demo state on logout.',project:true});

const errors=[
 'Saving as .xlsx removes macros. Put callable macros in a standard module, not a worksheet cell. Do not globally weaken macro security.',
 'Declare each variable with its own As clause. Long is safer for row indexes; validate before conversion and avoid ambiguous date text.',
 'Unqualified Cells can target the wrong active sheet. ClearContents retains formats but still destroys source values, so clear only the indicated scratch cells.',
 'Missing Next/End If and nonterminating Do loops are common. VBA And/Or do not short-circuit; keep conversion validation separate.',
 'A Function returns through its name. Button macros must be assignable public Subs; add business-range validation rather than relying only on IsNumeric.',
 'Do not divide an empty class or initialize minima to zero indiscriminately. Mark invalid rows separately and calculate extrema only from valid student averages.',
 'End(xlUp) assumes a meaningful key column, while UsedRange can include formatting. A repeated append can create duplicates unless the activity guards the ID.',
 'Paste event handlers in the correct object module. Handle multi-cell changes and restore the saved event state; formula recalculation is a separate event.',
 'Control Name and Caption differ. Wire events in the UserForm module, validate choices and duplicates, and unload or hide deliberately.',
 'A single-cell range returns a scalar, not a 2D array. ReDim Preserve has dimension restrictions; collection indexes shift after deletion.',
 'IsDate/IsNumeric are not complete business checks. Do not suppress failures globally or use wildcard matching as an exact ID comparison.',
 'Filtered list indexes are not record IDs. Validate in the shared data procedures and ask before deleting; implement full edit behavior in your project.',
 'A masked password field or hidden sheet is not authentication. Reject real passwords in the demo and clear retained form/session state on logout.',
 'Do not silently replace existing report sheets/files or send to a printer. Qualify both workbooks and confirm export destinations.',
 'Do not call the restricted Split-based import a full CSV parser. Reject unsupported fields before writes, stage first, and never execute macros in external workbooks.',
 'ADO/ACE provider and Office bitness must match on Windows. Append positional parameters in SQL order, use the practice DB, and close resources on every path.',
 'Restore saved settings rather than forcing True/Automatic. Guard scalar/empty ranges and handle Timer wraparound when measuring.',
 'Do not claim demo role selection secures a workbook. Test all mutations/reports/backups, retain stable IDs, and validate before changing persistent data.'
];
const out=items.map((item,index)=>{
 const quiz=item.facts.map(([question,correct,wrong],q)=>{
  const other=item.facts.filter((_,i)=>i!==q).flatMap(f=>[f[1],f[2]]);
  const base=[...new Set([correct,wrong,...other])].slice(0,4), answer=(index+q)%4;
  return {question,choices:base.slice(4-answer).concat(base.slice(0,4-answer)),answer,explanation:correct+'. '+item.explanation.split('. ')[0]+'.'};
 });
 const location=item.location??'Standard module: Insert > Module in the Visual Basic Editor.';
 return {
  title:item.title,level:['Beginner','Intermediate','Advanced'][Math.floor(index/6)],position:index+1,is_project:!!item.project,
  objectives:item.objectives??['Explain '+item.topics+'.','Build and validate the specified Excel desktop activity.','Debug failures and document actual workbook behavior and applicable limitations.'],
  introduction:'Learn '+item.topics+' through a fictional student-data practice workbook.',
  explanation:item.explanation,syntax:item.code,example_vba:item.code,
  starter_vba:index===0?item.code:'Option Explicit\n\n\' Write original source in the module/form locations described in Excel Setup.\n',
  excel_setup:`Execution environment: Microsoft Excel desktop required.\n${item.platform??'Use desktop Excel; Windows is the reference environment for UserForms and external providers. Excel for the web cannot run/edit VBA. Mac/provider/control differences must be checked.'}\nCreate a new practice workbook or use a backup copy, reproduce Worksheet Layout, and save as Excel Macro-Enabled Workbook (.xlsm). Enable the Developer ribbon tab if needed and open the Visual Basic Editor.\n${location}\nReview trusted source and follow your organization macro policy; do not globally enable all macros or bypass blocked-file/security restrictions. Use only fictional records. CodeLab stores instructions/source and never executes macros.`,
  worksheet_layout:item.layout??studentsLayout,userform_guide:item.form??null,
  guided_practice:`1. Reproduce the exact sheets/headers/sample data in Worksheet Layout.\n2. ${location}\n3. Read the example explanation; paste each procedure into the indicated module, then use Debug > Compile VBAProject in Excel and correct the first diagnostic.\n4. Step through a small valid case and compare with Expected Result; inspect range/control values in the Immediate/Watch windows.\n5. ${errors[index]}\n6. Save your own solution and capture real desktop test evidence. CodeLab supplies no runtime output.`,
  activity:item.activity,expected_result:item.expected,important_notes:errors[index],
  debugging_tip:'Use a breakpoint at the entry procedure, Step Into (F8), Watches, and Debug.Print in the Immediate Window. Verify the exact workbook/sheet/control names and module location before inspecting the first error. Test a small valid case, then a boundary/failure case; never leave application settings disabled.',
  security_note:'Only run reviewed macros in trusted practice files under the applicable Excel policy; never enable all macros globally. Use fictional records, store user/file data as literal text, validate selected paths and formats, confirm destructive operations, and restore application settings. Never store plaintext passwords or production database credentials. Workbook protection is not authentication. CodeLab never executes uploaded or submitted macros.',
  challenge:'Summary: '+item.explanation.split('. ').slice(0,2).join('. ')+'.\nChallenge: '+(item.project?'Add an original usability improvement, document at least five edge/failure cases and one security boundary.':'Create an additional boundary/failure test and explain the resulting worksheet/dialog/form behavior.'),
  completion_requirements:'Save original VBA source, workbook/project URL and applicable screenshot/test notes. Pass the five-question quiz with at least 4/5 and receive teacher approval of the current submission; projects also require rubric grading. Actual execution and compilation occur only in Excel desktop.',
  guide:{steps:['Set up the specified macro-enabled practice workbook.','Build and test in desktop Excel with the stated module locations.','Complete the original activity and document real tests.','Save/submit source and workbook evidence, then pass the quiz for teacher review.']},
  quiz,validation_rules:{vba:{desktop_only:true,requires_teacher_review:true}},
  rubric:item.project?{program_functionality:25,correct_vba:20,excel_automation:15,[index===5?'worksheet_user_experience':'userform_user_experience']:10,data_handling:10,validation_error_handling:10,code_organization:5,testing_documentation:5}:null
 };
});
if(out.length!==18)throw Error('Exactly eighteen lessons required');
await writeFile('database/data/vba-course.json',JSON.stringify(out,null,2)+'\n');
console.log('Authored Excel VBA: 18 lessons, 90 quiz questions, 3 projects; all execution is instructional Excel desktop.');
