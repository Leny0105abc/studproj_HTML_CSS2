import fs from "node:fs";

// Authored course source. Running this only writes this course's JSON, never the database.
const lessons = [
    [
        "Introduction to Programming, Algorithms, and Pseudocode",
        "Programming; languages; programming logic; problem solving; algorithms; algorithm characteristics; pseudocode; Input-Process-Output",
        "Programming means expressing a solution as instructions a computer can execute. An algorithm describes the solution independently of syntax: it takes specified inputs, performs unambiguous steps, and produces the required output. A useful beginner algorithm is finite, effective, and correct for its stated input domain. A language is the notation used to implement that algorithm; changing languages does not change the underlying task.\n\nStart with problem analysis. For a two-number sum, the inputs are two integers, processing is addition, and output is their total. Test the plan by substituting real values before writing source. Pseudocode is a readable structured description rather than a language the compiler accepts. Use INPUT, assignment, and OUTPUT consistently. For coffee, include checking supplies, heating water, adding coffee, pouring safely, and serving; omitted decisions can make even everyday instructions ambiguous.",
        "Add two signed integers without exceeding the 32-bit integer range.",
        "Two integers a and b, one per line.",
        "Add a and b once.",
        "The integer sum, followed by a newline.",
        [
            ["2\n3\n", "5\n"],
            ["-4\n4\n", "0\n"],
        ],
        [
            "Which property makes an algorithm understandable without guessing?|Unambiguous steps|A particular language|Long variable names|A graphical interface|Each step must have a definite interpretation.",
            "What does processing mean in IPO?|Transforming inputs into results|Only reading data|Only printing text|Installing a compiler|Addition is the transformation in this example.",
            "Which statement describes pseudocode?|A language-independent solution outline|Executable Python source|A machine-code instruction|A database record|Pseudocode communicates logic without requiring compiler syntax.",
            "Which is a complete problem-solving order?|Analyze, plan, implement, test|Implement, ignore output, finish|Test without requirements|Pick syntax before understanding inputs|A clear plan makes implementation and testing purposeful.",
        ],
    ],
    [
        "Introduction to Flowcharting",
        "Terminator; process; input/output; decision; flowlines; connectors; predefined process; construction rules; algorithms and flowcharts",
        "A flowchart is a graphical representation of an algorithm. A rounded terminator marks Start or End; a rectangle performs a process; a parallelogram reads or displays data; a diamond selects between labeled outcomes. Arrowheads show execution direction. A connector joins a continued path, and a rectangle with double vertical sides denotes a predefined process or function call.\n\nRead a chart from Start, following one arrow at a time. A decision needs distinguishable outcomes; a loop needs a condition and a return path. Avoid unexplained crossings and disconnected symbols. In the rectangle example, read width and height, multiply them, and display area. Replacing multiplication with addition leaves the chart connected but logically wrong. An average-of-three chart instead adds three values and divides by three; its process symbol must show that different computation.",
        "Calculate a rectangle area for nonnegative finite dimensions.",
        "Width and height as decimal values, one per line.",
        "Multiply width by height.",
        "Area in square units, printed with six decimal places.",
        [
            ["3\n4\n", "12.000000\n"],
            ["0\n5.5\n", "0.000000\n"],
        ],
        [
            "Which symbol reads width?|Parallelogram|Diamond|Terminator|Connector|Input and output use parallelograms.",
            "Which symbol computes area?|Rectangle|Diamond|Terminator|Circle|A calculation is a process.",
            "What must a decision show?|Labeled alternative outcomes|Only an unlabeled arrow|No outgoing path|A language keyword|True and false labels make paths unambiguous.",
            "What does a predefined process mean?|A separately defined routine|An arbitrary jump|A text comment|An input value|The double-sided process symbol refers to a routine.",
        ],
    ],
    [
        "Variables, Constants, and Data Types",
        "Naming; initialization; integer; floating point; double precision; character; string; Boolean; constants; assignment; type systems",
        "A variable names a value that can change during execution. Initialization gives it a first value before use; assignment replaces the current value. Integers represent whole counts, real numbers represent measurements, strings represent text, and Booleans represent true or false. A character is one textual unit: C++ and Java provide char, while Python normally represents a single character using a length-one string. Use descriptive names and avoid reserved words.\n\nA constant expresses a value that should remain fixed. Python uses an uppercase naming convention such as UNIT_PRICE; there is no dedicated const keyword enforcing it. C++ const and Java final prevent reassignment in their respective contexts. Python names are dynamically bound to objects; C++ and Java variables have declared types. Generated workspace variables have explicit conceptual types even in Python, so every language implements the same plan. In this worked example, the unit price is initialized once and then multiplied by an integer quantity.",
        "Compute a purchase cost at a fixed unit price of 12.50.",
        "An integer quantity from 0 to 10000.",
        "Initialize unit_price to 12.5 and multiply by quantity.",
        "Cost as a decimal with six places.",
        [
            ["4\n", "50.000000\n"],
            ["0\n", "0.000000\n"],
        ],
        [
            "How does Python normally indicate a constant?|An uppercase naming convention|A mandatory const keyword|A final type|A compiler-enforced uppercase rule|Uppercase is a convention and does not prevent reassignment.",
            "Which type suits a quantity?|Integer|Boolean|Character|Function|A count is naturally a whole number.",
            "What is initialization?|Giving a variable its first value|Deleting its name|Comparing two values|Printing a constant|Initialization must precede reading the variable.",
            "Which statement is accurate?|C++ and Java variables have declared types|Python requires char declarations|Java has no numeric types|C++ const is only a comment|Static declarations constrain assignments.",
        ],
    ],
    [
        "Input and Output Operations",
        "Prompts; integers; strings; decimal input; calculated results; basic validation; input and print; cin and cout; Scanner",
        "Input brings external data into a program; output communicates a result. A prompt explains what the user should enter. Python input returns text and numeric conversion must be explicit. C++ commonly uses cin extraction and cout insertion. Java Scanner offers nextInt and nextDouble, but mixing token reads with nextLine requires care because a newline can remain unread.\n\nThe workspace uses one value per line in every language, including names with spaces. Its small input helpers wrap Python input, C++ getline(cin, ...), and Java Scanner.nextLine; strict parsing rejects malformed integers and non-finite decimals. Generated helpers make the teaching examples equivalent, while the familiar direct forms remain input()/print(), cin/cout, and Scanner/System.out.println(). Distinguish a valid string such as Maria Santos from a numeric string that must first be parsed. Empty numeric input is an error; empty text is allowed unless the problem requires otherwise.",
        "Read a full name and age and display them on separate lines.",
        "An ASCII name line followed by a 32-bit integer age.",
        "Preserve the name and parse the age as an integer.",
        "The name and age on two output lines.",
        [
            ["Maria Santos\n18\n", "Maria Santos\n18\n"],
            ["Lee\n0\n", "Lee\n0\n"],
        ],
        [
            "What does Python input return?|A string|Always an integer|Always a Boolean|A flowchart|Numeric input needs conversion.",
            "Which C++ object receives standard input?|cin|cout|System.out|print|cin is the standard input stream.",
            "Which Java utility reads console input here?|Scanner|Vector|StringBuilder|Thread|Scanner wraps standard input.",
            "Why read a full line for a name?|Names can contain spaces|It automatically validates age|It converts text into a number|It removes the need for input|Token extraction alone can stop at the first space.",
        ],
    ],
    [
        "Operators and Expressions",
        "Arithmetic; assignment; relational; logical; increment/decrement; precedence; integer and decimal division; modulo; expressions",
        "An expression combines operands and operators to compute a value. Arithmetic operators include addition, subtraction, multiplication, division, and remainder. Assignment stores a result; equality compares values. Relational operators produce Booleans and logical AND/OR combine conditions. Parentheses state grouping explicitly and avoid relying on memorized precedence. C++ and Java support increment/decrement; Python uses assignments such as count += 1 instead of ++.\n\nDivision needs an explicit policy. Python / produces a real result; C++ and Java divide two integers using integer division. The workspace emits cl_div to obtain real division in all three languages. Native remainder for negative values also differs; cl_mod defines a nonnegative result using the absolute divisor. A zero divisor is an error. Use this same operator knowledge to compute sum, difference, product, or simple interest I = principal * rate * time, with a decimal rate such as 0.05.",
        "Calculate a real quotient and a nonnegative remainder.",
        "Integers a and b, where b is nonzero.",
        "Divide a by b and calculate a modulo abs(b).",
        "A six-place quotient followed by an integer remainder.",
        [
            ["7\n2\n", "3.500000\n1\n"],
            ["-7\n3\n", "-2.333333\n2\n"],
        ],
        [
            "Why does generated division use a helper?|To preserve real division across languages|To conceal a random answer|To skip input|To make every result an integer|The helper converts numeric operands to real division.",
            "What should happen for division by zero?|Report an error|Return an invented result|Always return zero|Silently skip output|The operation is undefined for this model.",
            "Which Python update increases x by one?|x += 1|x++|++x|x =+ x|Python has no increment operator.",
            "Which operator combines two Boolean requirements?|Logical AND|Assignment|Multiplication only|Modulo|AND is true only when both requirements are true.",
        ],
    ],
    [
        "Sequential Programming",
        "Sequence; execution order; IPO; assignment; arithmetic; rectangle/triangle area; average; temperature; salary",
        "A sequential program executes statements in order without making a choice or repeating a block. Each step can depend on values computed earlier. In a temperature converter, input must be read before the conversion expression is evaluated and the result must be calculated before display. A sequential flowchart has one forward path through its symbols.\n\nConvert Celsius to Fahrenheit using F = C * 9 / 5 + 32. Parentheses and real division make the intended arithmetic clear. The same planning pattern handles rectangle area width * height, triangle area base * height / 2, average grade total / count, and salary hours * hourly_rate. Write the units alongside the IPO description: a correct-looking number in the wrong unit is still an incorrect solution.",
        "Convert a finite Celsius temperature into Fahrenheit.",
        "One finite decimal Celsius value.",
        "Multiply by 9, divide by 5, then add 32.",
        "Fahrenheit with six decimal places.",
        [
            ["0\n", "32.000000\n"],
            ["-40\n", "-40.000000\n"],
        ],
        [
            "Which step must precede calculating Fahrenheit?|Read Celsius|Display Fahrenheit|End the program|Overwrite Celsius with text|The expression depends on the input.",
            "Which formula is correct?|C * 9 / 5 + 32|C + 9 * 5 + 32|C * 5 / 9 + 32|C / 32|The scale factor is nine fifths and the offset is 32.",
            "What characterizes sequence?|Statements execute in order|A block always repeats|Every step branches|There is no output|Sequence is the simplest control structure.",
            "Which units describe rectangle area?|Square units|Linear units|Degrees|Currency|Multiplying two lengths produces area.",
        ],
    ],
    [
        "Conditional Statements",
        "Boolean conditions; decision flowcharts; true/false; if; if-else; relational expressions; conditional execution",
        "Selection allows the program to choose a path based on a Boolean condition. A simple if executes its body only when the condition is true; if-else selects exactly one of two branches. In a flowchart, a diamond displays the condition and outgoing arrows identify true and false. Both branches can join before later work continues.\n\nAn integer is even if its remainder after division by 2 is zero. This test also works for zero and negative even numbers. Use >= 75 for a pass threshold that includes exactly 75, and >= 18 for an age policy that includes 18. A positive/negative classifier needs a separate zero case if the task distinguishes zero. Always test both branches and values exactly at the boundary.",
        "Classify a signed integer as even or odd.",
        "One 32-bit integer.",
        "Test whether its nonnegative remainder modulo 2 is zero.",
        "Even or Odd.",
        [
            ["0\n", "Even\n"],
            ["-3\n", "Odd\n"],
        ],
        [
            "Is zero even?|Yes, its remainder modulo 2 is zero|No, it is always odd|Only in Python|It cannot be tested|The divisibility rule includes zero.",
            "How many if-else branches execute?|Exactly one|Always both|Always none|A random number|A Boolean chooses one of the two alternatives.",
            "Which condition includes the passing boundary 75?|grade >= 75|grade > 75|grade < 75|grade != 75|Greater-than-or-equal includes the threshold.",
            "What value does a relational comparison produce?|Boolean|Always a string|An array|A function|Conditions are evaluated as true or false.",
        ],
    ],
    [
        "Multiple Selection",
        "Nested if; elif; else if; switch; Python match-case; menus; grade equivalents; day of week; calculators",
        "Multiple selection chooses among more than two outcomes. Python uses if/elif/else, and C++ and Java use if/else if/else. Nested if statements handle dependent decisions, such as first checking validity and then classifying a grade. Exact-value menus can use switch in C++ and Java. Python match-case requires Python 3.10 or later; use elif on older Python 3 installations.\n\nThe day-of-week example accepts 1 through 7 and includes a default invalid-day branch. The workspace lowers its structured selection into mutually exclusive comparisons so the output is consistent on supported Python 3 runtimes. A calculator menu should also handle an unknown operator and division by zero. For grade bands, test higher thresholds first so a grade of 95 is not consumed by a lower >=75 branch.",
        "Map a day number to its weekday name.",
        "One integer day number; 1 means Monday and 7 Sunday.",
        "Select the matching exact-value case, otherwise use default.",
        "A weekday name or Invalid day.",
        [
            ["1\n", "Monday\n"],
            ["8\n", "Invalid day\n"],
        ],
        [
            "What handles an unmatched menu value?|A default branch|Repeating the first branch|Ignoring validation|A variable declaration|Default makes invalid choices explicit.",
            "Which Python construct needs Python 3.10 or later?|match-case|if-else|while|def|Pattern matching was introduced in Python 3.10.",
            "How should descending grade bands be checked?|Highest threshold first|Lowest threshold first in all cases|In random order|By variable name|An early broad lower band can hide a higher result.",
            "What is nested selection?|A decision inside another decision|A loop without a condition|Two unrelated variables|An output inside a string|The inner decision depends on the chosen outer path.",
        ],
    ],
    [
        "Introduction to Repetition Structures",
        "While; counters; accumulators; initialization; condition; update; termination; infinite loops; loop flowcharts",
        "Repetition executes a block while a condition holds. A counter tracks iterations, while an accumulator combines results across iterations. A while loop tests before its body, so it can run zero times. Plan initialization, condition, body, and update separately. Draw a backward arrow from the update to the test, with a false exit leading forward.\n\nTo sum 1 through n, initialize i = 1 and total = 0. While i <= n, add i to total and increment i. For n = 0 the loop is skipped and total stays zero. Omitting the increment can produce an infinite loop. A validator can detect a missing condition but cannot prove termination for every possible program; runtime limits remain necessary.",
        "Sum the integers 1 through n using while.",
        "An integer n from 0 to 10000.",
        "Accumulate each counter value and update the counter.",
        "The integer sum.",
        [
            ["4\n", "10\n"],
            ["0\n", "0\n"],
        ],
        [
            "What is an accumulator?|A variable combining results over iterations|Only a loop condition|An output symbol|A compiler|total stores a running sum.",
            "When is a while condition tested?|Before each iteration|Only after the loop ends|Never|Only during compilation|A false initial condition causes zero iterations.",
            "What can a missing counter update cause?|An infinite loop|A new input type|Automatic completion|Guaranteed faster execution|The condition may never become false.",
            "Can general loop termination always be proven automatically?|No|Yes for every program|Only by renaming variables|Only in Java|Validation and execution limits have different roles.",
        ],
    ],
    [
        "Beginner Practical Project",
        "Student Grade Evaluation System; problem analysis; algorithm; pseudocode; flowchart; three languages; testing; debugging",
        "A practical project combines previously learned steps into a documented solution. This grade evaluator reads three grades, validates that each is between 0 and 100, computes their arithmetic mean, and reports Pass for an average of at least 75. Invalid grades produce an explicit error message instead of a misleading average. State the grading policy before implementing it.\n\nPrepare an IPO table, numbered algorithm, pseudocode, and decision flowchart before opening the language tabs. Then implement the same plan in Python, C++, and Java. Test normal passing, failing, exactly-75, and invalid cases. Compare actual runner output with the expected results, and explain any difference. Submission includes the plan, the three programs, and your test evidence; generating source by itself does not demonstrate successful execution.",
        "Evaluate three student grades using a pass boundary of 75.",
        "Three finite decimal grades; values outside 0 to 100 are rejected.",
        "Validate all grades, compute their mean, and classify the mean.",
        "Average and Pass/Fail, or Invalid grade.",
        [
            ["75\n80\n85\n", "80.000000\nPass\n"],
            ["-1\n80\n90\n", "Invalid grade\n"],
        ],
        [
            "Why validate before computing the result?|Invalid grades must not produce a normal evaluation|It changes the pass boundary|It avoids all arithmetic|It removes the need for tests|Validation protects the stated grading policy.",
            "Which average passes exactly at the boundary?|75|74|0|-1|The policy uses >=75.",
            "What proves a program ran successfully?|Recorded actual execution matching expected results|Generating source|Selecting a language tab|Saving a flowchart|Execution evidence must come from a runner.",
            "What belongs in the submission?|Plan, flowchart, three programs, and tests|Only a screenshot of the title|Only one source language|Only the final average|The project assesses the entire problem-solving sequence.",
        ],
    ],
    [
        "For Loops",
        "Counted repetition; counters; boundaries; conditions; Python range; C++ and Java for; sequences; summation",
        "Use a counted loop when the intended number of iterations is known or derived from input. Python range(start, stop, step) excludes stop. A conventional C++ or Java for states initialization, condition, and update in one header. Translating the same boundary correctly matters more than making the headers look alike.\n\nSumming 1 through n requires an exclusive upper bound of n + 1 in this workspace. The generated C++ and Java loops use i < captured_stop, while Python uses range(1, n + 1). Capturing the stop value once keeps behavior equal even if a body changes other variables. Use an empty range when n is zero. A descending range needs a negative step and the matching comparison.",
        "Sum 1 through n using counted repetition.",
        "An integer n from 0 to 10000.",
        "Repeat for i from 1 up to but excluding n + 1.",
        "The integer sum.",
        [
            ["5\n", "15\n"],
            ["0\n", "0\n"],
        ],
        [
            "Does Python range include its stop value?|No|Always|Only for positive steps|Only when stop is zero|The stop bound is exclusive.",
            "Which exclusive stop includes n?|n + 1|n - 1|0|1|The iteration must still visit n.",
            "What step creates a descending counted loop? |A negative step|Zero|An empty string|A Boolean|The counter must decrease toward its stop.",
            "Why capture the upper bound once?|To keep loop bounds equivalent across languages|To prevent output|To change user input|To make every loop infinite|Python range evaluates its bounds before iteration.",
        ],
    ],
    [
        "Do-While Loops and Loop Comparison",
        "Pre-test vs post-test; do-while; Python while True and break; sentinel; menus; loop tracing; flowchart conversion",
        "A pre-test loop can skip its body, whereas a post-test loop executes the body at least once. C++ and Java provide do { body } while (condition); with a semicolon after the condition. Python has no native do-while statement. Express equivalent logic using while True, then test the continuation condition after the body and break when it is false.\n\nA sentinel is a special input value that ends repetition rather than ordinary data. Here zero ends a sequence of numbers. The body reads a number and adds it; adding the zero sentinel does not change the total. If the sentinel were -1 instead, it would need to be excluded from accumulation explicitly. Trace the first read and final condition to avoid processing stale input.",
        "Read integers until zero and display their sum.",
        "A finite sequence of 32-bit integers terminated by 0; sum must fit int.",
        "Read at least once, accumulate, then test for the sentinel.",
        "The sum including the harmless zero sentinel.",
        [
            ["4\n-1\n0\n", "3\n"],
            ["0\n", "0\n"],
        ],
        [
            "How many times does a post-test body run at minimum?|One|Zero|Two|Ten|The condition is checked after the first body execution.",
            "Does Python have a native do-while statement?|No|Yes in every version|Only with Scanner|Only with braces|Use while True and a conditional break.",
            "What is the sentinel here?|0|The running total|The loop variable name|A newline|Zero marks the end of input.",
            "Where is the continuation test in a post-test flowchart?|After the body|Before Start|Inside every output|Outside the program|The backward edge follows a bottom test.",
        ],
    ],
    [
        "Nested Loops and Pattern Programming",
        "Outer and inner loops; execution order; star/number patterns; multiplication tables; nested flowcharts; tracing",
        "A nested loop places one loop inside another. For each outer iteration, the inner loop begins again and completes its own iterations. A three-by-three table therefore contains nine cells rather than six. Trace both counters to understand which values are combined at each cell.\n\nThis multiplication-table example outputs each row*column product on a separate line in row-major order. The first row uses row = 1 for every column, then the second row begins. A star rectangle uses the same loop structure but outputs a star token; number patterns can output the row, column, or a formula. Keep display formatting separate from deciding how many tokens belong to each row.",
        "Produce a size-by-size multiplication table in row-major order.",
        "An integer size from 0 to 10.",
        "For every row 1..size, visit every column 1..size.",
        "One product per line.",
        [
            ["2\n", "1\n2\n2\n4\n"],
            ["0\n", ""],
        ],
        [
            "How often does the inner loop restart?|Once per outer iteration|Only once overall|Never|Only after End|The inner loop belongs to the outer body.",
            "How many cells are in a 3 by 3 table?|9|3|6|12|Multiply outer and inner iteration counts.",
            "What is row-major order?|Complete a row before moving to the next|Visit all rows of one column first|Sort the products|Reverse every cell|The outer loop controls rows here.",
            "Which counters determine a table product?|Both row and column|Only row|Only size|Neither|Each cell is row multiplied by column.",
        ],
    ],
    [
        "Simple Functions and Modular Programming",
        "Declarations; definitions; parameters; arguments; return values; void; calls; modular flowcharts; predefined process",
        "A function groups a named task behind an interface. Parameters are names in its definition; arguments are actual values supplied by a call. A returned value allows the caller to use the result in a larger expression. A procedure that only performs an action may return no useful value: C++ and Java use void, while a Python function without return produces None.\n\nThe area function accepts width and height and returns their product. Main reads inputs and displays the returned result, so calculation and interaction have separate responsibilities. A predefined-process symbol points to the area routine; its separate flowchart ends by returning to the caller. This workspace supports value-returning helpers with a final return; void procedures can be studied directly in the existing language editors but are outside this converter model.",
        "Calculate rectangle area through a reusable function.",
        "Two nonnegative finite decimal dimensions.",
        "Call area(width, height), which returns width * height.",
        "The returned area with six decimal places.",
        [
            ["2\n5\n", "10.000000\n"],
            ["0\n7\n", "0.000000\n"],
        ],
        [
            "What is a parameter?|A name in a function definition|A printed result only|A test score|A loop arrow|Arguments supply values to these names.",
            "What does return do?|Sends a value back to the caller|Always prints a value|Restarts main|Declares every variable|Returning and displaying are separate operations.",
            "Which flowchart symbol represents a function call?|Predefined process|Plain terminator|Unlabeled connector|Input parallelogram only|The double-sided rectangle names a separate routine.",
            "What does a Python function without return produce?|None|Always zero|A Java void object|A compiler error in every case|None represents the absence of an explicit result.",
        ],
    ],
    [
        "Simple Arrays and Lists",
        "Indexing; declaration; initialization; access; update; iteration; Python lists; C++ vectors; Java arrays; processing flowcharts",
        "An array or list stores an ordered collection of values accessed by index. These examples use zero-based indexing, so the first element has index 0 and the final valid index is length - 1. Reading outside the valid range is an error. The workspace rejects negative indices to avoid Python list behavior differing from C++ and Java.\n\nPython lists can grow and mix types in general, but this course uses homogeneous lists to match typed C++ vectors and Java arrays. Java arrays have fixed length; vector and list resizing are unnecessary for the beginner tasks. The example initializes three scores, updates index 0 from input, and traverses the collection. Assignment to one indexed element does not replace the entire collection.",
        "Replace the first score and display all three values.",
        "One integer replacement score.",
        "Initialize [70, 80, 90], update index 0, and visit every index.",
        "The updated three scores, one per line.",
        [
            ["75\n", "75\n80\n90\n"],
            ["0\n", "0\n80\n90\n"],
        ],
        [
            "What index refers to the first element?|0|1|-1|The length|These examples use zero-based indexing.",
            "What is the final valid index for three values?|2|3|0|4|The final index is length minus one.",
            "Which collection is used in generated C++?|std::vector|A Python list|Scanner|StringBuilder|A typed vector supports these array-processing examples.",
            "Why reject negative array indices here?|To preserve the same bounds policy in all languages|Because Python cannot use them|To sort the values|To remove the first value|Python negative indexing has different semantics.",
        ],
    ],
    [
        "Arrays with Loops",
        "Sum; average; minimum; maximum; counts; searching; collections and repetition",
        "A collection traversal applies the same processing step to every element. Initialize a sum to zero, then add each value. An average divides by the number of values, so an empty collection needs an explicit policy. A minimum or maximum should normally begin from the first element of a nonempty collection instead of an arbitrary zero.\n\nHere a four-score collection receives a replacement first value. The program tracks total, minimum, and maximum in one traversal and displays minimum, maximum, then average. Starting minimum at zero would be wrong when every score is positive. The same traversal can count grades >=75 or find a requested score by adding a condition inside the loop.",
        "Find minimum, maximum, and average of four integer scores.",
        "One integer replacing the first value in [70, 85, 60, 95].",
        "Initialize extrema from index 0; scan and accumulate all four values.",
        "Minimum, maximum, and six-place average.",
        [
            ["70\n", "60\n95\n77.500000\n"],
            ["-10\n", "-10\n95\n57.500000\n"],
        ],
        [
            "How should minimum start for a nonempty array?|From its first element|Always from zero|From its length|From an unrelated string|This works for both positive and negative data.",
            "What must be checked before averaging an empty collection?|A zero length|The variable spelling only|Whether values are sorted|The programming language name|Dividing by zero must be avoided.",
            "How many times is each value added in this traversal?|Once|Zero times|Twice|Until it becomes zero|One loop visit contributes one value to total.",
            "How can a traversal count passing grades?|Increment a counter when a grade meets the boundary|Replace every grade by zero|Use only the array length|Print the counter before initialization|Selection can be combined with traversal.",
        ],
    ],
    [
        "Combining Selection and Repetition",
        "Conditions inside loops; loops in decisions; validation; menus; grading; repeating calculations; complex flowcharts",
        "Selection inside repetition lets each item receive conditional treatment. A loop inside a decision repeats work only when an earlier requirement holds. Input validation commonly uses a loop: while the entered value is invalid, explain the issue and read a replacement. The loop condition describes invalidity; the exit path represents an accepted value.\n\nThe grade validator rejects values below 0 or above 100, then reports Pass or Fail for the first accepted grade. Use OR for the invalid condition: a number cannot be both below 0 and above 100. The reread must update the variable used by the condition. A practical menu extends the same pattern by repeatedly reading choices and selecting an action.",
        "Keep asking for a valid grade, then classify it.",
        "One or more integers ending with a value from 0 to 100.",
        "Reject out-of-range values and test accepted grade against 75.",
        "Invalid grade for every rejection, then Pass or Fail.",
        [
            ["-1\n105\n75\n", "Invalid grade\nInvalid grade\nPass\n"],
            ["0\n", "Fail\n"],
        ],
        [
            "Which condition identifies an invalid grade?|grade < 0 OR grade > 100|grade < 0 AND grade > 100|grade >= 0|grade <= 100|Either outside-bound condition is sufficient.",
            "What must happen after reporting invalid input?|Read a replacement into the tested variable|End without explanation|Keep the same invalid value forever|Set every value to 100|The loop needs a way to reach its exit condition.",
            "When should pass/fail be determined?|After a valid grade is accepted|Before any input|Only for invalid values|During source generation|Classification uses accepted data.",
            "Which control structures appear here?|Selection and repetition|Sequence alone|Recursion alone|Inheritance|A validation loop precedes a classification decision.",
        ],
    ],
    [
        "Combining Functions, Arrays, and Loops",
        "Modular problem solving; array parameters; reusable calculations; function organization; multi-function flowcharts",
        "Modular collection processing places a traversal in a reusable function. A mean(values) function can receive a homogeneous list or array, sum its elements, and return total divided by length. Main remains responsible for reading and validating input and for presenting the result. This separation makes it possible to test calculation independently from the console interface.\n\nThe example reads three grades into an array and calls mean. A function-level empty-array guard returns 0.0 by an explicitly documented policy before division. Generated array arguments are copied in all three languages so local mutation cannot unexpectedly alter the caller in one language but not another. Functions must reference only earlier defined helpers, and recursion is outside this introductory model.",
        "Read three valid grades and calculate their mean through a helper.",
        "Three decimal grades, each from 0 to 100; invalid entries are replaced.",
        "Fill an array and call mean(values).",
        "The six-place average; validation messages if needed.",
        [
            ["70\n80\n90\n", "80.000000\n"],
            ["0\n0\n0\n", "0.000000\n"],
        ],
        [
            "Which responsibility belongs in mean(values)?|Summing and dividing the collection|Choosing console colors|Authenticating the student|Selecting a course|The helper represents a calculation.",
            "Why guard an empty array first?|To avoid dividing by zero|To change all grades to text|To skip every function call|To force a syntax error|The example defines the empty mean as 0.0.",
            "How are generated array arguments handled?|Copied in all three languages|Shared only in Java without explanation|Converted into strings|Discarded|Copying gives consistent value-style behavior.",
            "What helps test a calculation independently?|Separating input from the calculation function|Combining everything in one prompt|Removing return values|Using global variables for every input|A function interface accepts known test values.",
        ],
    ],
    [
        "Debugging and Testing",
        "Syntax; logic; runtime errors; dry-run tables; variable tracing; flowchart faults; language diagnostics; expected vs actual",
        "A syntax error violates a language grammar and can prevent compilation or parsing. A runtime error happens during execution, such as a bounds violation or zero divisor. A logic error allows execution but produces the wrong result. A connected and syntactically valid program can still implement an incorrect algorithm.\n\nTrace a counted loop using columns for iteration, counter, condition, and accumulated count. The correct loop from 0 to n with an exclusive stop executes exactly n times for n >=0. Changing < to <= introduces an off-by-one fault. Test n=0, n=1, and a larger n rather than only a convenient middle value. Read the first diagnostic, locate the corresponding flowchart node, make one reasoned correction, and rerun the failing test.",
        "Count exactly n loop iterations.",
        "An integer n from 0 to 10000.",
        "Initialize count to zero and increment once per exclusive-range iteration.",
        "The number of iterations.",
        [
            ["3\n", "3\n"],
            ["0\n", "0\n"],
        ],
        [
            "Which error can produce a wrong result without a crash?|Logic error|Only a syntax error|Only a missing compiler|A valid test|Incorrect conditions can still compile and run.",
            "What is an off-by-one error?|A boundary includes or excludes one extra iteration|Any misspelled string|An unavailable network|A missing course title|Changing a loop boundary can change the count by one.",
            "Which table helps debug changing variables?|A dry-run trace table|A student seating chart|A file directory only|A color palette|A trace records state at each step.",
            "Why test n=0?|It checks the zero-iteration boundary|It guarantees every other test passes|It tests inheritance|It changes the language version|An empty range exposes many boundary mistakes.",
        ],
    ],
    [
        "Intermediate Practical Project",
        "Student Grade Management Program; arrays; means; statuses; summaries; functions; validation",
        "This project manages three student grades using an array, validation loops, and a reusable mean function. Unlike the beginner evaluator, it also reports an individual status for every stored grade. Define whether the summary is per student or per subject; this worked model uses one grade per student. The collection length and pass boundary are explicit requirements.\n\nPlan the input traversal, calculation function, and reporting traversal as separate blocks. Validate each grade before storing it, retain the original values, compute the overall average, then display each Pass/Fail status. Test all-pass, all-fail, mixed, boundary, and invalid-entry cases. Document the function interface and the empty-array policy even though this main program always stores three grades.",
        "Manage three grades and report their mean and individual statuses.",
        "Three finite decimal grades from 0 to 100, rereading invalid entries.",
        "Store validated grades, call mean, and classify every grade.",
        "Average, followed by three Pass/Fail lines.",
        [
            ["70\n80\n90\n", "80.000000\nFail\nPass\nPass\n"],
            ["75\n75\n75\n", "75.000000\nPass\nPass\nPass\n"],
        ],
        [
            "Why store grades before reporting?|The same values support summaries and repeated processing|Arrays automatically validate grades|Storage removes the need for loops|Stored data can never change|A collection preserves the inputs for later use.",
            "Which result is per student here?|Each individual Pass/Fail status|Only the overall mean|The array declaration|The compiler version|Each stored grade is classified separately.",
            "Which helper should be reusable?|mean(values)|The browser tab title|The login form|The course slug|The calculation depends on values rather than interface state.",
            "Which test checks the exact pass boundary?|Three grades of 75|Only a grade of 100|Only an invalid input|No input at all|Every 75 must be classified as passing.",
        ],
    ],
    [
        "Advanced Algorithm Design",
        "Decomposition; stepwise refinement; multiple inputs/outputs; nested decisions; combined structures; detailed plans",
        "Problem decomposition divides a larger task into coherent subtasks with clear interfaces. Stepwise refinement begins with broad actions and expands each until it is implementable. For a purchase calculator, first state read order, compute subtotal, apply discount, and report; then refine the discount rule and its boundary.\n\nThe example reads price and quantity, calculates subtotal, and calls discount. A subtotal of at least 1000 receives a 10 percent reduction. The function returns the adjusted amount, while main owns input and output. Test below, at, and above the threshold. Decomposition does not mean adding advanced language features: sequence, decisions, and small functions are enough.",
        "Calculate a purchase total with a threshold discount.",
        "A nonnegative decimal price and integer quantity from 0 to 10000.",
        "Compute subtotal and apply 10% off when subtotal >=1000.",
        "Discounted total with six decimal places.",
        [
            ["100\n10\n", "900.000000\n"],
            ["50\n2\n", "100.000000\n"],
        ],
        [
            "What is stepwise refinement?|Expanding a broad plan into precise steps|Skipping analysis|Adding unrelated features|Renaming every function|Refinement resolves details until steps are implementable.",
            "When is the discount applied?|When subtotal is at least 1000|Only below 1000|To every purchase|Only for zero quantity|The inclusive threshold is part of the policy.",
            "What is the discount function input?|The subtotal|The student password|A flowchart image|The output string|The helper needs the amount being discounted.",
            "Why test exactly 1000?|To verify the threshold is inclusive|To avoid testing below it|To test a compiler keyword|To remove floating-point types|Boundary tests distinguish > from >=.",
        ],
    ],
    [
        "Advanced Sequential and Conditional Problems",
        "Multi-step calculations; compound conditions; nested selection; grading policies; conditional computations; decision tables",
        "A decision table lists combinations of conditions and the action for each combination. Translate it carefully into compound Boolean expressions or nested decisions. An honors policy may require both a high grade and strong attendance; failing either requirement must select another outcome. Use parentheses to make mixed AND/OR grouping explicit.\n\nThis policy awards Honors for grade >=90 and attendance >=95. Otherwise, a grade >=75 receives Pass and a lower grade receives Fail. Honor eligibility is checked before the broader passing condition. Valid inputs are percentages from 0 to 100. Check combinations where only one honors requirement is met, plus both exact boundaries.",
        "Apply a grade-and-attendance decision table.",
        "Integer grade and attendance percentages from 0 to 100.",
        "Check honors requirements first, then the pass threshold.",
        "Honors, Pass, or Fail.",
        [
            ["90\n95\n", "Honors\n"],
            ["90\n94\n", "Pass\n"],
        ],
        [
            "What combines the two honors requirements?|AND|OR|Assignment|Modulo|Both grade and attendance thresholds must hold.",
            "Why test honors before ordinary pass?|Honors also satisfies the broader grade pass threshold|It prevents input|It makes attendance irrelevant|It sorts the values|Branch order must preserve the more specific result.",
            "What is a decision table?|A mapping from condition combinations to actions|An array of random numbers|A compiler warning|A list of filenames|It makes policy outcomes explicit.",
            "What happens with grade 90 and attendance 94?|Pass|Honors|Fail|Invalid syntax|Attendance does not meet the honors threshold.",
        ],
    ],
    [
        "Advanced Repetition Algorithms",
        "Counter/sentinel control; nested repetition; accumulators; conditional termination; repetition problem solving",
        "Choose loop control from the problem: a known quantity suggests a counter, while an unknown-length sequence suggests a sentinel. Distinguish data processing from termination testing. A sentinel value is not automatically meaningful data, and a counter may count only items meeting a condition rather than all reads.\n\nThe example counts positive integers until zero is read. Negative inputs keep the loop running but do not increase the counter. The zero sentinel neither increases the count nor triggers another input. Trace mixed positive, negative, and zero values to ensure the update belongs inside the positive-value decision. Resource limits guard execution even when an input stream never reaches the sentinel.",
        "Count positive values before a zero sentinel.",
        "A finite integer sequence terminated by 0.",
        "Increment only when the entered number is positive.",
        "The positive-value count.",
        [
            ["3\n-2\n5\n0\n", "2\n"],
            ["-1\n0\n", "0\n"],
        ],
        [
            "Do negative values end this loop?|No, only zero ends it|Yes, every negative does|Only -1 does|Only in C++|Termination and positive-value counting are separate rules.",
            "When is positive_count incremented?|Only for a positive input|For every read|Only for the sentinel|Before initialization|The update belongs in the positive branch.",
            "Which loop control fits an unknown input count?|Sentinel control|Only a fixed ten-iteration loop|A constant declaration|An array type|A sentinel signals when input is complete.",
            "Does the zero sentinel contribute to the count?|No|Yes|Only in Java|Only when total is positive|Zero is not positive and marks termination.",
        ],
    ],
    [
        "Advanced Pattern Programming",
        "Pyramids; reversed patterns; nested challenges; tracing; nested-loop flowcharts",
        "A pattern is a rule about positions and output tokens. In a growing triangle, row r contains r stars. A centered pyramid adds rows-r spaces and 2*r-1 stars. A reversed triangle uses rows-r+1 stars. Derive these formulas on paper before writing nested loops, then verify the first and last rows.\n\nThe worked graph emits one star token per line and a vertical-bar row marker so output order is visible without relying on trailing spaces. It represents a growing star triangle; the practice exercises turn it into a centered pyramid and reverse it. The outer counter determines row size, and the inner loop emits the required number of tokens. Total stars for n rows are n*(n+1)/2.",
        "Generate a growing star triangle as a token stream.",
        "An integer row count from 0 to 10.",
        "For row r, output r stars, then a row marker.",
        "One star token per line and | after each row.",
        [
            ["2\n", "*\n|\n*\n*\n|\n"],
            ["0\n", ""],
        ],
        [
            "How many stars belong to growing-triangle row r?|r|Always 1|Always n|r - n|The inner loop count depends on the current row.",
            "How many stars does centered pyramid row r contain?|2*r - 1|r - 1|2*r + 1|Always 2|Centered rows have an odd number of stars.",
            "What should be derived before writing nested loops?|The rule for spaces and symbols in each row|Only the filename|The browser color|The student password|A positional rule determines the bounds.",
            "What does the | token mark here?|The end of a row|A multiplication operator|An input request|A missing value|The explicit marker makes the output trace readable.",
        ],
    ],
    [
        "Advanced Functions and Modular Design",
        "Multiple parameters; return design; decomposition; reuse; array/list functions; modular algorithms and flowcharts",
        "A good function interface states the meaning and type of every parameter and its result. Avoid hiding policy in unexplained numbers. A weighted-grade function can accept exam, project, and exam_weight; the remaining weight is 1-exam_weight. This allows the same calculation to serve several grading policies.\n\nThe worked example uses exam weight 0.6 and project weight 0.4. The function returns a decimal value rather than printing it. Valid grades are 0..100 and a valid weight is 0..1. Test equal components, extreme component values, and a zero component. More parameters are useful when each has a clear role; unrelated tasks should be decomposed into other routines.",
        "Compute a reusable weighted grade.",
        "Exam and project decimal grades from 0 to 100.",
        "Return exam*0.6 + project*0.4.",
        "Weighted grade with six decimal places.",
        [
            ["80\n90\n", "84.000000\n"],
            ["0\n100\n", "40.000000\n"],
        ],
        [
            "What is the remaining weight when exam_weight is 0.6?|0.4|0.6|1.6|0|Weights sum to one in this policy.",
            "Why pass a weight as a parameter?|To reuse the calculation for different policies|To remove the return statement|To turn grades into strings|To skip all testing|An explicit parameter exposes the policy choice.",
            "What should a calculation helper usually return here?|The calculated value|Only a printed label|A student login|A flowchart node ID|The caller decides how to present the result.",
            "Which weight is valid under the stated contract?|0.6|1.5|-0.2|6|A fractional weight lies between zero and one.",
        ],
    ],
    [
        "Array Processing Applications",
        "Extrema; occurrence counts; filtering; linear search; small-array sorting; statistics; tracing",
        "Array algorithms combine a traversal with a clear invariant: a statement that remains true at a chosen point in each iteration. In linear search, every previously visited element has been checked. In counting, the counter equals the number of matches seen so far. Filtering can copy matching elements into a prepared result collection or display them during traversal.\n\nThe worked bubble sort compares adjacent values and swaps them when out of order. Each full pass moves a large value toward the end. A temporary variable preserves the first value while the second is moved. The example deliberately uses a small collection so every comparison is traceable. Duplicate values should remain present, and an empty or one-element collection needs no comparisons. This is a logic exercise, not a recommendation for large-data sorting.",
        "Sort four integers in ascending order while preserving duplicates.",
        "One integer replacing the first element of [9, 2, 7, 2].",
        "Compare adjacent elements over repeated passes and swap when needed.",
        "Four sorted values, one per line.",
        [
            ["9\n", "2\n2\n7\n9\n"],
            ["-1\n", "-1\n2\n2\n7\n"],
        ],
        [
            "Why use a temporary variable in a swap?|To preserve a value before overwriting it|To increase array length|To discard duplicates|To terminate input|One original value would otherwise be lost.",
            "What should sorting do with duplicates?|Preserve their occurrences|Delete all of them|Replace them with zero|Make the array shorter|Sorting changes order, not the data multiset.",
            "Which comparison triggers an ascending adjacent swap?|left > right|left < right|left == right only|Always false|An out-of-order pair must be reversed.",
            "How many adjacent comparisons are needed for an empty array?|Zero|One|Two|Its first element|There are no adjacent pairs to compare.",
        ],
    ],
    [
        "Combining Algorithms and Control Structures",
        "Sequence; selection; repetition; multi-level decisions; loops/functions; arrays/functions; menus; modular flowcharts",
        "A menu-driven program repeats an interaction cycle: read a choice, select an action, complete it, and return to the menu until exit is chosen. Each action can call a reusable function or traverse a collection. Keep the exit case explicit and make invalid choices produce useful feedback.\n\nThis example stores two grades, supports choice 1 for mean, choice 2 for count, and choice 0 for exit. A post-test loop ensures at least one menu choice is read. The selection node owns separate action blocks; all continuing actions join before the next loop test. Trace multiple menu choices in one run to confirm the application retains its state between actions.",
        "Provide a repeating grade-summary menu.",
        "A sequence of integer choices: 1 mean, 2 count, 0 exit.",
        "Store [80,90], select an action, and repeat until exit.",
        "Requested summary lines and Goodbye on exit.",
        [
            ["1\n2\n0\n", "85.000000\n2\nGoodbye\n"],
            ["9\n0\n", "Invalid option\nGoodbye\n"],
        ],
        [
            "Where does a completed non-exit action go?|Back to the menu loop test|To an unrelated course|Always directly to End|To a new student record|The interaction cycle repeats.",
            "What should an unknown menu choice do?|Report Invalid option and continue|Pretend an action succeeded|Delete grades|Exit silently|The default case provides feedback.",
            "Which choice ends this example?|0|1|2|9|Zero is the explicit exit option.",
            "Why combine functions with a menu?|Actions can reuse calculation helpers|Functions remove the need for input|Menus require recursion|Arrays cannot be used in main|Separation keeps each action understandable.",
        ],
    ],
    [
        "Flowchart-to-Code Challenge",
        "Interpretation; pseudocode; three implementations; execution; matching output; flowchart tracing",
        "Read an unfamiliar flowchart by identifying Start, inputs, initial values, decision branches, repeated paths, and outputs. Build a trace table before guessing the intended program. The chart for this challenge visits every integer from 1 through limit, adds only even values to total, and displays total after the loop.\n\nIn Independent Challenge mode, keep source tabs closed until your own pseudocode explains the chart. Predict the outputs for limits 0, 1, 2, and 6, then write or generate the three implementations and inspect them. Selecting a node highlights the statements that implement it. Compare actual results from each available runner and explain any unavailable language execution explicitly.",
        "Interpret a flowchart that sums even numbers through a limit.",
        "An integer limit from 0 to 10000.",
        "Visit 1..limit and add only values with remainder zero modulo 2.",
        "The sum of the accepted even values.",
        [
            ["6\n", "12\n"],
            ["1\n", "0\n"],
        ],
        [
            "Which numbers contribute when limit is 6?|2, 4, and 6|1, 3, and 5|Only 6|Every number|The decision accepts even values only.",
            "When is total displayed?|After the loop|Before initialization|Only inside every true branch|Before input|The final accumulated value is required.",
            "What should precede generating source in the challenge?|Your own interpretation and pseudocode|An invented execution result|Deleting the chart|Teacher approval of a blank page|The activity assesses understanding the flowchart.",
            "What does selecting a chart node help inspect?|Equivalent source statements|Only a random line|The login database|The browser installation|Source maps connect logic to syntax.",
        ],
    ],
    [
        "Programming Logic and Debugging Challenge",
        "Incorrect charts; algorithms; pseudocode; syntax faults; logic faults; correction; equivalence verification",
        "Debugging across representations means checking whether the problem statement, algorithm, pseudocode, chart, and code all describe the same behavior. A mistake in the plan can appear faithfully in all three languages, so matching outputs alone do not prove the plan is correct. Compare against independently computed expected values.\n\nThe corrected example computes average = (a+b)/2 using real division. A faulty chart might subtract instead of add; faulty pseudocode might omit the parentheses; faulty Python might have inconsistent indentation; faulty C++ or Java might divide two integers and truncate. Use odd totals such as 3+4 to expose truncation, and negative inputs to check the arithmetic. Document the fault, its cause, the change, and the regression test.",
        "Repair a two-integer average calculation.",
        "Two 32-bit integers whose sum fits int.",
        "Add before dividing by two using real division.",
        "A six-place arithmetic mean.",
        [
            ["3\n4\n", "3.500000\n"],
            ["-3\n1\n", "-1.000000\n"],
        ],
        [
            "Which test exposes integer truncation?|Inputs 3 and 4|Inputs 2 and 2 only|Inputs 0 and 0 only|A blank source file|An odd total has a fractional mean.",
            "Why are matching outputs alone insufficient?|All implementations can share the same logic error|Matching always proves correctness|Tests cannot use expected values|Compilers prove requirements|Independent expected results test the intended problem.",
            "Which expression implements the intended mean?|(a + b) / 2|a + b / 2|a - b / 2|a * b|Parentheses make addition happen before division.",
            "What belongs in a debugging report?|Fault, cause, correction, and regression test|Only a claim that it works|Only the compiler logo|Only a student name|Evidence makes the correction reviewable.",
        ],
    ],
    [
        "Advanced Capstone Project",
        "Console student records; information input; grade entry; calculations; statuses; search; update; reports; menus; arrays; functions; validation; documentation",
        "The capstone is a console student record and grade management system built from the same foundational control structures. This worked scope stores two records in parallel name and grade arrays. The same index identifies one student across both arrays. Names are entered as full lines, grades are validated, and menu choices perform search, update, reporting, or exit.\n\nSearch compares names by text value and reports the stored grade or Not found. If duplicate names exist, the worked policy returns the last matching record; a production identifier would avoid ambiguity. Updates use a zero-based index and validate both bounds and grade range before changing data. Reports display each name, grade, status, and the overall mean. The program is in-memory: it does not claim durable database storage of console-entered records.\n\nSubmit nine artifacts: problem analysis, algorithm, pseudocode, flowchart, Python source, C++ source, Java source, test results, and documentation. Include normal, invalid, missing-search, boundary, and multiple-action tests. Explain the fixed-capacity scope and identify how the array length could be generalized without changing the search/update logic.",
        "Manage two in-memory student records with search, update, and reporting.",
        "Two name/grade pairs, then choices 1 search, 2 update, 3 report, 0 exit. Search reads a name; update reads index then grade.",
        "Validate grades, maintain parallel arrays, search names, update valid indices, and call mean for reports.",
        "Search result, update feedback, report lines, and Goodbye.",
        [
            [
                "Ana\n80\nBen\n70\n1\nAna\n2\n1\n90\n3\n0\n",
                "80.000000\nUpdated\nAna\n80.000000\nPass\nBen\n90.000000\nPass\n85.000000\nGoodbye\n",
            ],
            ["Ana\n0\nBen\n100\n1\nMissing\n2\n2\n90\n0\n", "Not found\nInvalid update\nGoodbye\n"],
        ],
        [
            "How do parallel arrays identify one record?|By the same index in each array|By unrelated random positions|Only by sorting names|By the language tab|The index links a name to its grade.",
            "What must an update validate?|Index bounds and grade range|Only the menu color|Only the array name|Only the last output|Both target and replacement must be valid.",
            "What is the worked duplicate-name search policy?|Return the last match|Invent a unique ID|Delete duplicates|Always return Not found|The traversal updates found on every matching name.",
            "Are console-entered records persisted after program exit?|No, this example is in-memory|Yes, automatically in the course database|Only in Python|Only if a name contains spaces|Workspace submissions persist source and evidence, not the console process memory.",
        ],
    ],
];

