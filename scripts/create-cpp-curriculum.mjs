import { writeFileSync } from 'node:fs';
import { scenarios } from './cpp-quiz-scenarios.mjs';

// Authoring source; seeders preserve all subsequent teacher edits.
const lessons = [];
function add(
    title,
    concepts,
    explanation,
    body,
    output,
    activity,
    mistake,
    question,
    answer,
    choices,
    input = '',
) {
    lessons.push({
        title,
        concepts,
        explanation,
        body,
        output,
        activity,
        mistake,
        question,
        answer,
        choices,
        input,
    });
}
add(
    'Introduction to C++',
    'Source files, compilers, execution, #include, main(), statements, comments, applications',
    'C++ is a compiled language used for systems, games, embedded devices, and applications. Save source in a .cpp file. The preprocessor includes declarations, the compiler checks and translates code, and the linker joins object code with libraries. Execution begins at int main(). Statements usually end in a semicolon; // comments document intent. cout is declared by <iostream>. Returning 0 reports successful execution.',
    'cout << "Hello, C++!";\nreturn 0;',
    'Hello, C++!',
    'Display Student Name, Course, Year Level, and School on separate lines. Explain the include, main, cout, and return statements.',
    'Missing a semicolon or writing Main instead of main.',
    'Where does execution of a normal C++ program begin?',
    'main()',
    ['#include', 'A comment', 'cout'],
);
add(
    'Variables and Constants',
    'Declaration, initialization, assignment, reassignment, naming, const, naming conventions',
    'Declare a variable with a type and a meaningful name, and initialize it before reading it. Names are case sensitive, cannot begin with a digit, and cannot be reserved keywords. Assignment changes a stored value; const prevents later reassignment. Prefer studentName over unexplained abbreviations. A named constant makes a rule such as a passing grade explicit.',
    'string name = "Maria";\nint age = 19;\nconst double PI = 3.14159;\nage += 1;\ncout << name << " " << age << " " << PI;',
    'Maria 20 3.14159',
    'Declare name, age, course, year, and a school constant. Display them, update year, and explain why school cannot be reassigned.',
    'Reading an uninitialized variable or assigning to const.',
    'Which declaration prevents reassignment?',
    'const double PI = 3.14159;',
    ['double PI;', 'PI = 3.14159;', 'int const = 3;'],
);
add(
    'Data Types',
    'int, float, double, char, bool, string, sizeof, implicit conversion, static_cast',
    'int stores whole numbers; float and double store approximate real numbers; char stores one character; bool stores true or false; string stores text. sizeof reports storage size in bytes, which may vary by platform. Integer division drops the fractional part. static_cast<double>(total) makes an intentional conversion before division. Narrowing conversions can lose information and must be checked.',
    'int age = 18; double grade = 95.5; char section = \'A\'; bool passed = true; string name = "Juan";\ncout << name << " " << age << " " << grade << " " << section << " " << boolalpha << passed << "\\n";\ncout << static_cast<double>(5) / 2;',
    'Juan 18 95.5 A true\n2.5',
    'Declare and display all six types. Print sizeof(int) without assuming its size, and compare 5/2 with static_cast<double>(5)/2.',
    'Using double quotes for char or expecting integer division to produce 2.5.',
    'What does static_cast<double>(5) / 2 produce?',
    '2.5',
    ['2', '5', 'An integer 3'],
);
add(
    'Input and Output',
    'cout, cin, <<, >>, endl, multiple inputs, getline, fixed, setprecision',
    'cout << sends values to standard output; cin >> extracts whitespace-delimited values from standard input. getline reads a whole line including spaces. After formatted extraction, discard the pending newline before getline. Check stream success before using input. fixed and setprecision control presentation, not the stored value. Fill Program Input before Run; the lab supplies all input then EOF.',
    'string name, course; int age, year;\nif (!getline(cin, name) || !(cin >> age)) return 1;\ncin.ignore(numeric_limits<streamsize>::max(), \'\\n\');\ngetline(cin, course);\nif (!(cin >> year)) return 1;\ncout << name << " | " << age << " | " << course << " | " << year;',
    'Maria Santos | 19 | BSIT | 1',
    'Ask for full student name, age, course, and year. Display a labeled profile; test a name with spaces and invalid numeric input.',
    'A leftover newline makes the next getline return an empty string.',
    'Which reads a full name containing spaces?',
    'getline(cin, name)',
    ['cin << name', 'cout >> name', 'cin >> name'],
    'Maria Santos\n19\nBSIT\n1\n',
);
add(
    'Operators',
    'Arithmetic, assignment, comparison, logical operators, increment, decrement, precedence',
    'Use + - * / for arithmetic and % for integer remainder. Division by zero is invalid; validate the divisor first. = assigns, == compares, and += updates. Comparisons return bool; && and || short-circuit, while ! negates. ++ and -- change a counter by one. Parentheses clarify precedence. Do not combine increments of the same variable in a confusing expression.',
    'int a = 10, b = 3;\ncout << a + b << " " << a - b << " " << a * b << " " << a / b << " " << a % b << "\\n";\ncout << boolalpha << (a > b && b != 0);',
    '13 7 30 3 1\ntrue',
    'Build a calculator with two inputs and an operation. Support + - * / and integer remainder; reject zero divisors and unknown operations.',
    'Confusing = with == or dividing by zero.',
    'What is 10 % 3?',
    '1',
    ['3', '3.3333', '0'],
);
add(
    'Conditional Statements',
    'if, else if, else, switch, nested conditions, comparisons, logical expressions',
    'An if selects a branch when a condition is true. Ordered else-if branches select the first matching case; else handles the remaining valid cases. Check grade bounds before classifying. switch selects an integral or enumeration case; break prevents fallthrough unless intentional. Use braces and avoid accidentally ending an if with a semicolon.',
    'int grade; if (!(cin >> grade)) { cout << "Invalid input"; return 0; }\nif (grade < 0 || grade > 100) cout << "Invalid grade";\nelse if (grade >= 90) cout << "Excellent";\nelse if (grade >= 85) cout << "Very Good";\nelse if (grade >= 80) cout << "Good";\nelse if (grade >= 75) cout << "Passed";\nelse cout << "Failed";',
    'Excellent',
    'Classify grades using all five ranges. Test 74, 75, 79, 80, 84, 85, 89, 90, 100, -1, and 101. Add a switch menu.',
    'Checking grade >=75 before >=90 makes the higher category unreachable.',
    'Which condition rejects an out-of-range grade?',
    'grade < 0 || grade > 100',
    ['grade < 0 && grade > 100', 'grade = 100', 'grade >= 0 || grade <= 100'],
    '95\n',
);
add(
    'Loops',
    'for, while, do-while, break, continue, nested loops, counters, accumulators',
    'for suits a known iteration count, while checks before each iteration, and do-while runs at least once. Update the counter so a loop ends. An accumulator starts with a neutral value such as zero. break leaves the nearest loop; continue skips its remaining body. Nested loops are useful for tables and patterns but multiply the amount of work.',
    'int total = 0;\nfor (int i = 1; i <= 10; ++i) { total += i; }\ncout << total << "\\n";\nfor (int row = 1; row <= 3; ++row) { for (int col = 0; col < row; ++col) cout << "*"; cout << "\\n"; }',
    '55\n*\n**\n***',
    'Print 1–10, a multiplication table, a sum of inputs, and a triangle pattern. Explain when a while or do-while is appropriate.',
    'Forgetting to update a while counter creates an infinite loop.',
    'How often does a do-while execute its body before its first condition check?',
    'Once',
    ['Never', 'Ten times', 'Only if initially true'],
);
add(
    'Arrays',
    'Declaration, initialization, zero-based indices, traversal, bounds, total, average, extrema',
    'A built-in array has a fixed size. An array of five elements uses indices 0 through 4; reading or writing outside those bounds is undefined behavior. Traverse with i < count. Initialize highest and lowest from the first valid element, and accumulate totals. Convert the total to double before averaging integer values. Prefer vector for a count that changes at runtime.',
    'int grades[] = {80, 90, 100}; int total = 0, highest = grades[0], lowest = grades[0];\nfor (int grade : grades) { total += grade; highest = max(highest, grade); lowest = min(lowest, grade); }\ncout << fixed << setprecision(2) << static_cast<double>(total) / 3 << " " << highest << " " << lowest;',
    '90.00 100 80',
    'Store five valid grades in an array. Display each grade, total, average, highest, and lowest; check every input and array bound.',
    'Using <= count instead of < count accesses one element beyond the array.',
    'What is the last valid index of int grades[5]?',
    '4',
    ['5', '1', '-1'],
);
add(
    'Functions',
    'Declaration, definition, calls, parameters, arguments, return values, scope, reusable functions',
    'A function names a reusable operation. A declaration tells the compiler its return type and parameters; a definition provides its body. Arguments supply values at a call. Local variables belong to their block. Return a calculated value rather than relying on a global variable. Pass-by-value copies its argument; references for intentional modification are introduced later.',
    'cout << average(80, 100);',
    '90',
    'Write functions to calculate average, determine pass/fail, and display a student report. Call them with at least three different sets of grades.',
    'Declaring one signature but defining another or omitting a non-void return.',
    'What does a return statement do in a non-void function?',
    'Ends the function and provides its result to the caller',
    ['Restarts main', 'Declares a global variable', 'Always prints a result'],
);
lessons.at(-1).prefix =
    'double average(double first, double second) { return (first + second) / 2; }\n';
