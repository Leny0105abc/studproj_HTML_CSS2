import { writeFileSync } from 'node:fs';

// Authored curriculum is seeded into the shared lesson tables, never rendered from this script.
const rows = [];
function lesson(
    title,
    topics,
    explanation,
    code,
    output,
    activity,
    mistake,
    security,
    question,
    correct,
    distractors,
    construct = 'T_ECHO',
) {
    rows.push({
        title,
        topics,
        explanation,
        code: `<?php\n${code}\n`,
        output,
        activity,
        mistake,
        security,
        question,
        correct,
        distractors,
        construct,
    });
}
lesson(
    'Introduction to PHP',
    'PHP uses; client-side vs server-side; tags; syntax; embedding HTML; request lifecycle',
    'PHP runs on a server to generate a response. A browser sends a request, the server executes PHP, and the browser receives the resulting HTML or text rather than PHP source. JavaScript normally runs in the browser. In this lab, an isolated browser runtime simulates the server for practice. Open PHP with <?php, terminate statements with semicolons, and use echo to output text. Close the tag only when returning to literal HTML; omit the closing tag in PHP-only files.',
    'echo "Hello, PHP!";',
    'Hello, PHP!',
    'Create a student profile showing Student Name, Course, Year Level, and School using PHP output statements and HTML headings.',
    'Missing a semicolon or the opening <?php tag.',
    'Only response output should reach users. Do not serve PHP source or configuration secrets.',
    'What does a browser normally receive after a PHP web request?',
    'The generated response, such as HTML',
    [
        'The PHP source file',
        'The server password',
        'The PHP compiler executable',
    ],
);
lesson(
    'Variables and Constants',
    '$ variables; naming; assignment; reassignment; case sensitivity; define(); const',
    'Variables begin with $, followed by a letter or underscore and then letters, digits, or underscores. $name and $Name are different variables. Assignment uses = and can replace a value. Constants do not have a $ prefix and cannot be reassigned: define() creates a constant at runtime; const declares a constant using an expression PHP permits in that context.',
    '$name = "Maria";\n$age = 19;\ndefine("SCHOOL", "CodeLab College");\nconst PROGRAM = "BSIT";\necho "$name | $age | " . SCHOOL . " | " . PROGRAM;',
    'Maria | 19 | CodeLab College | BSIT',
    'Create and display student name, age, program, and year variables plus a school constant; update the year variable and show the new value.',
    'Using a digit as the first character of a variable name or confusing $name with $Name.',
    'Keep configuration secrets outside examples and source repositories.',
    'Which declaration creates a constant without a dollar prefix?',
    'const SCHOOL = "CodeLab";',
    ['$SCHOOL = "CodeLab";', 'constant $SCHOOL;', 'var SCHOOL = "CodeLab";'],
    'T_CONST',
);
lesson(
    'PHP Data Types',
    'string; integer; float; boolean; array; NULL; var_dump(); conversion',
    'PHP values have types: strings store text, integers whole numbers, floats decimal numbers, booleans true/false, arrays ordered key-value collections, and null the absence of a value. var_dump() prints both type and value. Explicit casts such as (int) convert values, but converting unvalidated input can hide errors. Objects are introduced in Advanced.',
    '$name = "Maria";\n$year = 1;\n$average = 88.5;\n$enrolled = true;\n$subjects = ["PHP", "Math"];\n$middleName = null;\necho gettype($year) . " | " . gettype($average) . " | " . gettype($enrolled);',
    'integer | double | boolean',
    'Declare all six types, use var_dump() to inspect them, and predict the result of converting the string "19" to an integer.',
    'Assuming the text "false" is a false boolean; a nonempty string is usually truthy.',
    'Validate the original input before converting it to a numeric type.',
    'Which value represents absence rather than an empty string?',
    'null',
    ['"null"', '""', '0'],
    'T_ARRAY',
);
lesson(
    'Operators',
    'arithmetic + - * / % **; assignment; comparison; logical; ++ --; precedence',
    'Arithmetic operators calculate values. % is the integer remainder and ** exponentiation. += updates a variable. === compares both type and value, while == performs type juggling. && and || combine boolean conditions. ++ and -- change a number by one. Multiplication normally precedes addition; parentheses make intended grouping explicit.',
    '$a = 12; $b = 5;\necho ($a + $b) . " | " . ($a - $b) . " | " . ($a * $b) . " | " . ($a % $b);',
    '17 | 7 | 60 | 2',
    'Create a calculator for +, -, *, /, %, and **. Reject division by zero; demonstrate comparison, logical, and compound assignment operators.',
    'Using = for comparison or dividing by zero.',
    'Validate operator choices against an allowlist; never evaluate a submitted expression as PHP.',
    'What does === compare?',
    'Both type and value',
    [
        'Only value after conversion',
        'Only variable names',
        'It assigns a value',
    ],
    'T_ECHO',
);
lesson(
    'Input and Output',
    'echo; print; variables; concatenation; interpolation; dynamic HTML',
    'echo outputs one or more expressions; print outputs one expression and returns 1. A dot joins strings. Double-quoted strings interpolate simple variables, while single-quoted strings generally do not. Mixing literal HTML and PHP generates dynamic pages. Request input is introduced in Intermediate; here values are defined in your program.',
    '$name = "Maria";\necho "Hello " . $name . "\n";\nprint "Year: 1";',
    'Hello Maria\nYear: 1',
    'Generate an HTML student profile using variables, echo, print, concatenation, and interpolation. Escape any values supplied by a user.',
    'Using + instead of . to concatenate strings.',
    'Escape text inserted into HTML with htmlspecialchars($value, ENT_QUOTES, "UTF-8").',
    'Which operator concatenates PHP strings?',
    '.',
    ['+', '*', '&'],
    'T_PRINT',
);
lesson(
    'Conditional Statements',
    'if; else; elseif; switch; nested conditions; logical comparisons',
    'Conditions select a branch. Check the most restrictive grade range first so 95 is not caught by a lower threshold. elseif belongs to the same decision chain; nested conditions add a decision inside another. switch compares cases and typically needs break to prevent fall-through. Reject grades outside 0–100 before classifying them.',
    '$grade = 88;\nif ($grade < 0 || $grade > 100) { echo "Invalid grade"; }\nelseif ($grade >= 90) { echo "Excellent"; }\nelseif ($grade >= 85) { echo "Very Good"; }\nelseif ($grade >= 80) { echo "Good"; }\nelseif ($grade >= 75) { echo "Passed"; }\nelse { echo "Failed"; }',
    'Very Good',
    'Classify 90–100 Excellent, 85–89 Very Good, 80–84 Good, 75–79 Passed, and below 75 Failed. Test -1, 74, 75, 89, 90, and 101; then demonstrate switch with a menu choice.',
    'Checking >=75 before >=90 in the same elseif chain.',
    'Reject invalid values before processing and display a friendly validation error.',
    'Why validate the range before classifying a grade?',
    'A value such as 150 must be rejected',
    [
        'Every grade is automatically valid',
        'It prevents variables being declared',
        'It makes echo unnecessary',
    ],
    'T_IF',
);
lesson(
    'Loops',
    'for; while; do...while; foreach; break; continue; nested loops',
    'for combines initialization, a condition, and an update. while checks before an iteration; do...while checks afterward and runs at least once. foreach visits array entries. break leaves a loop; continue skips the remainder of one iteration. Nested loops are useful for multiplication tables but multiply the work performed.',
    'for ($i = 1; $i <= 3; $i++) {\n    echo $i . ($i < 3 ? " " : "");\n}',
    '1 2 3',
    'Display 1–10, produce a multiplication table with nested loops, and use foreach to show three student names. Demonstrate break and continue.',
    'Forgetting to update a while counter creates an infinite loop.',
    'Bound iteration counts when values come from user input.',
    'Which loop naturally visits each element in an array?',
    'foreach',
    ['switch', 'if', 'try'],
    'T_FOR',
);
lesson(
    'Arrays',
    'indexed; associative; multidimensional; add/remove; access; iteration; count()',
    'PHP arrays map keys to values. Indexed arrays commonly use numeric keys; associative arrays use meaningful names. A multidimensional array contains arrays. Append with [], remove with unset(), and count entries with count(). Removing an indexed element does not automatically renumber remaining keys.',
    '$students = [["name" => "Maria", "grade" => 88], ["name" => "Jose", "grade" => 76]];\nforeach ($students as $student) {\n    echo $student["name"] . ": " . $student["grade"] . "\n";\n}',
    'Maria: 88\nJose: 76',
    'Build student records in a multidimensional array and display a safely escaped HTML table. Add a student, remove a record, and report the count.',
    'Reading an undefined key without checking it or assuming removed indexes are renumbered.',
    'Escape student names when outputting them into an HTML table.',
    'How do you append a new value to $names?',
    '$names[] = "Ana";',
    ['$names =+ "Ana";', '$names.append("Ana");', 'append $names "Ana";'],
    'T_FOREACH',
);
lesson(
    'Functions',
    'declaration; calls; parameters; return; defaults; local/global scope',
    'Functions package reusable behavior. Parameters pass values into local scope and return sends a result to the caller. A default argument makes a parameter optional. Local variables are not the same as globals; passing dependencies explicitly makes a function easier to test than using global. A declared return type documents and enforces the contract.',
    'function average(array $grades): float {\n    if (count($grades) === 0) { throw new InvalidArgumentException("At least one grade is required."); }\n    return array_sum($grades) / count($grades);\n}\nfunction result(float $grade, float $threshold = 75): string {\n    return $grade >= $threshold ? "PASSED" : "FAILED";\n}\necho number_format(average([85, 90, 90.5]), 2) . " | " . result(88.5);',
    '88.50 | PASSED',
    'Write average(), result(), and formatResult() functions. Test an empty list, one grade, and boundary averages 74.99 and 75.00.',
    'Using echo in a function that should return a value or dividing an empty array sum by zero.',
    'Validate grades before calculating and avoid hidden global dependencies.',
    'What does return do in a function?',
    'Sends a value back and ends that call',
    [
        'Always prints HTML',
        'Declares a global variable',
        'Repeats the function forever',
    ],
    'T_FUNCTION',
);
lesson(
    'Beginner Project — Student Grade Calculator',
    'student form; averages; pass/fail; arrays; functions; validation; formatting',
    'Build a core PHP grade calculator with a form for student name and three grades. Separate validation, average calculation, pass/fail classification, and output formatting into functions. Model records with arrays and enforce grades from 0 to 100. In the lab, use controlled POST request data; the form itself is a visual preview and does not submit to CodeLab.',
    'function average(array $grades): float { return array_sum($grades) / count($grades); }\n$grades = [85, 90, 90.5];\n$name = "Maria Santos";\n$mean = average($grades);\necho "Student: $name\nAverage: " . number_format($mean, 2) . "\nStatus: " . ($mean >= 75 ? "PASSED" : "FAILED");',
    'Student: Maria Santos\nAverage: 88.50\nStatus: PASSED',
    'Student Grade Calculator\nRequirements: student name and grade form; validate missing/non-numeric/out-of-range values; calculate average; display pass/fail; use variables, operators, conditions, arrays, and reusable functions.\nSteps: 1. Sketch the form. 2. Validate inputs. 3. Implement calculation functions. 4. Escape and format the result. 5. Test boundaries.\nSample POST input: {"name":"Maria Santos","grades":[85,90,90.5]}. Sample output: Student: Maria Santos; Average: 88.50; Status: PASSED.\nSubmit your PHP source with form markup and a test matrix in comments. The rubric replaces the 15 database points with calculation accuracy because databases have not yet been introduced.',
    'Calculating an average before checking every grade and ensuring the list is nonempty.',
    'Do not trust form values. Escape the displayed name and preserve safe form values after a validation error.',
    'What must happen before averaging submitted grades?',
    'Validate each grade and ensure the list is nonempty',
    [
        'Cast all missing grades to zero',
        'Print the password',
        'Skip boundary tests',
    ],
    'T_FUNCTION',
);
lesson(
    'Working with HTML Forms',
    'form action; fields; GET vs POST; processing; validation; sticky values; escaping',
    'A form submits named fields to its action using GET or POST. GET places data in the URL and is appropriate for reads/searches. POST sends a body and is appropriate for changes, but does not encrypt data; HTTPS is still required. Check the request method, validate values, and keep escaped submitted values in the form when validation fails. In this lab, enter {"post":{"name":"Maria"}} in Request Data to simulate a form submission.',
    '$name = trim($_POST["name"] ?? "Maria");\nif ($name === "") { echo "Name is required"; }\nelse { echo "Registered: " . htmlspecialchars($name, ENT_QUOTES, "UTF-8"); }',
    'Registered: Maria',
    'Create a student registration form processed by PHP with required name, email, course, and year. Display field-specific errors and preserve escaped values. Try missing fields and an invalid email through Request Data.',
    'Assuming POST is encrypted or reading a missing field without a default.',
    'Use HTTPS, server-side validation, output escaping, and CSRF protection for state changes.',
    'Which request method normally puts form fields in the URL query string?',
    'GET',
    ['POST', 'SESSION', 'COOKIE'],
    'T_IF',
);
lesson(
    'Superglobals',
    '$_GET; $_POST; $_SERVER; $_SESSION; $_COOKIE; $_FILES',
    'Superglobals are available in every scope. GET and POST contain parsed request fields; SERVER holds request/server metadata; SESSION holds server-maintained state; COOKIE contains user-supplied cookies; FILES describes uploads. All client-originating data is untrusted. Only display selected harmless metadata. The sandbox simulates GET, POST, cookies, and initial session values and never imports your CodeLab cookies.',
    '$course = $_GET["course"] ?? "BSIT";\necho "Course: " . htmlspecialchars($course, ENT_QUOTES, "UTF-8") . "\n";\necho "Method: " . ($_SERVER["REQUEST_METHOD"] ?? "GET");',
    'Course: BSIT\nMethod: GET',
    'Display a validated course filter from GET and the request method from SERVER. Add a POST name field. Explain SESSION, COOKIE, and FILES in comments without dumping server configuration.',
    'Dumping all of $_SERVER or treating a cookie role as authoritative.',
    'Never expose credentials, filesystem paths, or a full environment dump; authorize roles on the server.',
    'Which superglobal describes uploaded files?',
    '$_FILES',
    ['$_GET', '$_SESSION', '$_SERVER'],
    'T_ECHO',
);
lesson(
    'String Manipulation',
    'strlen; strtolower; strtoupper; trim; str_replace; explode; implode; substr; strpos',
    'trim() removes surrounding whitespace; strtoupper()/strtolower() change case. str_replace() substitutes text. explode() splits and implode() joins. substr() extracts a range. strpos() returns a position or false, so compare with !== false to distinguish a match at position zero. strlen() counts bytes; multilingual character counts may need mb_strlen() and the mbstring extension.',
    '$text = trim("  hello PHP  ");\necho strtoupper($text) . " | " . strlen($text) . " | " . str_replace("PHP", "CodeLab", $text);',
    'HELLO PHP | 9 | hello CodeLab',
    'Build a text utility that trims input, changes case, counts bytes, replaces words, splits into words, and rejoins them. Test a search match at index zero.',
    'Using if (strpos(...)) fails for a match at position zero.',
    'Text transformations are not HTML escaping; escape the final displayed value.',
    'How should you test whether strpos() found a match?',
    'Compare its result with !== false',
    [
        'Check only if the result is truthy',
        'Always compare with null',
        'It never returns false',
    ],
    'T_ECHO',
);
lesson(
    'Advanced Array Operations',
    'push/pop; merge/search; sort/rsort/asort/ksort; filter; iteration',
    'array_push()/array_pop() add/remove at the end. array_merge() combines arrays and may renumber numeric keys. sort()/rsort() sort values and reset keys; asort() sorts values while retaining key associations; ksort() sorts keys. array_search() can return zero or false, requiring a strict comparison. array_filter() selects entries and retains their keys.',
    '$grades = ["Maria" => 88, "Jose" => 72, "Ana" => 95];\n$passing = array_filter($grades, fn ($grade) => $grade >= 75);\nasort($passing);\nforeach ($passing as $name => $grade) { echo "$name: $grade\n"; }',
    'Maria: 88\nAna: 95',
    'Sort and filter a named grade list while retaining names. Demonstrate push, pop, merge, search, descending value sort, and key sort on copies.',
    'Using sort() on named grades loses the name-to-grade mapping.',
    'Validate numeric grade values before comparing and sorting them.',
    'Which function sorts values and preserves their keys?',
    'asort()',
    ['sort()', 'rsort()', 'array_pop()'],
    'T_FOREACH',
);
lesson(
    'File Handling',
    'fopen/fwrite/fread/fgets/fclose; append; permissions; safe paths',
    'fopen() opens a file in a mode: r reads, w truncates/writes, and a appends. Check the returned handle before using it. fwrite() writes bytes; fread() reads a chosen length; fgets() reads a line; fclose() releases the handle. Permissions determine who may access files. All paths here belong to a temporary virtual filesystem discarded after Run, not the CodeLab server.',
    '$file = fopen("/workspace/students.txt", "w");\nif ($file === false) { throw new RuntimeException("Cannot open file"); }\nfwrite($file, "Maria,88\n");\nfclose($file);\n$file = fopen("/workspace/students.txt", "r");\necho fgets($file);\nfclose($file);',
    'Maria,88',
    'Write two student records to a sandbox-local text file, append a third, then read records back with fgets(). Check failures and close handles. Explain fread() and file permissions.',
    'Using w when you intended to append, or ignoring a failed fopen().',
    'Use fixed allowed paths. Never accept arbitrary filenames or expose sensitive records in a public directory.',
    'Which fopen() mode appends without truncating existing content?',
    'a',
    ['w', 'r', 'x'],
    'T_IF',
);
lesson(
    'Sessions and Cookies',
    'session_start; read/write/unset/destroy; setcookie; expiration; login state',
    'session_start() loads a server-side session associated with an identifier. Store values in SESSION, unset one to remove it, and destroy the session when logging out. setcookie() sends a response header; the browser returns the cookie on later requests, not the same request. Cookies are client-controlled; authenticated state belongs in a server-side session. Our runs are fresh: Request Data can supply a simulated session or cookie, and no CodeLab authentication state enters the lab.',
    'session_start();\n$_SESSION["name"] = $_POST["name"] ?? "Maria";\necho "Welcome " . htmlspecialchars($_SESSION["name"], ENT_QUOTES, "UTF-8");',
    'Welcome Maria',
    'Create a remember-name page, a greeting page, and a logout branch in comments or functions. Simulate separate requests with session input; show a non-sensitive preference cookie with expiration and explain why a newly set cookie is not in COOKIE immediately.',
    'Sending output before session_start()/setcookie() or storing a trusted role in a client cookie.',
    'Use Secure, HttpOnly, SameSite cookies over HTTPS; regenerate the session ID on login and invalidate the old session at logout.',
    'Where should sensitive authenticated state usually be stored?',
    'A server-side session',
    [
        'A plain client-editable role cookie',
        'The URL password parameter',
        'Public HTML comments',
    ],
    'T_ECHO',
);
lesson(
    'Date and Time',
    'date; time; Unix timestamps; strtotime; calculations; DateTime',
    'time() gives seconds since the Unix epoch. date() formats a timestamp using the configured timezone. strtotime() parses a supported textual date and may return false. DateTimeImmutable represents a date without mutating the original; diff() computes a calendar interval. Timezones and daylight-saving transitions matter, so a day is not always exactly 86400 elapsed seconds.',
    'date_default_timezone_set("Asia/Manila");\n$enrolled = new DateTimeImmutable("2026-08-01");\n$review = new DateTimeImmutable("2026-08-11");\necho $enrolled->format("Y-m-d") . " | " . $enrolled->diff($review)->days . " days";',
    '2026-08-01 | 10 days',
    'Display the current date/time, a fixed enrollment date, and days between two dates. Compare date(), time(), strtotime(), and DateTimeImmutable; test invalid input and state the timezone.',
    'Ignoring the timezone or treating a failed strtotime() as a valid timestamp.',
    'Validate date formats and do not use predictable timestamps as secret tokens.',
    'What does time() return?',
    'A Unix timestamp in seconds',
    [
        'A formatted HTML date',
        'The current timezone name',
        'An array of months',
    ],
    'T_NEW',
);
lesson(
    'Error Handling and Validation',
    'syntax/runtime/logic; isset; empty; filter_input; exceptions; try/catch/finally',
    'Syntax errors prevent parsing; runtime errors happen during execution; logical errors produce incorrect results without an exception. isset() rejects null/missing values; empty() also treats "0" as empty. filter_input() validates actual SAPI input; filter_var() is useful for already read or simulated values. Throw exceptions for exceptional failures, catch expected types for friendly errors, and use finally for cleanup.',
    '$email = $_POST["email"] ?? "maria@example.test";\ntry {\n    if (filter_var($email, FILTER_VALIDATE_EMAIL) === false) { throw new InvalidArgumentException("Invalid email"); }\n    echo "Email accepted";\n} catch (InvalidArgumentException $error) { echo $error->getMessage(); }',
    'Email accepted',
    'Validate required name, email, and year fields with field-specific errors. Demonstrate isset(), the "0" empty() pitfall, filter_input() in a real request, and try/catch/finally. Use filter_var() for simulated Request Data.',
    'Using empty() to reject a numeric value when zero is valid.',
    'Show friendly errors to users; log diagnostic details privately and disable error display in production.',
    'Which function validates a value that has already been read into a variable?',
    'filter_var()',
    ['echo()', 'session_start()', 'array_pop()'],
    'T_TRY',
);
lesson(
    'Introduction to MySQL with PHP',
    'tables/rows/columns/primary keys; PDO; DSN; SELECT; fetch',
    'A relational database stores rows in tables, with columns defining fields and a primary key identifying each record. PDO provides a common PHP database API. A MySQL DSN looks like mysql:host=SANDBOX_HOST;dbname=student_lab;charset=utf8mb4; credentials must come from a secure server configuration, never CodeLab production. The browser lab provides a temporary PDO SQLite database to practice portable SQL and result fetching; it is explicitly not a MySQL server.',
    '$db = new PDO("sqlite:/workspace/student-lab.sqlite");\n$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);\n$records = $db->query("SELECT student_number, first_name FROM students ORDER BY id")->fetchAll(PDO::FETCH_ASSOC);\nforeach ($records as $row) { echo $row["student_number"] . " | " . $row["first_name"] . "\n"; }',
    '2026-001 | Maria\n2026-002 | Jose',
    'Read student records from the isolated teaching database with PDO and FETCH_ASSOC. Write the equivalent MySQL DSN using placeholder configuration values in a comment. Identify primary key, columns, and rows.',
    'Putting real production credentials in a lesson or confusing a DSN with an SQL query.',
    'Use a separate least-privilege teaching database; never connect student code to the application database.',
    'What is the role of a primary key?',
    'Uniquely identifies a row',
    [
        'Encrypts every column',
        'Stores the database password',
        'Automatically escapes HTML',
    ],
    'T_NEW',
);
lesson(
    'Intermediate Project — Student Record Management System',
    'student CRUD/search; PDO/prepared statements; forms; session; errors',
    'Build a core PHP Student Record Management System with add, list, search, edit, and delete actions. Keep validation and database queries separate from presentation. Every user value belongs in a prepared-statement parameter, not concatenated SQL. Practice individual operations with the temporary teaching database; develop the complete multi-page MySQL project in a separately provisioned educational environment.',
    '$db = new PDO("sqlite:/workspace/student-lab.sqlite");\n$query = $db->prepare("SELECT student_number, first_name FROM students WHERE first_name LIKE :name");\n$query->execute(["name" => "%Maria%"]);\nforeach ($query->fetchAll(PDO::FETCH_ASSOC) as $student) { echo $student["student_number"] . " | " . $student["first_name"]; }',
    '2026-001 | Maria',
    'Student Record Management System\nSchema: students(id primary key, student_number unique, first_name, last_name, course, year_level, email).\nMilestones: 1. Design the schema and navigation. 2. Add PDO connection configuration. 3. Create validated add/list forms. 4. Implement search and edit with prepared statements. 5. Add confirmed deletion via POST and CSRF. 6. Add a basic session login if assigned. 7. Test and document.\nSample UI: search bar; student table with number/name/course/year/email; Add, Edit, and Delete controls; friendly errors.\nUse MySQL only in a separate teacher-provisioned environment. Submit the PHP entry script and SQL schema/test evidence in source comments; an optional repository URL can be included in comments. Never include credentials.',
    'Concatenating search input into SQL or deleting a record through a GET link.',
    'Use prepared statements, validate identifiers, escape output, protect writes with CSRF, and keep errors free of credentials.',
    'Which approach safely supplies a search value to SQL?',
    'Bind it through a prepared statement',
    [
        'Concatenate it into the SQL',
        'Trust the form because it uses POST',
        'Put it in the DSN',
    ],
    'T_NEW',
);
lesson(
    'Object-Oriented PHP',
    'classes/objects; properties/methods; constructors; $this; state',
    'A class defines properties and methods; an object is an instance with its own state. __construct() initializes that state. $this refers to the current object. Constructor property promotion, supported by PHP 8+, declares and initializes properties concisely. Use typed methods to express behavior, and keep validation near the state it protects.',
    'class Student {\n    public function __construct(public string $name, public float $grade) {}\n    public function summary(): string { return "$this->name: $this->grade"; }\n}\n$student = new Student("Maria", 88.5);\necho $student->summary();',
    'Maria: 88.5',
    'Create a Student class with constructor, name/grade state, summary(), and passed() methods. Instantiate two students and show that their state is independent.',
    'Forgetting $this-> when accessing an instance property or mixing class and object syntax.',
    'Validate constructor inputs and avoid public properties for sensitive mutable state.',
    'What does $this refer to inside an instance method?',
    'The current object',
    [
        'Every object in the program',
        'A global database connection',
        'The parent HTTP request',
    ],
    'T_CLASS',
);
lesson(
    'Inheritance and Polymorphism',
    'parent/child; extends; overriding; parent; reuse; polymorphism',
    'Inheritance lets a child extend a parent class and reuse behavior. A child can override a method with a compatible signature. parent:: calls the parent implementation. Polymorphism lets code call the same method on different subclasses and receive specialized behavior. Favor inheritance for a true is-a relationship rather than merely sharing unrelated code.',
    'class Person { public function role(): string { return "Person"; } }\nclass Student extends Person { public function role(): string { return "Student"; } }\nclass Teacher extends Person { public function role(): string { return "Teacher"; } }\nforeach ([new Student(), new Teacher()] as $person) { echo $person->role() . "\n"; }',
    'Student\nTeacher',
    'Create Person, Student, and Teacher classes with shared name state and specialized introduction() methods. Use parent::__construct() and iterate over both child objects through a common method.',
    'Changing an overridden method to an incompatible parameter or return type.',
    'A class named Admin is not authorization; enforce permissions using trusted authenticated identity.',
    'Which keyword declares a child class?',
    'extends',
    ['implements-only', 'inherits()', 'parent()'],
    'T_EXTENDS',
);
lesson(
    'Encapsulation, Interfaces, and Traits',
    'public/private/protected; getters/setters; interfaces; implements; traits/use',
    'Encapsulation controls access to state: public is externally accessible; protected is available to the class and descendants; private belongs to its declaring class. A getter reads state and a validated setter changes it. Interfaces define method contracts that implementing classes must fulfill. Traits reuse method implementations without a parent-child relationship.',
    'interface Describable { public function describe(): string; }\ntrait Greeting { public function greet(): string { return "Hello"; } }\nclass Student implements Describable {\n    use Greeting;\n    private string $name = "Maria";\n    public function describe(): string { return $this->greet() . " " . $this->name; }\n}\necho (new Student())->describe();',
    'Hello Maria',
    'Implement a shared interface in Student and Teacher, add a greeting trait, and protect a grade property with a setter that rejects values outside 0–100.',
    'Treating an interface as an instantiable class or modifying a private property from outside.',
    'Keep validated state behind methods; visibility alone does not validate user input.',
    'What does an interface primarily define?',
    'A contract of required methods',
    ['A database table', 'A browser window', 'A list of session cookies'],
    'T_INTERFACE',
);
lesson(
    'Advanced Database Programming with PDO',
    'named/positional placeholders; bind; transactions; commit/rollback; fetch; errors',
    'prepare() separates SQL structure from values. Bind values using named or positional placeholders; identifiers such as table names require an allowlist rather than value binding. Transactions group related writes: beginTransaction(), commit(), and rollBack(). Catch exceptions, roll back if still in a transaction, and show a friendly error. FETCH_ASSOC returns column-name keys.',
    '$db = new PDO("sqlite:/workspace/student-lab.sqlite");\n$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);\n$db->beginTransaction();\ntry {\n    $query = $db->prepare("UPDATE students SET year_level = :year WHERE student_number = :number");\n    $query->execute(["year" => 2, "number" => "2026-001"]);\n    $db->commit();\n    echo "Updated: " . $query->rowCount();\n} catch (PDOException $error) { if ($db->inTransaction()) { $db->rollBack(); } echo "Update failed"; }',
    'Updated: 1',
    'Implement secure create/read/update/delete functions, demonstrate named and positional parameters, and perform a two-write transaction. Deliberately trigger a constraint error to verify rollback leaves records unchanged.',
    'Trying to bind a table name or committing after one of the required writes failed.',
    'Allowlist dynamic identifiers; use bound values, least privilege, and private diagnostic logs.',
    'What does rollBack() do to an active transaction?',
    'Reverts its uncommitted changes',
    [
        'Deletes the entire database',
        'Commits every pending change',
        'Restarts the browser',
    ],
    'T_TRY',
);
lesson(
    'Authentication and Authorization',
    'register/login/logout; password_hash/verify; sessions; regeneration; roles',
    'Authentication establishes identity; authorization decides what that identity may do. Hash registration passwords with password_hash(..., PASSWORD_DEFAULT) and verify login attempts with password_verify(). Use a password column long enough for evolving hashes, typically VARCHAR(255). On successful login regenerate the session identifier and store only the user ID and trusted role. Enforce Admin/Teacher/Student permissions on each protected action and clear session state on logout.',
    '$hash = password_hash("practice-only-password", PASSWORD_DEFAULT);\n$verified = password_verify("practice-only-password", $hash);\necho $verified ? "Password verified" : "Login failed";',
    'Password verified',
    'Write registration, login, and logout functions with hashed passwords and session-ID regeneration. Define Admin, Teacher, and Student permissions and reject an authenticated student who requests an admin action.',
    'Storing plain-text passwords or treating a hidden admin button as authorization.',
    'Use generic login errors, rate limits, HTTPS, secure cookies, and CSRF protection. Never submit real passwords in lab examples.',
    'Which PHP function verifies a password against its stored hash?',
    'password_verify()',
    [
        'md5($password) === $password',
        'strcmp() with plain text',
        'base64_decode()',
    ],
    'T_ECHO',
);
lesson(
    'File Uploads',
    'multipart; FILES; errors/size; MIME; random names; nonpublic storage',
    'Upload forms require multipart/form-data. FILES includes error, size, temporary path, and client name. Check UPLOAD_ERR_OK and an explicit size limit, then inspect content with finfo rather than trusting the extension or client-provided MIME type. Generate a random storage name and store outside an executable web directory. move_uploaded_file() checks a real upload; this lab supplies no real upload endpoint and uses sandbox-local sample bytes to practice MIME validation.',
    '$bytes = "plain-text sample";\n$file = "/workspace/upload-sample.txt";\nfile_put_contents($file, $bytes);\n$mime = (new finfo(FILEINFO_MIME_TYPE))->file($file);\necho in_array($mime, ["image/jpeg", "image/png"], true) ? "Image accepted" : "Rejected: not an allowed image";',
    'Rejected: not an allowed image',
    'Design a profile-image upload handler with multipart form, upload-error/size checks, MIME allowlist, random filename, and storage outside public execution. Test invalid sample bytes in the lab. Describe how a real teacher-provisioned server would use move_uploaded_file().',
    'Trusting .jpg in the submitted name without checking the actual content.',
    'Reject executable files and oversized content. Store outside webroot with least privilege; serve approved images through a controlled response.',
    'Why is the submitted file extension insufficient for validation?',
    'An attacker can rename arbitrary content',
    [
        'Extensions always contain encrypted MIME data',
        'PHP forbids filenames',
        'Every .jpg is automatically safe',
    ],
    'T_NEW',
);
lesson(
    'JSON and APIs',
    'encode/decode; associative arrays; HTTP requests/status; clients; simulated data',
    'JSON is a language-independent data format. json_encode() serializes PHP values and json_decode(..., true, ..., JSON_THROW_ON_ERROR) reads objects into associative arrays and reports invalid JSON. An API request specifies method, path, headers, and possibly a body; the response includes a status such as 200 success, 400 bad request, or 401 unauthenticated. cURL or a server-side HTTP client can make real requests, but this lab deliberately disables networking and uses a simulated response.',
    '$json = \'{"students":[{"name":"Maria","year":1}]}\';\n$data = json_decode($json, true, 512, JSON_THROW_ON_ERROR);\necho $data["students"][0]["name"] . " | " . $data["students"][0]["year"];',
    'Maria | 1',
    'Parse a simulated student API response, handle invalid JSON, display safely escaped HTML, and generate a JSON response. Document method/status/content-type choices and where an actual server-side API key would be configured.',
    'Assuming decoding always succeeds or embedding a secret API key in browser code.',
    'Validate API data, set sensible timeouts on real clients, and keep secret keys in server configuration.',
    'What does the true argument in json_decode($json, true) request?',
    'Associative arrays for JSON objects',
    ['Automatic encryption', 'A network connection', 'HTML rendering'],
    'T_ECHO',
);
lesson(
    'MVC and Application Structure',
    'Model/View/Controller; routing; lifecycle; configuration; service/database layer',
    'MVC separates responsibilities: a model/service handles data and rules; a controller handles a request and coordinates work; a view presents output. A router maps an allowed method/path to a controller. Store configuration separately and inject the database connection into services. A request flows router → controller → service/model → view → response. Laravel builds on these core PHP ideas, but this activity uses plain PHP functions and folders.',
    'function studentModel(): array { return ["name" => "Maria"]; }\nfunction studentView(array $student): string { return "Student: " . htmlspecialchars($student["name"], ENT_QUOTES, "UTF-8"); }\nfunction studentController(): string { return studentView(studentModel()); }\necho studentController();',
    'Student: Maria',
    'Refactor a small CRUD script into public/index.php, app/controllers, app/models or services, views, and config. Keep SQL out of templates and HTML out of models. Include a folder map and request flow in your source comments.',
    'Moving files without actually separating SQL, request handling, and rendering responsibilities.',
    'Allowlist routes and never include a filesystem path constructed directly from request input.',
    'Which responsibility belongs primarily in a view?',
    'Presenting output to the user',
    [
        'Storing database credentials in HTML',
        'Authorizing every route by hiding buttons',
        'Accepting arbitrary include paths',
    ],
    'T_FUNCTION',
);
lesson(
    'PHP Security and Best Practices',
    'SQL injection; XSS; CSRF; validation; hashing; secure sessions; uploads; env; errors; least privilege',
    'Prepared statements prevent values from becoming SQL structure. Context-appropriate escaping prevents untrusted text from becoming HTML; htmlspecialchars() is for HTML text/attributes, not every context. CSRF tokens tie a state-changing request to a session and are verified with hash_equals(). Validate input independently of escaping. Hash passwords, regenerate session IDs, restrict uploads, keep secrets outside public files, disable production error display, and grant database accounts only needed permissions.',
    '$untrusted = "<script>alert(1)</script>";\necho htmlspecialchars($untrusted, ENT_QUOTES, "UTF-8");',
    '&lt;script&gt;alert(1)&lt;/script&gt;',
    'Review a form that concatenates POST input into SQL and echoes the same value without escaping. Replace SQL concatenation with parameters, add server-side validation and a session CSRF token generated by random_bytes(), and escape output. Add secure-session and upload checks; explain least privilege.',
    'Treating escaping as SQL protection or trusting validation performed only in JavaScript.',
    'Protect all writes including logout/delete with CSRF; avoid GET mutations, plain passwords, public secrets, and verbose production errors.',
    'Which defense prevents SQL injection through query values?',
    'PDO prepared statements with bound parameters',
    ['HTML escaping alone', 'Hiding the submit button', 'Changing POST to GET'],
    'T_ECHO',
);
lesson(
    'Advanced Project — PHP Web Application',
    'registration/auth; dashboard/roles; CRUD/MySQL; search/filter; validation; uploads; CSRF; tests',
    'Develop a PHP Student Information Web Application using core PHP. Combine registration, login/logout, a role-aware dashboard, student CRUD, MySQL, search/filtering, validated forms, prepared statements, password hashes, secure sessions, controlled profile images, CSRF, and output escaping. Admin manages users and all records; Staff manages allowed student records; Student views only their own profile. Enforce ownership and role permissions in server code for every action.',
    '$db = new PDO("sqlite:/workspace/student-lab.sqlite");\n$query = $db->prepare("SELECT first_name, course FROM students WHERE student_number = :number");\n$query->execute(["number" => "2026-001"]);\n$student = $query->fetch(PDO::FETCH_ASSOC);\necho $student["first_name"] . " | " . $student["course"];',
    'Maria | BSIT',
    'PHP Student Information Web Application\nFunctional requirements: registration, login/logout, dashboard, Admin/Staff/Student permissions, student CRUD, MySQL, search/filtering, form validation, PDO parameters, password_hash/password_verify, regenerated sessions, profile images, CSRF tokens, escaping, and friendly errors. Optional modules: Courses, Subjects, Users, Reports.\nDatabase design: users(id, email unique, password VARCHAR(255), role); students(id, user_id foreign key, student_number unique, first_name, last_name, course, year_level, email, profile_image). Add courses/subjects and junction tables if needed.\nMilestones: 1. Design schema and role/ownership matrix. 2. Build MVC-style folders/config. 3. Implement registration/login/logout securely. 4. Add validated CRUD/search/filtering. 5. Add controlled images and CSRF. 6. Test every role and ownership boundary. 7. Document installation with placeholder configuration.\nSecurity checklist: prepared SQL; escaped output; CSRF on writes; hashed passwords; regenerated session IDs; HTTPS cookie flags; upload MIME/size limits and non-executable storage; private errors; environment secrets; least privilege.\nTesting checklist: duplicate registration, wrong password, expired session, denied roles, another student ID, SQL/XSS payloads, missing/wrong CSRF, invalid forms, oversized/fake images, search/filtering, rollback, and logout.\nSubmit a PHP entry script plus schema, folder map, milestones, test matrix, and optional educational repository URL in comments. Full multi-page/MySQL execution requires a teacher-provisioned sandbox outside CodeLab; the lab practices isolated components.',
    'Checking roles only in the dashboard and forgetting record ownership checks in edit/delete handlers.',
    'Use Admin/Staff/Student role checks plus ownership authorization at every endpoint; keep all project databases separate from CodeLab.',
    'Which check is required when a Student opens a profile by ID?',
    'Verify the profile belongs to that authenticated student',
    [
        'Trust any numeric ID',
        'Trust a hidden form field',
        'Check only that login succeeded',
    ],
    'T_NEW',
);

