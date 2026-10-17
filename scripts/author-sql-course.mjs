import { writeFile } from 'node:fs/promises';
import initSqlJs from 'sql.js';
import { executeSql } from '../resources/js/sql-engine.js';

const school = `CREATE TABLE sections(id INTEGER PRIMARY KEY, name TEXT NOT NULL UNIQUE);
CREATE TABLE students(id INTEGER PRIMARY KEY, first_name TEXT NOT NULL, last_name TEXT NOT NULL, birth_date TEXT, year_level INT NOT NULL CHECK(year_level BETWEEN 1 AND 4), average DECIMAL(5,2), active BOOLEAN NOT NULL DEFAULT 1 CHECK(active IN (0,1)), section_id INT REFERENCES sections(id));
CREATE TABLE teachers(id INTEGER PRIMARY KEY, name TEXT NOT NULL, mentor_id INT REFERENCES teachers(id));
CREATE TABLE subjects(id INTEGER PRIMARY KEY, name TEXT NOT NULL UNIQUE, units INT NOT NULL CHECK(units>0), teacher_id INT REFERENCES teachers(id));
CREATE TABLE enrollments(student_id INT REFERENCES students(id), subject_id INT REFERENCES subjects(id), enrolled_on DATE NOT NULL, PRIMARY KEY(student_id,subject_id));
CREATE TABLE grades(student_id INT, subject_id INT, score DECIMAL(5,2) CHECK(score BETWEEN 0 AND 100), FOREIGN KEY(student_id,subject_id) REFERENCES enrollments(student_id,subject_id), PRIMARY KEY(student_id,subject_id));
INSERT INTO sections VALUES(1,'Ruby'),(2,'Sapphire');
INSERT INTO students VALUES(1,'Ana','Cruz','2006-05-10',1,88,1,1),(2,'Ben','Reyes','2005-02-20',2,92,1,2),(3,'Cara','Lim','2006-09-01',1,88,1,1),(4,'Dan','Santos','2004-11-15',3,75,0,2),(5,'Eli','Tan','2006-12-01',1,NULL,1,NULL);
INSERT INTO teachers VALUES(1,'Ms. Lopez',NULL),(2,'Mr. Ramos',1),(3,'Ms. Garcia',1);
INSERT INTO subjects VALUES(1,'SQL',3,1),(2,'Programming',3,2),(3,'Statistics',2,3);
INSERT INTO enrollments VALUES(1,1,'2026-06-01'),(1,2,'2026-06-02'),(2,1,'2026-06-01'),(2,3,'2026-06-03'),(3,1,'2026-06-02'),(4,2,'2026-06-04');
INSERT INTO grades VALUES(1,1,90),(1,2,86),(2,1,92),(2,3,92),(3,1,88),(4,2,75);`;
const lessons = [];
function add(title, topics, explanation, sql, task, facts, options = {}) {
    lessons.push({ title, topics, explanation, sql, task, facts, ...options });
}
// Each quiz fact contains a focused question, its correct answer, and a misconception.
add(
    'Introduction to Databases and SQL',
    'databases; SQL; relational databases; tables, rows, and columns; DBMSs; common uses',
    'A database organizes related data so it can be stored, searched, updated, and protected. A relational database uses tables: each row is a record and each column describes an attribute. SQL means Structured Query Language. A DBMS such as SQLite, MySQL, or PostgreSQL manages databases; SQL is the language used to communicate with it. Schools use databases for enrollment and grades, shops for orders, and libraries for books and borrowers. Our fictional school already has students, subjects, teachers, and enrollments. SELECT reads these records without changing them.',
    'SELECT id, first_name, last_name FROM students ORDER BY id;',
    'List the student IDs and names. Explain which part of the result is a row and which part is a column; describe one school use for a database.',
    [
        [
            'What does SQL stand for?',
            'Structured Query Language',
            'School Queue List',
        ],
        [
            'What is one row in students?',
            'One student record',
            'All student names',
        ],
        [
            'What is a column?',
            'One attribute such as first_name',
            'The entire database',
        ],
        ['Which tool manages a database?', 'A DBMS', 'A CSS selector'],
        ['What does SELECT do?', 'Reads records', 'Deletes records'],
    ],
);
add(
    'Creating Databases and Tables',
    'CREATE DATABASE; CREATE TABLE; column names; data types; primary keys; table design',
    'In a server DBMS, CREATE DATABASE school may create a database when your account has permission. SQLite instead opens a database file or an in-memory database; it has no CREATE DATABASE statement. This lab creates the in-memory database for you. CREATE TABLE defines a schema. Use descriptive column names, suitable types, and a primary key that uniquely identifies each row. Decide which attributes belong to one entity before creating a table. IF NOT EXISTS avoids an already-exists error, but does not check whether an existing schema matches your intended design.',
    "CREATE TABLE books(id INTEGER PRIMARY KEY, title TEXT NOT NULL, price DECIMAL(8,2));\nINSERT INTO books VALUES(1,'SQL Basics',250.50);\nSELECT * FROM books;",
    'Create a library_books table with an integer key, title, author, and publication date. Insert two fictional books and select them in key order.',
    [
        ['Which statement defines a table?', 'CREATE TABLE', 'SELECT TABLE'],
        ['What does a primary key identify?', 'A unique row', 'A text color'],
        [
            'How does SQLite create this lab database?',
            'The runner opens an in-memory database',
            'CREATE DATABASE runs in SQLite',
        ],
        [
            'What should column names describe?',
            'The stored attributes',
            'The number of browser tabs',
        ],
        [
            'What does IF NOT EXISTS guarantee?',
            'It avoids an existing-table error',
            'It validates every existing column',
        ],
    ],
    {
        seed: '',
        dialect:
            'CREATE DATABASE is a MySQL/PostgreSQL server concept. In this SQLite lab, use CREATE TABLE inside the database already opened by Run.',
    },
);
add(
    'SQL Data Types',
    'INT; VARCHAR; CHAR; DATE; DECIMAL; BOOLEAN; choosing types; SQLite affinity',
    'INT is used for whole numbers, VARCHAR for variable-length text, CHAR for fixed-width text, DATE for dates, DECIMAL for exact decimal values in DBMSs that implement it, and BOOLEAN for true/false values. SQLite normally uses dynamic typing and type affinity. VARCHAR(20) does not enforce a length of 20, CHAR does not pad automatically, and DECIMAL does not guarantee exact decimal arithmetic. Use integer cents for exact monetary calculations here. ISO dates can be stored as TEXT (YYYY-MM-DD), and boolean values as 0 or 1 with a CHECK constraint. Constraints are needed when a value must obey a rule.',
    "CREATE TABLE type_demo(id INT PRIMARY KEY, name VARCHAR(30), code CHAR(3), joined DATE, price_cents INT, active BOOLEAN CHECK(active IN (0,1)));\nINSERT INTO type_demo VALUES(1,'Ana','SQL','2026-06-01',12550,1);\nSELECT name, joined, price_cents, active FROM type_demo;",
    'Create an inventory table and choose types for ID, name, date, price in cents, and availability. Add a CHECK for availability and explain why SQLite VARCHAR length alone is insufficient.',
    [
        [
            'Which value naturally uses INT?',
            'A whole-number count',
            'A paragraph',
        ],
        [
            'How are dates represented in this example?',
            'ISO date text',
            'CSS pixels',
        ],
        [
            'Does SQLite VARCHAR(30) enforce length 30?',
            'No; add an explicit constraint',
            'Yes, always',
        ],
        [
            'Which storage helps exact currency arithmetic here?',
            'Integer cents',
            'Unrestricted floating-point values',
        ],
        [
            'Which values represent boolean flags here?',
            '0 and 1',
            'Every arbitrary string',
        ],
    ],
    {
        dialect:
            'SQLite affinity differs from strict server DBMS types. VARCHAR/CHAR lengths and DECIMAL precision are not enforced as declarations alone.',
    },
);
add(
    'Inserting Data',
    'INSERT INTO; one record; multiple records; column-value matching; invalid data',
    'INSERT INTO adds records. State the destination columns so values clearly match their intended columns. A single VALUES tuple inserts one row; comma-separated tuples insert several. Text and date literals use single quotes. NULL represents a missing value and is different from an empty string. Omitting a required column without a default, reusing a primary key, or violating a CHECK or foreign key raises an error. Avoid inserting data merely to work around a failed constraint; correct the value or the design.',
    "INSERT INTO students(id, first_name, last_name, year_level) VALUES(6,'Faye','Diaz',2),(7,'Gio','Uy',1);\nSELECT id, first_name, year_level FROM students WHERE id>=6 ORDER BY id;",
    'Insert three new fictional students using explicit columns and one multi-row INSERT. Verify their names and year levels. Explain a duplicate-key error without keeping invalid data.',
    [
        ['What adds rows?', 'INSERT INTO', 'ORDER BY'],
        [
            'How do values match an explicit column list?',
            'By position in that list',
            'By alphabetical order',
        ],
        ['What represents a missing value?', 'NULL', 'The string NULL always'],
        [
            'How can several rows be inserted?',
            'Several VALUES tuples',
            'Several column aliases',
        ],
        [
            'What happens to a duplicate primary key?',
            'The constraint rejects it',
            'It becomes a valid duplicate',
        ],
    ],
);
add(
    'Retrieving Data with SELECT',
    'SELECT; SELECT *; specific columns; aliases; DISTINCT',
    'SELECT chooses output expressions and FROM chooses the source table. SELECT * reads all columns; explicit columns make reports easier to understand and avoid unnecessary data. AS supplies a readable output alias without renaming the stored column. DISTINCT removes duplicate combinations of the selected values. The order of rows is not guaranteed unless ORDER BY is used. Reading a result does not update the source records.',
    'SELECT DISTINCT year_level AS year FROM students ORDER BY year;',
    'Write one SELECT * query, one query with only student IDs and names using aliases, and one DISTINCT year-level query. Use ORDER BY for repeatable output.',
    [
        ['What does SELECT * select?', 'All columns', 'All databases'],
        ['What does AS change?', 'An output label', 'The stored table name'],
        [
            'What does DISTINCT remove?',
            'Duplicate selected combinations',
            'All NULL rows automatically',
        ],
        ['Which clause names the source?', 'FROM', 'SET'],
        [
            'What guarantees a chosen row order?',
            'ORDER BY',
            'The insertion order alone',
        ],
    ],
);
add(
    'Filtering Records',
    'WHERE; comparisons; AND; OR; NOT; BETWEEN; IN; NULL',
    'WHERE keeps rows whose condition is true. Compare values with =, <>, !=, <, <=, >, or >=. AND requires both conditions; OR requires either; NOT reverses a condition. AND binds more tightly than OR, so use parentheses when combining them. BETWEEN includes both endpoints. IN tests membership in a list or query. NULL means unknown: use IS NULL or IS NOT NULL rather than = NULL. Filters are useful for both reports and carefully targeted updates.',
    'SELECT first_name, average FROM students WHERE active=1 AND year_level IN (1,2) AND average BETWEEN 85 AND 95 ORDER BY id;\nSELECT first_name FROM students WHERE average IS NULL ORDER BY id;',
    'Find active year-one students, students with averages between 80 and 90, and students whose averages are missing. Add a parenthesized OR condition and explain its effect.',
    [
        ['What filters source rows?', 'WHERE', 'CREATE VIEW'],
        [
            'What does AND require?',
            'Both conditions true',
            'Either condition true',
        ],
        ['Does BETWEEN include endpoints?', 'Yes', 'No'],
        [
            'How do you test for missing averages?',
            'average IS NULL',
            'average = NULL',
        ],
        ['What does IN test?', 'Membership', 'Sorting direction'],
    ],
);
add(
    'Sorting and Limiting Results',
    'ORDER BY; ASC; DESC; multiple columns; LIMIT; DBMS equivalents',
    'ORDER BY controls the result order. ASC sorts ascending (the default) and DESC sorts descending. A second column breaks ties in the first; include a stable unique key when selecting a limited set of tied rows. LIMIT caps returned rows in SQLite and MySQL. SQL Server commonly uses TOP or OFFSET/FETCH, while other DBMSs support FETCH FIRST. LIMIT without ORDER BY does not reliably mean the best or earliest records. NULL sorting conventions also differ by DBMS.',
    'SELECT id, first_name, average FROM students WHERE average IS NOT NULL ORDER BY average DESC, id ASC LIMIT 3;',
    'Produce the top three known averages with stable ID tie-breaking, then sort all names ascending by last name and first name.',
    [
        ['Which keyword sorts descending?', 'DESC', 'DOWN'],
        ['What is the default sort direction?', 'ASC', 'DESC'],
        ['Why add a second sort column?', 'To break ties', 'To create records'],
        ['Which clause caps SQLite results?', 'LIMIT', 'SET'],
        [
            'What makes a top-three report reliable?',
            'ORDER BY before LIMIT',
            'LIMIT alone',
        ],
    ],
    {
        dialect:
            'SQLite/MySQL use LIMIT; SQL Server uses TOP or OFFSET/FETCH. Teach the equivalent concept rather than running unsupported syntax here.',
    },
);
add(
    'Updating and Deleting Records',
    'UPDATE; SET; DELETE; WHERE safety; destructive changes',
    'UPDATE changes existing values with SET. DELETE removes rows. A WHERE clause targets intended records; without it, an UPDATE or DELETE affects every row in the table. First run a SELECT using the same condition and inspect its rows. Use a stable key and a transaction for important changes. DELETE removes records, whereas DROP TABLE removes the table definition too. In this lab all changes affect fictional data and disappear on the next Run; real systems need permissions, backups, and reviewed conditions.',
    'SELECT id, first_name, average FROM students WHERE id=4;\nUPDATE students SET average=80 WHERE id=4;\nDELETE FROM students WHERE id=5;\nSELECT id, first_name, average FROM students ORDER BY id;',
    'Preview one student by ID, update that student only, and verify the new value. Insert a temporary student, preview it, then delete it by its key. Explain the risk of omitting WHERE.',
    [
        ['What specifies updated values?', 'SET', 'DISTINCT'],
        [
            'What happens without WHERE in UPDATE?',
            'All rows are targeted',
            'No rows are targeted',
        ],
        [
            'What should precede a destructive query?',
            'A SELECT with the same condition',
            'An unrelated LIMIT',
        ],
        ['What does DELETE remove?', 'Rows', 'The table definition'],
        [
            'What is a reliable target identifier?',
            'A unique primary key',
            'A possibly duplicated name',
        ],
    ],
);
add(
    'Basic Aggregate Functions',
    'COUNT; SUM; AVG; MIN; MAX; NULL values',
    'Aggregates summarize several rows into one result. COUNT(*) counts rows; COUNT(column) counts non-NULL values. SUM totals, AVG computes the mean of known numeric values, and MIN/MAX find extremes. Most aggregates ignore NULL values; SUM or AVG of no matching values can be NULL, while COUNT returns zero. A missing average must not silently become a zero grade. Use ROUND only when presenting a value, and document what your statistic includes.',
    'SELECT COUNT(*) AS students, COUNT(average) AS known_averages, SUM(average) AS total, ROUND(AVG(average),2) AS mean, MIN(average) AS lowest, MAX(average) AS highest FROM students;',
    'Report total students, count of known averages, mean, minimum, and maximum. Then compute the same statistics for active year-one students and explain how NULL affects each count.',
    [
        ['What counts every row?', 'COUNT(*)', 'COUNT(average) always'],
        ['What does AVG usually ignore?', 'NULL values', 'Every low number'],
        ['Which function finds a minimum?', 'MIN', 'BOTTOM'],
        ['Which function totals numeric values?', 'SUM', 'DISTINCT'],
        ['What is COUNT on an empty match?', '0', 'Always NULL'],
    ],
);
const beginnerProject = `CREATE TABLE students(id INTEGER PRIMARY KEY, name TEXT NOT NULL, year_level INT CHECK(year_level BETWEEN 1 AND 4), average REAL CHECK(average BETWEEN 0 AND 100));
INSERT INTO students VALUES(1,'Ana Cruz',1,88),(2,'Ben Reyes',2,92),(3,'Cara Lim',1,85),(4,'Temporary Student',1,70);
SELECT * FROM students ORDER BY id;
SELECT name, average FROM students WHERE year_level=1 ORDER BY average DESC,id;
UPDATE students SET average=90 WHERE id=1;
DELETE FROM students WHERE id=4;
SELECT COUNT(*) AS students, ROUND(AVG(average),2) AS mean, MIN(average) AS lowest, MAX(average) AS highest FROM students;`;
add(
    'Beginner Project — Student Database',
    'student table; insert; view; search/filter; update; delete; class statistics',
    'Design a small student database from a school brief. Separate the schema, seed records, reports, and carefully targeted modifications in one repeatable script. Include comments explaining the chosen key and types. Validate the counts and statistics against hand calculations. A successful Run is practice evidence, not automatic grading: submit your original work and pass the quiz for teacher review.',
    beginnerProject,
    'Create your own student table with a primary key and useful constraints. Insert at least five fictional records. Include all-record and filtered reports, one targeted update, a temporary record deletion, and COUNT/AVG/MIN/MAX statistics. Comment expected counts and test boundary values. Keep the entire script repeatable from an empty database.',
    [
        [
            'What identifies each student uniquely?',
            'A primary key',
            'An average grade',
        ],
        [
            'What makes the project repeatable in this lab?',
            'Including schema and inserts in one script',
            'Depending on the previous Run',
        ],
        [
            'What protects a targeted deletion?',
            'WHERE with the intended key',
            'Omitting WHERE',
        ],
        [
            'How should statistics be checked?',
            'Compare with known sample values',
            'Assume any output is correct',
        ],
        [
            'What completes this project?',
            'Teacher approval and a passed quiz',
            'Run SQL alone',
        ],
    ],
    { seed: '', project: true },
);
add(
    'Constraints',
    'PRIMARY KEY; FOREIGN KEY; NOT NULL; UNIQUE; DEFAULT; CHECK; integrity',
    'Constraints make invalid data harder to store. PRIMARY KEY identifies rows; FOREIGN KEY connects valid parent and child records; NOT NULL requires a value; UNIQUE prevents duplicates; DEFAULT supplies an omitted value; CHECK evaluates a condition. A CHECK that evaluates to NULL may pass, so combine NOT NULL with CHECK for required values. SQLite foreign-key enforcement is enabled at the start of each Run; do not disable it. Constraints complement validation and do not replace access control.',
    "CREATE TABLE clubs(id INTEGER PRIMARY KEY, name TEXT NOT NULL UNIQUE, capacity INT NOT NULL DEFAULT 20 CHECK(capacity>0));\nCREATE TABLE memberships(student_id INT REFERENCES students(id), club_id INT REFERENCES clubs(id), PRIMARY KEY(student_id,club_id));\nINSERT INTO clubs(id,name) VALUES(1,'Coding Club');\nINSERT INTO memberships VALUES(1,1);\nSELECT name, capacity FROM clubs;",
    'Create clubs and memberships with required names, unique club names, positive capacity with a default, and foreign keys. Demonstrate valid inserts; document expected failures for duplicate names, missing students, and invalid capacity.',
    [
        ['What prevents a missing required value?', 'NOT NULL', 'ORDER BY'],
        [
            'What links a child to an existing parent?',
            'FOREIGN KEY',
            'DISTINCT',
        ],
        ['What supplies an omitted value?', 'DEFAULT', 'HAVING'],
        [
            'How do you require a positive capacity?',
            'NOT NULL plus CHECK(capacity>0)',
            'A column alias',
        ],
        ['What prevents duplicate club names?', 'UNIQUE', 'LIMIT'],
    ],
);
add(
    'Relationships Between Tables',
    'one-to-one; one-to-many; many-to-many; foreign keys; junction tables',
    'A one-to-one relationship may use a shared primary key or a unique foreign key, such as one profile per student. One section can have many students, a one-to-many relationship represented by section_id on students. Students can take many subjects and subjects can have many students: use an enrollments junction table with two foreign keys and a composite primary key. Do not store subject IDs as a comma-separated text list. Relationship cardinality guides placement of keys and constraints.',
    "CREATE TABLE student_profiles(student_id INTEGER PRIMARY KEY REFERENCES students(id), bio TEXT);\nINSERT INTO student_profiles VALUES(1,'Enjoys coding');\nSELECT student_id, subject_id FROM enrollments ORDER BY student_id,subject_id;",
    'Draw or describe the three relationship types. Add a one-to-one profile table, and query the existing junction table to show one student taking multiple subjects.',
    [
        [
            'What represents students taking many subjects?',
            'An enrollments junction table',
            'A comma-separated column',
        ],
        [
            'Where is the key in section-to-students?',
            'On the students side',
            'Only in an alias',
        ],
        [
            'How is one profile per student enforced?',
            'A unique or primary student key',
            'Several duplicate rows',
        ],
        [
            'What does the junction key prevent?',
            'Duplicate student-subject pairs',
            'All enrollments',
        ],
        [
            'What expresses relationship validity?',
            'Foreign keys',
            'Result ordering',
        ],
    ],
);
add(
    'JOINs',
    'INNER JOIN; LEFT JOIN; RIGHT JOIN; FULL OUTER JOIN; aliases; multiple tables',
    'JOIN combines rows using a stated relationship. INNER JOIN returns matching pairs; LEFT JOIN also keeps unmatched left rows with NULL right values. RIGHT JOIN preserves the right side, and FULL OUTER JOIN preserves unmatched rows from both sides. The bundled SQLite supports RIGHT and FULL JOIN, but older SQLite and some server DBMSs do not. Aliases shorten qualified column references. Multiple joins can connect students, enrollments, subjects, and teachers. Missing ON conditions or incorrect keys can multiply records; verify the intended report grain.',
    'SELECT s.first_name, sub.name AS subject, t.name AS teacher FROM students s INNER JOIN enrollments e ON e.student_id=s.id INNER JOIN subjects sub ON sub.id=e.subject_id INNER JOIN teachers t ON t.id=sub.teacher_id ORDER BY s.id,sub.id;\nSELECT s.first_name, sec.name AS section FROM students s LEFT JOIN sections sec ON sec.id=s.section_id ORDER BY s.id;',
    'Write an enrollment report with INNER JOIN and a student-section report with LEFT JOIN. Identify which student is retained without a section. Try equivalent RIGHT JOIN and explain FULL OUTER JOIN with small unmatched tables.',
    [
        ['What does INNER JOIN keep?', 'Matching pairs', 'Every unmatched row'],
        ['What does LEFT JOIN preserve?', 'All left rows', 'Only right rows'],
        [
            'Why qualify ambiguous column names?',
            'To identify their source table',
            'To change their type',
        ],
        [
            'What can a missing join condition cause?',
            'A Cartesian multiplication',
            'Automatic deduplication',
        ],
        [
            'What does FULL OUTER JOIN preserve?',
            'Matched and unmatched rows from both sides',
            'Only matched rows',
        ],
    ],
    {
        dialect:
            'RIGHT/FULL JOIN run in the bundled modern SQLite. Older SQLite and MySQL versions differ; LEFT JOIN can express many RIGHT JOIN reports, and full joins may require a UNION-based alternative.',
    },
);
add(
    'GROUP BY and HAVING',
    'groups; aggregate functions; GROUP BY; HAVING; WHERE versus HAVING',
    'GROUP BY creates one aggregate result per distinct group. WHERE filters source rows before grouping; HAVING filters groups after aggregates are computed. Select group keys and aggregate expressions, rather than unrelated non-grouped columns: permissive DBMSs may return an arbitrary value. COUNT and AVG can summarize enrollment or class data. A WHERE filter on the right side of a LEFT JOIN may discard its unmatched rows; choose the intended condition placement carefully.',
    'SELECT year_level, COUNT(*) AS students, ROUND(AVG(average),2) AS mean FROM students WHERE active=1 GROUP BY year_level HAVING COUNT(*)>=2 ORDER BY year_level;',
    'Group active students by year level and calculate counts and means. Keep only groups with at least two students. Explain the different roles of WHERE and HAVING.',
    [
        ['When does WHERE filter?', 'Before grouping', 'Only after AVG'],
        ['What filters aggregate groups?', 'HAVING', 'SET'],
        [
            'What does GROUP BY produce?',
            'One summary per group',
            'A new stored table automatically',
        ],
        [
            'What should a grouped SELECT contain?',
            'Group keys and aggregate expressions',
            'Arbitrary unrelated values',
        ],
        [
            'How do you keep groups of at least two?',
            'HAVING COUNT(*)>=2',
            'WHERE COUNT(*)>=2',
        ],
    ],
);
add(
    'String and Numeric Functions',
    'UPPER; LOWER; LENGTH; CONCAT; ROUND; TRIM; SUBSTR; ABS',
    'Functions transform or calculate selected values without necessarily changing stored data. UPPER and LOWER change case, LENGTH measures text, TRIM removes surrounding spaces, and SUBSTR extracts part of a string. SQLite concatenation uses ||; the lab also supports CONCAT, but function availability and NULL behavior differ between DBMSs. ROUND formats numeric values to chosen decimal places, and ABS returns magnitude. Use aliases to label expressions and avoid confusing a rounded display with exact currency storage.',
    "SELECT UPPER(first_name) AS upper_name, LOWER(last_name) AS lower_name, LENGTH(first_name) AS letters, first_name || ' ' || last_name AS full_name, ROUND(average,1) AS mean FROM students ORDER BY id;\nSELECT TRIM('  SQL  ') AS cleaned, SUBSTR('Database',1,4) AS prefix, ABS(-12) AS magnitude, CONCAT('Code','Lab') AS combined;",
    'Produce cleaned full-name and uppercase reports. Demonstrate LENGTH, SUBSTR, ROUND, and ABS with your own literals. Compare concatenation with a NULL input and document the behavior.',
    [
        ['Which function changes text to uppercase?', 'UPPER', 'ROUND'],
        ['What does LENGTH return?', 'Text length', 'The highest grade'],
        [
            'What does || do in SQLite?',
            'Concatenates text',
            'Performs OR filtering',
        ],
        [
            'What does ROUND affect here?',
            'The selected numeric presentation',
            'The table schema',
        ],
        ['What does TRIM remove?', 'Surrounding spaces', 'Every letter'],
    ],
    {
        dialect:
            'Function names and NULL behavior vary. SQLite || propagates NULL; CONCAT handles NULL differently. Verify the target DBMS rather than assuming identical functions.',
    },
);
add(
    'Date and Time Queries',
    'ISO dates; current date/time; parts; filtering; calculations; DBMS differences',
    'Store date-only values consistently as YYYY-MM-DD text in SQLite. CURRENT_DATE and CURRENT_TIMESTAMP use UTC in SQLite and vary on server systems. strftime extracts parts, date applies modifiers, and julianday supports day differences. Use half-open date ranges for timestamp filtering to avoid excluding later times on the final day. Time zones and calendar units need explicit choices: one month is not always 30 days. The examples use a fixed date for reproducibility rather than depending on today.',
    "SELECT first_name, strftime('%Y',birth_date) AS birth_year, date(birth_date,'+18 years') AS eighteenth_birthday FROM students ORDER BY id;\nSELECT student_id, enrolled_on, CAST(julianday('2026-06-10')-julianday(enrolled_on) AS INT) AS days_since FROM enrollments WHERE enrolled_on>='2026-06-01' AND enrolled_on<'2026-06-04' ORDER BY student_id,subject_id;",
    'Extract birth years, filter enrollments in a chosen date interval, and calculate days since enrollment using a fixed reference date. Add a separate CURRENT_TIMESTAMP query and explain why its output changes.',
    [
        [
            'What is the chosen date-text format?',
            'YYYY-MM-DD',
            'An arbitrary local format',
        ],
        [
            'What extracts date parts in SQLite?',
            'strftime',
            'DATEPART is universal',
        ],
        [
            'What helps calculate elapsed days?',
            'julianday difference',
            'Text concatenation',
        ],
        [
            'Why use a fixed date in examples?',
            'Reproducible output',
            'To disable filtering',
        ],
        [
            'Why use a half-open timestamp interval?',
            'It handles the ending day consistently',
            'It returns only NULL dates',
        ],
    ],
    {
        dialect:
            'SQLite uses date/strftime/julianday; MySQL DATE_FORMAT and PostgreSQL EXTRACT/interval syntax are different. Current SQLite timestamps are UTC.',
    },
);
add(
    'Subqueries',
    'subqueries in WHERE and SELECT; nesting; IN; EXISTS; scalar results',
    'A subquery is a query inside another statement. A scalar subquery supplies one value, such as the average used in a comparison. IN can compare a key with a set of returned keys. EXISTS tests whether any matching row exists; its selected value is not important. A correlated subquery refers to the outer row. Nested queries should remain readable. NOT IN with NULL in its result can produce surprising unknown comparisons; NOT EXISTS is often clearer when finding missing relationships.',
    'SELECT first_name, average, (SELECT ROUND(AVG(average),2) FROM students) AS class_mean FROM students WHERE average>(SELECT AVG(average) FROM students) ORDER BY id;\nSELECT s.first_name FROM students s WHERE EXISTS(SELECT 1 FROM enrollments e WHERE e.student_id=s.id) ORDER BY s.id;',
    'Find above-average students with a scalar subquery, students enrolled in SQL with IN, and students with no enrollment using NOT EXISTS.',
    [
        ['What is a subquery?', 'A query inside another query', 'A CSS rule'],
        [
            'What should a scalar subquery supply?',
            'One value',
            'A whole unrelated table',
        ],
        [
            'What does EXISTS test?',
            'Whether a matching row exists',
            'The alphabetical first name',
        ],
        [
            'What does a correlated query reference?',
            'An outer row',
            'Only a constant',
        ],
        [
            'What can complicate NOT IN?',
            'NULL values in the returned set',
            'ORDER BY alone',
        ],
    ],
);
add(
    'Views',
    'CREATE VIEW; querying; update concepts; reusable reports; limitations',
    'A view names a stored SELECT definition. Query it like a table to reuse a report and simplify application queries. An ordinary view does not store a frozen copy of rows: later changes to base tables appear in later queries. Views can expose selected columns, but they are not a complete authorization system on their own. SQLite views are read-only unless an INSTEAD OF trigger handles changes; updateability rules differ in server DBMSs. Keep explicit column names and document dependencies.',
    'CREATE VIEW active_students AS SELECT id, first_name, last_name, year_level FROM students WHERE active=1;\nSELECT first_name, year_level FROM active_students WHERE year_level=1 ORDER BY id;',
    'Create a view of active students and a reusable enrollment-report view. Query each with a filter; explain why updating a SQLite view directly fails.',
    [
        [
            'What does CREATE VIEW store?',
            'A query definition',
            'A frozen copy of all rows',
        ],
        ['How can a view be queried?', 'With SELECT', 'Only with INSERT'],
        [
            'What happens after a base row changes?',
            'A later view query reflects it',
            'The view stays frozen forever',
        ],
        [
            'Are ordinary SQLite views directly writable?',
            'No, absent INSTEAD OF handling',
            'Yes, all of them',
        ],
        [
            'Why use a view?',
            'Reuse a clear report definition',
            'Replace every permission check',
        ],
    ],
    {
        dialect:
            'SQLite views are read-only by default. Some server views can be updated under specific rules; an INSTEAD OF trigger is a separate SQLite technique.',
    },
);
add(
    'Indexes and Query Performance Basics',
    'index purpose; CREATE INDEX; searches; costs; performance basics',
    'An index stores a structure that can help locate rows without scanning every record. CREATE INDEX names a table and its indexed columns. Indexes require storage and maintenance on INSERT, UPDATE, and DELETE; indexing every column can make writes worse. Composite index column order matters. An optimizer may choose a scan on a tiny table even with an index. Measure representative workloads and inspect plans rather than claiming every index makes every query faster.',
    'CREATE INDEX idx_students_year_name ON students(year_level,last_name);\nSELECT id, first_name FROM students WHERE year_level=1 ORDER BY last_name,id;\nEXPLAIN QUERY PLAN SELECT id FROM students WHERE year_level=1;',
    'Create an index supporting a year-level filter. Inspect the plan before and after creation in the same script, and explain its write and storage costs without asserting timings from this tiny dataset.',
    [
        [
            'What may an index reduce?',
            'Rows examined during a search',
            'The number of valid records',
        ],
        ['What creates an index?', 'CREATE INDEX', 'CREATE SPEED'],
        [
            'What is an index trade-off?',
            'Extra storage and write maintenance',
            'Guaranteed faster every query',
        ],
        ['Does the optimizer always use an index?', 'No', 'Yes'],
        [
            'What matters in a composite index?',
            'Column order',
            'The browser window size',
        ],
    ],
);
const intermediateProject = `${school}
CREATE VIEW enrollment_report AS SELECT s.id AS student_id,s.first_name,sub.name AS subject,t.name AS teacher FROM students s JOIN enrollments e ON e.student_id=s.id JOIN subjects sub ON sub.id=e.subject_id JOIN teachers t ON t.id=sub.teacher_id;
CREATE INDEX idx_enrollments_subject ON enrollments(subject_id);
SELECT * FROM enrollment_report ORDER BY student_id,subject;
SELECT sub.name,COUNT(e.student_id) AS students FROM subjects sub LEFT JOIN enrollments e ON e.subject_id=sub.id GROUP BY sub.id,sub.name HAVING COUNT(e.student_id)>=2 ORDER BY sub.id;
SELECT first_name FROM students WHERE id IN(SELECT student_id FROM enrollments WHERE subject_id=1) ORDER BY id;`;
add(
    'Intermediate Project — School Enrollment Database',
    'students; subjects; teachers; enrollments; keys; JOINs; grouping; views; searching',
    'Build a relational enrollment database instead of storing names and subjects repeatedly in one row. Use a junction table for enrollment, enforce parent keys, and define the grain of each report. Include a view for repeated reports and an index justified by a frequent filter. Test unmatched students and duplicate enrollment attempts. Submit a schema description and working reports with your SQL.',
    intermediateProject,
    'From an empty database create students, teachers, subjects, and enrollments with primary and foreign keys. Add at least five students, three subjects, two teachers, and six enrollments. Include INNER/LEFT JOIN reports, GROUP BY with HAVING, an IN or EXISTS query, a view, a targeted search, and an index justification. Document expected duplicate and invalid-parent failures.',
    [
        [
            'Which table resolves many-to-many enrollment?',
            'enrollments',
            'A comma-separated subjects field',
        ],
        [
            'What protects parent-child integrity?',
            'FOREIGN KEY',
            'A SELECT alias',
        ],
        [
            'What retains students with no enrollment?',
            'LEFT JOIN',
            'INNER JOIN alone',
        ],
        ['What filters grouped counts?', 'HAVING', 'SET'],
        [
            'How should an index be justified?',
            'By a relevant query pattern and plan',
            'By adding one to every column',
        ],
    ],
    { seed: '', project: true },
);
add(
    'Advanced JOINs and Set Operations',
    'self joins; multiple joins; UNION; UNION ALL; INTERSECT; EXCEPT/MINUS; compatibility',
    'A self join relates rows in the same table, such as teachers and their mentors. Set operations combine compatible result shapes. UNION removes duplicate rows while UNION ALL retains them. INTERSECT returns rows present in both sets; EXCEPT returns left rows absent on the right. Some DBMSs use MINUS instead of EXCEPT or have version-dependent support. Select the same number of compatible columns and apply final ORDER BY to the combined output. Join multiplicity differs from set membership; count the intended entities.',
    'SELECT t.name AS teacher,m.name AS mentor FROM teachers t LEFT JOIN teachers m ON m.id=t.mentor_id ORDER BY t.id;\nSELECT student_id FROM enrollments WHERE subject_id=1 INTERSECT SELECT student_id FROM enrollments WHERE subject_id=2 ORDER BY student_id;\nSELECT id AS student_id FROM students EXCEPT SELECT student_id FROM enrollments ORDER BY student_id;\nSELECT year_level FROM students WHERE id<=2 UNION ALL SELECT year_level FROM students WHERE id=3;',
    'Write a teacher-mentor self join. Compare UNION with UNION ALL, find students enrolled in both two subjects using INTERSECT, and find unenrolled students with EXCEPT.',
    [
        [
            'What relates teachers to mentors in the same table?',
            'A self join',
            'A DEFAULT clause',
        ],
        ['What preserves duplicates?', 'UNION ALL', 'UNION'],
        ['What returns shared rows?', 'INTERSECT', 'EXCEPT'],
        [
            'What returns only left-side differences?',
            'EXCEPT',
            'INNER JOIN always',
        ],
        [
            'What must set-operation SELECTs share?',
            'Compatible column counts and types',
            'The same table alias',
        ],
    ],
    {
        dialect:
            'SQLite supports UNION, UNION ALL, INTERSECT, and EXCEPT. MINUS is used by some DBMSs, and support varies by product/version.',
    },
);
add(
    'Advanced Subqueries and Common Table Expressions',
    'correlated subqueries; WITH; CTEs; multiple CTEs; recursive introduction',
    'Correlated subqueries depend on an outer row, useful for existence checks and per-entity statistics. WITH gives intermediate result sets names (CTEs) within one statement; it does not create permanent tables. Multiple CTEs can build a report in readable stages. WITH RECURSIVE repeats from an anchor using a recursive term, useful for hierarchies. Include a termination condition and consider cycles and depth; unbounded recursion can exhaust resources. A CTE is a readability tool and is not automatically faster.',
    'WITH counts AS(SELECT student_id,COUNT(*) AS subjects FROM enrollments GROUP BY student_id), active AS(SELECT id,first_name FROM students WHERE active=1) SELECT a.first_name,COALESCE(c.subjects,0) AS subjects FROM active a LEFT JOIN counts c ON c.student_id=a.id ORDER BY a.id;\nWITH RECURSIVE numbers(n) AS(SELECT 1 UNION ALL SELECT n+1 FROM numbers WHERE n<5) SELECT n FROM numbers ORDER BY n;',
    'Use two CTEs to summarize active students and enrollment counts. Add a correlated EXISTS report and a recursive sequence with an explicit upper bound; explain how a hierarchy would require cycle handling.',
    [
        [
            'How long does a CTE name exist?',
            'Within its statement',
            'As a permanent table always',
        ],
        ['Which keyword begins a CTE?', 'WITH', 'SET'],
        [
            'What starts a recursive CTE?',
            'An anchor query',
            'A foreign key alone',
        ],
        [
            'What makes recursion safer?',
            'A termination condition and cycle strategy',
            'Removing its WHERE clause',
        ],
        ['Does a CTE guarantee faster execution?', 'No', 'Yes'],
    ],
);
add(
    'Window Functions',
    'OVER; PARTITION BY; window ORDER BY; ROW_NUMBER; RANK; DENSE_RANK; running totals',
    'Window functions calculate over related rows while keeping individual rows visible. OVER defines the window; PARTITION BY restarts calculations per group, and its ORDER BY defines calculation order. ROW_NUMBER assigns a distinct sequence; RANK leaves gaps after tied ranks; DENSE_RANK does not. Do not add a unique tie-breaker inside a rank window if you intend equal scores to tie. Running totals should specify ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW for a row-based frame. Use a separate final ORDER BY to control presentation.',
    'SELECT first_name,year_level,average,ROW_NUMBER() OVER(PARTITION BY year_level ORDER BY average DESC,id) AS sequence,RANK() OVER(PARTITION BY year_level ORDER BY average DESC) AS ranking,DENSE_RANK() OVER(PARTITION BY year_level ORDER BY average DESC) AS dense_ranking FROM students WHERE average IS NOT NULL ORDER BY year_level,average DESC,id;\nSELECT student_id,score,SUM(score) OVER(ORDER BY student_id,subject_id ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS running_total FROM grades ORDER BY student_id,subject_id;',
    'Rank known averages within each year using all three ranking functions. Add tied scores to explain gaps, and compute a running score total with an explicit ROWS frame.',
    [
        ['What defines the window?', 'OVER', 'CREATE WINDOW TABLE'],
        [
            'What resets ranking by year?',
            'PARTITION BY year_level',
            'A column alias',
        ],
        ['Which ranking can leave gaps after ties?', 'RANK', 'DENSE_RANK'],
        ['Which assigns a unique sequence?', 'ROW_NUMBER', 'RANK always'],
        [
            'What makes the running sum row-based?',
            'An explicit ROWS frame',
            'An omitted frame always',
        ],
    ],
);
add(
    'Stored Procedures and Functions',
    'stored routines; creation; parameters; functions; reusable logic; dialect differences',
    'A stored procedure is reusable database-side logic invoked by a call; a stored function returns a value or result under DBMS-specific rules. Parameters support reuse without concatenating user input. MySQL routine syntax uses CREATE PROCEDURE and CALL, often with a client DELIMITER command; PostgreSQL functions use different return and language declarations. SQLite has no SQL CREATE PROCEDURE or CREATE FUNCTION. This lesson compares those concepts and runs a view/CTE alternative in SQLite. Application-registered functions are a different feature and are deliberately not exposed to student SQL.',
    'CREATE VIEW student_subject_counts AS SELECT s.id,s.first_name,COUNT(e.subject_id) AS subject_count FROM students s LEFT JOIN enrollments e ON e.student_id=s.id GROUP BY s.id,s.first_name;\nWITH requested AS(SELECT 1 AS student_id) SELECT c.* FROM student_subject_counts c JOIN requested r ON r.student_id=c.id;',
    'Comment a MySQL procedure definition with an IN student_id parameter and its CALL, clearly labeling it conceptual. Then implement and run the SQLite view/CTE report for a selected student. Explain differences between procedures, functions, views, and application logic.',
    [
        ['Does SQLite support SQL CREATE PROCEDURE?', 'No', 'Yes'],
        [
            'What does a stored function generally provide?',
            'A returned value or result',
            'Only a browser color',
        ],
        [
            'Why use routine parameters?',
            'Safe reusable inputs',
            'To concatenate arbitrary SQL',
        ],
        [
            'Is MySQL DELIMITER part of SQLite SQL?',
            'No, it is a MySQL client command',
            'Yes',
        ],
        [
            'What runs as the alternative here?',
            'A SQLite view and CTE query',
            'A simulated procedure engine',
        ],
    ],
    {
        dialect:
            'Stored procedures/functions are conceptual MySQL/PostgreSQL content. This SQLite lab does not execute them; its runnable example is explicitly a view/CTE alternative.',
        syntax: '-- MySQL concept; do not run in SQLite:\n-- CREATE PROCEDURE student_subjects(IN p_student_id INT)\n-- SELECT subject_id FROM enrollments WHERE student_id=p_student_id;\n-- CALL student_subjects(1);\n-- Stored function syntax is DBMS-specific; PostgreSQL functions declare RETURNS and LANGUAGE.',
    },
);
add(
    'Triggers',
    'BEFORE; AFTER; INSERT/UPDATE/DELETE; OLD/NEW; audit logs; risks',
    'A trigger responds automatically to a table change. INSERT exposes NEW values, DELETE exposes OLD values, and UPDATE exposes both. BEFORE triggers can reject invalid operations; AFTER triggers can record audit entries. SQLite uses row triggers with BEGIN/END and semicolons inside the body; do not split SQL blindly at semicolons. Keep trigger logic small and avoid surprising cascades or recursion. Audit records in a practice database illustrate a pattern but are not tamper-proof security logs.',
    'CREATE TABLE grade_audit(student_id INT,subject_id INT,old_score REAL,new_score REAL);\nCREATE TRIGGER audit_grade AFTER UPDATE OF score ON grades BEGIN INSERT INTO grade_audit VALUES(OLD.student_id,OLD.subject_id,OLD.score,NEW.score); END;\nUPDATE grades SET score=91 WHERE student_id=1 AND subject_id=1;\nSELECT * FROM grade_audit;',
    'Create an AFTER UPDATE audit trigger recording old and new grades. Add a BEFORE INSERT validation trigger using RAISE(ABORT,...) in a separate demonstration, and describe insert/delete OLD/NEW differences and recursion risks.',
    [
        [
            'What makes a trigger run?',
            'A matching table event',
            'Opening a browser tab',
        ],
        ['What refers to a prior updated value?', 'OLD', 'BEFORE_VALUE'],
        ['What refers to an inserted value?', 'NEW', 'OLD'],
        [
            'When is an audit trigger commonly run?',
            'AFTER the change',
            'Only on SELECT',
        ],
        [
            'What is a risk of excessive trigger logic?',
            'Hidden cascading work and recursion',
            'Automatic perfect security',
        ],
    ],
    {
        dialect:
            'SQLite trigger syntax differs from server DBMSs. Use RAISE in validation triggers; MySQL-style SET NEW.column is unsupported here.',
    },
);
add(
    'Transactions',
    'ACID; BEGIN; COMMIT; ROLLBACK; safety; atomic operations',
    'Transactions group changes into a unit. Atomicity means all intended changes succeed together or are undone; consistency preserves declared invariants; isolation addresses concurrent interactions; durability addresses committed storage. BEGIN starts a transaction, COMMIT finishes it, and ROLLBACK discards its changes. If a statement fails, inspect the transaction and roll back rather than assuming every earlier statement was undone automatically. This single-worker in-memory lab demonstrates atomicity and rollback; it does not simulate multi-user isolation or durable disk storage across Runs.',
    'BEGIN;\nUPDATE grades SET score=99 WHERE student_id=1 AND subject_id=1;\nROLLBACK;\nSELECT score FROM grades WHERE student_id=1 AND subject_id=1;\nBEGIN;\nUPDATE grades SET score=91 WHERE student_id=1 AND subject_id=1;\nCOMMIT;\nSELECT score FROM grades WHERE student_id=1 AND subject_id=1;',
    'Demonstrate a rollback restoring a grade, followed by a committed update. Describe how a two-part enrollment/grade operation should be atomic and what this browser lab cannot prove about isolation or durability.',
    [
        ['What begins a transaction?', 'BEGIN', 'SELECT'],
        ['What makes changes final in the transaction?', 'COMMIT', 'ROLLBACK'],
        ['What undoes uncommitted changes?', 'ROLLBACK', 'ORDER BY'],
        [
            'What does atomicity mean?',
            'An operation succeeds as a unit or is undone',
            'Every query is faster',
        ],
        [
            'Does this lab retain committed data across Runs?',
            'No, every Run is fresh',
            'Yes, it writes production storage',
        ],
    ],
    {
        dialect:
            'Transactions run within one script. The in-memory lab does not demonstrate concurrent server isolation or persistent durability across Runs.',
    },
);
add(
    'Database Normalization',
    'redundancy; functional dependencies; 1NF; 2NF; 3NF; denormalization',
    'Normalization organizes relations to reduce update, insert, and delete anomalies. A functional dependency means one set of attributes determines another. First Normal Form avoids repeating groups and stores appropriate single values. Second Normal Form removes partial dependencies of non-key attributes on only part of a composite candidate key. Third Normal Form removes inappropriate transitive dependencies among non-key attributes. Put a teacher name on teachers rather than duplicating it on every enrollment. Denormalization can support measured reporting needs, but creates synchronization obligations; it should be deliberate.',
    'SELECT s.first_name,sub.name AS subject,t.name AS teacher FROM students s JOIN enrollments e ON e.student_id=s.id JOIN subjects sub ON sub.id=e.subject_id JOIN teachers t ON t.id=sub.teacher_id ORDER BY s.id,sub.id;',
    'Start with a commented enrollment sheet containing repeated student, subject, and teacher details. Identify keys and functional dependencies, decompose it into 1NF/2NF/3NF tables, and run a join reconstructing a report. Explain one justified denormalization trade-off.',
    [
        [
            'What does normalization reduce?',
            'Redundancy and update anomalies',
            'All database queries',
        ],
        [
            'What does a functional dependency describe?',
            'Attributes determining other attributes',
            'A CSS dependency',
        ],
        ['What does 1NF avoid?', 'Repeating groups', 'Every text column'],
        [
            'What does 2NF address?',
            'Partial dependency on a composite key',
            'Only sorting ties',
        ],
        [
            'What does 3NF address?',
            'Inappropriate transitive dependencies',
            'Every foreign key',
        ],
    ],
);
add(
    'Database Security',
    'users and roles; permissions; GRANT; REVOKE; least privilege; injection; parameters',
    'Server DBMSs manage users, roles, and privileges with product-specific GRANT and REVOKE commands. Least privilege gives an application only the rights needed for its job. SQLite has no database-user GRANT/REVOKE system; application and filesystem boundaries control access. SQL injection occurs when untrusted text is concatenated into executable SQL. Bind values with named parameters instead: write WHERE id=:id and enter {":id":1} in Named parameters. Parameters bind values, not table names or arbitrary SQL fragments; identifiers require a fixed allowlist. This lab uses fictional data and gives SQL no connection to CodeLab storage.',
    'SELECT id,first_name,last_name FROM students WHERE id=COALESCE(:id,1) ORDER BY id;',
    'Run a bound :id search with {":id":2}. Then use a :name text filter with a string containing quotes and SQL-looking text, showing it remains a value. Comment conceptual PostgreSQL role/GRANT/REVOKE examples and explain least privilege. Do not build queries by concatenation.',
    [
        [
            'What is least privilege?',
            'Only permissions needed for the task',
            'Administrator rights for every user',
        ],
        ['Does SQLite have GRANT-based database users?', 'No', 'Yes'],
        [
            'How should untrusted values enter queries?',
            'Bound parameters',
            'String concatenation',
        ],
        [
            'Can a parameter safely replace a table name?',
            'No, use a fixed identifier allowlist',
            'Yes, every SQL fragment',
        ],
        [
            'What causes SQL injection?',
            'Untrusted text becoming executable SQL',
            'A WHERE clause by itself',
        ],
    ],
    {
        dialect:
            'GRANT/REVOKE and database roles are conceptual server DBMS topics, not runnable SQLite commands. Named JSON parameters are actually bound in this lab.',
        syntax: '-- PostgreSQL concept; not SQLite:\n-- CREATE ROLE reporting_reader;\n-- GRANT SELECT ON students TO reporting_reader;\n-- REVOKE SELECT ON students FROM reporting_reader;\n-- Runnable SQLite parameter syntax:\nSELECT id,first_name FROM students WHERE id=:id;',
    },
);
add(
    'Query Optimization and Execution Plans',
    'execution plans; index selection; projection; joins; expensive queries; testing',
    'The optimizer chooses a plan for scans, searches, join order, and sorting. SQLite EXPLAIN QUERY PLAN returns a high-level plan; it is not the same output as PostgreSQL EXPLAIN ANALYZE or MySQL EXPLAIN. Compare a relevant query before and after adding an index. Select needed columns, join on correct keys, and avoid repeated expensive correlated work when a grouped report suffices. Plans and timings depend on data size and distribution; tiny classroom results do not prove production performance. Check result correctness before optimizing and avoid brittle tests tied to exact plan wording.',
    'EXPLAIN QUERY PLAN SELECT id,first_name FROM students WHERE year_level=1;\nCREATE INDEX idx_year ON students(year_level);\nEXPLAIN QUERY PLAN SELECT id,first_name FROM students WHERE year_level=1;\nSELECT id,first_name FROM students WHERE year_level=1 ORDER BY id;',
    'Capture a filter plan before and after creating an index. Explain scan versus search, improve a SELECT * report using explicit columns, and document a representative performance-test strategy and index trade-offs.',
    [
        [
            'What does an execution plan describe?',
            'How the DBMS intends to access data',
            'A user password',
        ],
        [
            'What is the SQLite plan command here?',
            'EXPLAIN QUERY PLAN',
            'EXPLAIN ANALYZE is universal',
        ],
        [
            'What should be verified before optimizing?',
            'Result correctness',
            'Only the fastest-looking text',
        ],
        [
            'Why select only needed columns?',
            'Reduce unnecessary data work',
            'To bypass all constraints',
        ],
        [
            'What affects index usefulness?',
            'Data distribution and query pattern',
            'Only the index name',
        ],
    ],
);
const advancedProject = `${school}
CREATE TABLE grade_audit(student_id INT,subject_id INT,old_score REAL,new_score REAL);
CREATE TRIGGER audit_grade AFTER UPDATE OF score ON grades BEGIN INSERT INTO grade_audit VALUES(OLD.student_id,OLD.subject_id,OLD.score,NEW.score); END;
CREATE INDEX idx_enrollments_subject ON enrollments(subject_id);
CREATE VIEW grade_report AS SELECT s.id,s.first_name,sec.name AS section,sub.name AS subject,t.name AS teacher,g.score FROM students s JOIN enrollments e ON e.student_id=s.id JOIN subjects sub ON sub.id=e.subject_id JOIN teachers t ON t.id=sub.teacher_id LEFT JOIN sections sec ON sec.id=s.section_id LEFT JOIN grades g ON g.student_id=e.student_id AND g.subject_id=e.subject_id;
BEGIN; UPDATE grades SET score=91 WHERE student_id=1 AND subject_id=1; COMMIT;
SELECT * FROM grade_report ORDER BY id,subject;
WITH means AS(SELECT id,first_name,ROUND(AVG(score),2) AS mean FROM grade_report GROUP BY id,first_name) SELECT *,DENSE_RANK() OVER(ORDER BY mean DESC) AS ranking FROM means ORDER BY mean DESC,id;
SELECT * FROM grade_audit;
-- Role permissions and stored routines are documented for a chosen server DBMS, not simulated in SQLite.
-- Bind :id with the Named parameters JSON field for this search.
SELECT id,first_name FROM students WHERE id=COALESCE(:id,1);`;
add(
    'Advanced Project — Student Information Database System',
    'students; teachers; subjects; sections; enrollment; grades; roles; reports; views; transactions; routines where supported; indexes; security',
    'Integrate normalized schema design, reporting, integrity, and safe operations into a student information database. Include sections, teachers, subjects, enrollment, and grades with clear keys. Show joins, grouped reports, a CTE/window report, views, a transaction, audit trigger, and justified indexes. Describe a server role matrix and a DBMS-specific stored routine as documentation; SQLite cannot execute those features. No real student records, application users, or credentials belong in this project. Demonstrate parameter binding and test expected failures.',
    advancedProject,
    'Build the six school entities from an empty database with sample records and keys/constraints. Include complex join and grouped reports, views, a CTE/window ranking, committed and rolled-back operations, an audit trigger, indexes with plan notes, and a bound search. Comment a reader/teacher/admin role matrix and a routine for a chosen server DBMS, labeled unsupported in SQLite. Document test cases for invalid grades, duplicate enrollments, missing parents, NULLs, ties, and SQL-looking parameter values.',
    [
        [
            'How should grades relate to enrollment?',
            'By a matching composite foreign key',
            'By duplicated names alone',
        ],
        ['What protects a multi-step change?', 'A transaction', 'A sort order'],
        [
            'What records old and new grades here?',
            'An audit trigger',
            'A browser cookie',
        ],
        [
            'How are server-only routines assessed here?',
            'Clearly labeled documentation plus working SQLite alternatives',
            'Pretend SQLite execution',
        ],
        [
            'What data belongs in this project?',
            'Fictional educational records',
            'Production users and passwords',
        ],
    ],
    {
        seed: '',
        project: true,
        dialect:
            'Runnable project: SQLite schema, reports, views, triggers, transactions, indexes, and bound values. Roles/GRANT/REVOKE and stored routines require a chosen server DBMS and remain labeled documentation.',
    },
);