add(
    'Beginner Project — Student Grade Calculator',
    'Arrays, functions, input validation, loops, conditions, formatted reports',
    'Combine small functions into one tested grade calculator. Read a name and five grades, validate 0–100, calculate total, average, highest, lowest, and pass/fail using a threshold of 75. Keep calculation functions separate from input and output. Use an array with fixed bounds and floating-point division. An invalid input must produce a clear message without using uninitialized values.',
    'string name; getline(cin, name);\ndouble grades[5], total = 0, highest = 0, lowest = 100;\nfor (double &grade : grades) { if (!(cin >> grade) || grade < 0 || grade > 100) { cout << "Invalid grade"; return 0; } total += grade; highest = max(highest, grade); lowest = min(lowest, grade); }\ndouble averageGrade = total / 5;\ncout << name << "\\nTotal: " << fixed << setprecision(2) << total << "\\nAverage: " << averageGrade << "\\nStatus: " << status(averageGrade) << "\\nHighest: " << highest << "\\nLowest: " << lowest;',
    'Maria Santos\nTotal: 450.00\nAverage: 90.00\nStatus: Passed\nHighest: 100.00\nLowest: 80.00',
    'Build a Student Grade Calculator. Use an array, at least three named functions, a loop, conditions, and a formatted report containing name, total, average, pass/fail, highest, and lowest.',
    'Dividing an integer total with integer division or initializing the minimum to zero.',
    'Which boundary should be classified Passed at a threshold of 75?',
    'An average of exactly 75',
    ['An average of 74.99', 'Every average', 'Only 100'],
    'Maria Santos\n80 85 90 95 100\n',
);
lessons.at(-1).prefix =
    'string status(double averageGrade) { return averageGrade >= 75 ? "Passed" : "Failed"; }\n';
