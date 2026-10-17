import {writeFile} from 'node:fs/promises';
const consoleProgram=(body,imports='',helpers='')=>`Option Explicit On\nOption Strict On\n${imports}\nModule Program\n    Sub Main()\n        Console.InputEncoding = System.Text.Encoding.UTF8\n        Console.OutputEncoding = System.Text.Encoding.UTF8\n${body.split('\n').map(l=>'        '+l).join('\n')}\n    End Sub\n${helpers}\nEnd Module\n`;
const formGuide=(name,layout,controls,events,extra='')=>`WINDOWS FORMS — VISUAL STUDIO BUILD GUIDE
This is a desktop design specification, not a browser designer or executable form.
Target a supported Windows .NET SDK (prefer .NET 10 LTS; .NET 8 is compatible while supported). Create a Visual Basic Windows Forms App on Windows, not a console app. A project targets net10.0-windows and enables UseWindowsForms; choose the installed supported SDK in Visual Studio. Do not paste a Form class into a console project.

Form name: ${name}
Suggested layout (schematic only):
${layout}

RECOMMENDED CONTROLS, NAMES, AND PROPERTIES
${controls}

REQUIRED EVENTS
${events}

BUILD STEPS
1. Create the Windows Forms solution/project and rename Form1 to ${name}.
2. Add controls using the Toolbox; set their Name, Text, size, location, TabIndex, and accessible labels. Set DropDownStyle=DropDownList for fixed choices.
3. Use the listed code as a reference. Designer-created controls already exist: do not declare a second control with the same name. The reference creates controls programmatically and can instead be used as a separate form class.
4. Wire handlers with Handles or AddHandler; read control values, validate first, update the model, and display friendly feedback.
5. Build in Visual Studio. Use the first compiler diagnostic, breakpoints, and the Watch window to debug.
6. Test expected actions and invalid inputs. Capture screenshots of the real desktop form and include code, build steps, and test evidence in the CodeLab submission.
${extra}`;
const studentControls=`Label lblStudentId: Text=Student ID; TextBox txtStudentId
Label lblFirstName: Text=First name; TextBox txtFirstName
Label lblLastName: Text=Last name; TextBox txtLastName
Label lblCourse: Text=Course; ComboBox cboCourse: Items=IT,CS; DropDownStyle=DropDownList
Label lblYear: Text=Year level; ComboBox cboYear: Items=1,2,3,4; DropDownStyle=DropDownList
Label lblClub: Text=Club (fictional, non-sensitive choice); ComboBox cboClub: Items=Coding,Art
Button btnSave: Text=Save; Button btnClear: Text=Clear
Label lblStatus: Text=Ready; accessible status feedback`;
const items=[];
const add=(title,topics,explanation,code,activity,facts,extra={})=>items.push({title,topics,explanation,code,activity,facts,...extra});
add('Introduction to Visual Basic .NET','VB.NET uses; .NET runtime; Visual Studio; solutions/projects; console and Windows Forms; Module; Sub Main; comments',
 'Visual Basic .NET is a managed programming language on .NET. The SDK/compiler builds code, and the runtime executes it; installing only a runtime does not provide a compiler. A solution organizes one or more projects. Console applications use standard input/output, while Windows Forms applications use Windows desktop controls and events. Module Program and Sub Main define the entry point of this console example. An apostrophe starts a comment. CodeLab stores source and supports an isolated compiler adapter, but online Run is unavailable until that service is verified. Windows Forms must be built in Visual Studio on Windows.',
 consoleProgram('Console.WriteLine("Hello, VB.NET!")\nConsole.WriteLine("Student: Maria Santos")\nConsole.WriteLine("Course: BS Information Technology")\nConsole.WriteLine("Year: 1")\nConsole.WriteLine("School: CodeLab Practice School")'),
 'Create a console program displaying your fictional student name, course, year level, and school. Identify the Module, Main procedure, statements, and a comment. Explain SDK versus runtime and console versus Windows Forms. Run with a supported local SDK; paste source and test results into CodeLab.',
 [['What does the .NET runtime do?','Executes managed applications','Always supplies the compiler SDK'],['What is Sub Main in this console app?','Its entry point','A form control'],['What organizes multiple projects?','A solution','A database row'],['What starts a VB comment?','An apostrophe','A CSS selector'],['Where does Windows Forms run?','On Windows desktop .NET','Natively inside this browser']],{objectives:['Explain the purpose of Visual Basic .NET.','Identify common VB.NET application types.','Differentiate console and Windows Forms applications.','Create a basic VB.NET console program.'],expected:'Hello, VB.NET!\nStudent: Maria Santos\nCourse: BS Information Technology\nYear: 1\nSchool: CodeLab Practice School\n'});
add('Variables, Constants, and Data Types','Dim; Const; names; assignment/reassignment; Option Explicit/Strict; Integer/Long/Double/Decimal/String/Char/Boolean/Date; inference; conversions; TryParse',
 'Dim declares a variable and As specifies its type; Const defines a compile-time constant. Option Explicit On requires declarations, while Option Strict On prevents implicit narrowing and late binding. Integer and Long hold whole numbers, Double holds floating-point values, and Decimal is useful for decimal calculations. String holds text, Char a single character, Boolean true/false, and Date represents DateTime. Type inference can infer a local type from a suitable initializer. CInt/CDbl/CDec/CStr convert values but may throw for invalid or overflowing input; CInt rounds rather than simply truncating. TryParse is safer for user-entered numeric text. Choose clear names and document units.',
 consoleProgram('Dim studentName As String = "Maria"\nDim age As Integer = 19\nDim grade As Double = 95.5\nDim fee As Decimal = 1250.5D\nDim initial As Char = "M"c\nDim enrolled As Boolean = True\nDim joined As Date = New DateTime(2026, 6, 1)\nConst PassingGrade As Integer = 75\nage += 1\nConsole.WriteLine($"{studentName}: age {age}, grade {grade.ToString(CultureInfo.InvariantCulture)}")\nConsole.WriteLine($"Passing grade: {PassingGrade}; initial: {initial}; enrolled: {enrolled}")\nConsole.WriteLine(joined.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture))', 'Imports System.Globalization'),
 'Declare fictional student details using several appropriate types and a passing-grade constant. Reassign a variable, demonstrate type inference and explicit conversions, and explain why TryParse belongs at input boundaries. Keep Option Explicit/Strict On.',
 [['What declares a variable?','Dim','Return'],['What defines a fixed compile-time value?','Const','Catch'],['What does Option Strict prevent?','Implicit narrowing and late binding','Every numeric operation'],['Which type is suited to decimal money values?','Decimal','Boolean'],['What safely attempts a numeric conversion?','TryParse','Unchecked CInt on arbitrary text']],{expected:'Maria: age 20, grade 95.5\nPassing grade: 75; initial: M; enrolled: True\n2026-06-01\n'});
add('Input, Output, and Operators','Write/WriteLine/ReadLine; interpolation; TryParse; arithmetic / and \\; Mod/^; comparisons; And/Or/Not; short-circuit AndAlso/OrElse; compound assignment; &',
 'Console.ReadLine returns a string or Nothing at end of input. Write stays on the same line and WriteLine adds a newline. Use TryParse and a stated culture for numeric input, then validate the domain. / performs division; \\ performs integer division; Mod gives a remainder and ^ exponentiation. = is equality in a comparison and assignment in an assignment statement; <> means unequal. And/Or evaluate both sides, while AndAlso/OrElse short-circuit and are useful for safe validation. & explicitly concatenates strings. Check division by zero and use integer inputs for integer-division/remainder exercises rather than silently rounding fractional inputs.',
 consoleProgram('Dim first, second As Integer\nIf Not Integer.TryParse(Console.ReadLine(), first) OrElse Not Integer.TryParse(Console.ReadLine(), second) Then\n    Console.WriteLine("Invalid integer input")\n    Return\nEnd If\nConsole.WriteLine($"Add: {first + second}; Subtract: {first - second}; Multiply: {first * second}")\nIf second = 0 Then\n    Console.WriteLine("Cannot divide by zero")\nElse\n    Console.WriteLine("Divide: " & (first / second).ToString(CultureInfo.InvariantCulture))\n    Console.WriteLine($"Integer divide: {first \\ second}; Remainder: {first Mod second}")\nEnd If', 'Imports System.Globalization'),
 'Build a calculator accepting two integer inputs and reporting addition, subtraction, multiplication, division, integer division, and remainder. Reject non-numeric/overflowing input and zero divisors. Add an exponent example and explain short-circuit logic and string concatenation.',
 [['What does ReadLine return?','String or Nothing','Always an Integer'],['Which operator is integer division?','\\','/'],['What produces a remainder?','Mod','Const'],['Which operator short-circuits logical AND?','AndAlso','And'],['What should happen for a zero divisor?','A handled validation message','An unchecked successful result']],{input:'12\n5\n',expected:'Add: 17; Subtract: 7; Multiply: 60\nDivide: 2.4\nInteger divide: 2; Remainder: 2\n'});
