import { writeFileSync } from 'node:fs';
import {
    gradeProject,
    recordsProject,
    jdbcProject,
} from './java-project-examples.mjs';

// Trusted curriculum authoring; the seeder preserves all later teacher edits.
const rows = [];
const main = (body, imports = '', members = '') =>
    `${imports}${imports ? '\n' : ''}public class Main {\n${members}\n    public static void main(String[] args)${/new File|\.join\(|Connection/.test(body) ? ' throws Exception' : ''} {\n${body
        .split('\n')
        .map((line) => '        ' + line)
        .join('\n')}\n    }\n}\n`;
function add(
    title,
    concepts,
    explanation,
    example,
    output,
    activity,
    mistake,
    question,
    correct,
    wrong,
    scenario,
    scenarioCorrect,
    scenarioWrong,
    input = '',
) {
    rows.push({
        title,
        concepts,
        explanation,
        example,
        output,
        activity,
        mistake,
        question,
        correct,
        wrong,
        scenario,
        scenarioCorrect,
        scenarioWrong,
        input,
    });
}
add(
    'Introduction to Java',
    'JDK, JRE, JVM, source, javac, bytecode, class, main, comments',
    'Java is used in business applications, Android ecosystems, services, and tools. A JDK contains development tools such as javac plus a runtime. A JRE describes the runtime libraries and JVM needed to execute bytecode; modern JDK distributions often bundle this runtime instead of a separately installed JRE. javac checks Main.java and produces .class bytecode; a compatible JVM executes it. Platform independence depends on an appropriate JVM and compatible APIs. Execution starts at public static void main(String[] args). Statements end in semicolons. // and /* */ document code.',
    main('System.out.println("Hello, Java!");'),
    'Hello, Java!',
    'Display Student Name, Course, Year Level, and School on separate lines. Add one comment explaining main. Identify source code, bytecode, and the JVM.',
    'Naming the public class differently from Main.java, or writing Main instead of main.',
    'Which tool compiles Java source into bytecode?',
    'javac',
    ['The browser address bar', 'Scanner', 'println'],
    'Which entry point can the Java launcher invoke?',
    'public static void main(String[] args)',
    ['private void start()', 'public int Main()', 'static string main()'],
);
add(
    'Variables and Constants',
    'Declarations, initialization, assignment, final, local scope, naming',
    'Declare a local variable with a type and meaningful name, then initialize it before use. Java names are case sensitive, cannot start with a digit, and cannot be reserved words. A variable may be reassigned; a final variable may be assigned only once. A block limits local scope. final prevents changing a reference but does not automatically make the referenced object immutable.',
    main(
        'String name = "Maria";\nint age = 19;\nfinal double PI = 3.14159;\nage += 1;\nSystem.out.println(name + " " + age + " " + PI);',
    ),
    'Maria 20 3.14159',
    'Declare name, age, course, year level, and a final school name. Print them and update year level. Explain the lifetime of a local variable.',
    'Reading a local variable before assignment or reassigning final.',
    'Which keyword prevents reassignment?',
    'final',
    ['constant', 'mutable', 'fixed'],
    'What happens after final int year = 1; year = 2;?',
    'Compilation fails',
    ['year becomes 2', 'year becomes 0', 'Only a warning appears'],
);
add(
    'Data Types',
    'byte, short, int, long, float, double, char, boolean, String, widening, casts',
    'Primitive types hold numeric, character, or boolean values: byte, short, int, long, float, double, char, boolean. String is a reference type. Use L for a long literal and f for a float literal. Widening conversions such as int to long are implicit; explicit narrowing casts may lose range or precision. char uses single quotes and String uses double quotes. Integer division truncates toward zero. Convert an operand to double before division when a fractional result is needed.',
    main(
        'byte year = 1; short students = 120; int age = 19; long id = 100001L;\nfloat score = 95.5f; double average = 90.25; char section = \'A\'; boolean passed = true;\nString name = "Juan";\nSystem.out.println(name + " " + year + " " + students + " " + age + " " + id);\nSystem.out.println(score + " " + average + " " + section + " " + passed);\nSystem.out.println((double) 5 / 2);',
    ),
    'Juan 1 120 19 100001\n95.5 90.25 A true\n2.5',
    'Declare and display all eight primitive types and a String. Compare 5 / 2 with (double) 5 / 2. Demonstrate a narrowing cast and explain what is lost.',
    'Using double quotes for char or omitting f on a float literal.',
    'Which listed type is a reference type?',
    'String',
    ['int', 'boolean', 'char'],
    'What is the value of (int) 9.8?',
    '9',
    ['10', '9.8', 'A String'],
);
add(
    'Input and Output',
    'System.out.print, println, printf, Scanner, next, nextLine, nextInt, nextDouble',
    'print writes without a newline, println adds one, and printf formats values. Scanner reads tokens or complete lines. nextInt and nextDouble leave the following newline; consume it with nextLine before reading the next text line, or read complete lines and parse numbers. next reads one token, while nextLine can read Maria Santos. Validate missing or invalid input. In this lab, Program Input is supplied before Run and reaches EOF when consumed.',
    main(
        'try (Scanner input = new Scanner(System.in)) {\n    String name = input.nextLine();\n    int age = input.nextInt();\n    double grade = input.nextDouble();\n    System.out.printf(Locale.ROOT, "Student: %s%nAge: %d%nGrade: %.2f%n", name, age, grade);\n}',
        'import java.util.Scanner;\nimport java.util.Locale;',
    ),
    'Student: Maria Santos\nAge: 19\nGrade: 95.50',
    'Read student name, age, course, and year level. Preserve names containing spaces. Print labeled values. Test blank names, missing input, and a non-numeric age.',
    'Using next for a full name or forgetting the newline after nextInt.',
    'Which method reads a complete text line?',
    'nextLine()',
    ['nextInt()', 'next()', 'println()'],
    'After nextInt(), which action prepares for the following full text line?',
    'Consume the remaining newline with nextLine()',
    [
        'Close Scanner immediately',
        'Cast Scanner to String',
        'Use == to compare the name',
    ],
    'Maria Santos\n19\n95.5\n',
);
add(
    'Operators',
    'Arithmetic, assignment, comparison, logical, increment, decrement, precedence',
    'Arithmetic operators are +, -, *, /, %. Compound assignment includes +=, -=, *=, /=, %=. Comparisons produce boolean values using ==, !=, >, <, >=, <=. && and || short circuit; ! negates a boolean. ++ and -- change a numeric variable by one. Multiplication and division bind before addition; parentheses state intent. Validate a divisor before division or remainder; integer division by zero throws an exception.',
    main(
        'int a = 12, b = 5;\nSystem.out.println(a + b);\nSystem.out.println(a - b);\nSystem.out.println(a * b);\nif (b != 0) { System.out.println((double) a / b); System.out.println(a % b); }\nSystem.out.println(a > b && b > 0);',
    ),
    '17\n7\n60\n2.4\n2\ntrue',
    'Build a calculator using Scanner. Accept two numbers and an operation. Support addition, subtraction, multiplication, division, and remainder; reject a zero divisor and unknown operators.',
    'Confusing = with == or performing division before validating zero.',
    'What does the % operator calculate?',
    'Remainder',
    ['Percentage automatically', 'Exponentiation', 'String comparison'],
    'What does 2 + 3 * 4 evaluate to?',
    '14',
    ['20', '24', '9'],
);
add(
    'Conditional Statements',
    'if, else if, else, switch, nested conditions, logical expressions, ternary',
    'if chooses a branch based on a boolean expression. An else-if chain should test grade bands from highest to lowest after rejecting values outside 0–100. A traditional switch selects a matching case; break prevents accidental fall-through. Combine conditions with && or || and use braces for clarity. A ternary condition ? first : second suits short value selection, not a complex workflow.',
    main(
        'int grade = 87;\nif (grade < 0 || grade > 100) System.out.println("Invalid grade");\nelse if (grade >= 90) System.out.println("Excellent");\nelse if (grade >= 85) System.out.println("Very Good");\nelse if (grade >= 80) System.out.println("Good");\nelse if (grade >= 75) System.out.println("Passed");\nelse System.out.println("Failed");',
    ),
    'Very Good',
    'Read a grade. Classify 90–100 Excellent, 85–89 Very Good, 80–84 Good, 75–79 Passed, and below 75 Failed. Reject values outside 0–100. Test every boundary and include a switch-based menu.',
    'Testing grade >= 75 before the higher bands, making later branches unreachable.',
    'Why validate the range before classifying a grade?',
    'To reject impossible values before assigning a category',
    [
        'To change every grade to 100',
        'To remove the need for conditions',
        'To make Scanner read faster',
    ],
    'What happens without break in a traditional switch case?',
    'Execution may fall through into the next case',
    [
        'The program always exits',
        'The source cannot compile',
        'The switch automatically repeats',
    ],
);
add(
    'Loops',
    'for, while, do while, break, continue, counters, accumulators, nested loops',
    'for suits a counted repetition, while checks a condition before each iteration, and do-while executes once before checking. Update loop control to avoid infinite loops. break exits the nearest loop; continue skips the rest of the current iteration. An accumulator begins with an appropriate initial value, such as zero for a sum. Nested loops can generate tables or patterns. Enhanced for reads each array element without an explicit index.',
    main(
        'int sum = 0;\nfor (int i = 1; i <= 10; i++) { sum += i; }\nSystem.out.println(sum);\nint count = 3;\nwhile (count > 0) { System.out.println(count); count--; }',
    ),
    '55\n3\n2\n1',
    'Display 1–10, generate a multiplication table, sum several inputs, and print a small pattern using nested loops. Demonstrate break and continue and explain why each loop terminates.',
    'Forgetting to change the condition or adding an accidental semicolon after a loop.',
    'Which loop executes its body at least once?',
    'do-while',
    ['while', 'for with a false condition', 'An if statement'],
    'What does continue do inside a loop?',
    'Skips the remaining statements of the current iteration',
    [
        'Exits every method',
        'Always exits the loop permanently',
        'Resets the counter to zero',
    ],
);
add(
    'Arrays',
    'Declarations, creation, initialization, index, length, enhanced for, multidimensional arrays',
    'An array has a fixed length and one element type. Indices run from zero through length - 1; arr.length is a field rather than a method. Read or update elements with arr[index]. Enhanced for reads values; assigning its loop variable does not replace array elements. A two-dimensional array is an array of arrays and rows can have different lengths. Validate indices and avoid dividing by the length of an empty array.',
    main(
        'double[] grades = {90, 80, 100};\ndouble total = 0, highest = grades[0], lowest = grades[0];\nfor (double grade : grades) { total += grade; highest = Math.max(highest, grade); lowest = Math.min(lowest, grade); }\nSystem.out.println(total + " " + total / grades.length + " " + highest + " " + lowest);',
    ),
    '270.0 90.0 100.0 80.0',
    'Read at least three grades into an array and compute total, average, highest, and lowest. Validate grade range and array size. Display a small two-dimensional grade table.',
    'Using <= grades.length as a valid index bound.',
    'What is the last valid index of an array with length 5?',
    '4',
    ['5', '6', '-1'],
    'Why initialize highest from grades[0] after checking nonempty?',
    'It begins with an actual member of the data',
    [
        'It changes array length',
        'It converts the array to String',
        'It avoids all iteration',
    ],
);
add(
    'Methods',
    'Declaration, invocation, static, parameters, arguments, return, void, scope, overloading',
    'A method groups a named operation. Parameters declare inputs; arguments supply values when calling it. A non-void method returns a value of its declared type; void methods perform actions without a returned value. static methods belong to the class and can be called from static main without constructing an object. Local variables remain within their scope. Overloads have the same name but different parameter lists, not merely different return types. Java passes arguments by value, including copied object references.',
    main(
        'double[] grades = {90, 80, 100};\ndouble result = average(grades);\nSystem.out.println(result);\nSystem.out.println(passed(result));',
        '',
        '    static double average(double[] grades) {\n        if (grades.length == 0) throw new IllegalArgumentException("No grades");\n        double total = 0;\n        for (double grade : grades) total += grade;\n        return total / grades.length;\n    }\n    static boolean passed(double average) { return average >= 75; }',
    ),
    '90.0\ntrue',
    'Create methods for average, highest grade, pass/fail, and displaying results. Call them from main. Reject empty arrays and demonstrate one useful overload.',
    'Calling an instance method directly from static main or omitting a return.',
    'What distinguishes overloaded methods?',
    'Different parameter lists',
    [
        'Only different return types',
        'Only different comments',
        'Only different local variable names',
    ],
    'What does void mean in a method declaration?',
    'The method returns no value',
    [
        'The method has no parameters',
        'The method cannot be called',
        'The method always throws',
    ],
);
add(
    'Beginner Project — Student Grade Calculator',
    'Scanner, arrays, methods, loops, conditions, validation, formatted output',
    'Build a console calculator that reads a student name and five grades, stores them in an array, and displays total, average, highest, lowest, and pass/fail. Separate reading, validation, calculation, and presentation into methods. Pass means an average of at least 75. The example is a complete baseline; extend it with your own clearly labeled output and retry behavior.',
    gradeProject,
    'Student: Maria Santos\nTotal: 450.00\nAverage: 90.00\nHighest: 100.00\nLowest: 80.00\nStatus: PASSED',
    'Required: student name; several grades in an array; total/average/highest/lowest; pass/fail; formatted results; methods, loops, conditions. Milestones: sketch input/output, write validation, implement calculations, connect main, test. Test: names with spaces, all 75, all 0, all 100, mixed grades, negative/101/non-numeric/missing grades. Submit saved Main.java and sample input; explain your calculations and include test results.',
    'Accepting invalid grades or calculating the average using integer division.',
    'How should the grade calculator separate responsibilities?',
    'Use methods for input, validation, calculations, and output',
    [
        'Put all rules into comments',
        'Store every numeric grade as an unchecked String',
        'Hard-code every result',
    ],
    'An average is 74.99 and the passing threshold is 75. What status applies?',
    'FAILED',
    ['PASSED', 'Excellent', 'Always round to passed'],
    'Maria Santos\n90\n85\n95\n80\n100\n',
);
add(
    'Strings and String Methods',
    'Immutability, length, charAt, substring, equals, trim, case conversion, searching',
    'String is immutable: methods such as trim and toUpperCase return a new String. Compare text values with equals or equalsIgnoreCase; == compares reference identity. length reports character count, charAt reads an index, and substring uses a start-inclusive/end-exclusive interval. contains, startsWith, endsWith, and indexOf search text. Check indices and null before calling methods. Case conversion for predictable lab output uses Locale.ROOT.',
    main(
        'String name = "  Maria Santos  ".trim();\nSystem.out.println(name);\nSystem.out.println(name.toUpperCase(Locale.ROOT));\nSystem.out.println(name.substring(0, 5));\nSystem.out.println(name.equals("Maria Santos"));\nSystem.out.println(name.contains("Santos"));',
        'import java.util.Locale;',
    ),
    'Maria Santos\nMARIA SANTOS\nMaria\ntrue\ntrue',
    'Build a name utility that trims input, validates nonempty names, reports length/initial, searches a surname, and compares names with equalsIgnoreCase. Demonstrate all listed search methods and guarded substring.',
    'Using == for String value comparison or expecting trim to mutate the original.',
    'How should two non-null String values be compared?',
    'equals()',
    ['== always', 'Assignment with =', 'comparePointers()'],
    'After String s = " hi "; s.trim(); what remains in s?',
    'The original text including spaces',
    ['hi without spaces', 'null', 'An empty String'],
);
add(
    'ArrayList',
    'Dynamic size, add, remove, get, set, size, contains, clear, enhanced for',
    'ArrayList grows dynamically and stores reference values; primitive grades use boxed Double. Access elements by a checked index using get and set. size() returns its current count. add appends; remove may remove an index or an object depending on the overload. Avoid structural modification during enhanced for unless using an iterator appropriately. Check an empty list before averaging.',
    main(
        'ArrayList<Double> grades = new ArrayList<>();\ngrades.add(80.0); grades.add(90.0); grades.add(100.0);\ngrades.remove(0);\ngrades.set(0, 95.0);\ndouble total = 0;\nfor (double grade : grades) total += grade;\nSystem.out.println(grades);\nSystem.out.println(total / grades.size());',
        'import java.util.ArrayList;',
    ),
    '[95.0, 100.0]\n97.5',
    'Create a menu to add, remove, show, and average grades using ArrayList<Double>. Check ranges, invalid indices, and empty lists. Demonstrate contains and clear.',
    'Confusing size() with array length or removing from a list while enhanced-for iterating.',
    'Which method appends an item to ArrayList?',
    'add()',
    ['pushBack()', 'length()', 'put()'],
    'For ArrayList<Integer> values, what does values.remove(0) remove?',
    'The element at index 0',
    [
        'All zero values',
        'The last element',
        'Nothing because integers are primitive',
    ],
);
add(
    'Classes and Objects',
    'Class, object, fields, instance methods, new, state, behavior',
    'A class describes a type with fields and behavior. new creates an object with its own instance state. Two objects made from one class can store different values. Instance methods operate on a particular object, while static members belong to the class. This lab allows helper classes in Main.java provided only Main is public; nested static classes are also convenient.',
    main(
        'Student maria = new Student(); maria.name = "Maria"; maria.average = 91;\nStudent juan = new Student(); juan.name = "Juan"; juan.average = 82;\nmaria.displayInfo(); juan.displayInfo();',
        '',
        '    static class Student {\n        String name; double average;\n        void displayInfo() { System.out.println(name + " " + average); }\n    }',
    ),
    'Maria 91.0\nJuan 82.0',
    'Create a Student class with fields and a displayInfo method. Construct three distinct objects and demonstrate that changing one does not change the others.',
    'Treating a class declaration as an already-created object.',
    'What does new Student() create?',
    'A Student object',
    ['A package import', 'A primitive number', 'A class comment'],
    'Why do two new Student() instances hold independent names?',
    'Each instance has its own instance fields',
    [
        'All names are static automatically',
        'Java copies the whole source file',
        'The JVM ignores names',
    ],
);
add(
    'Constructors and Encapsulation',
    'Constructors, overloads, this, private fields, getters, setters, validation',
    'A constructor has the class name and no return type. If no constructor is declared, the compiler supplies a default no-argument constructor; declaring one changes that rule. Constructor overloads can delegate through this(...). Encapsulation makes fields private and exposes controlled methods. Validate inside setters and constructors to preserve invariants. this distinguishes an instance field from a parameter with the same name.',
    main(
        'Student student = new Student("Maria", 91);\nstudent.setGrade(95);\nSystem.out.println(student.getName() + " " + student.getGrade());',
        '',
        '    static class Student {\n        private final String name; private double grade;\n        Student() { this("Unnamed", 0); }\n        Student(String name, double grade) {\n            if (name == null || name.trim().isEmpty()) throw new IllegalArgumentException("Name required");\n            this.name = name.trim(); setGrade(grade);\n        }\n        String getName() { return name; }\n        double getGrade() { return grade; }\n        void setGrade(double grade) {\n            if (!Double.isFinite(grade) || grade < 0 || grade > 100) throw new IllegalArgumentException("Grade 0–100 required");\n            this.grade = grade;\n        }\n    }',
    ),
    'Maria 95.0',
    'Build an encapsulated Student with validated name and grade, getters, setters, and two constructors. Test rejected blank names, NaN, and out-of-range grades without modifying valid state.',
    'Giving a constructor a return type or exposing fields publicly while claiming encapsulation.',
    'What visibility commonly protects encapsulated fields?',
    'private',
    ['global', 'unrestricted', 'export'],
    'If a class declares only Student(String name), is new Student() automatically valid?',
    'No; declare a no-argument constructor if needed',
    [
        'Yes for every class',
        'Only when name equals Main',
        'Yes because String is immutable',
    ],
);
add(
    'Inheritance',
    'extends, superclass, subclass, overriding, super, protected',
    'Inheritance models an is-a relationship. A subclass extends one superclass and may override accessible methods. super(...) calls a parent constructor before subclass initialization; super.method() invokes parent behavior. Prefer private state with controlled access; protected permits subclass and package access and should be used intentionally. Constructors are not inherited. Use composition when the relationship is has-a instead.',
    main(
        'new Student("Maria").describe();\nnew Teacher("Ana").describe();',
        '',
        '    static class Person {\n        private final String name; Person(String name) { this.name = name; }\n        String getName() { return name; }\n        void describe() { System.out.println("Person: " + name); }\n    }\n    static class Student extends Person {\n        Student(String name) { super(name); }\n        @Override void describe() { System.out.println("Student: " + getName()); }\n    }\n    static class Teacher extends Person {\n        Teacher(String name) { super(name); }\n        @Override void describe() { System.out.println("Teacher: " + getName()); }\n    }',
    ),
    'Student: Maria\nTeacher: Ana',
    'Create Person, Student, and Teacher. Validate parent name input, call parent constructors, override descriptions, and explain an is-a relationship and one has-a alternative.',
    'Trying to access a private parent field directly or confusing overloading with overriding.',
    'Which keyword declares a subclass?',
    'extends',
    ['inheritsFrom', 'parent', 'implementsClass'],
    'Where must an explicit super(...) constructor call appear?',
    'As the first statement in the subclass constructor',
    ['After all other statements', 'Only inside main', 'Inside an import'],
);
add(
    'Polymorphism and Abstraction',
    'Parent references, overriding, abstract class, abstract method, interface basics',
    'A parent-type reference can refer to a subclass object. Overridden instance methods are selected using the actual object at runtime. An abstract class cannot be instantiated and may contain abstract and concrete methods. A concrete subclass must implement inherited abstract methods. Interfaces express capabilities without requiring one shared superclass. Polymorphism allows callers to use a common contract.',
    main(
        'Person[] people = {new Student(), new Teacher()};\nfor (Person person : people) System.out.println(person.role());',
        '',
        '    static abstract class Person { abstract String role(); }\n    static class Student extends Person { @Override String role() { return "Student"; } }\n    static class Teacher extends Person { @Override String role() { return "Teacher"; } }',
    ),
    'Student\nTeacher',
    'Create an abstract Person or Employee and two subclasses. Store instances in a parent-type array, invoke overridden behavior, and add a simple capability interface.',
    'Trying to instantiate an abstract class or leaving an abstract method unimplemented.',
    'What determines the overridden instance method invoked at runtime?',
    'The actual object type',
    ['Only the variable name', 'Only the comment', 'The order of imports'],
    'Can new Person() instantiate an abstract Person class?',
    'No',
    [
        'Yes if there are no arguments',
        'Yes inside main only',
        'Yes if stored in Object',
    ],
);
add(
    'Exception Handling',
    'try, catch, finally, throw, throws, checked vs unchecked, input validation',
    'Exceptions report failure without treating an invalid result as a valid value. try surrounds risky operations, catch handles a suitable exception, and finally runs cleanup even when control leaves the block. throw creates a failure; throws declares possible checked exceptions. Checked exceptions generally require handling or declaration, while RuntimeException subclasses are unchecked. Catch specific exceptions first. Scanner may throw InputMismatchException; parsing text may throw NumberFormatException. Do not hide unexpected exceptions with empty catch blocks.',
    main(
        'try {\n    int grade = Integer.parseInt("ninety");\n    System.out.println(grade);\n} catch (NumberFormatException error) {\n    System.out.println("Enter a numeric grade.");\n} finally {\n    System.out.println("Attempt finished.");\n}',
    ),
    'Enter a numeric grade.\nAttempt finished.',
    'Improve a calculator or grade reader to recover from invalid input. Handle NumberFormatException and InputMismatchException where used. Reject non-finite grades. Test retry behavior and distinguish checked IOException from unchecked validation errors.',
    'Catching broad exceptions before specific ones or continuing with invalid state.',
    'Which exception commonly results from Integer.parseInt("abc")?',
    'NumberFormatException',
    ['IOException', 'SQLException', 'ClassNotFoundException'],
    'What is the purpose of throws IOException on a method?',
    'Declare a checked exception that callers must handle or declare',
    [
        'Automatically retry file access',
        'Suppress every exception',
        'Create a catch block automatically',
    ],
);
add(
    'File Handling',
    'File, FileWriter, FileReader, BufferedReader, BufferedWriter, Scanner, append, resources',
    'File represents a path; readers and writers perform access. Wrap FileReader/FileWriter with BufferedReader/BufferedWriter for text operations, or use Scanner to read a file. try-with-resources closes resources automatically. Use FileWriter(path, true) to append, and account for IOException. In CodeLab only a disposable sandbox workspace is permitted: files survive during this Run, not into another Run or the Laravel application. Validate a record completely before replacing current state.',
    main(
        'try (BufferedWriter writer = new BufferedWriter(new FileWriter("students.txt"))) { writer.write("S1,Maria,90"); writer.newLine(); }\ntry (BufferedReader reader = new BufferedReader(new FileReader("students.txt"))) {\n    String line; while ((line = reader.readLine()) != null) System.out.println(line);\n}',
        'import java.io.*;',
    ),
    'S1,Maria,90',
    'Save several student records to a sandbox text file, read them back within the same Run, and demonstrate append. Handle missing/corrupt files. Reject path traversal; do not attempt to read application files. Explain the temporary-file lifetime.',
    'Assuming a file persists between separate Runs or forgetting to close a writer.',
    'Which construct automatically closes an AutoCloseable reader?',
    'try-with-resources',
    ['A comment', 'String.equals()', 'System.out.print()'],
    'What does new FileWriter("records.txt", true) request?',
    'Append mode',
    [
        'Delete the file only',
        'Read-only access',
        'Access to the production server',
    ],
);
add(
    'Collections and Generics Basics',
    'List, Set, Map, ArrayList, HashSet, HashMap, generic types, forEach',
    'List preserves positional elements and can contain duplicates. Set models uniqueness. Map associates a unique key with a value; inserting an existing key replaces its value, so reject duplicate student IDs explicitly when required. Generic syntax such as Map<String, String> catches incompatible types at compile time. HashMap and HashSet do not guarantee iteration order. Use sorted views when deterministic output matters.',
    main(
        'Map<String, String> students = new HashMap<>();\nstudents.put("S1", "Maria"); students.put("S2", "Juan");\nSet<String> courses = new HashSet<>(); courses.add("BSCS"); courses.add("BSCS");\nSystem.out.println(students.get("S1"));\nSystem.out.println(courses.size());',
        'import java.util.*;',
    ),
    'Maria\n1',
    'Map student IDs to names with HashMap. Reject duplicate IDs and support lookup/removal. Use Set for unique courses and List for ordered grades. Explain the chosen collection for each requirement.',
    'Assuming HashMap prints in insertion order or assuming put rejects duplicate keys.',
    'Which collection models unique values?',
    'Set',
    ['List always', 'StringBuilder', 'Scanner'],
    'What happens when Map.put receives an existing key?',
    'The associated value is replaced',
    [
        'Compilation always fails',
        'A second identical key is stored',
        'The map automatically becomes a Set',
    ],
);
add(
    'Intermediate Project — Student Record Management System',
    'Encapsulated Student, ArrayList, CRUD, menu, averages, files, exceptions',
    'Build a menu-driven Student record manager. A validated Student class stores ID, name, and grades; ArrayList stores records. Separate add/view/search/update/delete, average calculation, and file save/load methods. The example encodes names safely and loads into a temporary list before replacing records, preventing partial overwrite after malformed input. Files remain in the current disposable Run.',
    recordsProject,
    'Added S1\nS1 Maria Santos average=90.00\nSaved\nLoaded\nS1 Maria Santos average=90.00',
    'Required: add/view/search/update/delete, multiple grades and average, menu, validated input, exceptions, save/load. Milestones: Student model, ArrayList repository, CRUD menu, robust file format, transactional load, tests. Test duplicate IDs, missing IDs, malformed grades, names with spaces, corrupt files, save/load round trip, update/delete. Submit Main.java, menu input, test evidence, and a brief design explanation.',
    'Replacing all records before validating the entire file or accepting duplicate IDs.',
    'What makes loading a file safer?',
    'Validate into a temporary list before replacing current records',
    [
        'Clear existing records before parsing',
        'Ignore every parsing failure',
        'Use student input as a server path',
    ],
    'Which collection is specifically required by this project?',
    'ArrayList',
    [
        'Only one fixed integer',
        'The production users table',
        'An unrestricted remote database',
    ],
    '1\nS1\nMaria Santos\n90,80,100\n2\n6\n7\n2\n8\n',
);
add(
    'Advanced Object-Oriented Programming',
    'Composition, aggregation, encapsulation, inheritance, cohesion, coupling',
    'Cohesion means responsibilities within a class belong together. Coupling describes dependency between classes. Composition models ownership of a collaborating object; aggregation describes a relationship where parts can exist independently. Favor composition when behavior can be delegated without claiming an is-a relationship. Keep validation close to the model and pass dependencies through constructors so services can be tested with alternative repositories.',
    main(
        'Student student = new Student("Maria", new GradeBook(new double[]{90, 80}));\nSystem.out.println(student.name + " " + student.book.average());',
        '',
        '    static class GradeBook {\n        private final double[] grades;\n        GradeBook(double[] grades) { this.grades = grades.clone(); }\n        double average() { double sum = 0; for (double g : grades) sum += g; return grades.length == 0 ? 0 : sum / grades.length; }\n    }\n    static class Student {\n        final String name; final GradeBook book;\n        Student(String name, GradeBook book) { this.name = name; this.book = book; }\n    }',
    ),
    'Maria 85.0',
    'Refactor a Student manager into a validated model, repository, service, and console UI. Use composition for a GradeBook and explain one appropriate inheritance relationship. Prevent mutable arrays from escaping your model.',
    'Creating inheritance merely to reuse a few lines or exposing mutable internal arrays.',
    'A Student has a GradeBook. Which relationship fits?',
    'Composition',
    [
        'Student extends GradeBook automatically',
        'A primitive cast',
        'A SQL join only',
    ],
    'What improves cohesion in a record manager?',
    'Group record persistence in a repository',
    [
        'Mix printing, SQL, and parsing into every setter',
        'Duplicate every validation rule',
        'Expose all fields globally',
    ],
);
add(
    'Interfaces and Abstract Classes',
    'interface, implements, default methods, abstract methods, concrete methods, constructors',
    'An interface defines a contract and can include default methods. A class can implement multiple interfaces but extend only one class. Interface methods implemented by a concrete class must be public. An abstract class can store instance state, define constructors and concrete methods, and leave selected methods abstract. Choose a capability interface for independent implementations; choose an abstract class when shared state and a coherent hierarchy are needed.',
    main(
        'Printable[] reports = {new StudentReport("Maria"), new StudentReport("Juan")};\nfor (Printable report : reports) report.print();',
        '',
        '    interface Printable { String text(); default void print() { System.out.println(text()); } }\n    static abstract class Report { final String name; Report(String name) { this.name = name; } abstract String heading(); }\n    static class StudentReport extends Report implements Printable {\n        StudentReport(String name) { super(name); }\n        @Override String heading() { return "Student"; }\n        @Override public String text() { return heading() + ": " + name; }\n    }',
    ),
    'Student: Maria\nStudent: Juan',
    'Create Printable or Payable and implement it in two unrelated classes. Add an abstract base where shared state is appropriate. Demonstrate a default method and explain the difference between interface and abstract class.',
    'Implementing an interface method with weaker visibility or expecting interface instance fields.',
    'Can a Java class implement multiple interfaces?',
    'Yes',
    [
        'No, only one interface',
        'Only if it has no constructor',
        'Only primitive classes',
    ],
    'Which choice can directly declare a constructor and instance fields?',
    'An abstract class',
    ['An interface constructor', 'An import statement', 'A wildcard'],
);
add(
    'Advanced Collections Framework',
    'LinkedList, TreeSet, TreeMap, Queue, Deque, Iterator, Comparable, Comparator, sorting',
    'Choose collections by required operations, not just familiarity. TreeSet and TreeMap maintain sorted order; LinkedList implements List and Deque; ArrayDeque commonly serves a queue or stack. Iterator supports controlled traversal and removal. Comparable defines a natural ordering; Comparator supplies alternative orders such as student name or grade. Collections.sort sorts a list; tie-breakers make ordering predictable. A comparison returning zero can cause a sorted set to treat distinct items as equivalent.',
    main(
        'List<Student> students = new ArrayList<>(List.of(new Student("S2", "Juan", 80), new Student("S1", "Maria", 95)));\nCollections.sort(students, Comparator.comparingDouble((Student s) -> s.grade).reversed().thenComparing(s -> s.id));\nfor (Student s : students) System.out.println(s.id + " " + s.name);\nQueue<String> queue = new ArrayDeque<>(); queue.add("First"); queue.add("Second");\nSystem.out.println(queue.remove());',
        'import java.util.*;',
        '    static class Student { final String id, name; final double grade; Student(String id, String name, double grade) { this.id=id; this.name=name; this.grade=grade; } }',
    ),
    'S1 Maria\nS2 Juan\nFirst',
    'Sort student records by name, grade, and ID with Comparator; define a natural ID ordering with Comparable. Demonstrate a Queue, Deque, TreeSet, TreeMap, and safe iterator removal. Explain order and uniqueness.',
    'Writing a Comparator that violates its contract or assuming every collection has the same ordering.',
    'Which type supplies an alternative sorting order?',
    'Comparator',
    ['Scanner', 'FileReader', 'SQLException'],
    'Why add an ID tie-breaker when comparing grades in a TreeSet?',
    'To avoid treating distinct students with equal grades as the same element',
    [
        'To permit duplicate IDs automatically',
        'To disable sorting',
        'To change the grade value',
    ],
);
add(
    'Generics',
    'Generic classes, methods, type parameters, bounds, wildcards, type safety',
    'Generics allow reusable types checked at compile time. A class may declare <T> and a method may declare its own type parameter before the return type. Bounds such as <T extends Number> restrict accepted types. Multiple parameters support key-value containers. A List<? extends Number> can be read as Number but cannot accept arbitrary Numbers; List<? super Integer> can accept Integers. Avoid raw types and unchecked casts that discard guarantees.',
    main(
        'Box<String> name = new Box<>("Maria");\nBox<Integer> age = new Box<>(19);\nSystem.out.println(name.get() + " " + age.get());\nSystem.out.println(sum(List.of(90, 80)));',
        'import java.util.*;',
        '    static class Box<T> { private final T value; Box(T value) { this.value=value; } T get() { return value; } }\n    static double sum(List<? extends Number> numbers) { double sum=0; for (Number n : numbers) sum += n.doubleValue(); return sum; }',
    ),
    'Maria 19\n170.0',
    'Create a generic Box<T> and a reusable generic method. Add a bounded numeric operation and a two-parameter Pair<K,V>. Explain a wildcard read/write restriction and remove raw-type warnings.',
    'Using primitive type arguments such as Box<int> or bypassing checks with raw collections.',
    'Which valid type argument represents integers in a generic Box?',
    'Integer',
    ['int', 'number', 'primitive'],
    'Can arbitrary Number objects be added to List<? extends Number>?',
    'No; its specific element subtype is unknown',
    [
        'Yes without any restriction',
        'Only when the list is sorted',
        'Yes if Number is cast to String',
    ],
);
add(
    'Lambda Expressions and Streams',
    'Functional interfaces, Predicate, Consumer, Function, filter, map, sorted, collect, count',
    'A lambda implements a functional interface with one abstract method. Predicate tests a value, Consumer performs an action, and Function transforms a value. A stream pipeline processes a source through intermediate operations such as filter, map, and sorted, then a terminal operation such as collect or count. Intermediate operations are lazy. Streams are single-use and do not replace the source collection. Keep transformations free of unwanted shared-state side effects.',
    main(
        'List<Integer> grades = List.of(60, 90, 80, 70);\nList<Integer> passing = grades.stream().filter(g -> g >= 75).sorted().collect(Collectors.toList());\nSystem.out.println(passing);\nSystem.out.println(grades.stream().filter(g -> g >= 75).count());\nList<String> names = List.of("Maria", "Juan");\nSystem.out.println(names.stream().map(String::toUpperCase).collect(Collectors.joining(", ")));',
        'import java.util.*;\nimport java.util.stream.Collectors;',
    ),
    '[80, 90]\n2\nMARIA, JUAN',
    'Filter passing students, sort by grade then name, transform names, and calculate a count or summary. Use one Predicate and one Consumer explicitly. Compare the pipeline to an ordinary loop and preserve the input collection.',
    'Reusing a consumed stream or expecting filter alone to perform terminal work.',
    'Which stream operation keeps only values satisfying a predicate?',
    'filter()',
    ['map()', 'closeFile()', 'put()'],
    'What happens if a stream is reused after a terminal operation?',
    'It can throw IllegalStateException',
    [
        'It always starts again',
        'It becomes an ArrayList automatically',
        'It writes to a database',
    ],
);
add(
    'Multithreading',
    'Thread, Runnable, start, sleep, join, shared state, race conditions, synchronized',
    'A process owns its address space; threads within it share memory. start schedules a new thread, while directly calling run performs the task on the current thread. join waits for completion; sleep pauses approximately and can be interrupted. Shared read-modify-write operations need synchronization. synchronized protects an invariant through a shared monitor. Limit worker counts and stop cooperatively; do not use deprecated Thread.stop. CodeLab must impose process/thread and CPU limits at the execution provider, independent of student code.',
    main(
        'Counter counter = new Counter();\nRunnable task = () -> { for (int i=0; i<100; i++) counter.increment(); };\nThread first = new Thread(task); Thread second = new Thread(task);\nfirst.start(); second.start(); first.join(); second.join();\nSystem.out.println(counter.value());',
        '',
        '    static class Counter {\n        private int count;\n        synchronized void increment() { count++; }\n        synchronized int value() { return count; }\n    }',
    ),
    '200',
    'Run two small Runnable tasks concurrently. Use join, demonstrate an unsafe counter, then protect it with synchronized and repeat tests. Handle InterruptedException. Use at most two student-created threads; explain why a successful test does not prove race freedom.',
    'Calling run instead of start, or updating shared counters without synchronization.',
    'Which method schedules a Thread to run concurrently?',
    'start()',
    ['run() directly', 'toString()', 'equals()'],
    'Why can count++ lose updates when used concurrently?',
    'Read, increment, and write are not one atomic operation',
    [
        'Integer values cannot be shared',
        'join always resets count',
        'Every thread has a different source file',
    ],
);
add(
    'Database Programming with JDBC',
    'Driver, Connection, PreparedStatement, ResultSet, CRUD, transactions, resources',
    'JDBC defines standard Java database interfaces; a driver implements them for a database. This lesson requires the sandbox to supply the H2 JDBC driver. jdbc:h2:mem:lesson creates a disposable in-memory educational database within the isolated JVM. Use PreparedStatement parameters for data, not String concatenation. try-with-resources closes Connection, PreparedStatement, and ResultSet. Transactions use setAutoCommit(false), commit, and rollback to protect related changes. This database has no production connection or production credentials.',
    main(
        'try (Connection db = DriverManager.getConnection("jdbc:h2:mem:lesson")) {\n    try (Statement schema = db.createStatement()) { schema.execute("CREATE TABLE students(id VARCHAR(20) PRIMARY KEY, name VARCHAR(100), grade DOUBLE)"); }\n    db.setAutoCommit(false);\n    try (PreparedStatement insert = db.prepareStatement("INSERT INTO students VALUES(?,?,?)")) {\n        insert.setString(1,"S1"); insert.setString(2,"Maria Santos"); insert.setDouble(3,90); insert.executeUpdate(); db.commit();\n    } catch (SQLException error) { db.rollback(); throw error; }\n    try (PreparedStatement query = db.prepareStatement("SELECT name, grade FROM students WHERE id=?")) {\n        query.setString(1,"S1");\n        try (ResultSet results = query.executeQuery()) { while(results.next()) System.out.println(results.getString("name") + " " + results.getDouble("grade")); }\n    }\n}',
        'import java.sql.*;',
    ),
    'Maria Santos 90.0',
    'Create sandbox tables and implement insert/select/update/delete with PreparedStatement and parameter binding. Add a transaction and deliberately roll back a failed change. Test duplicate IDs and an apostrophe in a name. Explain driver requirements and why production credentials are forbidden.',
    'Concatenating student input into SQL, leaking resources, or assuming an in-memory DB survives a later Run.',
    'Which API binds user data separately from SQL syntax?',
    'PreparedStatement',
    [
        'String concatenation',
        'System.getenv("DB_PASSWORD")',
        'An HTML form alone',
    ],
    'What does rollback do within an uncommitted JDBC transaction?',
    'Reverts changes in that transaction',
    [
        'Deletes the production database',
        'Commits every pending change',
        'Compiles Java source',
    ],
);
add(
    'JSON and APIs',
    'JSON objects, arrays, keys, parsing, serialization, REST, GET, status codes, errors',
    'JSON represents objects with string keys, arrays, strings, numbers, booleans, and null. Java 17 does not include a general JSON parser in its standard library; this example requires Gson on the sandbox classpath. Parse with a JSON library instead of splitting text or using regular expressions. The simulated response demonstrates GET /students and status 200 without any internet access. Handle non-success statuses, malformed JSON, and missing/type-mismatched fields. Do not put API keys in source code.',
    main(
        'int status = 200;\nString response = "{\\"students\\":[{\\"id\\":\\"S1\\",\\"name\\":\\"Maria Santos\\"}]}";\nif (status != 200) throw new IllegalStateException("API status " + status);\nJsonObject root = JsonParser.parseString(response).getAsJsonObject();\nfor (JsonElement entry : root.getAsJsonArray("students")) {\n    JsonObject student = entry.getAsJsonObject();\n    System.out.println(student.get("id").getAsString() + " " + student.get("name").getAsString());\n}\nSystem.out.println(new Gson().toJson(java.util.Map.of("count", 1)));',
        'import com.google.gson.*;',
    ),
    'S1 Maria Santos\n{"count":1}',
    'Process a simulated GET response with a students array. Check status, required fields, and value types; display selected values and serialize a summary. Test missing names, malformed JSON, 404, and 500. Explain GET/POST/PUT/DELETE and keep all API credentials outside student code.',
    'Treating every HTTP response as success or parsing general JSON with split or regex.',
    'Why use a JSON library rather than splitting on commas?',
    'JSON supports nested values and escaped delimiters',
    [
        'JSON never contains commas',
        'Splitting performs encryption',
        'A library grants unrestricted network access',
    ],
    'How should a client handle simulated status 404?',
    'Report the missing resource before parsing a success payload',
    [
        'Assume a successful response',
        'Expose an API key',
        'Retry forever without a limit',
    ],
);
add(
    'Application Architecture and Best Practices',
    'Packages, imports, MVC, layers, service, repository, validation, logging, configuration',
    'A package groups related types and its declaration precedes imports. In a multi-file application, package names map to source directories. Separate a model, repository, service, and UI/controller so validation and persistence do not depend on presentation. MVC separates state, presentation, and coordination; a console UI can use the same principles. Log useful diagnostic events without secrets. Put configuration outside source code. This lab uses one Main.java with nested types to demonstrate layers; production projects normally split these types into packages and use a build tool.',
    main(
        'Repository repository = new MemoryRepository();\nStudentService service = new StudentService(repository);\nservice.register("S1", "Maria");\nSystem.out.println(service.name("S1"));',
        'import java.util.*;',
        '    interface Repository { void save(String id, String name); String find(String id); }\n    static class MemoryRepository implements Repository {\n        private final Map<String,String> data = new HashMap<>();\n        public void save(String id, String name) { if(data.containsKey(id)) throw new IllegalArgumentException("Duplicate ID"); data.put(id,name); }\n        public String find(String id) { return data.get(id); }\n    }\n    static class StudentService {\n        private final Repository repository; StudentService(Repository repository) { this.repository=repository; }\n        void register(String id, String name) { if(id == null || id.isBlank() || name == null || name.isBlank()) throw new IllegalArgumentException("Required fields"); repository.save(id,name); }\n        String name(String id) { return repository.find(id); }\n    }',
    ),
    'Maria',
    'Refactor a Student app into model, repository, service, and console controller/UI. Sketch package declarations for a multi-file version while keeping the runnable lab in Main.java. Define error handling, safe logging, testable dependency injection, and configuration boundaries.',
    'Putting SQL and UI prompting inside model setters or logging passwords.',
    'Which layer should encapsulate persistence operations?',
    'Repository',
    [
        'Every println call',
        'Only the main menu label',
        'A hard-coded credential constant',
    ],
    'Why pass a Repository into a service constructor?',
    'To make the dependency explicit and allow alternative implementations',
    [
        'To disable validation',
        'To require production database access',
        'To make all fields static',
    ],
);
add(
    'Advanced Project — Java Student Information System',
    'OOP, interfaces, collections, generics, JDBC, PreparedStatement, architecture, reports',
    'Develop a console Student Information System with JDBC persistence inside the disposable sandbox. A Student model validates ID, name, and grades. A Repository interface separates JDBC operations, a service owns validation and reports, and a console controller handles input. Store student rows and individual grades in related tables with primary/foreign keys. Use parameter binding and transactions. Persistence lasts throughout the current Run; exporting production data or connecting to CodeLab MySQL is forbidden.',
    jdbcProject,
    'Added S1\nS1 Maria Santos average=90.00 PASSED\nS1 [90.0, 80.0, 100.0]\nStudents=1 Passing=1',
    'Required: registration/add/list/search/edit/delete; grades/average/academic status; JDBC persistence; input validation and exceptions; filtering/reports; organized model/repository/service/controller. Schema: students(id primary key,name), grades(student_id foreign key,position,grade). Milestones: model invariants, repository contract, schema/parameterized CRUD, transaction rollback, service reports, console menu, tests/documentation. Menu: 1 Add, 2 View, 3 Search, 4 Edit, 5 Delete, 6 Grades, 7 Reports, 8 Exit. Security: no credentials, no production DB, prepared statements, bounded input, no secret logging. Test duplicate/missing IDs, apostrophe names, multiple grades, invalid data, updates, cascading delete, rollback, empty reports. Submit Main.java, menu input, schema/design notes, and test evidence. Use inheritance/polymorphism only where meaningful; GUI is optional outside this console lab.',
    'Committing a partial student update, concatenating SQL, or mixing all layers in main.',
    'How should changing student details and grades be persisted?',
    'In one transaction using parameterized statements',
    [
        'As unrelated unchecked updates',
        'In the CodeLab production users table',
        'By exposing a database password',
    ],
    'How can one service use different repository implementations?',
    'Depend on a Repository interface',
    [
        'Require every class to be Main',
        'Hard-code SQL in every UI prompt',
        'Use a global mutable String',
    ],
    '1\nS1\nMaria Santos\n90,80,100\n2\n6\nS1\n7\n8\n',
);