add(
    'Strings',
    'string, concatenation, length, indexing, substr, find, getline, comparison',
    'std::string owns a sequence of characters. Use + for concatenation, size() for length, substr for a slice, and find for a search. find returns string::npos when absent. Check indices before indexing and remember that a space is a character. getline reads names with spaces. Comparing strings is lexicographic rather than a numeric comparison of their contents.',
    'string name = "Maria Santos";\ncout << name.size() << " " << name.substr(0, 5) << "\\n";\ncout << boolalpha << (name.find("Santos") != string::npos);',
    '12 Maria\ntrue',
    'Read a full name, display its length, extract a checked first name, and search a requested substring. Test spaces and a missing match.',
    'Treating string::npos as a valid position or indexing an empty string.',
    'What does string::find return when no match exists?',
    'string::npos',
    ['Always 0', 'The string length plus one character', 'An empty vector'],
);
add(
    'Vectors',
    'vector, push_back, size, at, indexing, iteration, insert, erase, dynamic sequences',
    'std::vector grows to store a runtime number of values. push_back appends; size reports the current count. at checks bounds while operator[] requires you to ensure a valid index. erase shifts later elements and invalidates some iterators; avoid accessing an erased element. Do not retain a reference across a reallocation. Prefer a range-for loop when an index is unnecessary.',
    'vector<int> grades{80, 90}; grades.push_back(100);\nfor (int grade : grades) cout << grade << " ";\ncout << "\\nCount: " << grades.size();',
    '80 90 100\nCount: 3',
    'Read a validated count and that many grades into a vector. Add and remove one grade, then display count, total, and average, handling an empty vector.',
    'Calling front on an empty vector or using an iterator after erase.',
    'Which operation appends an element?',
    'push_back(value)',
    ['pop_back(value)', 'size(value)', 'clear(value)'],
);
add(
    'References',
    'Aliases, initialization, pass by reference, const reference, value vs reference, lifetime',
    'A reference is an alias bound to an existing object. Initialize int& when declaring it; it cannot later be reseated to alias a different object. Pass by reference for an intentional caller-visible change. Pass const string& or const vector<T>& to read a large object without copying. Never return a reference to a local variable whose lifetime ends at the return.',
    'int score = 70; improve(score);\ncout << score;',
    '75',
    'Create a function that updates a grade through a reference and another that displays a vector through a const reference. Compare with a pass-by-value function.',
    'Returning a reference to a local variable produces a dangling reference.',
    'What does const vector<int>& express?',
    'Read an existing vector without copying or modifying it',
    [
        'Always copy the vector',
        'Permit modification',
        'Create a nullable reference',
    ],
);
lessons.at(-1).prefix = 'void improve(int& score) { score += 5; }\n';
add(
    'Pointers',
    'Addresses, &, *, dereference, nullptr, initialization, pointer safety',
    'A pointer stores an address and can be nullptr when it points to nothing. &value obtains an address; *pointer reads or changes the pointed-to object. Initialize pointers and check for nullptr before dereferencing. The pointed-to object must still be alive. Pointer arithmetic is only valid within the same array (or one past its end, without dereferencing). Prefer references for required aliases and smart pointers for ownership.',
    'int score = 80; int* pointer = &score;\nif (pointer != nullptr) *pointer = 90;\ncout << score;',
    '90',
    'Point to an existing score, update it safely, then demonstrate a nullptr guard. Explain address vs value without dereferencing invalid pointers.',
    'Dereferencing nullptr, an uninitialized pointer, or a pointer to an expired local object.',
    'What does &score produce?',
    'The address of score',
    ['The value plus one', 'A reference count', 'A copy of the entire program'],
);
add(
    'Structures',
    'struct, members, initialization, dot access, arrays/vectors of records, functions',
    'A struct groups related data into a record. Its members are public by default and accessed with the dot operator. Initialize every member. A vector<Student> stores multiple records; functions taking const Student& can display a record without copying. Choose stable IDs for searching rather than assuming a name is unique.',
    'Student student{"S001", "Maria", 90};\ncout << student.id << " " << student.name << " " << student.grade;',
    'S001 Maria 90',
    'Define Student with ID, full name, course, and grade. Store three records in a vector and display them through a function.',
    'Using the wrong member name or leaving a numeric field uninitialized.',
    'What does a struct primarily provide?',
    'A type that groups related members',
    [
        'Automatic sorting of all records',
        'A replacement for every loop',
        'A database connection',
    ],
);
lessons.at(-1).prefix =
    'struct Student { string id; string name; double grade; };\n';
add(
    'File Handling',
    'fstream, ifstream, ofstream, opening, reading, writing, append, close, stream failure',
    'ofstream writes and ifstream reads. Check whether a file opened before proceeding. getline reads lines; extraction reads formatted values. ios::app appends while the default output mode truncates an existing file. Stream objects close resources when they leave scope; explicit close is useful before reading what was just written. Lab files exist only in a temporary virtual filesystem and disappear after Run.',
    'ofstream out("students.txt"); if (!out) { cout << "Write failed"; return 1; }\nout << "S001 Maria 90\\n"; out.close();\nifstream in("students.txt"); string line;\nwhile (getline(in, line)) cout << line << "\\n";',
    'S001 Maria 90',
    'Write two student records to students.txt, close it, reopen it, and display its lines. Demonstrate append and handle a missing input file. Use only fictional records.',
    'Reading while an output stream has not flushed or assuming a file exists after a new Run.',
    'Which mode preserves existing contents and adds at the end?',
    'ios::app',
    ['ios::trunc', 'ios::binary alone', 'The default ofstream mode'],
);
add(
    'Function Overloading and Recursion',
    'Signatures, overload resolution, parameter types/counts, recursion, base case, stack',
    'Overloads share a name but differ in parameter types or counts; return type alone cannot distinguish them. A recursive function calls itself and needs a reachable base case plus progress toward it. Large recursion consumes stack space. Prefer an iterative solution when deep recursion is unnecessary. Validate input before recursion, and consider arithmetic overflow.',
    'cout << sum(2, 3) << " " << sum(1.5, 2.5) << " " << factorial(5);',
    '5 4 120',
    'Overload an average function for two and three grades. Write a factorial with a base case, reject negative inputs, and compare with an iterative version.',
    'Missing the base case or overloading only by return type.',
    'What stops a correct recursive function?',
    'A reachable base case',
    ['Its name', 'A return type overload', 'An uninitialized counter'],
);
lessons.at(-1).prefix =
    'int sum(int a, int b) { return a + b; }\ndouble sum(double a, double b) { return a + b; }\nint factorial(int n) { return n <= 1 ? 1 : n * factorial(n - 1); }\n';