add('Conditional Statements and Loops','If/ElseIf/Else; Select Case; nested conditions; For/While/Do While/Do Until/For Each; Exit/Continue; counters/accumulators',
 'Conditions choose a path and loops repeat bounded work. Validate grades before classifying them. Check high bands first: 90–100 Excellent, 85 to below 90 Very Good, 80 to below 85 Good, 75 to below 80 Passed, otherwise Failed. Continuous ranges also classify fractional grades correctly. Select Case is useful for discrete choices or explicit ranges. For...Next counts through a range; While and Do variants check a condition, and For Each reads collection values. Exit For/Exit Do end loops, while Continue For skips one iteration. Counters and accumulators track counts and totals. Nested loops multiply work and must have sensible bounds.',
 consoleProgram('Dim grades As Double() = {95, 87.5, 82, 75, 60, 101}\nDim validCount As Integer = 0\nFor Each grade As Double In grades\n    If grade < 0 OrElse grade > 100 Then\n        Console.WriteLine("Invalid grade")\n        Continue For\n    End If\n    Dim result As String\n    If grade >= 90 Then\n        result = "Excellent"\n    ElseIf grade >= 85 Then\n        result = "Very Good"\n    ElseIf grade >= 80 Then\n        result = "Good"\n    ElseIf grade >= 75 Then\n        result = "Passed"\n    Else\n        result = "Failed"\n    End If\n    validCount += 1\n    Console.WriteLine(result)\nNext\nConsole.WriteLine($"Valid grades: {validCount}")'),
 'Process several grades with a loop and classify all five bands, rejecting invalid values. Include 0, 74.9, 75, 80, 85, 90, 100, and 101. Add small bounded examples of For, While, Do Until, and a nested loop; explain when Exit and Continue are appropriate.',
 [['What should precede grade classification?','Range and finite-value validation','Only sorting'],['What classifies 89.5?','Very Good','Excellent'],['What reads array elements directly?','For Each','CREATE VIEW'],['What skips one For iteration?','Continue For','Exit For'],['What keeps a loop safe?','A progressing condition and finite bounds','Removing every exit condition']],{expected:'Excellent\nVery Good\nGood\nPassed\nFailed\nInvalid grade\nValid grades: 5\n'});
add('Arrays and Procedures','array declarations/initializers/indexes/updates/Length; For Each; multidimensional arrays; Sub/Function; parameters/arguments/returns; ByVal/ByRef; scope',
 'Arrays have fixed length and zero-based indices. Dim values(4) As Double allocates five elements, since the bound is the highest index. A two-dimensional array uses two indices and GetLength for each dimension. Sub performs an action without a return value; Function returns a value. Parameters are placeholders and arguments are supplied values. ByVal copies the argument value; for reference types that value is a reference, so the referred array/object can still be modified. ByRef allows reassignment of the caller variable. Prefer ByVal unless the contract needs ByRef, and check empty arrays before averaging.',
 consoleProgram('Dim grades As Double() = {90, 80, 100}\nConsole.WriteLine($"Average: {Average(grades):F2}")\nConsole.WriteLine($"Highest: {Highest(grades)}; Lowest: {Lowest(grades)}")\nConsole.WriteLine(If(Average(grades) >= 75, "Passed", "Failed"))', '', `    Function Average(ByVal grades As Double()) As Double
        If grades.Length = 0 Then Throw New ArgumentException("Empty grades")
        Dim total As Double = 0
        For Each grade As Double In grades
            total += grade
        Next
        Return total / grades.Length
    End Function
    Function Highest(ByVal grades As Double()) As Double
        If grades.Length = 0 Then Throw New ArgumentException("Empty grades")
        Dim value As Double = grades(0)
        For Each grade As Double In grades
            If grade > value Then value = grade
        Next
        Return value
    End Function
    Function Lowest(ByVal grades As Double()) As Double
        If grades.Length = 0 Then Throw New ArgumentException("Empty grades")
        Dim value As Double = grades(0)
        For Each grade As Double In grades
            If grade < value Then value = grade
        Next
        Return value
    End Function`),
 'Create reusable average, highest, lowest, pass/fail, and display procedures. Handle empty arrays and invalid grades. Demonstrate an element update, a small two-dimensional array, local scope, and the difference between ByVal reference values and ByRef reassignment.',
 [['How many elements does Dim values(4) allocate?','Five','Four'],['What returns a result?','Function','Sub always'],['What type of value is copied for a ByVal array argument?','The array reference','An automatic deep copy'],['What allows caller-variable reassignment?','ByRef','Const'],['What must averaging guard against?','An empty array','Every comment']],{expected:'Average: 90.00\nHighest: 100; Lowest: 80\nPassed\n'});
const gradeProject=consoleProgram(`Dim name As String = Console.ReadLine()
If String.IsNullOrWhiteSpace(name) Then
    Console.WriteLine("Name required")
    Return
End If
Dim count As Integer
If Not Integer.TryParse(Console.ReadLine(), count) OrElse count < 1 OrElse count > 20 Then
    Console.WriteLine("Enter 1 to 20 grades")
    Return
End If
Dim grades(count - 1) As Decimal
For index As Integer = 0 To count - 1
    If Not Decimal.TryParse(Console.ReadLine(), NumberStyles.Number, CultureInfo.InvariantCulture, grades(index)) OrElse grades(index) < 0D OrElse grades(index) > 100D Then
        Console.WriteLine("Invalid grade")
        Return
    End If
Next
DisplayResults(name.Trim(), grades)`, 'Imports System.Globalization', `    Function Total(grades As Decimal()) As Decimal
        Dim sum As Decimal = 0D
        For Each grade As Decimal In grades
            sum += grade
        Next
        Return sum
    End Function
    Function Average(grades As Decimal()) As Decimal
        If grades.Length = 0 Then Throw New ArgumentException("Empty grades")
        Return Total(grades) / grades.Length
    End Function
    Sub DisplayResults(name As String, grades As Decimal())
        Dim high As Decimal = grades(0), low As Decimal = grades(0)
        For Each grade As Decimal In grades
            If grade > high Then high = grade
            If grade < low Then low = grade
        Next
        Dim mean As Decimal = Average(grades)
        Console.WriteLine("Student: " & name)
        Console.WriteLine("Total: " & Total(grades).ToString("F2", CultureInfo.InvariantCulture))
        Console.WriteLine("Average: " & mean.ToString("F2", CultureInfo.InvariantCulture))
        Console.WriteLine("Status: " & If(mean >= 75D, "PASSED", "FAILED"))
        Console.WriteLine($"Highest: {high}; Lowest: {low}")
    End Sub`);
add('Beginner Project — Student Grade Calculator','console name/count/grades input; arrays; totals/mean/extrema/pass-fail; procedures; validation; tests',
 'Develop a console grade calculator using original procedures and clear input validation. The input format is name, grade count, then one grade per line. The reference limits the count to 1–20 and accepts only decimal grades within 0–100. Maria Santos with 95, 88, and 91 has total 274 and mean 91.33, so the result is PASSED. Separate parsing, calculations, and presentation. Browser code storage is available even when online compilation is not; run locally in a supported SDK and include the observed output as testing evidence.',
 gradeProject,
 'Build the full calculator: name, multiple grades, array storage, total, average, pass/fail, highest, lowest, and formatted output. Use both Sub and Function. Milestones: define input → validate → process array → calculate → format → test. Test blank names, non-integer counts, zero/over-limit counts, invalid/negative/over-100 grades, decimals, a single grade, and the exact 75 boundary. Paste source, input, observed output, and test notes; pass the quiz and request teacher review.',
 [['What is the first sample input?','Student name','A production password'],['What stores multiple grades?','An array','One Boolean only'],['What produces the average?','Total divided by valid count','Highest grade alone'],['What should invalid input do?','Produce a handled message','Be silently accepted'],['What completes this project?','Current teacher approval and a passed quiz','A matching output screenshot alone']],{input:'Maria Santos\n3\n95\n88\n91\n',expected:'Student: Maria Santos\nTotal: 274.00\nAverage: 91.33\nStatus: PASSED\nHighest: 95; Lowest: 88\n',project:true});
add('Strings and Collections','Length/case/Trim/Substring/search/Replace/Split/interpolation; List(Of T); Add/AddRange/Remove/RemoveAt/Contains/Count/indexes/For Each',
 'Strings are immutable: methods return a new string rather than modifying the original. Trim removes surrounding whitespace; Substring needs valid bounds; Contains/StartsWith/EndsWith support searches with stated comparison rules. Split is suitable for controlled simple delimiters, not a complete CSV parser. List(Of T) provides a variable-sized typed collection. Add appends one item, AddRange appends several, Remove removes a matching value, and RemoveAt uses a zero-based index. Count is a list property, while arrays use Length. Choose explicit case-insensitive comparisons for user-facing name search.',
 consoleProgram('Dim names As New List(Of String) From {" Ana ", "Ben", "Cara"}\nnames.Add("Dan")\nnames.Remove("Ben")\nFor index As Integer = 0 To names.Count - 1\n    names(index) = names(index).Trim()\nNext\nFor Each name As String In names\n    If name.StartsWith("a", StringComparison.OrdinalIgnoreCase) Then Console.WriteLine("Match: " & name)\nNext\nConsole.WriteLine("Names: " & String.Join(", ", names))\nConsole.WriteLine($"Count: {names.Count}")', 'Imports System.Collections.Generic'),
 'Create a typed student-name list. Add/remove/search/display names and demonstrate AddRange, RemoveAt, Contains, and Count. Exercise string case, bounds-safe Substring, Replace, Split, and case-insensitive search. Document an empty-list and invalid-index test.',
 [['What can change size as records are added?','List(Of T)','A fixed-size array automatically'],['What counts list items?','Count','Length always'],['Does Trim change the original string in place?','No, it returns a string','Yes'],['What removes by index?','RemoveAt','Substring'],['What should text search specify?','Comparison/case rules','A database password']],{expected:'Match: Ana\nNames: Ana, Cara, Dan\nCount: 3\n'});