const rubric = {
    'Program Functionality': 30,
    'Correct Use of PHP Concepts': 20,
    'Database Implementation': 15,
    'Security and Validation': 15,
    'Code Organization': 10,
    'User Interface / Usability': 5,
    'Testing and Documentation': 5,
};
function question(prompt, correct, wrong, explanation, rotation) {
    const choices = [correct, ...wrong];
    const offset = rotation % 4;
    return {
        question: prompt,
        choices: choices.slice(offset).concat(choices.slice(0, offset)),
        answer: (4 - offset) % 4,
        explanation,
    };
}
const content = rows.map((row, index) => {
    const project = (index + 1) % 10 === 0;
    const next = rows[index + 1]?.title;
    const checks = { required_constructs: [row.construct] };
    // Project outputs vary; teachers assess the complete rubric rather than a sample string.
    if (!project && ![11, 15].includes(index))
        checks.expected_output = row.output;
    if (index === 8)
        checks.test_cases = [
            { function: 'average', arguments: [[80, 90]], expected: 85 },
            { function: 'result', arguments: [74], expected: 'FAILED' },
            { function: 'result', arguments: [75], expected: 'PASSED' },
        ];
    const quiz = [
        question(
            row.question,
            row.correct,
            row.distractors,
            row.explanation,
            index,
        ),
        question(
            'Predict the output of this lesson’s complete example (with default Request Data).',
            row.output,
            [
                'The literal PHP source is printed',
                'No output is possible from PHP',
                'All student records in CodeLab are deleted',
            ],
            'Trace the example statements in order. The displayed expected result belongs to the sample inputs, not every possible solution.',
            index + 1,
        ),
        question(
            `Which issue should you check when debugging ${row.title}?`,
            row.mistake,
            [
                'PHP never needs debugging',
                'Ignore all invalid inputs',
                'Delete the existing course records',
            ],
            `Common error: ${row.mistake}`,
            index + 2,
        ),
        question(
            'Which practice best matches this lesson’s security requirements?',
            row.security,
            [
                'Copy production credentials into the editor',
                'Trust all browser-submitted values',
                'Execute student code on the CodeLab server',
            ],
            row.security,
            index + 3,
        ),
        question(
            'Which activity demonstrates the main skill in this lesson?',
            row.activity.split('\n')[0],
            [
                'Only change the CodeLab theme color',
                'Remove all PHP validation',
                'Reset every student’s progress',
            ],
            `Apply the lesson’s concepts: ${row.topics}.`,
            index,
        ),
    ];
    return {
        title: row.title,
        level: ['Beginner', 'Intermediate', 'Advanced'][Math.floor(index / 10)],
        position: index + 1,
        objectives:
            index === 0
                ? [
                      'Explain the purpose of PHP.',
                      'Differentiate client-side and server-side scripting.',
                      'Write and execute a basic PHP program.',
                  ]
                : [
                      `Explain how ${row.topics.split(';')[0]} supports this lesson’s program.`,
                      `Create a working solution for ${row.title.replace(/^(Beginner|Intermediate|Advanced) Project — /, '')}.`,
                      `Debug this common error: ${row.mistake}`,
                  ],
        introduction: `${row.title} develops ${row.topics.toLowerCase()}. Apply these ideas to student information and core PHP web development.`,
        explanation: `Key concepts: ${row.topics}.\n\n${row.explanation}`,
        syntax: row.code,
        example_php: row.code,
        starter_php: `<?php\n// ${row.title}\n// Complete the activity; use the example as a reference.\n`,
        guided_practice: `Run the complete example, predict its output, then change one input or value. Compare the result and fix a deliberate error: ${row.mistake} Explain why your correction works.`,
        activity: row.activity,
        expected_result: row.output,
        important_notes: row.mistake,
        security_note: row.security,
        challenge: `Summary: ${row.explanation.split('. ')[0]}.\nChallenge: test both a valid input and an invalid or boundary case and document what changed.${next ? `\nNext lesson: ${next}.` : '\nNext: complete the Advanced assessment and present your project.'}`,
        completion_requirements:
            'Save and submit your PHP source for teacher review, pass the Quick Check with at least 4/5, and receive teacher approval. Project approval also requires rubric grading.',
        is_project: project,
        rubric: project
            ? index === 9
                ? Object.fromEntries(
                      Object.entries(rubric).map(([name, points]) => [
                          name === 'Database Implementation'
                              ? 'Calculation Accuracy'
                              : name,
                          points,
                      ]),
                  )
                : rubric
            : null,
        validation_rules: { php: checks },
        quiz,
    };
});
if (content.length !== 30)
    throw new Error('PHP curriculum must have 30 lessons');
writeFileSync(
    new URL('../database/data/php-course.json', import.meta.url),
    JSON.stringify(content, null, 2) + '\n',
);
console.log(
    'Authored PHP curriculum: 30 lessons, 150 quiz questions, 3 project rubrics.',
);