add(
    'Searching and Sorting',
    'Linear search, binary search, sorted prerequisite, std::sort, comparators, complexity',
    'Linear search checks elements one at a time and works on unsorted data in O(n). Binary search halves a sorted range in O(log n); using it on an unsorted range violates its prerequisite. std::sort orders a random-access range in O(n log n) comparisons. A comparator must impose a strict weak ordering; use < rather than <=. Sorting changes positions, so stable IDs remain essential.',
    'vector<int> grades{90, 70, 80}; sort(grades.begin(), grades.end());\nfor (int grade : grades) cout << grade << " ";\ncout << "\\n" << boolalpha << binary_search(grades.begin(), grades.end(), 80);',
    '70 80 90\ntrue',
    'Search student records by ID using linear search. Sort by grade and show ascending results. Use binary search only on a sorted ID list; test a missing ID.',
    'Using binary search on unsorted data or a comparator returning <=.',
    'What must hold before binary_search is used?',
    'The range is ordered consistently with its comparison',
    [
        'The range is reversed at random',
        'Every value is equal',
        'The vector has at least 100 elements',
    ],
);
add(
    'Exception Handling',
    'try, throw, catch, std::exception, runtime_error, invalid_argument, recovery, RAII',
    'throw reports an exceptional failure; try encloses an operation whose failure can be handled; catch selects a matching exception type. Catch standard exceptions by const reference to avoid copying and slicing. Do not catch everything and silently ignore failure. Separate ordinary input checks from exceptions for exceptional operations. Stack unwinding destroys automatic resource-owning objects, making RAII important.',
    'try { int grade = -1; if (grade < 0 || grade > 100) throw invalid_argument("Grade must be 0-100"); cout << grade; }\ncatch (const exception& error) { cout << error.what(); }',
    'Grade must be 0-100',
    'Create a checked grade function that throws invalid_argument for an invalid range. Catch it in main, explain the error, and test valid, invalid, and nonnumeric input.',
    'Catching by value or hiding an exception with an empty catch block.',
    'Which catch avoids copying a standard exception?',
    'catch (const exception& error)',
    [
        'catch (exception error) always avoids copying',
        'catch (int& error) for all exceptions',
        'catch error:',
    ],
);
add(
    'Intermediate Project — Student Record Management System',
    'Menu, struct, vector, strings, references, functions, CRUD, search, sort, validation, files',
    'Implement a menu-driven record system with stable unique IDs. Store records in vector<Student>; pass the vector by reference for updates and const reference for display. Separate each operation into a function. Reject duplicate IDs, invalid grades, missing records, and corrupt file rows. Read into a temporary vector and replace live data only after validation succeeds. Save and load inside one lab run; browser files are temporary.',
    'vector<Record> records;\nfor (int option; cin >> option && option != 9;) {\ntry {\n if (option == 1) { Record r; if (!(cin >> quoted(r.id) >> quoted(r.name) >> r.grade)) throw runtime_error("Invalid input"); addRecord(records, r); }\n else if (option == 2) showRecords(records);\n else if (option == 3) { string id; cin >> id; auto it = findRecord(records, id); cout << (it == records.end() ? "Not found" : it->name) << "\\n"; }\n else if (option == 4) { string id; double grade; cin >> id >> grade; validateGrade(grade); auto it = findRecord(records, id); if (it == records.end()) throw runtime_error("Not found"); it->grade = grade; }\n else if (option == 5) { string id; cin >> id; auto it = findRecord(records, id); if (it == records.end()) throw runtime_error("Not found"); records.erase(it); }\n else if (option == 6) { double total = 0; for (const auto& r : records) total += r.grade; if (records.empty()) cout << "No records\\n"; else cout << "Average: " << total / records.size() << "\\n"; }\n else if (option == 7) saveRecords(records);\n else if (option == 8) loadRecords(records);\n else cout << "Invalid option\\n";\n} catch (const exception& e) { cout << "Error: " << e.what() << "\\n"; if (!cin) return 1; }\n}',
    'S001 Maria Santos 90\nAverage: 90\nSaved\nLoaded 1\nS001 Maria Santos 90',
    'Build add/view/search/update/delete operations, class average, sorting, save/load, and an exit menu. Use struct, vector, reference parameters, named functions, checked streams, and exception handling. Supply a test log with duplicate IDs, missing IDs, invalid grades, empty data, and save/load.',
    'Replacing live records before fully validating a loaded file.',
    'How should a failed load affect the current valid records?',
    'Keep current records unchanged and report the error',
    [
        'Erase all records first',
        'Accept every malformed row',
        'Treat missing files as successful loads',
    ],
    '1 S001 "Maria Santos" 90\n2\n6\n7\n8\n2\n9\n',
);
lessons.at(-1).prefix = `struct Record { string id, name; double grade; };
void validateGrade(double grade) { if (!(grade >= 0 && grade <= 100)) throw invalid_argument("Grade must be 0-100"); }
auto findRecord(vector<Record>& records, const string& id) { return find_if(records.begin(), records.end(), [&](const Record& r) { return r.id == id; }); }
void addRecord(vector<Record>& records, const Record& r) { validateGrade(r.grade); if (r.id.empty() || r.name.empty() || findRecord(records, r.id) != records.end()) throw invalid_argument("Invalid or duplicate ID"); records.push_back(r); }
void showRecords(const vector<Record>& records) { for (const auto& r : records) cout << r.id << " " << r.name << " " << r.grade << "\\n"; }
void saveRecords(const vector<Record>& records) { ofstream out("records.txt"); if (!out) throw runtime_error("Cannot save"); for (const auto& r : records) out << quoted(r.id) << " " << quoted(r.name) << " " << r.grade << "\\n"; if (!out) throw runtime_error("Write failed"); cout << "Saved\\n"; }
void loadRecords(vector<Record>& records) { ifstream in("records.txt"); if (!in) throw runtime_error("Cannot load"); vector<Record> loaded; string line; while (getline(in, line)) { istringstream row(line); Record r; string extra; if (!(row >> quoted(r.id) >> quoted(r.name) >> r.grade) || row >> extra) throw runtime_error("Corrupt record"); addRecord(loaded, r); } if (in.bad()) throw runtime_error("Read failed"); records = move(loaded); cout << "Loaded " << records.size() << "\\n"; }
`;
add(
    'Introduction to Object-Oriented Programming',
    'Objects, classes, attributes, methods, abstraction, encapsulation, inheritance, polymorphism',
    'Object-oriented programming groups state and behavior into objects. A class defines a type; each object has its own state. Encapsulation protects invariants, abstraction presents a useful interface, inheritance models a genuine is-a relationship, and polymorphism lets code use a common interface with different implementations. Prefer composition when objects merely contain other objects. OOP is one tool, not a requirement for every small function.',
    'Student student; student.name = "Maria"; student.display();',
    'Maria',
    'Model a Student with name and a display method. Identify its attributes, behavior, and object instances. Explain where composition would be more appropriate than inheritance.',
    'Confusing a class definition with an object or putting unrelated global state into a class.',
    'Which statement describes an object?',
    'An instance of a class with its own state',
    ['Only a file extension', 'A compiler warning', 'Always a global function'],
);
lessons.at(-1).prefix =
    'class Student { public: string name; void display() const { cout << name; } };\n';