const formBasics=`Option Explicit On
Option Strict On
Imports System
Imports System.Windows.Forms
Public Class StudentInformationForm
    Inherits Form
    Private ReadOnly txtStudentId As New TextBox With {.Name="txtStudentId", .Left=140, .Top=20}
    Private ReadOnly txtFirstName As New TextBox With {.Name="txtFirstName", .Left=140, .Top=55}
    Private ReadOnly txtLastName As New TextBox With {.Name="txtLastName", .Left=140, .Top=90}
    Private ReadOnly cboCourse As New ComboBox With {.Name="cboCourse", .Left=140, .Top=125, .DropDownStyle=ComboBoxStyle.DropDownList}
    Private ReadOnly cboYear As New ComboBox With {.Name="cboYear", .Left=140, .Top=160, .DropDownStyle=ComboBoxStyle.DropDownList}
    Private ReadOnly cboClub As New ComboBox With {.Name="cboClub", .Left=140, .Top=195, .DropDownStyle=ComboBoxStyle.DropDownList}
    Private WithEvents btnSave As New Button With {.Name="btnSave", .Text="Save", .Left=140, .Top=235}
    Private WithEvents btnClear As New Button With {.Name="btnClear", .Text="Clear", .Left=235, .Top=235}
    Private ReadOnly lblStatus As New Label With {.Name="lblStatus", .Text="Ready", .Left=20, .Top=280, .Width=320}
    Public Sub New()
        Text="Student Information"
        Width=380 : Height=360
        Dim labels As String()={"Student ID","First name","Last name","Course","Year level","Club"}
        For index As Integer=0 To labels.Length-1
            Controls.Add(New Label With {.Text=labels(index),.Left=20,.Top=20+index*35,.Width=110})
        Next
        cboCourse.Items.AddRange(New Object(){"IT","CS"})
        cboYear.Items.AddRange(New Object(){"1","2","3","4"})
        cboClub.Items.AddRange(New Object(){"Coding","Art"})
        Controls.AddRange(New Control(){txtStudentId,txtFirstName,txtLastName,cboCourse,cboYear,cboClub,btnSave,btnClear,lblStatus})
    End Sub
    Private Sub btnSave_Click(sender As Object,e As EventArgs) Handles btnSave.Click
        If String.IsNullOrWhiteSpace(txtStudentId.Text) OrElse String.IsNullOrWhiteSpace(txtFirstName.Text) OrElse String.IsNullOrWhiteSpace(txtLastName.Text) OrElse cboCourse.SelectedIndex<0 OrElse cboYear.SelectedIndex<0 Then
            lblStatus.Text="Complete the required fields."
            Return
        End If
        lblStatus.Text="Validated: " & txtFirstName.Text.Trim() & " " & txtLastName.Text.Trim()
    End Sub
    Private Sub btnClear_Click(sender As Object,e As EventArgs) Handles btnClear.Click
        txtStudentId.Clear() : txtFirstName.Clear() : txtLastName.Clear()
        cboCourse.SelectedIndex=-1 : cboYear.SelectedIndex=-1 : cboClub.SelectedIndex=-1
        lblStatus.Text="Cleared" : txtStudentId.Focus()
    End Sub
End Class`;
add('Windows Forms Fundamentals','Windows Forms project/designer/toolbox; form/control properties; Label/TextBox/Button/ComboBox/ListBox/CheckBox/RadioButton/DateTimePicker; naming/events/navigation',
 'Windows Forms is a Windows desktop UI framework. The Visual Studio designer generates layout code in a partial class; student event/business code belongs in the normal form file. Name identifies a control in code and Text usually controls its displayed caption. Labels explain inputs, TextBoxes accept text, ComboBoxes/ListBoxes choose values, CheckBoxes represent independent flags, and RadioButtons represent grouped exclusive choices. DateTimePicker selects dates. A browser preview is not the Windows Forms designer: use the stored Form Design guide, real Visual Studio, and screenshots of the actual application. The reference is a programmatically created form, not a designer file.',
 formBasics,
 'In Visual Studio create the specified Student Information form with ID, first/last name, course, year level, and an optional fictional club field. Add Save/Clear, proper labels/control names, tab order, validation, and focus reset. Demonstrate the purpose of the other listed controls in a separate practice form. Submit source and real-desktop screenshots or screenshot links with build notes.',
 [['What is a control Name used for?','Referencing it in code','Only its displayed caption'],['What supplies the normal Windows Forms designer?','Visual Studio on Windows','This CodeLab browser page'],['What is suitable for a fixed course choice?','A DropDownList ComboBox','An unvalidated password field'],['What does a CheckBox represent?','An independent Boolean choice','Every exclusive group automatically'],['Where should student business logic normally go?','The normal form/service file','Repeated edits to generated designer code']],{mode:'winforms',guide:formGuide('StudentInformationForm','[Student ID] [txtStudentId]\n[First name] [txtFirstName]\n[Last name ] [txtLastName]\n[Course] [cboCourse]  [Year] [cboYear]\n[Club] [cboClub]\n[Save] [Clear]\n[Status]',studentControls,'btnSave.Click → validate/display acknowledgement; btnClear.Click → clear/reset/focus; Form.Load → populate fixed choices.'),expected:'Desktop behavior: required fields are validated; Save acknowledges the fictional record; Clear empties fields, resets choices, and focuses Student ID. No browser execution is claimed.'});
const validationForm=`Option Explicit On
Option Strict On
Imports System
Imports System.Globalization
Imports System.Windows.Forms
Public Class GradeValidationForm
    Inherits Form
    Private WithEvents txtName As New TextBox With {.Name="txtName",.Left=100,.Top=20}
    Private ReadOnly txtAge As New TextBox With {.Name="txtAge",.Left=100,.Top=55}
    Private ReadOnly txtGrade As New TextBox With {.Name="txtGrade",.Left=100,.Top=90}
    Private WithEvents btnSave As New Button With {.Name="btnSave",.Text="Save",.Left=100,.Top=130,.Enabled=False}
    Private WithEvents btnClear As New Button With {.Name="btnClear",.Text="Clear",.Left=190,.Top=130}
    Public Sub New()
        Text="Validated Student Entry" : Width=350 : Height=230
        Controls.AddRange(New Control(){New Label With {.Text="Name",.Left=20,.Top=20},New Label With {.Text="Age",.Left=20,.Top=55},New Label With {.Text="Grade",.Left=20,.Top=90},txtName,txtAge,txtGrade,btnSave,btnClear})
    End Sub
    Private Sub txtName_TextChanged(sender As Object,e As EventArgs) Handles txtName.TextChanged
        btnSave.Enabled=Not String.IsNullOrWhiteSpace(txtName.Text)
    End Sub
    Private Sub btnSave_Click(sender As Object,e As EventArgs) Handles btnSave.Click
        Dim age As Integer,grade As Decimal
        If String.IsNullOrWhiteSpace(txtName.Text) Then
            MessageBox.Show("Name required") : txtName.Focus() : Return
        End If
        If Not Integer.TryParse(txtAge.Text,age) OrElse age<1 OrElse age>120 Then
            MessageBox.Show("Enter an age from 1 to 120") : txtAge.Focus() : Return
        End If
        If Not Decimal.TryParse(txtGrade.Text,NumberStyles.Number,CultureInfo.InvariantCulture,grade) OrElse grade<0D OrElse grade>100D Then
            MessageBox.Show("Enter a grade from 0 to 100") : txtGrade.Focus() : Return
        End If
        MessageBox.Show($"Accepted {txtName.Text.Trim()}; age {age}; grade {grade}")
    End Sub
    Private Sub btnClear_Click(sender As Object,e As EventArgs) Handles btnClear.Click
        txtName.Clear() : txtAge.Clear() : txtGrade.Clear() : txtName.Focus()
    End Sub
End Class`;
add('Event-Driven Programming and Validation','Handles; Click/TextChanged/SelectedIndexChanged/Load; control values; MessageBox; TryParse; enabled states; clear/focus',
 'An event handler runs in response to an event rather than in a fixed console sequence. Handles attaches a method to an event on a WithEvents member; AddHandler can wire it explicitly. Click performs an action, TextChanged reacts to editing, SelectedIndexChanged reacts to choices, and Form Load initializes the form. Read Text as text, validate required/range rules, then convert using TryParse. Never let an enabled button substitute for validation inside its handler. Friendly messages and focus placement help users correct mistakes. Database or file operations should follow successful validation, not precede it.',
 validationForm,
 'Create a student name/age/grade form. Wire events, validate every Save call, show friendly errors, disable Save for blank name, and implement Clear/focus. Add a fixed-choice ComboBox with SelectedIndexChanged and Form.Load initialization. Test pasted text, blank values, overflow, decimals, and grade boundaries.',
 [['What attaches the shown handler?','Handles btnSave.Click','Imports alone'],['What declaration supports a Handles control member?','WithEvents','Const'],['Does an enabled button guarantee valid input?','No, validate inside the handler','Yes'],['What avoids invalid numeric conversion exceptions?','TryParse','Unchecked CDbl'],['What helps after a field error?','A clear message and focus','Silently deleting the input']],{mode:'winforms',guide:formGuide('GradeValidationForm','[Name ] [txtName]\n[Age  ] [txtAge]\n[Grade] [txtGrade]\n[Save] [Clear]','Labels lblName/lblAge/lblGrade; TextBoxes txtName/txtAge/txtGrade; Buttons btnSave/btnClear. Save starts disabled; age range 1–120; grade range 0–100.','txtName.TextChanged → enable state; btnSave.Click → all validation; btnClear.Click → clear/focus; optional cboCourse.SelectedIndexChanged and Form.Load.'),expected:'Real desktop form rejects missing name, invalid/out-of-range age or grade, and accepts valid values. Clear resets inputs and focus.'});