const independentActivities = [
    [
        "Write a numbered coffee-making algorithm that checks supplies and uses a safe order.",
        "Design the IPO table and pseudocode for subtracting two integers.",
        "Explain how an algorithm for splitting a bill becomes three language implementations.",
    ],
    [
        "Draw an addition chart using terminators, input/output, process, and arrows.",
        "Draw a chart for the average of three numbers and label every value.",
        "Create a chart for rectangle area and explain the units of its output.",
    ],
    [
        "Declare and display integer, real, text, character, and Boolean values in all three editors.",
        "Write a price calculator using Python uppercase constants, C++ const, and Java final.",
        "Trace three successive assignments and explain why a Python name can change object type while statically declared variables cannot.",
    ],
    [
        "Read and display a full name, integer age, and decimal height.",
        "Reject an invalid integer input without presenting a calculated success result.",
        "Add clear matching prompts to the graph and verify that all three programs preserve a name containing spaces.",
    ],
    [
        "Implement sum, difference, and product for two integers.",
        "Build a simple-interest calculator using principal, decimal rate, and time.",
        "Compare native integer division and negative remainder with the workspace policy using positive and negative operands.",
    ],
    [
        "Create sequential charts for rectangle and triangle area.",
        "Calculate an average grade from three decimal inputs.",
        "Calculate salary from hours and hourly rate and label the output currency.",
    ],
    [
        "Classify a number as positive, negative, or zero.",
        "Implement a pass/fail test with 75 as the inclusive boundary.",
        "Implement a legal-age checker using an explicitly stated 18-year threshold.",
    ],
    [
        "Map numeric grades to five grade-equivalent bands using descending thresholds.",
        "Create a calculator menu with addition, subtraction, multiplication, division, and invalid-choice handling.",
        "Create student remarks using nested decisions; compare elif with else-if and switch alternatives in the language editors.",
    ],
    [
        "Display integers 1 through 10 using while.",
        "Display only even integers through a supplied limit.",
        "Sum 1 through n and trace the n=0 and n=1 boundaries.",
    ],
    [
        "Extend the evaluator to four subjects and revise every averaging step.",
        "Add a student name and document exactly how the report changes.",
        "Test a failing mean, an exactly-75 mean, and an invalid grade in all available runners.",
    ],
    [
        "Display a supplied counted sequence with a positive step.",
        "Create a descending sequence with a negative step and exclusive stop.",
        "Rewrite the while-based summation using for and compare all boundary cases.",
    ],
    [
        "Implement a repeating calculator menu ending with choice 0.",
        "Change the sentinel to -1 and ensure it does not enter the sum.",
        "Trace the same input with pre-test and post-test loops and explain the first-read difference.",
    ],
    [
        "Generate a three-by-four star rectangle as a token stream.",
        "Display row and column number pairs for a multiplication table.",
        "Create a number triangle and trace every inner-loop reset.",
    ],
    [
        "Define a triangle-area helper with two parameters and a return value.",
        "Create an output-only greeting routine directly in each language editor and explain void versus None.",
        "Divide an average calculator into input, calculation, and reporting responsibilities.",
    ],
    [
        "Declare and initialize five scores and access the first and final valid elements.",
        "Update the middle element without changing the collection length.",
        "Trace an invalid index in each language and explain why negative indexing is rejected by the converter.",
    ],
    [
        "Count passing grades during an array traversal.",
        "Find a requested value by linear search and report its index or absence.",
        "Calculate sum, mean, minimum, and maximum for an all-negative collection.",
    ],
    [
        "Validate a menu choice by repeating input until an allowed value is supplied.",
        "Repeat a calculator while the user selects continue.",
        "Count passing and failing grades using a decision inside a traversal.",
    ],
    [
        "Write reusable sum and count-passing functions for arrays.",
        "Pass an empty collection to a helper and document its result policy.",
        "Compare caller state before and after a helper receives a copied array.",
    ],
    [
        "Make dry-run tables for zero, one, and four iterations.",
        "Correct a missing loop update, an incorrect output variable, and an invalid array index.",
        "Produce one syntax, one runtime, and one logic error and classify the actual diagnostics.",
    ],
    [
        "Generalize the grade manager from three grades to five.",
        "Add minimum and maximum summary functions.",
        "Submit all-pass, all-fail, mixed, invalid-entry, and boundary test evidence.",
    ],
    [
        "Decompose a purchase calculator into subtotal, discount, and report modules.",
        "Refine a multi-input scholarship policy into a decision table before coding.",
        "Design a salary calculator with separate regular-pay and overtime calculations.",
    ],
    [
        "Implement a grading policy from a four-row decision table.",
        "Test honors eligibility with only one of the two requirements satisfied.",
        "Add valid-range checks before the honors/pass/fail classification.",
    ],
    [
        "Count positive, negative, and zero values using an explicitly chosen sentinel.",
        "Combine an input-validation loop with a fixed-count outer loop.",
        "Terminate a running total when a stated limit is reached and trace the final included value.",
    ],
    [
        "Generate a centered pyramid using spaces = n-r and stars = 2*r-1.",
        "Generate a reversed triangle using n-r+1 tokens.",
        "Create and trace a number pyramid with distinct row and column values.",
    ],
    [
        "Define a reusable weighted-grade helper accepting three parameters.",
        "Decompose a report into mean, extrema, and classification helpers.",
        "Document parameter domains and return values for each routine in a multi-function chart.",
    ],
    [
        "Implement occurrence counting and linear search on a small array.",
        "Filter passing values by displaying only matching elements.",
        "Trace bubble sort on empty, one-element, sorted, reversed, and duplicate-containing collections.",
    ],
    [
        "Add minimum and maximum actions to the repeating grade menu.",
        "Create a menu that updates one valid array element before reporting.",
        "Draw a modular chart showing every action returning to the interaction loop.",
    ],
    [
        "Translate the supplied chart into pseudocode without viewing source.",
        "Manually implement its logic in Python, C++, and Java before comparing generated source.",
        "Change the condition to accept odd values and create independent expected tests.",
    ],
    [
        "Repair a chart that subtracts a and b instead of adding them before averaging.",
        "Correct pseudocode average <- a + b / 2 and explain operator precedence.",
        "Repair a Python indentation error and a C++/Java integer-division error, recording the failing and corrected tests.",
    ],
    [
        "Extend the fixed record capacity and explain how shared indices preserve record identity.",
        "Add occurrence counts and extrema to the summary report using helper functions.",
        "Submit all nine capstone artifacts with search, update, invalid-index, invalid-grade, and repeated-menu test evidence.",
    ],
];