if (lessons.length !== 30) throw Error('Expected 30 lessons.');
const SQL = await initSqlJs();
const out = lessons.map((item, index) => {
    const position = index + 1,
        level = ['Beginner', 'Intermediate', 'Advanced'][
            Math.floor(index / 10)
        ];
    const seed = item.seed ?? school;
    const execution = executeSql(SQL, item.sql, seed);
    const quiz = item.facts.map(([question, correct, misconception], q) => {
        const choices = [
            ...new Set([
                correct,
                misconception,
                ...item.facts
                    .filter((_, i) => i !== q)
                    .flatMap((f) => [f[1], f[2]]),
            ]),
        ].slice(0, 4);
        if (new Set(choices).size !== 4)
            throw Error('Duplicate quiz choices: ' + item.title);
        const answer = (index + q) % 4;
        const rotated = choices
            .slice(4 - answer)
            .concat(choices.slice(0, 4 - answer));
        return {
            question,
            choices: rotated,
            answer,
            explanation:
                correct + '. Review the explanation and example for this rule.',
        };
    });
    return {
        title: item.title,
        level,
        position,
        is_project: !!item.project,
        objectives: [
            'Explain ' + item.topics + '.',
            'Write and run the lesson queries on fictional data.',
            'Check results, integrity, and relevant SQLite/DBMS differences.',
        ],
        introduction: `This ${level.toLowerCase()} lesson develops ${item.topics}. Use the isolated practice database to explore the example before writing your own activity.`,
        explanation: item.explanation,
        syntax: item.syntax ?? item.sql,
        example_sql: item.sql,
        starter_sql:
            index === 0
                ? item.sql
                : `-- ${item.title}\n-- ${item.task}\n-- Write your own complete SQLite solution below.\n`,
        sql_seed: seed,
        dialect_note:
            item.dialect ??
            'Runnable examples use the bundled SQLite engine. Check your target DBMS documentation for syntax, typing, and function differences.',
        guided_practice:
            'Read the schema in the example. Run the complete example script, inspect every result table, then change one value or condition and predict the result before running again. Each Run recreates the lesson database; keep all required statements together.',
        activity: item.task,
        expected_result: execution.results
            .map(
                (r, i) =>
                    `Example result ${i + 1}: columns ${r.columns.join(', ')}; ${r.values.length} rows.\n${JSON.stringify(r.values)}`,
            )
            .join('\n\n'),
        important_notes: `Topics: ${item.topics}. Run does not save database changes between runs or award a grade. Save SQL preserves source and named parameters; submit sends a versioned snapshot for teacher review.`,
        security_note:
            'Use fictional records only. Student SQL executes in a fresh browser worker, never on the Laravel database. Use bound parameters for untrusted values, keep foreign keys enabled, and preview UPDATE/DELETE targets. Server permissions and backups are separate responsibilities.',
        debugging_tip:
            'Read the first SQLite error; check spelling, quotes, commas, aliases, and the practice schema. Check foreign-key parents and constraint values. Keep setup and queries in one script; SQLite does not support CREATE DATABASE, stored routines, or GRANT/REVOKE.',
        challenge: item.project
            ? 'Add a documented edge case and an extra useful report. Explain the design and one limitation to your teacher.'
            : 'Extend the activity with a new boundary or missing-data test and explain its expected result.',
        completion_requirements:
            'Save and submit your original SQL activity, pass the five-question quiz with at least 4/5, and receive teacher approval of the current submitted version. Running SQL or matching an example alone does not unlock the next lesson.',
        guide: {
            steps: [
                'Read the lesson and dialect note.',
                'Run the example and compare results.',
                'Write and test your own activity.',
                'Save, submit, and pass the quiz for teacher review.',
            ],
        },
        quiz,
        validation_rules: {
            sql: {
                expected_results: execution.results.map(
                    ({ columns, values }) => ({ columns, values }),
                ),
            },
        },
        rubric: item.project
            ? {
                  query_correctness: 30,
                  schema_design: 25,
                  data_integrity: 15,
                  required_reports: 15,
                  readability: 10,
                  testing: 5,
              }
            : null,
    };
});
await writeFile(
    'database/data/sql-course.json',
    JSON.stringify(out, null, 2) + '\n',
);
console.log(
    'Authored and executed 30 SQL examples; 150 quiz questions and three project rubrics.',
);