const studentClass=`Public Class Student
    Private _average As Double
    Public Property StudentId As Integer
    Public Property Name As String
    Public Property Average As Double
        Get
            Return _average
        End Get
        Set(value As Double)
            If Double.IsNaN(value) OrElse Double.IsInfinity(value) OrElse value<0 OrElse value>100 Then Throw New ArgumentOutOfRangeException(NameOf(value))
            _average=value
        End Set
    End Property
    Public Sub New(id As Integer,name As String,average As Double)
        If String.IsNullOrWhiteSpace(name) Then Throw New ArgumentException("Name required")
        StudentId=id : Me.Name=name.Trim() : Me.Average=average
    End Sub
    Public Function Description() As String
        Return $"{StudentId}: {Name} — {Average:F2}"
    End Function
End Class`;
add('Object-Oriented Programming Basics','classes/objects; fields/properties/methods; constructor/New/Me; encapsulation; private fields; Get/Set; auto properties; initializers',
 'A class defines a model and an object is one instance. Fields hold internal state; properties provide controlled access and methods supply behavior. New calls a constructor; Me refers to the current instance and distinguishes it from similarly named parameters. Auto-implemented properties are convenient, but a property with Get/Set can enforce an invariant such as a valid average. Encapsulation is more than making a field private: avoid exposing setters that bypass the intended validation. A List(Of Student) groups typed objects for later forms and reports.',
 consoleProgram('Dim students As New List(Of Student) From {New Student(1,"Maria",90),New Student(2,"Jose",72)}\nFor Each student As Student In students\n    Console.WriteLine(student.Description())\nNext', 'Imports System.Collections.Generic')+'\n'+studentClass,
 'Create a Student class with identity, validated name/average, constructor, properties, and a reporting method. Populate a List(Of Student), update a valid average, reject invalid values, and explain field versus property and Me versus a parameter.',
 [['What creates an instance?','New','Imports'],['What identifies the current instance?','Me','Global'],['What helps enforce a property invariant?','A validating Set accessor','An unrestricted public field'],['What defines reusable behavior?','A method','Only a label caption'],['What stores typed Student objects?','List(Of Student)','List(Of Boolean)']],{expected:'1: Maria — 90.00\n2: Jose — 72.00\n'});
add('Exception and File Handling','Try/Catch/Finally; specific exceptions; validation; Using; System.IO; StreamReader/Writer; read/write/append; saving/loading',
 'Validation handles expected bad input before an operation; exceptions describe failures during operations such as inaccessible files. Catch specific useful exception types, provide a safe message, and do not silently swallow every error. Finally runs cleanup, while Using deterministically disposes readers/writers even on failure. System.IO can read, overwrite, or append files. In a verified CodeLab sandbox, only its isolated temporary workspace may be accessible. The example uses the current practice directory; it must never receive a production file path. Real CSV requires escaping and parsing rules; simple line records are not a complete CSV format.',
 consoleProgram('Dim practicePath As String = Path.Combine(Environment.CurrentDirectory,"practice-students.txt")\nTry\n    Using writer As New StreamWriter(practicePath,False)\n        writer.WriteLine("Ana")\n        writer.WriteLine("Ben")\n    End Using\n    File.AppendAllText(practicePath,"Cara" & Environment.NewLine)\n    Using reader As New StreamReader(practicePath)\n        While Not reader.EndOfStream\n            Console.WriteLine(reader.ReadLine())\n        End While\n    End Using\nCatch ex As IOException\n    Console.WriteLine("Unable to read/write the practice file")\nFinally\n    If File.Exists(practicePath) Then File.Delete(practicePath)\nEnd Try', 'Imports System.IO'),
 'Save and load fictional student records using disposable readers/writers. Demonstrate read/write/append APIs and specific exception handling. Choose JSON or proper CSV escaping for records with punctuation; test missing files, invalid contents, and denied writes. Use only a local practice directory, never application files.',
 [['What disposes a reader reliably?','Using','Leaving every file open'],['What handles a file-operation failure?','A suitable Catch block','A CSS class'],['What runs cleanup after success or failure?','Finally','Const'],['What does append preserve?','Existing content before the addition','No existing content'],['Where may sandbox files live?','Only the disposable workspace','The Laravel .env directory']],{expected:'Ana\nBen\nCara\n'});