add(
    'Classes and Constructors',
    'Class definition, members, constructors, initializer lists, default and parameterized construction, destructor',
    'Constructors initialize a new object and have the same name as the class with no return type. Use member initializer lists to initialize members directly, including const members and references. A default constructor takes no required arguments; a parameterized constructor accepts initial values. A destructor releases owned resources; standard library members already manage their resources. Maintain a valid state from construction onward.',
    'Student student("Maria", 90); student.display();',
    'Maria 90',
    'Define Student with default and parameterized constructors, an initializer list, and a const display method. Validate constructor grades and create two independent objects.',
    'Giving a constructor a return type or assuming assignment is initialization.',
    'What is the purpose of a member initializer list?',
    'Initialize members before the constructor body',
    [
        'Declare a second main',
        'Delete every object',
        'Sort fields alphabetically',
    ],
);
lessons.at(-1).prefix =
    'class Student { string name; double grade; public: Student(string n = "Unknown", double g = 0) : name(move(n)), grade(g) { if (g < 0 || g > 100) throw invalid_argument("Invalid grade"); } void display() const { cout << name << " " << grade; } };\n';
add(
    'Encapsulation',
    'private, public, protected, getters, setters, invariants, const methods',
    'Keep implementation details private and expose operations that preserve valid state. A getter can be const because reading does not change the object. A setter validates before assigning so an invalid request leaves the existing value intact. protected grants access to derived classes but can weaken encapsulation; prefer a clear protected operation over exposing raw state.',
    'Grade grade; grade.set(90); cout << grade.get();',
    '90',
    'Make student fields private. Add const getters and checked setters; show that a rejected grade preserves the old grade.',
    'Making all fields public bypasses validation.',
    'Where should an invalid grade be rejected?',
    'Before changing the stored grade',
    [
        'After returning a reference to private data',
        'Only in a comment',
        'After silently clamping every value',
    ],
);
lessons.at(-1).prefix =
    'class Grade { double value = 0; public: void set(double v) { if (v < 0 || v > 100) throw invalid_argument("Invalid grade"); value = v; } double get() const { return value; } };\n';
add(
    'Inheritance',
    'Base and derived classes, public inheritance, is-a, constructor chaining, protected members, composition',
    'Public inheritance represents substitutability: a CollegeStudent is a Person. The derived constructor initializes the base before its own members. A derived class cannot directly access private base fields; use a suitable base interface. Do not inherit merely to reuse a few fields when composition communicates the relationship more accurately. Destruction through a base pointer needs a virtual destructor.',
    'CollegeStudent student("Maria", "BSIT"); cout << student.getName() << " " << student.getCourse();',
    'Maria BSIT',
    'Create Person and CollegeStudent with constructor chaining and accessors. Explain why Student containing a GradeReport is composition rather than inheritance.',
    'Trying to access a private base member directly or using inheritance for a has-a relationship.',
    'Which is an appropriate public inheritance relationship?',
    'CollegeStudent is a Person',
    ['Student is a vector', 'Grade is a file', 'Person is an input stream'],
);
lessons.at(-1).prefix =
    'class Person { string name; public: explicit Person(string n) : name(move(n)) {} virtual ~Person() = default; const string& getName() const { return name; } };\nclass CollegeStudent : public Person { string course; public: CollegeStudent(string n, string c) : Person(move(n)), course(move(c)) {} const string& getCourse() const { return course; } };\n';
add(
    'Polymorphism',
    'virtual methods, override, runtime dispatch, abstract classes, pure virtual functions, virtual destructor, slicing',
    'A virtual call through a base reference or pointer dispatches to the derived implementation. override asks the compiler to check the intended override signature. A pure virtual method makes a class abstract; callers depend on its interface. Store derived objects with unique_ptr<Base> to preserve their dynamic type. Copying a derived object into a base value slices its derived portion. A polymorphic base should have a virtual destructor.',
    'unique_ptr<Report> report = make_unique<StudentReport>(); cout << report->heading();',
    'Student Report',
    'Define an abstract Report with a virtual destructor and pure virtual render method. Implement two reports and invoke them through base pointers without slicing.',
    'Omitting virtual or slicing a derived object into a base value.',
    'What enables runtime dispatch through a base pointer?',
    'A virtual method overridden by the derived class',
    ['A global variable', 'A nonvirtual method only', 'Renaming main'],
);
lessons.at(-1).prefix =
    'class Report { public: virtual ~Report() = default; virtual string heading() const = 0; };\nclass StudentReport : public Report { public: string heading() const override { return "Student Report"; } };\n';