const course = lessons.map(
    ([title, topics, discussion, problem, inputs, process, outputs, tests, knowledge], i) => {
        const number = i + 1;
        const question = (text) => {
            const [question, correct, ...rest] = text.split("|");
            return {
                question: question.trim(),
                choices: [correct, ...rest.slice(0, 3)],
                answer: 0,
                explanation: rest[3],
            };
        };
        const quiz = knowledge.map(question);
        const [sampleInput, sampleExpected] = tests[0];
        quiz.push(
            {
                question: `For this lesson's worked problem, which input contract is correct?`,
                choices: [
                    inputs,
                    "Any binary file with no input contract.",
                    "Only a screenshot of source code.",
                    "No input regardless of the problem statement.",
                ],
                answer: 0,
                explanation: `The problem specifies: ${inputs}`,
            },
            {
                question: `Which processing plan solves “${problem}”?`,
                choices: [
                    process,
                    "Print an arbitrary value without using the plan.",
                    "Replace every result with a fixed success message.",
                    "Treat the flowchart label as executable source.",
                ],
                answer: 0,
                explanation: `The processing requirement is: ${process}`,
            },
            {
                question: `Which output is expected for test 1 input ${JSON.stringify(sampleInput)}?`,
                choices: [
                    sampleExpected || "(no output)",
                    "This program always prints SUCCESS.",
                    "This program always prints ERROR.",
                    "This program always prints the source code.",
                ],
                answer: 0,
                explanation:
                    "Trace the published algorithm with test 1. This is an expected result; actual execution must be observed separately.",
            },
            {
                question: `Which output is expected for test 2 input ${JSON.stringify(tests[1][0])}?`,
                choices: [
                    tests[1][1] || "(no output)",
                    "The lesson title is printed automatically.",
                    "The source generator reports a quiz score.",
                    "Every input must produce the same nonempty output.",
                ],
                answer: 0,
                explanation:
                    "Test 2 checks a different boundary, branch, or data value under the stated algorithm.",
            },
            {
                question: `During “${title}”, how should a mismatch between expected and actual output be handled?`,
                choices: [
                    "Trace inputs and variable values, correct the responsible step, and rerun the failing test.",
                    "Record the expected value as if it were actual output.",
                    "Mark the lesson complete after code generation.",
                    "Delete the test that found the mismatch.",
                ],
                answer: 0,
                explanation:
                    "A failed comparison is debugging evidence. Preserve the actual result and explain the correction.",
            },
            {
                question: `Which evidence best demonstrates that the three implementations of this lesson agree?`,
                choices: [
                    "Actual runs with the same valid inputs, compared against the independently specified expected outputs.",
                    "Three tabs containing source text.",
                    "Identical variable colors.",
                    "A saved graph without any test record.",
                ],
                answer: 0,
                explanation:
                    "Source generation and execution are distinct. Report unavailable runners rather than inventing their results.",
            },
        );
        return {
            number,
            title,
            level: ["Beginner", "Intermediate", "Advanced"][Math.floor(i / 10)],
            topics: topics.split("; "),
            discussion,
            problem,
            inputs,
            process,
            outputs,
            objectives: [
                `Explain ${topics.split("; ").slice(0, 3).join(", ")} in a language-independent plan.`,
                `Construct and trace a structured flowchart for: ${problem}`,
                "Compare equivalent Python, C++17, and Java 17 programs using the published tests.",
            ],
            prerequisites:
                number === 1
                    ? "No programming experience required."
                    : `Complete lesson ${number - 1}; review the earlier sequence, selection, and repetition concepts used in this plan.`,
            duration: [10, 20, 30].includes(number) ? 120 : 45 + Math.floor(i / 10) * 15,
            tests: tests.map(([input, expected], index) => ({
                name: index === 0 ? "Normal / primary path" : "Boundary / alternate path",
                input,
                expected,
            })),
            exercises: {
                guided: [
                    `Build the IPO table for: ${problem} Identify ${inputs}`,
                    `Trace the worked graph with test 1. Use a table with step, condition, variable values, and output.`,
                    `Complete the provided plan one block at a time. Hint 1: ${process} Hint 2: compare your final output against ${JSON.stringify(sampleExpected)}.`,
                ],
                independent: independentActivities[i],
                debugging: [
                    `Fault A: replace a required calculation, condition, or loop bound in the worked chart with an incorrect one. Choose a published test that detects the fault, record the wrong result, then restore the correct configuration. Expected repair: ${process}`,
                    `Fault B: introduce an undefined variable in a node expression, then correct it using the declared name and type. Compare the validator message with a separate syntax error in one language editor; explain why these are different failures.`,
                ],
                conversion: [
                    `Hide the source tabs. Read the worked chart, write its pseudocode, then implement it manually in Python, C++, and Java. Verify test 1.`,
                    `Change one typed input value or literal in the structured chart, explain the effect on the plan, regenerate all three languages, and verify a new independently calculated expected result.`,
                ],
            },
            code_explanation:
                "Select a flowchart node to highlight its equivalent source lines. v_ prefixes prevent collisions with language keywords. cl_ helpers enforce matching parsing, bounds, checked integer arithmetic, real division, and nonnegative modulo. Python uses indentation and def; C++ uses braces, typed functions, and int main; Java uses a public Main class, static helpers, and main. Output reals use six decimal places with a shared half-away-from-zero rounding policy and a supported output magnitude up to 1e9. Compare the input, calculation, and output nodes separately.",
            quiz,
        };
    },
);
fs.writeFileSync("database/data/programming-course.json", JSON.stringify(course, null, 2) + "\n");
console.log(
    `Authored ${course.length} lessons, ${course.reduce((n, l) => n + l.quiz.length, 0)} quiz questions, and ${course.reduce((n, l) => n + l.tests.length, 0)} test cases.`,
);