const recordsForm=`Option Explicit On
Option Strict On
Imports System
Imports System.Collections.Generic
Imports System.ComponentModel
Imports System.Globalization
Imports System.IO
Imports System.Linq
Imports System.Text.Json
Imports System.Windows.Forms
Public Class StudentRecord
    Public Property Id As Integer
    Public Property Name As String = ""
    Public Property Average As Decimal
End Class
Public Class StudentRecordsForm
    Inherits Form
    Private students As New List(Of StudentRecord)
    Private nextId As Integer=1
    Private ReadOnly filePath As String=Path.Combine(Environment.CurrentDirectory,"practice-students.json")
    Private ReadOnly txtName As New TextBox With {.Name="txtName",.Left=20,.Top=20}
    Private ReadOnly txtAverage As New TextBox With {.Name="txtAverage",.Left=160,.Top=20}
    Private ReadOnly txtSearch As New TextBox With {.Name="txtSearch",.Left=300,.Top=20}
    Private ReadOnly grid As New DataGridView With {.Name="gridStudents",.Left=20,.Top=100,.Width=520,.Height=220,.ReadOnly=True,.AutoGenerateColumns=True,.AllowUserToAddRows=False,.SelectionMode=DataGridViewSelectionMode.FullRowSelect}
    Public Sub New()
        Text="Student Record Management" : Width=590 : Height=410
        Controls.AddRange(New Control(){txtName,txtAverage,txtSearch,grid})
        Dim actions As New Dictionary(Of String,Action) From {{"Add",AddressOf AddStudent},{"Edit",AddressOf EditStudent},{"Delete",AddressOf DeleteStudent},{"Clear",AddressOf ClearInputs},{"Save",AddressOf SaveRecords},{"Load",AddressOf LoadRecords}}
        Dim left As Integer=20
        For Each pair As KeyValuePair(Of String,Action) In actions
            Dim button As New Button With {.Name="btn" & pair.Key,.Text=pair.Key,.Left=left,.Top=60,.Width=80}
            Dim handler As Action=pair.Value
            AddHandler button.Click,Sub(sender,e) handler()
            Controls.Add(button) : left+=85
        Next
        AddHandler txtSearch.TextChanged,Sub(sender,e) RefreshGrid()
        AddHandler grid.SelectionChanged,Sub(sender,e)
            Dim selected As StudentRecord=SelectedStudent()
            If selected IsNot Nothing Then
                txtName.Text=selected.Name : txtAverage.Text=selected.Average.ToString(CultureInfo.InvariantCulture)
            End If
        End Sub
        RefreshGrid()
    End Sub
    Private Function ReadValues(ByRef name As String,ByRef average As Decimal) As Boolean
        name=txtName.Text.Trim()
        If name="" OrElse Not Decimal.TryParse(txtAverage.Text,NumberStyles.Number,CultureInfo.InvariantCulture,average) OrElse average<0D OrElse average>100D Then
            MessageBox.Show("Enter a name and average from 0 to 100") : Return False
        End If
        Return True
    End Function
    Private Function SelectedStudent() As StudentRecord
        If grid.CurrentRow Is Nothing Then Return Nothing
        Return TryCast(grid.CurrentRow.DataBoundItem,StudentRecord)
    End Function
    Private Sub AddStudent()
        Dim name As String="",average As Decimal
        If Not ReadValues(name,average) Then Return
        students.Add(New StudentRecord With {.Id=nextId,.Name=name,.Average=average}) : nextId+=1
        RefreshGrid()
    End Sub
    Private Sub EditStudent()
        Dim selected As StudentRecord=SelectedStudent()
        If selected Is Nothing Then Return
        Dim name As String="",average As Decimal
        If Not ReadValues(name,average) Then Return
        selected.Name=name : selected.Average=average : RefreshGrid()
    End Sub
    Private Sub DeleteStudent()
        Dim selected As StudentRecord=SelectedStudent()
        If selected Is Nothing Then Return
        If MessageBox.Show("Delete selected fictional student?","Confirm",MessageBoxButtons.YesNo)<>DialogResult.Yes Then Return
        students.Remove(selected) : RefreshGrid()
    End Sub
    Private Sub ClearInputs()
        txtName.Clear() : txtAverage.Clear() : txtSearch.Clear() : txtName.Focus()
    End Sub
    Private Sub RefreshGrid()
        Dim query As String=txtSearch.Text.Trim()
        grid.DataSource=New BindingList(Of StudentRecord)(students.Where(Function(s) s.Name.Contains(query,StringComparison.OrdinalIgnoreCase)).ToList())
    End Sub
    Private Sub SaveRecords()
        Try
            File.WriteAllText(filePath,JsonSerializer.Serialize(students))
            MessageBox.Show("Saved practice records")
        Catch ex As IOException
            MessageBox.Show("Practice file could not be saved")
        End Try
    End Sub
    Private Sub LoadRecords()
        Try
            If Not File.Exists(filePath) Then Return
            Dim loaded As List(Of StudentRecord)=JsonSerializer.Deserialize(Of List(Of StudentRecord))(File.ReadAllText(filePath))
            If loaded Is Nothing OrElse loaded.Any(Function(s) s.Id<1 OrElse String.IsNullOrWhiteSpace(s.Name) OrElse s.Average<0D OrElse s.Average>100D) OrElse loaded.Select(Function(s) s.Id).Distinct().Count()<>loaded.Count Then Throw New JsonException("Invalid records")
            students=loaded : nextId=If(students.Count=0,1,students.Max(Function(s) s.Id)+1) : RefreshGrid()
        Catch ex As JsonException
            MessageBox.Show("Practice file has invalid records")
        Catch ex As IOException
            MessageBox.Show("Practice file could not be loaded")
        End Try
    End Sub
End Class`;
add('Intermediate Project — Student Record Management System','Windows Forms CRUD/search/clear; classes/List; events/TryParse; JSON files; errors; testing',
 'Create a real Windows Forms record manager with separate typed state and form operations. Stable IDs distinguish duplicate names and survive searches. Validate before adding/editing and confirm deletion. JSON handles punctuation better than a naive comma split; imported records still need domain and duplicate-ID validation. Save/Load use an explicit practice file and friendly specific errors. The reference builds controls in code and demonstrates the structure; the activity requires labels, usability improvements, and documented tests in Visual Studio.',
 recordsForm,
 'Build the desktop record manager with Add/View/Search/Edit/Delete/Clear/Save/Load and a DataGridView or ListBox. Use a Student class/List, validation, events, file handling, and specific errors. Milestones: layout → model → validated CRUD → search → persistence → tests. Add accessible labels and control names, handle no selection, confirm deletion, and test duplicate names, bad files, invalid grades, and save/reload. Submit source, project link if available, real screenshots, build steps, and test evidence.',
 [['Why use IDs independently of names?','Names may duplicate or change','Names are always unique'],['What should precede deletion?','User confirmation','Automatic file deletion'],['What should loaded records receive?','Domain and identity validation','Blind trust'],['What is the appropriate UI environment?','Visual Studio Windows Forms','A fake browser designer'],['What belongs in project evidence?','Source, real screenshots, and tests','Production student records']],{mode:'winforms',guide:formGuide('StudentRecordsForm','[Name][Average][Search]\n[Add][Edit][Delete][Clear][Save][Load]\n[gridStudents: ID | Name | Average]','Labels lblName/lblAverage/lblSearch; TextBoxes txtName/txtAverage/txtSearch; Buttons btnAdd/btnEdit/btnDelete/btnClear/btnSave/btnLoad; DataGridView gridStudents: read-only, full-row selection, no user-added blank rows.','Buttons → corresponding methods; txtSearch.TextChanged → filter; gridStudents.SelectionChanged → populate fields; Form.Load → optional LoadRecords.','Add explicit labels/tab order to the reference. Keep the practice JSON file in the project practice directory; never point it at CodeLab storage.'),expected:'Desktop manager validates CRUD, shows filtered records, confirms deletion, and saves/loads a fictional JSON file. Inspect real screenshots and test results; no browser execution.' ,project:true});
add('Inheritance, Polymorphism, and Interfaces','base/derived classes; Inherits/MyBase/Protected; Overridable/Overrides/MustOverride; Interface/Implements; multiple contracts',
 'Inheritance shares a suitable base abstraction, while composition often avoids unnecessary hierarchy. Inherits defines a base class, MyBase invokes its constructor or members, and Protected exposes members to subclasses. Overridable/Overrides support runtime polymorphism; MustOverride declares an abstract member in a MustInherit class. Interfaces define a contract and Implements connects a method/property to it. A class can implement multiple interfaces. Keep substitutability: derived types should honor the base contract rather than adding surprising requirements.',
 consoleProgram('Dim people As Person()={New StudentPerson("Maria","IT"),New TeacherPerson("Mr. Reyes","SQL")}\nFor Each person As Person In people\n    Console.WriteLine(person.Describe())\nNext')+`\nPublic Interface IReportable
    Function Describe() As String
End Interface
Public MustInherit Class Person
    Implements IReportable
    Protected ReadOnly PersonName As String
    Protected Sub New(name As String)
        PersonName=name
    End Sub
    Public MustOverride Function Describe() As String Implements IReportable.Describe
End Class
Public Class StudentPerson
    Inherits Person
    Private ReadOnly Course As String
    Public Sub New(name As String,course As String)
        MyBase.New(name) : Me.Course=course
    End Sub
    Public Overrides Function Describe() As String
        Return "Student: " & PersonName & " — " & Course
    End Function
End Class
Public Class TeacherPerson
    Inherits Person
    Private ReadOnly Subject As String
    Public Sub New(name As String,subject As String)
        MyBase.New(name) : Me.Subject=subject
    End Sub
    Public Overrides Function Describe() As String
        Return "Teacher: " & PersonName & " — " & Subject
    End Function
End Class`,
 'Create Person, Student, and Teacher models, override a suitable description method, and implement a reporting interface. Demonstrate runtime dispatch through a base-typed array and discuss one case where composition is preferable. Add a second small interface contract.',
 [['What defines the base class relation?','Inherits','Imports only'],['What invokes the base constructor?','MyBase.New','Me.Text'],['What supplies an overridden implementation?','Overrides','Private always'],['What declares an abstract member?','MustOverride','Const'],['What does an interface specify?','A contract','A desktop screenshot']],{expected:'Student: Maria — IT\nTeacher: Mr. Reyes — SQL\n'});
add('Advanced Collections and LINQ','List/Dictionary/Queue/Stack; LINQ Where/Select/OrderBy/Descending/FirstOrDefault/Any/Count/Average; lambdas; empty results',
 'A dictionary indexes values by unique keys, a queue is first-in/first-out, and a stack is last-in/first-out. LINQ expresses filtering, ordering, projection, and aggregation over typed sequences. Where filters, Select projects, OrderBy/OrderByDescending sort, and FirstOrDefault may return Nothing. Any can guard against empty input before Average, which otherwise throws. Many LINQ queries are deferred until enumeration, so a changing source can change a later result; use ToList when a snapshot is intended. Keep lambdas clear and preserve stable IDs.',
 consoleProgram('Dim students As New List(Of Student) From {New Student(1,"Ana",88),New Student(2,"Ben",72),New Student(3,"Cara",95)}\nDim passing = students.Where(Function(s) s.Average>=75).OrderByDescending(Function(s) s.Average).ToList()\nConsole.WriteLine(String.Join(", ",passing.Select(Function(s) s.Name)))\nConsole.WriteLine($"Class average: {students.Average(Function(s) s.Average):F2}")\nDim lookup = students.ToDictionary(Function(s) s.StudentId)\nConsole.WriteLine(lookup(1).Name)\nDim queue As New Queue(Of String)() : queue.Enqueue("first") : queue.Enqueue("second")\nDim stack As New Stack(Of String)() : stack.Push("first") : stack.Push("second")\nConsole.WriteLine(queue.Dequeue() & " / " & stack.Pop())', 'Imports System.Collections.Generic\nImports System.Linq')+'\n'+studentClass,
 'Filter passing students, search by name safely, sort by average, calculate the class average, and project report labels. Build a dictionary by ID and compare queue/stack order. Test no match and empty input, and explain deferred execution versus a ToList snapshot.',
 [['What filters a LINQ sequence?','Where','Catch'],['What projects new values?','Select','Dim alone'],['What may FirstOrDefault return?','Nothing','Always a matching object'],['Which collection is FIFO?','Queue','Stack'],['What should precede Average on possibly empty data?','An Any/empty check','A hard-coded credential']],{expected:'Cara, Ana\nClass average: 85.00\nAna\nfirst / second\n'});