add(
    'Templates',
    'Function templates, class templates, type parameters, instantiation, generic programming, requirements',
    'A template describes a family of functions or classes parameterized by types. The compiler instantiates it for the used types, checking the operations that the body requires. A maximum template needs a valid comparison. Keep template definitions visible where instantiated, usually in a header. Templates provide compile-time generic behavior; virtual methods provide runtime polymorphism.',
    'cout << larger(3, 8) << " " << larger(2.5, 1.5);',
    '8 2.5',
    'Write a function template for a checked maximum and a class template Box<T> with get/set operations. Instantiate with int, double, and string; explain required operations.',
    'Passing incompatible types to a single T without an explicit intended conversion.',
    'When is a template normally instantiated?',
    'At compile time for the types that are used',
    [
        'After every cout statement at runtime',
        'Only when deleting an object',
        'Never',
    ],
);
lessons.at(-1).prefix =
    'template<class T> T larger(T a, T b) { return a < b ? b : a; }\n';
add(
    'Standard Template Library (STL)',
    'vector, map, set, iterators, algorithms, sort, find, count, container selection, invalidation',
    'The standard library connects containers, iterators, and algorithms. vector stores a sequence, map associates unique keys with values, and set stores ordered unique values. Iterators describe a half-open range [begin,end); end is not an element. Select a container based on access patterns. find returns end when absent. Know iterator invalidation rules when mutating a container.',
    'map<string, double> grades{{"S001", 90}, {"S002", 85}};\nset<string> courses{"BSIT", "BSCS", "BSIT"};\ncout << grades.at("S001") << " " << courses.size();',
    '90 2',
    'Use a map for ID lookup, a set for unique courses, and a vector with sort/find/count. Explain why each container matches its operation and check missing keys.',
    'Dereferencing end or using map[] to test existence, which can insert a value.',
    'Which container stores unique keys paired with values?',
    'map',
    ['vector without any additional checks', 'An input stream', 'A raw char'],
);
add(
    'Dynamic Memory Management',
    'Stack and heap lifetime, new/delete, new[]/delete[], ownership, leaks, dangling pointers, RAII, unique_ptr, shared_ptr',
    'Automatic objects have scope-based lifetimes. new allocates a dynamic object; match it with delete, and match new[] with delete[]. Never double-delete, dereference after deletion, or leak ownership. RAII binds resource lifetime to an object destructor. Prefer vector for dynamic sequences and make_unique for exclusive ownership. shared_ptr is for genuinely shared ownership; cycles need weak_ptr. Raw pointers can observe without owning.',
    'auto grade = make_unique<int>(90);\nvector<int> grades{80, 90, 100};\ncout << *grade << " " << grades.size();',
    '90 3',
    'Show a small correctly matched new/delete example, then rewrite it with make_unique. Explain lifetime, leaks, dangling pointers, and why vector is safer than a raw dynamic array.',
    'Using delete instead of delete[] or accessing memory after release.',
    'Which manages one owned object automatically?',
    'unique_ptr',
    [
        'An uninitialized raw pointer',
        'A leaked new expression',
        'A second manual delete',
    ],
);
add(
    'Advanced File and Data Handling',
    'Structured serialization, quoted text, versioning, validation, duplicate IDs, atomic replacement, corruption, portability',
    'Serialize an explicit versioned format with well-defined fields. quoted text preserves spaces and escaping. Parse each record into temporary validated data, reject extra fields and duplicate IDs, and replace current state only after the entire file is valid. Check both opening and write completion. Dumping raw class memory is unsafe for objects containing string or pointers and is nonportable because of layout and endianness. Lab file persistence lasts only within one Run.',
    'ofstream out("students.txt"); if (!out) throw runtime_error("Cannot write");\nout << "CODELAB1\\n" << quoted("S001") << " " << quoted("Maria Santos") << " " << 90 << "\\n"; out.close();\nifstream in("students.txt"); string version, id, name; double grade;\ngetline(in, version);\nif (version != "CODELAB1" || !(in >> quoted(id) >> quoted(name) >> grade)) throw runtime_error("Corrupt data");\ncout << id << " " << name << " " << grade;',
    'S001 Maria Santos 90',
    'Create a versioned student file. Round-trip names with spaces and reject unsupported versions, missing fields, extra fields, invalid grades, duplicate IDs, and missing files without losing current records.',
    'Writing raw object bytes containing string or pointer members.',
    'Why avoid writing raw bytes of a Student containing string?',
    'Its object representation contains implementation details rather than portable serialized text',
    [
        'Text files cannot store numbers',
        'Strings never contain spaces',
        'All object layouts are identical',
    ],
);
add(
    'Advanced Project — C++ Student Information System',
    'Class design, encapsulation, constructors, inheritance, polymorphism, STL, functions, menu, validation, exceptions, files',
    'Design Student as an encapsulated value with stable ID, name, and grades. StudentStore owns records and manages CRUD and versioned serialization. An abstract Report and derived SummaryReport provide meaningful runtime polymorphism; StudentStore contains students through composition. Validate before changing state, and load into temporary data before committing. Organize a larger native project into headers and implementation files; the current lab uses one main.cpp with these logical sections.',
    'StudentStore store;\nunique_ptr<Report> report = make_unique<SummaryReport>();\nfor (int option; cin >> option && option != 8;) { try {\n if (option == 1) { string id, name; double grade; if (!(cin >> quoted(id) >> quoted(name) >> grade)) throw runtime_error("Invalid input"); store.add(Student(id, name, {grade})); }\n else if (option == 2) report->render(store);\n else if (option == 3) { string id; cin >> id; cout << store.get(id).getName() << "\\n"; }\n else if (option == 4) { string id; double grade; cin >> id >> grade; store.get(id).setGrades({grade}); }\n else if (option == 5) { string id; cin >> id; store.remove(id); }\n else if (option == 6) store.save();\n else if (option == 7) store.load();\n else cout << "Invalid option\\n";\n } catch (const exception& e) { cout << "Error: " << e.what() << "\\n"; if (!cin) return 1; } }',
    'S001 Maria Santos Average: 90 Passed\nSaved\nLoaded\nS001 Maria Santos Average: 90 Passed',
    'Implement student registration, listing, search, edit, deletion, grades, average, pass/fail, save/load, and a robust exit menu. Use private fields, checked constructors/setters, vector or map, a meaningful abstract report with an override, RAII, reusable functions, and exceptions. Document class responsibilities and test every operation.',
    'Giving inheritance no meaningful behavior or corrupting live data on a failed load.',
    'Which design supports different report implementations without changing the menu?',
    'A virtual Report interface with overridden render methods',
    [
        'A public global vector in every function',
        'Copying derived reports into base values',
        'Disabling validation',
    ],
    '1 S001 "Maria Santos" 90\n2\n6\n7\n2\n8\n',
);
lessons.at(-1).prefix = `class Student {
 string id, name; vector<double> grades;
 public:
 Student(string i, string n, vector<double> g) : id(move(i)), name(move(n)) { if (id.empty() || name.empty()) throw invalid_argument("ID and name required"); setGrades(move(g)); }
 const string& getId() const { return id; } const string& getName() const { return name; }
 void setGrades(vector<double> g) { if (g.empty()) throw invalid_argument("Grades required"); for (double v : g) if (!(v >= 0 && v <= 100)) throw invalid_argument("Invalid grade"); grades = move(g); }
 double average() const { double total = 0; for (double g : grades) total += g; return total / grades.size(); }
 const vector<double>& getGrades() const { return grades; }
};
class StudentStore {
 map<string, Student> records;
 public:
 const map<string, Student>& all() const { return records; }
 void add(Student s) { string id = s.getId(); if (records.count(id)) throw invalid_argument("Duplicate ID"); records.emplace(id, move(s)); }
 Student& get(const string& id) { auto it = records.find(id); if (it == records.end()) throw out_of_range("Not found"); return it->second; }
 void remove(const string& id) { if (!records.erase(id)) throw out_of_range("Not found"); }
 void save() const { ofstream out("sis.txt"); if (!out) throw runtime_error("Cannot save"); out << "CODELAB1\\n" << setprecision(17); for (const auto& pair : records) { const Student& s = pair.second; out << quoted(s.getId()) << " " << quoted(s.getName()) << " " << s.getGrades().size(); for (double g : s.getGrades()) out << " " << g; out << "\\n"; } out.close(); if (!out) throw runtime_error("Write failed"); cout << "Saved\\n"; }
 void load() { ifstream in("sis.txt"); string version, line; if (!in || !getline(in, version) || version != "CODELAB1") throw runtime_error("Unsupported or missing file"); StudentStore loaded; while (getline(in, line)) { istringstream row(line); string id, name, extra; int count; if (!(row >> quoted(id) >> quoted(name) >> count) || count < 1 || count > 100) throw runtime_error("Corrupt row"); vector<double> grades(count); for (double& grade : grades) if (!(row >> grade)) throw runtime_error("Corrupt grades"); if (row >> extra) throw runtime_error("Extra fields"); loaded.add(Student(id, name, move(grades))); } if (in.bad()) throw runtime_error("Read failed"); records = move(loaded.records); cout << "Loaded\\n"; }
};
class Report { public: virtual ~Report() = default; virtual void render(const StudentStore& store) const = 0; };
class SummaryReport : public Report { public: void render(const StudentStore& store) const override { for (const auto& pair : store.all()) { const Student& s = pair.second; cout << s.getId() << " " << s.getName() << " Average: " << s.average() << " " << (s.average() >= 75 ? "Passed" : "Failed") << "\\n"; } } };
`;