function quiz(question, correct, wrong, explanation, rotation) {
    const choices = [correct, ...wrong];
    const rotated = choices.slice(rotation).concat(choices.slice(0, rotation));
    return {
        question,
        choices: rotated,
        answer: rotated.indexOf(correct),
        explanation,
    };
}
const rubric = {
    program_functionality: 30,
    java_concepts: 20,
    object_oriented_design: 15,
    data_management: 10,
    validation_and_error_handling: 10,
    code_organization: 10,
    testing_and_documentation: 5,
};
const contents = rows.map((row, index) => {
    const level = ['Beginner', 'Intermediate', 'Advanced'][
        Math.floor(index / 10)
    ];
    const project = index % 10 === 9;
    const questions = [
        quiz(row.question, row.correct, row.wrong, row.explanation, index % 4),
        quiz(
            'What does the provided example display with its sample input?',
            row.output,
            [
                'No output at all',
                'A compilation error before main runs',
                'The literal text Main.java',
            ],
            'Trace the example statements and the supplied input. ' +
                row.output,
            (index + 1) % 4,
        ),
        quiz(
            'Which mistake should you avoid in this lesson?',
            row.mistake,
            [
                'Validate data before changing state.',
                'Use clear names and test boundary cases.',
                'Keep application credentials out of code.',
            ],
            'The common error is: ' + row.mistake,
            (index + 2) % 4,
        ),
        quiz(
            row.scenario,
            row.scenarioCorrect,
            row.scenarioWrong,
            row.scenarioCorrect + '. ' + row.explanation,
            (index + 3) % 4,
        ),
        quiz(
            'Where may this lesson’s code access files and databases?',
            'Only the disposable educational sandbox workspace and database',
            [
                'The Laravel .env file',
                'The CodeLab production database',
                'Other students’ saved files',
            ],
            'Runs must be isolated from Laravel, credentials, and other students. Files and JDBC data are temporary.',
            index % 4,
        ),
    ];
    return {
        title: row.title,
        level,
        position: index + 1,
        objectives:
            index === 0
                ? [
                      'Explain what Java is and identify practical uses.',
                      'Differentiate JDK, JRE, and JVM at an introductory level.',
                      'Identify the class and main method in a Java program.',
                      'Create a Java program that displays student information.',
                  ]
                : [
                      `Identify the role of ${row.concepts.split(',').slice(0, 3).join(',')} in a Java program.`,
                      `Apply ${row.concepts.split(',')[0]} in a working console exercise.`,
                      `Debug ${row.mistake.charAt(0).toLowerCase() + row.mistake.slice(1)}`,
                  ],
        introduction: `${level} Java: ${row.title}. ${row.explanation.split('. ')[0]}.`,
        explanation: row.explanation + '\nKey concepts: ' + row.concepts,
        syntax: row.example,
        example_java: row.example,
        starter_java: main('// Write your solution here.'),
        guided_practice:
            '1. Read the example and predict its output.\n2. Copy it with Try Example and enter the sample input below.\n3. Run when the isolated service is connected; compare the result and explain each step.\n4. Change one value, predict the effect, and repeat.\n5. Introduce the listed common error, read the diagnostic, and fix it.\nSample input:\n' +
            (row.input || '(No input required.)') +
            '\nCode explanation: ' +
            row.explanation,
        activity: row.activity,
        expected_result: row.output,
        important_notes:
            'Common error: ' +
            row.mistake +
            '\nSummary: ' +
            row.concepts +
            '.\nNext lesson: ' +
            (rows[index + 1]?.title ??
                'Review Advanced Java Assessment and your completed project.'),
        debugging_tip:
            'Read the first compiler diagnostic or exception type and line number. Reproduce the smallest failing input, inspect the relevant value and invariant, then test the boundary again. ' +
            row.mistake,
        security_note:
            'Java must run only in an approved isolated service. Never use application files, secrets, production database credentials, shell commands, or unrestricted network. Enter all input before Run; files and JDBC data are disposable. Java 17; Main.java requires public class Main. JDBC needs H2 and JSON needs Gson supplied by the service.',
        challenge: project
            ? 'Document your architecture and extend your tests to cover failed changes without losing valid records.'
            : 'Extend the activity with one validated input and a boundary test; explain the result.',
        completion_requirements:
            'Save your source and sample input, submit the activity for teacher review, and pass at least 4 of the 5 Quick Check questions. Teacher approval unlocks the next lesson.',
        is_project: project,
        rubric: project ? rubric : null,
        quiz: questions,
        validation_rules: {
            java: { test_cases: [{ input: row.input, expected: row.output }] },
        },
    };
});
if (contents.length !== 30)
    throw new Error('Java must contain exactly 30 lessons');
writeFileSync(
    'database/data/java-course.json',
    JSON.stringify(contents, null, 2) + '\n',
);
console.log('Authored 30 Java lessons, 150 quick checks, and three projects.');