const adoCode=consoleProgram(`Using connection As New SqliteConnection("Data Source=:memory:")
    connection.Open()
    Using schema = connection.CreateCommand()
        schema.CommandText="CREATE TABLE Students(Id INTEGER PRIMARY KEY, Name TEXT NOT NULL, Average REAL NOT NULL CHECK(Average BETWEEN 0 AND 100));"
        schema.ExecuteNonQuery()
    End Using
    Using insert = connection.CreateCommand()
        insert.CommandText="INSERT INTO Students(Id,Name,Average) VALUES(@id,@name,@average);"
        insert.Parameters.AddWithValue("@id",1)
        insert.Parameters.AddWithValue("@name","O'Brien")
        insert.Parameters.AddWithValue("@average",90)
        insert.ExecuteNonQuery()
    End Using
    Using update = connection.CreateCommand()
        update.CommandText="UPDATE Students SET Average=@average WHERE Id=@id;"
        update.Parameters.AddWithValue("@average",92) : update.Parameters.AddWithValue("@id",1)
        update.ExecuteNonQuery()
    End Using
    Using query = connection.CreateCommand()
        query.CommandText="SELECT Id,Name,Average FROM Students WHERE Id=@id;"
        query.Parameters.AddWithValue("@id",1)
        Using reader = query.ExecuteReader()
            While reader.Read()
                Console.WriteLine($"{reader.GetInt32(0)}: {reader.GetString(1)} — {reader.GetDouble(2)}")
            End While
        End Using
    End Using
    Using delete = connection.CreateCommand()
        delete.CommandText="DELETE FROM Students WHERE Id=@id;"
        delete.Parameters.AddWithValue("@id",1) : Console.WriteLine($"Deleted: {delete.ExecuteNonQuery()}")
    End Using
End Using`, 'Imports Microsoft.Data.Sqlite');
add('Database Programming with ADO.NET','provider; connection/command/parameters/reader; DataAdapter/DataTable concepts; CRUD; Using; connection strings; secure configuration',
 'ADO.NET providers expose connections, commands, parameters, and readers for particular databases. This lesson uses Microsoft.Data.Sqlite and a disposable in-memory educational database, never CodeLab tables. Keep the connection open for the lifetime of an in-memory SQLite database. Using disposes connections, commands, and readers deterministically. Bind values as parameters instead of concatenating SQL; table/column identifiers require a fixed allowlist. ExecuteNonQuery handles modifications, ExecuteReader reads rows, and ExecuteScalar reads a single value. DataTable can load a reader; Microsoft.Data.Sqlite has no DataAdapter implementation, while providers such as SQL Server have one. Package references and connection syntax are provider-specific.',
 adoCode,
 'In a separate practice project add the Microsoft.Data.Sqlite package for your supported .NET target. Create fictional Students and implement parameterized CRUD with Using blocks. Test an apostrophe/SQL-looking name, missing keys, invalid grades, and empty results. Load a DataTable from a reader as an extension. Never copy production credentials or connect to the CodeLab database.',
 [['What protects untrusted SQL values?','Bound parameters','String concatenation'],['What cleans up a connection?','Using','Leaving it globally open'],['What does ExecuteReader provide?','A row reader','A Windows Forms designer'],['Where does this example store records?','A disposable in-memory SQLite database','The CodeLab users table'],['Does Microsoft.Data.Sqlite implement DataAdapter?','No; use a reader/DataTable or another provider','Yes, every provider does']],{input:'',expected:"1: O'Brien — 92\nDeleted: 1\n",libraries:['Microsoft.Data.Sqlite']});
const multiForms=`Option Explicit On
Option Strict On
Imports System
Imports System.Windows.Forms
Public Class SessionInfo
    Public ReadOnly Property DisplayName As String
    Public Sub New(name As String)
        DisplayName=name
    End Sub
End Class
Public Class DashboardForm
    Inherits Form
    Private ReadOnly session As SessionInfo
    Public Sub New(session As SessionInfo)
        Me.session=session : Text="Practice Dashboard"
        Dim manage As New Button With {.Name="btnStudents",.Text="Students",.Left=20,.Top=50}
        Controls.Add(New Label With {.Name="lblWelcome",.Text="Welcome " & session.DisplayName,.Left=20,.Top=20,.Width=240})
        Controls.Add(manage)
        AddHandler manage.Click,AddressOf OpenStudentDialog
    End Sub
    Private Sub OpenStudentDialog(sender As Object,e As EventArgs)
        Using form As New StudentSummaryForm(session)
            form.ShowDialog(Me)
        End Using
    End Sub
End Class
Public Class StudentSummaryForm
    Inherits Form
    Public Sub New(session As SessionInfo)
        Text="Student Management"
        Controls.Add(New Label With {.Text="Practice session: " & session.DisplayName,.Left=20,.Top=20,.Width=250})
    End Sub
End Class`;
add('Multi-Form Applications and Application Architecture','Show/ShowDialog/close/hide; passing data; MenuStrip; login/dashboard/management; UI/service/data layers; modules; bounded state',
 'Separate UI interaction, business validation, and data access so form events do not contain all application logic. Pass a small session/model through constructors rather than unrestricted global variables. Show opens modelessly; ShowDialog blocks the caller until the dialog closes, and a Using block can dispose a short-lived dialog. Hiding a form keeps it alive; closing and lifetime management must be deliberate. MenuStrip provides menu navigation. Authentication is a service responsibility: a navigation demonstration is not a secure login implementation. Clear session state on logout and enforce permissions in services as well as the UI.',
 multiForms,
 'Design Login, Dashboard, and Student Management forms with constructor-based data passing, navigation, close/logout behavior, and a MenuStrip. Define authentication/service/repository interfaces; keep database code outside event handlers. Explain the difference between a navigation example and real validated authentication.',
 [['What opens a modal dialog?','ShowDialog','Show always'],['What does Hide do?','Keeps the form alive but hidden','Disposes it automatically'],['How should session information be passed?','Through a controlled model/constructor','Through unlimited globals'],['Where should database work live?','A repository/data-access layer','Every click handler duplicated'],['Does a navigation demo authenticate users?','No','Yes']],{mode:'winforms',guide:formGuide('DashboardForm','[LoginForm] → authenticated SessionInfo → [DashboardForm]\nDashboard: Welcome | MenuStrip/Students | Logout\nStudents opens a modal management dialog → closes back to Dashboard.','LoginForm: txtUsername, txtPassword (UseSystemPasswordChar=True), btnLogin, lblStatus. DashboardForm: lblWelcome, menuMain, btnStudents, btnLogout. StudentManagementForm: typed session constructor and controls from the records project.','btnLogin.Click → authentication service; btnStudents.Click → ShowDialog; btnLogout.Click → clear session/close dashboard; FormClosing → controlled lifetime.','The reference demonstrates navigation only. Implement real credential verification in an authentication service for the activity; do not treat a displayed name as proof of login.'),expected:'Desktop navigation passes an explicit session/model to a modal form and disposes it. Secure Login is a separate implementation requirement, not simulated by this reference.'});
add('Advanced Error Handling, Security, and Best Practices','specific/central errors; safe logging; validation; parameterized SQL; configuration/secrets; password hashing; session state; naming/disposal/debugging',
 'Use specific exception handling near operations and a central boundary for user-friendly messages and safe diagnostics. Logs must not contain passwords, tokens, production connection strings, or sensitive student data. Keep configuration separate from source and never hard-code production credentials. Store salted password hashes, not plaintext or reversible encryption. The example uses PBKDF2 with a per-password random salt and constant-time comparison; real applications should use a maintained authentication framework and review work factors and migration needs. Parameterized SQL, Using blocks, clear naming, small methods, and documented tests are part of secure design. Breakpoints and Watch are real Visual Studio debugging tools.',
 consoleProgram('Dim password As String = Console.ReadLine()\nIf String.IsNullOrWhiteSpace(password) OrElse password.Length < 10 Then\n    Console.WriteLine("Use a longer practice password")\n    Return\nEnd If\nDim salt As Byte() = RandomNumberGenerator.GetBytes(16)\nDim hash As Byte() = Rfc2898DeriveBytes.Pbkdf2(password,salt,600000,HashAlgorithmName.SHA256,32)\nDim candidate As Byte() = Rfc2898DeriveBytes.Pbkdf2(password,salt,600000,HashAlgorithmName.SHA256,32)\nConsole.WriteLine($"Salt bytes: {salt.Length}; hash bytes: {hash.Length}")\nConsole.WriteLine("Verified: " & CryptographicOperations.FixedTimeEquals(hash,candidate).ToString())\nConsole.WriteLine("No plaintext password stored or logged")', 'Imports System.Security.Cryptography'),
 'Review an insecure example and correct missing input checks, concatenated SQL, plaintext passwords, hard-coded production credentials, broad silent catches, and misplaced database code. Explain safe configuration, hash verification, role enforcement, logout/state cleanup, and what should never appear in logs. Include build/debugging evidence.',
 [['What should password storage contain?','A salted adaptive hash and its parameters','Plaintext passwords'],['What protects SQL value inputs?','Parameters','Raw concatenation'],['What should logs exclude?','Secrets and sensitive records','Every useful diagnostic'],['Where do production secrets belong?','Protected configuration/secret management','Hard-coded source literals'],['What should enforce permissions?','Services/data access as well as UI','Only a hidden button']],{input:'classroom-test-only\n',expected:'Salt bytes: 16; hash bytes: 32\nVerified: True\nNo plaintext password stored or logged\n'});