const rubric = {
    functionality: 30,
    cpp_concepts: 25,
    algorithm_and_logic: 15,
    code_organization: 10,
    validation_and_error_handling: 10,
    readability_and_documentation: 5,
    testing: 5,
};
const quiz = (question, correct, distractors, explanation, rotation) => {
    const choices = [correct, ...distractors];
    for (let i = 0; i < rotation % 4; i++) choices.push(choices.shift());
    return { question, choices, answer: choices.indexOf(correct), explanation };
};
const data = lessons.map((l, index) => {
    const usedCode = l.body + (l.prefix ?? '');
    const headerRules = [
        ['string', /\bstring\b/],
        ['iomanip', /setprecision|quoted/],
        ['vector', /\bvector\b/],
        ['algorithm', /\b(sort|find_if|binary_search|max|min)\b/],
        ['fstream', /\b(ofstream|ifstream)\b/],
        ['sstream', /istringstream/],
        ['stdexcept', /throw|\bexception\b/],
        ['memory', /unique_ptr|make_unique/],
        ['map', /\bmap\b/],
        ['set', /\bset\b/],
        ['limits', /numeric_limits/],
        ['utility', /\bmove\b/],
    ];
    const lessonIncludes =
        '#include <iostream>\n' +
        headerRules
            .filter(([, pattern]) => pattern.test(usedCode))
            .map(([header]) => `#include <${header}>\n`)
            .join('') +
        'using namespace std;\n';
    const project = index % 10 === 9;
    const code =
        lessonIncludes +
        (l.prefix ?? '') +
        '\nint main() {\n' +
        l.body
            .split('\n')
            .map((x) => '    ' + x)
            .join('\n') +
        '\n}\n';
    const tests = [{ input: l.input, expected: l.output }];
    if (index === 3)
        tests.push({
            input: 'Juan Dela Cruz\n20\nBSCS\n2\n',
            expected: 'Juan Dela Cruz | 20 | BSCS | 2',
        });
    if (index === 5)
        tests.push(
            ...[
                [74, 'Failed'],
                [75, 'Passed'],
                [85, 'Very Good'],
                [101, 'Invalid grade'],
            ].map(([g, expected]) => ({ input: String(g), expected })),
        );
    if (index === 9)
        tests.push({
            input: 'Juan\n70 70 70 70 70\n',
            expected:
                'Juan\nTotal: 350.00\nAverage: 70.00\nStatus: Failed\nHighest: 70.00\nLowest: 70.00',
        });
    const milestones = project
        ? '\n\nDevelopment milestones:\n1. Sketch inputs, outputs, data structures, and function/class responsibilities.\n2. Implement and test a small valid path.\n3. Add each remaining feature independently.\n4. Validate input and failure paths before changing stored state.\n5. Test boundaries, missing data, duplicate data, and repeated operations.\n6. Refactor names and functions; add comments explaining decisions.\n7. Submit the saved source, test input, and testing evidence for teacher review.\n\nTesting evidence: record input, expected result, actual result, and pass/fail for each operation. Never use real personal student data.'
        : '';
    const projectDetails =
        index === 19
            ? '\n\nMenu: 1 Add, 2 View, 3 Search, 4 Update, 5 Delete, 6 Average, 7 Save, 8 Load, 9 Exit. Add a sort option in your finished system. Record: stable ID, full name, course, grade. Reference implementation shows the essential ID/name/grade flow; extend it with course and sorting. Test CRUD, duplicates, no records, invalid grades, and malformed files.'
            : index === 29
              ? '\n\nMenu: 1 Add, 2 View, 3 Search, 4 Edit, 5 Delete, 6 Save, 7 Load, 8 Exit. Extend edit to name/course and support several grades per student. Suggested native file map: Student.h/Student.cpp (invariants), StudentStore.h/StudentStore.cpp (CRUD and serialization), Report.h (virtual report interface), SummaryReport.cpp (implementation), main.cpp (menu). The browser lab currently accepts one main.cpp, so keep equivalent sections in one source. Test every menu branch, average threshold 75, bad numeric input, corrupt version, duplicate IDs, missing records, and round trips.'
              : '';
    return {
        title: l.title,
        level: ['Beginner', 'Intermediate', 'Advanced'][Math.floor(index / 10)],
        position: index + 1,
        objectives:
            index === 0
                ? [
                      'Explain two uses of C++ and distinguish source, compilation, and execution.',
                      'Identify include, main, output, statements, and return in a program.',
                      'Create and run a C++ program that displays a student profile.',
                  ]
                : [
                      `Explain ${l.concepts.split(',').slice(0, 3).join(', ')} using a concrete example.`,
                      `Implement and test ${l.title.toLowerCase()} in a C++17 program.`,
                      `Diagnose and correct this mistake: ${l.mistake}`,
                  ],
        introduction: `${l.title} develops ${l.concepts.toLowerCase()}. ${project ? 'Combine this module’s skills in a working student application.' : 'Run the example, trace the result, then build your own solution.'}`,
        explanation: l.explanation,
        syntax: `Key concepts: ${l.concepts}\n\n${code}`,
        example_cpp: code,
        starter_cpp:
            lessonIncludes +
            '\nint main() {\n    // Implement the activity here.\n    return 0;\n}\n',
        guided_practice: `Try It Yourself:\n1. Read the example and predict its output.\n2. Copy it into CODE and place the sample input below into Program Input.\n3. Run it and compare with the expected output.\n4. Change a value or operation and predict the new result.\n5. Explain which statement produced each output.\n\nSample Program Input:\n${l.input || '(No input required.)'}\n\nExample explanation: ${l.explanation}\n\nGuided activity: ${l.activity}`,
        activity: l.activity + milestones + projectDetails,
        expected_result: `Example output:\n${l.output}\n\nYour activity must meet the listed requirements; variable names and harmless whitespace may differ. Teacher review checks behavior, logic, and concepts, not an exact source match.`,
        important_notes: `Common mistake: ${l.mistake}\n\nSummary: ${l.explanation}\n\nUse fictional data and check all bounds, input, and resource lifetimes.`,
        debugging_tip: `Read the first compiler diagnostic and its line number. Fix that cause before later messages. Trace intermediate values with cout or cerr. ${l.mistake} Test a smallest valid input and a boundary case.`,
        security_note:
            'Runs in an isolated browser WebAssembly worker. No Laravel files, database credentials, native shell, or host filesystem are available. Files are temporary within one Run. Execution and output are bounded; do not rely on undefined behavior.',
        challenge: `Extend the activity with one useful feature and explain its effect. ${project ? 'Include a complete test log and class/function design.' : 'Add a boundary or failure test and document the result.'}`,
        completion_requirements: `Save and submit your activity, pass at least 4 of 5 quiz questions, and receive teacher approval. ${project ? 'Teacher scores all seven rubric categories (100 points).' : ''} Next: ${lessons[index + 1]?.title ?? 'Complete the Advanced module assessment and review your final project.'}`,
        is_project: project,
        rubric: project ? rubric : null,
        validation_rules: { cpp: { test_cases: tests } },
        quiz: [
            quiz(l.question, l.answer, l.choices, l.explanation, index),
            quiz(
                'Which result does the provided example produce?',
                l.output,
                [
                    'It always produces no output',
                    'It prints the C++ source instead of executing it',
                    'It always prints an unrelated Hello World message',
                ],
                `Trace the example statements. Expected output: ${l.output}`,
                index + 1,
            ),
            quiz(
                `Which is a real mistake to avoid in ${l.title}?`,
                l.mistake,
                [
                    'Using meaningful variable names',
                    'Testing valid and invalid inputs',
                    'Reading compiler diagnostics',
                ],
                l.explanation,
                index + 2,
            ),
            quiz(
                scenarios[index][0],
                scenarios[index][1],
                scenarios[index].slice(2),
                l.explanation,
                index + 3,
            ),
            quiz(
                'What is true about files written in this CodeLab?',
                'They are virtual files available only within the current Run',
                [
                    'They modify the Laravel project',
                    'They expose server credentials',
                    'They are automatically persistent in MySQL',
                ],
                'Each Run uses a fresh isolated filesystem. Demonstrate save/load in the same run and document longer-term persistence for a native application.',
                index + 4,
            ),
        ],
    };
});
if (data.length !== 30)
    throw new Error('C++ curriculum must have exactly thirty lessons.');
writeFileSync(
    'database/data/cpp-course.json',
    JSON.stringify(data, null, 2) + '\n',
);
console.log('Authored 30 C++ lessons, 150 quiz questions, and three projects.');