const finalCore=`Option Explicit On
Option Strict On
Imports System
Imports System.Collections.Generic
Imports System.Security.Cryptography
Imports Microsoft.Data.Sqlite
Public Class StudentRow
    Public Property Id As Long
    Public Property Name As String=""
    Public Property Average As Double
End Class
Public Class StudentRepository
    Private ReadOnly connectionString As String
    Public Sub New(practiceConnectionString As String)
        connectionString=practiceConnectionString
    End Sub
    Public Function ListStudents() As List(Of StudentRow)
        Dim result As New List(Of StudentRow)
        Using connection As New SqliteConnection(connectionString)
            connection.Open()
            Using command=connection.CreateCommand()
                command.CommandText="SELECT Id,Name,Average FROM Students ORDER BY Name,Id;"
                Using reader=command.ExecuteReader()
                    While reader.Read()
                        result.Add(New StudentRow With {.Id=reader.GetInt64(0),.Name=reader.GetString(1),.Average=reader.GetDouble(2)})
                    End While
                End Using
            End Using
        End Using
        Return result
    End Function
    Public Sub AddStudent(session As ApplicationSession,name As String,average As Double)
        If Not session.CanManageStudents Then Throw New UnauthorizedAccessException("Management permission required")
        If String.IsNullOrWhiteSpace(name) OrElse Double.IsNaN(average) OrElse Double.IsInfinity(average) OrElse average<0 OrElse average>100 Then Throw New ArgumentException("Invalid student")
        Using connection As New SqliteConnection(connectionString)
            connection.Open()
            Using command=connection.CreateCommand()
                command.CommandText="INSERT INTO Students(Name,Average) VALUES(@name,@average);"
                command.Parameters.AddWithValue("@name",name.Trim()) : command.Parameters.AddWithValue("@average",average)
                command.ExecuteNonQuery()
            End Using
        End Using
    End Sub
End Class
Public Class ApplicationSession
    Public ReadOnly Property UserId As Long
    Public ReadOnly Property Role As String
    Friend Sub New(userId As Long,role As String)
        Me.UserId=userId : Me.Role=role
    End Sub
    Public ReadOnly Property CanManageStudents As Boolean
        Get
            Return Role="manager" OrElse Role="admin"
        End Get
    End Property
End Class
Public Class AuthenticationService
    Private ReadOnly connectionString As String
    Public Sub New(practiceConnectionString As String)
        connectionString=practiceConnectionString
    End Sub
    Public Function Login(username As String,password As String) As ApplicationSession
        If String.IsNullOrWhiteSpace(username) OrElse String.IsNullOrEmpty(password) Then Return Nothing
        Using connection As New SqliteConnection(connectionString)
            connection.Open()
            Using command=connection.CreateCommand()
                command.CommandText="SELECT Id,Role,Salt,PasswordHash,Iterations FROM PracticeUsers WHERE Username=@username;"
                command.Parameters.AddWithValue("@username",username.Trim())
                Using reader=command.ExecuteReader()
                    If Not reader.Read() Then Return Nothing
                    Dim salt As Byte()=CType(reader.GetValue(2),Byte())
                    Dim stored As Byte()=CType(reader.GetValue(3),Byte())
                    Dim iterations As Integer=reader.GetInt32(4)
                    If iterations<100000 OrElse iterations>2000000 Then Throw New InvalidOperationException("Invalid hash parameters")
                    Dim candidate As Byte()=Rfc2898DeriveBytes.Pbkdf2(password,salt,iterations,HashAlgorithmName.SHA256,stored.Length)
                    If Not CryptographicOperations.FixedTimeEquals(stored,candidate) Then Return Nothing
                    Return New ApplicationSession(reader.GetInt64(0),reader.GetString(1))
                End Using
            End Using
        End Using
    End Function
End Class`;
add('Advanced Project — VB.NET Student Information System','real Windows Forms login/logout/roles; dashboard; student CRUD; SQLite persistence; LINQ/reports; layers; validation; tests',
 'Develop a complete Windows Forms student information system from the functional brief. Use real desktop forms and separate authentication, service validation, and parameterized data access. The reference supplies reusable repository/authentication core code; it is not a complete executable desktop application. Implement the remaining forms, first-run account setup, database initialization, full CRUD, reports, and logout as the project activity. Practice accounts store random salts, password hashes, hash parameters, and controlled roles. Do not reuse CodeLab credentials or real student data. Confirm deletion and document failures, permissions, and data boundaries.',
 finalCore,
 'Implement real Login, Dashboard, Student Management, and Report forms. Add register/edit/delete/search/details, confirmation before deletion, reports (master list/filtered/enrollment or printable summary), LINQ filtering/sorting, and SQLite persistence through a repository. Create a first-run practice account setup that hashes typed passwords; never ship plaintext/default production passwords. Enforce admin/manager/reader permissions in service/repository methods and clear sessions on logout. Milestones: schema → models/repository → authentication → forms/navigation → CRUD → reports → hardening/tests. Submit all source via the editor/repository link, real desktop screenshots, build/package instructions, schema, and tests. Test incorrect login, unauthorized changes, SQL-looking names, invalid grades, missing DB, repeated actions, and delete cancellation.',
 [['What should the final project persist?','Fictional data in a separate practice DB','CodeLab production records'],['Where should database commands live?','A repository separate from UI','Duplicated SQL in every form event'],['What should account storage exclude?','Plaintext passwords','Hash parameters'],['What should happen on logout?','Session state cleared and privileged forms closed','Permissions retained indefinitely'],['What proves desktop project work?','Source, real screenshots, build steps, and tests','A fake browser designer']],{mode:'winforms',libraries:['Microsoft.Data.Sqlite'],project:true,guide:formGuide('StudentInformationSystem','LoginForm → DashboardForm → StudentManagementForm / ReportForm\nSetupForm (first-run only) creates a practice account with a salted hash.\nLogout closes privileged views and returns to LoginForm.','LoginForm: txtUsername, txtPassword (UseSystemPasswordChar=True), btnLogin, lblStatus. DashboardForm: lblSummary, menuMain, btnStudents, btnReports, btnLogout. StudentManagementForm: ID/name/course/year/average fields, gridStudents, CRUD/search buttons. ReportForm: gridReport, filter controls, simple Export/Print if already supported.','Login.Click → AuthenticationService.Login; dashboard navigation → constructor-injected session/repository; CRUD handlers → validating services; Delete → confirmation; Logout → clear session and close forms.','PRACTICE SCHEMA\nStudents(Id INTEGER PRIMARY KEY, Name TEXT NOT NULL, Average REAL CHECK(Average BETWEEN 0 AND 100), Course TEXT, YearLevel INTEGER).\nPracticeUsers(Id INTEGER PRIMARY KEY, Username TEXT UNIQUE NOT NULL, Role TEXT CHECK(Role IN (\'admin\',\'manager\',\'reader\')), Salt BLOB NOT NULL, PasswordHash BLOB NOT NULL, Iterations INTEGER NOT NULL).\nCreate the database in a separate local practice directory and initialize it explicitly. The provided reference core is not a complete app: implement schema/setup, full CRUD, forms, and reports. No browser GUI execution or production authentication is claimed.'),expected:'Desktop project: verified practice login/logout/roles, real forms, parameterized CRUD, separate SQLite persistence, reports, validation, confirmed deletion, and safe errors. Teacher reviews the built application evidence; the reference core alone is insufficient.'});
if(items.length!==18)throw Error('Expected 18 lessons');
const out=items.map((item,index)=>{
 const quiz=item.facts.map(([question,correct,wrong],q)=>{const choices=[...new Set([correct,wrong,...item.facts.filter((_,i)=>i!==q).flatMap(f=>[f[1],f[2]])])].slice(0,4),answer=(index+q)%4;return {question,choices:choices.slice(4-answer).concat(choices.slice(0,4-answer)),answer,explanation:correct+'. Review the explanation and example for the relevant rule.'};});
 return {title:item.title,level:['Beginner','Intermediate','Advanced'][Math.floor(index/6)],position:index+1,is_project:!!item.project,vbnet_mode:item.mode??'console',vbnet_form_guide:item.guide??null,objectives:item.objectives??['Explain '+item.topics+'.','Create and validate the lesson activity using VB.NET.','Debug the result and document tests and the applicable execution boundaries.'],introduction:'Develop '+item.topics+'. Use fictional records and a supported .NET development environment.',explanation:item.explanation,syntax:item.code,example_vbnet:item.code,starter_vbnet:index===0?item.code:(item.mode==='winforms'?"Option Explicit On\nOption Strict On\n' Add your desktop source and design notes.\n":consoleProgram("' Write your original activity here.")),guided_practice:item.mode==='winforms'?'Open Form Design for the control list, names, properties, layout, events, and Visual Studio milestones. Build the reference in a real Windows Forms project; do not treat it as browser output. Capture actual screenshots and test behavior.':'Create a VB console project with a supported SDK, keep Option Explicit/Strict On, paste the example, provide the sample input, build, and compare observed output. The optional browser Run requires a verified isolated service and has no local fallback.',activity:item.activity,expected_result:item.expected,important_notes:'Avoid: '+item.facts.slice(0,2).map(f=>f[2]).join('; ')+'. Check End If/Next/End Sub, types, bounds, selected controls, and provider-specific APIs. Saving code is not compiling or grading it.',debugging_tip:'Read the first build diagnostic. Check declarations, Option Strict conversions, missing Imports/package references, control names, and Handles/WithEvents wiring. Use Visual Studio breakpoints and Watch on real desktop work. Test one small case before integrating the app.',security_note:'Never use CodeLab files, production databases, credentials, or real student records. Files and SQLite must be restricted to a practice workspace. Bind SQL values, dispose resources with Using, validate inputs, and store salted password hashes. Online compilation is disabled until a verified isolated service is configured.',challenge:item.project?'Add one original improvement and document at least five edge-case tests, one security boundary, and one design trade-off.':'Add a boundary/failure test and explain the expected result or desktop behavior.',completion_requirements:'Save and submit original source, program input, and applicable project/evidence notes. Pass the five-question quiz with at least 4/5 and receive teacher approval of the current version. Projects require rubric grading; examples and screenshots alone do not grant completion.',guide:{steps:['Read lesson and syntax.','Build/test in the appropriate supported development environment.','Write the original activity.','Save source and evidence; submit; pass the quiz for teacher review.']},quiz,validation_rules:{vbnet:{test_cases:item.mode==='winforms'?[]:[{input:item.input??'',expected:item.expected}],libraries:item.libraries??[],desktop_only:item.mode==='winforms'}},rubric:item.project?{program_functionality:25,correct_vbnet:20,interface_event_handling:15,object_oriented_design:10,data_file_database_handling:10,validation_error_handling:10,code_organization:5,testing_usability:5}:null};
});
const errors = [
 'A runtime-only installation cannot compile a project. Select the Visual Basic console template and keep the Main procedure inside a Module; comments start with an apostrophe.',
 'Do not put text into Integer variables or change a Const. Use Decimal for exact monetary/grade arithmetic and explicit conversion when Option Strict rejects a narrowing assignment.',
 'Console.ReadLine returns text and may return Nothing. Check TryParse before arithmetic; / produces division while \\ is integer division. Reject a zero divisor.',
 'Close every If and For block. Check boundary comparisons and avoid a loop that never updates its condition; AndAlso/OrElse short-circuit checks can guard invalid input.',
 'Array indexes start at zero: an upper bound of 2 gives three elements. Do not access Length as an index; distinguish Sub from a Function with a return value.',
 'An empty class cannot have an average. Validate the count before allocating an array, validate every grade in 0–100, and use Decimal division rather than integer division.',
 'Strings are immutable; Trim and Replace return new values. Guard an empty search term, choose case-insensitive comparisons deliberately, and never assume an item exists at index zero.',
 'Use the Windows Forms Visual Basic template on Windows. Name controls before adding Handles clauses, avoid duplicate event wiring, and keep Designer-generated declarations intact.',
 'Click handlers must be wired to the intended control. Reject blank names and invalid grades before changing the grid; hiding an error message does not validate input.',
 'Do not share mutable instance state accidentally. Validate inside properties/constructors as well as at the UI, and distinguish a Class instance from a Module procedure.',
 'Dispose StreamReader/StreamWriter with Using. A path may not exist and a file may be malformed; handle expected failures without concealing every exception or writing outside the practice directory.',
 'Validate selection before edit/delete, ask before destructive actions, and assign stable record IDs. JSON loading can fail; preserve the current list until a loaded replacement has been validated.',
 'Use Overrides only for an overridable member and implement the interface signature exactly. Invoke through the base/interface reference to observe polymorphism; do not substitute unsafe casts.',
 'LINQ sequences can be deferred. Materialize a snapshot when appropriate; call Any before Average on potentially empty groups, and choose deterministic tie-breakers when sorting.',
 'Open a practice connection before issuing commands, bind SQL values with parameters, and dispose readers before reusing a connection. SQLite provider syntax differs from SQL Server; never use the platform connection string.',
 'A navigation demo is not authenticated login. Keep database/authentication logic out of event handlers, dispose forms consistently, and clear the session when the user logs out.',
 'Do not store plaintext passwords or log secrets. Generate a fresh random salt, retain iteration counts with hashes, use constant-time comparison, and report friendly errors without exposing paths or connection strings.',
 'Do not grant roles from a client-controlled UI value. Enforce permissions in services/repositories, bind all SQL values, validate loaded records, and handle login, CRUD, and persistence failures without discarding good data.'
];
const summaries = [
 'VB.NET source belongs to projects/solutions; the SDK builds it and the runtime executes it. Console Main and desktop form events have different entry workflows.',
 'Declare variables and constants deliberately. Option Strict makes conversions explicit, and the chosen data type determines which values and operations are valid.',
 'Convert text input safely, validate before computing, and distinguish arithmetic, comparison, and logical operators.',
 'Conditions select paths and loops repeat work. Correct boundaries and a terminating condition are essential.',
 'Arrays hold ordered values; procedures organize reusable work. A Function returns a result and a Sub performs an action.',
 'The calculator combines validated input, arrays, procedures, Decimal statistics, and grade classification into an original tested console project.',
 'String functions return transformed text; Lists and Dictionaries organize variable-sized data for search and lookup.',
 'Windows Forms uses named controls, properties, layout, and events. Build and test it in Visual Studio on Windows.',
 'Event handlers react to actions; validation must pass before records or the UI are changed.',
 'Classes encapsulate state and behavior. Validated properties and constructors keep every instance consistent.',
 'Using disposes file resources. Targeted exception handling and a private practice path support reliable persistence.',
 'The record manager combines CRUD, search, selection, validation, and JSON persistence with real desktop evidence.',
 'Inheritance shares behavior, interfaces define contracts, and polymorphism selects the correct overridden implementation.',
 'Generics and LINQ support typed filtering, ordering, grouping, projection, and aggregate reports.',
 'ADO.NET separates connections, commands, parameters, and readers. Practice SQLite is independent of CodeLab databases.',
 'Separate forms, models, repositories, services, and session state. Navigation and authentication are distinct responsibilities.',
 'Use validated input, least privilege, safe errors, parameterized SQL, and salted password hashes throughout the application.',
 'The final project integrates authenticated desktop navigation, authorized CRUD, SQLite persistence, reports, and documented security and failure tests.'
];
const practice = [
 'Create a VB.NET console project, locate Program.vb/Main, build Hello, VB.NET, then change each fictional student detail and rebuild. Explain the solution/project/runtime/SDK relationship.',
 'Declare one variable of each taught type plus a Const, print values, then try an invalid assignment and inspect the Option Strict diagnostic before correcting the conversion.',
 'Enter 12 and 5, compare / with integer division, then test invalid text and zero. Trace TryParse and inspect the displayed error before rerunning.',
 'Trace each grade boundary through If/ElseIf, then step a For loop and a condition-controlled loop. Write a trace table including the first and last iteration.',
 'Inspect the array bounds, step each index, and call the total/average procedures with different arrays. Explain the argument and return type at each call.',
 'Run the sample three grades, independently compute the average, then test an invalid count/grade before designing your own calculator output and procedures.',
 'Transform a string while inspecting the returned value, populate a List/Dictionary, and trace matching/missing searches before adding one new record.',
 'Use Form Design to add and name the listed controls, set Text/Size/TabIndex, wire the button, build on Windows, and compare the actual form with the layout guide.',
 'Wire the indicated Click event, test blank/invalid/valid input, and confirm the grid changes only for valid values. Record the error and focus behavior.',
 'Construct two independent Student objects, call a method, test an invalid property value, and inspect encapsulated state before adding a validated property.',
 'Run in a disposable practice directory, inspect the saved text, reload it using Using, then test missing/malformed input. Verify handles are closed and practice files are cleaned up.',
 'Follow Form Design, implement models/list/CRUD before JSON persistence, then test search, selection, delete cancellation, restart/load, and corrupt-file recovery on Windows.',
 'Create base/derived objects through an interface, step the overridden call, then add a second implementation with the same contract and compare output.',
 'Inspect each LINQ filter/order/group result, add a tie and an empty group, and compare aggregate reports with manually calculated values.',
 'Run the in-memory SQLite example, follow each Using scope, and enter an apostrophe-containing name to verify parameter binding. Trace INSERT/SELECT/UPDATE/DELETE independently.',
 'Build the navigation reference in Visual Studio using Form Design. Move data access into a repository and add genuine authentication/session service logic; test logout and navigation disposal.',
 'Trace salt generation, PBKDF2 derivation, and constant-time verification with matching/mismatched inputs. Test friendly validation/failure responses and confirm logs omit credentials.',
 'Build the practice schema and auth/repository core first, implement actual forms and first-run account setup, then add authorized CRUD/reports. Follow project milestones and capture real desktop and failure-test evidence.'
];
out.forEach((lesson,i) => {
 lesson.important_notes = errors[i];
 lesson.guided_practice = practice[i] + (lesson.vbnet_mode === 'console' ? ' Online Run requires a verified isolated service; the platform has no native execution fallback.' : ' These are Visual Studio instructions; CodeLab does not execute or emulate desktop forms.');
 lesson.challenge = 'Summary: ' + summaries[i] + '\nChallenge: ' + lesson.challenge;
 if(i===5) lesson.rubric = {program_functionality:25,correct_vbnet:20,console_input_output:15,procedure_design:10,array_data_handling:10,validation_error_handling:10,code_organization:5,testing_usability:5};
});
await writeFile('database/data/vbnet-course.json',JSON.stringify(out,null,2)+'\n');console.log('Authored VB.NET: 18 lessons, 90 questions, 3 projects; 13 console lessons and 5 desktop lessons.');
