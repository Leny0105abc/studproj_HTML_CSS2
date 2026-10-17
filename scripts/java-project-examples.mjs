export const gradeProject = `import java.util.*;
public class Main {
    static double readGrade(Scanner input) {
        double grade = Double.parseDouble(input.nextLine().trim());
        if (!Double.isFinite(grade) || grade < 0 || grade > 100)
            throw new IllegalArgumentException("Grades must be 0–100.");
        return grade;
    }
    static double total(double[] grades) {
        double result = 0; for (double grade : grades) result += grade; return result;
    }
    static double highest(double[] grades) {
        double result = grades[0]; for (double grade : grades) result = Math.max(result, grade); return result;
    }
    static double lowest(double[] grades) {
        double result = grades[0]; for (double grade : grades) result = Math.min(result, grade); return result;
    }
    static void display(String name, double[] grades) {
        double sum = total(grades), average = sum / grades.length;
        System.out.printf(Locale.ROOT, "Student: %s%nTotal: %.2f%nAverage: %.2f%nHighest: %.2f%nLowest: %.2f%nStatus: %s%n",
            name, sum, average, highest(grades), lowest(grades), average >= 75 ? "PASSED" : "FAILED");
    }
    public static void main(String[] args) {
        try (Scanner input = new Scanner(System.in)) {
            String name = input.nextLine().trim();
            if (name.isEmpty()) throw new IllegalArgumentException("Name required.");
            double[] grades = new double[5];
            for (int i = 0; i < grades.length; i++) grades[i] = readGrade(input);
            display(name, grades);
        } catch (IllegalArgumentException | NoSuchElementException error) {
            System.out.println("Invalid input: " + error.getMessage());
        }
    }
}
`;

const model = `    static class Student {
        private final String id, name;
        private final List<Double> grades;
        Student(String id, String name, List<Double> grades) {
            if (id == null || !id.matches("[A-Za-z0-9_-]{1,20}")) throw new IllegalArgumentException("Invalid ID");
            if (name == null || name.trim().isEmpty() || name.length() > 100) throw new IllegalArgumentException("Name required, maximum 100 characters");
            if (grades.isEmpty() || grades.size() > 10) throw new IllegalArgumentException("Use 1–10 grades");
            for (double grade : grades) if (!Double.isFinite(grade) || grade < 0 || grade > 100) throw new IllegalArgumentException("Grades must be 0–100");
            this.id=id; this.name=name.trim(); this.grades=List.copyOf(grades);
        }
        String id() { return id; }
        String name() { return name; }
        List<Double> grades() { return grades; }
        double average() { double sum=0; for(double grade:grades) sum+=grade; return sum/grades.size(); }
        String display() { return String.format(Locale.ROOT, "%s %s average=%.2f", id, name, average()); }
    }
    static List<Double> parseGrades(String text) {
        List<Double> grades=new ArrayList<>();
        for(String value:text.split(",", -1)) grades.add(Double.parseDouble(value.trim()));
        return grades;
    }
    static Student readStudent(Scanner input) {
        String id=input.nextLine().trim(), name=input.nextLine();
        return new Student(id, name, parseGrades(input.nextLine()));
    }
`;
export const recordsProject = `import java.util.*;
import java.io.*;
import java.nio.charset.StandardCharsets;
public class Main {
${model}
    static class Records {
        private final ArrayList<Student> students=new ArrayList<>();
        int index(String id) { for(int i=0;i<students.size();i++) if(students.get(i).id().equals(id)) return i; return -1; }
        void add(Student student) { if(index(student.id())>=0) throw new IllegalArgumentException("Duplicate ID"); students.add(student); }
        Student find(String id) { int i=index(id); if(i<0) throw new IllegalArgumentException("Student not found"); return students.get(i); }
        void update(Student student) { int i=index(student.id()); if(i<0) throw new IllegalArgumentException("Student not found"); students.set(i,student); }
        void delete(String id) { int i=index(id); if(i<0) throw new IllegalArgumentException("Student not found"); students.remove(i); }
        void display() { for(Student student:students) System.out.println(student.display()); }
        void save() throws IOException {
            try(BufferedWriter writer=new BufferedWriter(new FileWriter("students.txt"))) {
                for(Student s:students) {
                    String encoded=Base64.getEncoder().encodeToString(s.name().getBytes(StandardCharsets.UTF_8));
                    List<String> values=new ArrayList<>(); for(double g:s.grades()) values.add(Double.toString(g));
                    writer.write(s.id()+"|"+encoded+"|"+String.join(",",values)); writer.newLine();
                }
            }
        }
        void load() throws IOException {
            Records candidate=new Records();
            try(BufferedReader reader=new BufferedReader(new FileReader("students.txt"))) {
                String line; while((line=reader.readLine())!=null) {
                    String[] parts=line.split("\\\\|",-1);
                    if(parts.length!=3) throw new IOException("Malformed record");
                    String name=new String(Base64.getDecoder().decode(parts[1]),StandardCharsets.UTF_8);
                    candidate.add(new Student(parts[0],name,parseGrades(parts[2])));
                    if(candidate.students.size()>100) throw new IOException("Too many records");
                }
            }
            students.clear(); students.addAll(candidate.students);
        }
    }
    public static void main(String[] args) {
        Records records=new Records();
        try(Scanner input=new Scanner(System.in)) {
            // Menu: 1 Add, 2 View, 3 Search, 4 Update, 5 Delete, 6 Save, 7 Load, 8 Exit.
            while(input.hasNextLine()) {
                try {
                    int choice=Integer.parseInt(input.nextLine().trim());
                    if(choice==8) break;
                    switch(choice) {
                        case 1: Student s=readStudent(input); records.add(s); System.out.println("Added "+s.id()); break;
                        case 2: records.display(); break;
                        case 3: System.out.println(records.find(input.nextLine().trim()).display()); break;
                        case 4: records.update(readStudent(input)); System.out.println("Updated"); break;
                        case 5: records.delete(input.nextLine().trim()); System.out.println("Deleted"); break;
                        case 6: records.save(); System.out.println("Saved"); break;
                        case 7: records.load(); System.out.println("Loaded"); break;
                        default: System.out.println("Choose 1–8");
                    }
                } catch(IllegalArgumentException | IOException error) { System.out.println("Error: "+error.getMessage()); }
            }
        } catch(NoSuchElementException error) { System.out.println("Incomplete menu input"); }
    }
}
`;

export const jdbcProject = `import java.util.*;
import java.sql.*;
public class Main {
${model}
    interface Repository {
        void save(Student student, boolean update) throws SQLException;
        List<Student> all() throws SQLException;
        void delete(String id) throws SQLException;
    }
    static class JdbcRepository implements Repository {
        private final Connection db;
        JdbcRepository(Connection db) throws SQLException {
            this.db=db;
            try(Statement schema=db.createStatement()) {
                schema.execute("CREATE TABLE students(id VARCHAR(20) PRIMARY KEY,name VARCHAR(100) NOT NULL)");
                schema.execute("CREATE TABLE grades(student_id VARCHAR(20) REFERENCES students(id) ON DELETE CASCADE,position INT,grade DOUBLE CHECK(grade BETWEEN 0 AND 100),PRIMARY KEY(student_id,position))");
            }
        }
        public void save(Student s, boolean update) throws SQLException {
            db.setAutoCommit(false);
            try {
                String sql=update ? "UPDATE students SET name=? WHERE id=?" : "INSERT INTO students(name,id) VALUES(?,?)";
                try(PreparedStatement statement=db.prepareStatement(sql)) {
                    statement.setString(1,s.name()); statement.setString(2,s.id());
                    if(statement.executeUpdate()!=1) throw new SQLException("Student not found");
                }
                if(update) try(PreparedStatement clear=db.prepareStatement("DELETE FROM grades WHERE student_id=?")) { clear.setString(1,s.id()); clear.executeUpdate(); }
                try(PreparedStatement insert=db.prepareStatement("INSERT INTO grades VALUES(?,?,?)")) {
                    for(int i=0;i<s.grades().size();i++) {
                        insert.setString(1,s.id()); insert.setInt(2,i); insert.setDouble(3,s.grades().get(i)); insert.addBatch();
                    }
                    insert.executeBatch();
                }
                db.commit();
            } catch(SQLException error) { db.rollback(); throw error; }
            finally { db.setAutoCommit(true); }
        }
        public List<Student> all() throws SQLException {
            List<Student> result=new ArrayList<>();
            try(PreparedStatement query=db.prepareStatement("SELECT id,name FROM students ORDER BY id"); ResultSet rows=query.executeQuery()) {
                while(rows.next()) {
                    List<Double> grades=new ArrayList<>();
                    try(PreparedStatement values=db.prepareStatement("SELECT grade FROM grades WHERE student_id=? ORDER BY position")) {
                        values.setString(1,rows.getString("id"));
                        try(ResultSet items=values.executeQuery()) { while(items.next()) grades.add(items.getDouble(1)); }
                    }
                    result.add(new Student(rows.getString("id"),rows.getString("name"),grades));
                }
            }
            return result;
        }
        public void delete(String id) throws SQLException {
            try(PreparedStatement statement=db.prepareStatement("DELETE FROM students WHERE id=?")) {
                statement.setString(1,id); if(statement.executeUpdate()!=1) throw new SQLException("Student not found");
            }
        }
    }
    static class StudentService {
        private final Repository repository;
        StudentService(Repository repository) { this.repository=repository; }
        Student find(String id) throws SQLException {
            return repository.all().stream().filter(s -> s.id().equals(id)).findFirst().orElseThrow(() -> new IllegalArgumentException("Student not found"));
        }
        void register(Student student) throws SQLException { repository.save(student,false); }
        void edit(Student student) throws SQLException { repository.save(student,true); }
        void delete(String id) throws SQLException { repository.delete(id); }
        List<Student> students() throws SQLException { return repository.all(); }
        void report() throws SQLException {
            List<Student> students=students(); long passing=students.stream().filter(s -> s.average()>=75).count();
            System.out.println("Students="+students.size()+" Passing="+passing);
        }
    }
    public static void main(String[] args) throws SQLException {
        // H2 exists only inside this isolated JVM. No production credentials.
        try(Connection db=DriverManager.getConnection("jdbc:h2:mem:student_lab"); Scanner input=new Scanner(System.in)) {
            StudentService service=new StudentService(new JdbcRepository(db));
            // Menu: 1 Add, 2 View, 3 Search, 4 Edit, 5 Delete, 6 Grades, 7 Reports, 8 Exit.
            while(input.hasNextLine()) {
                try {
                    int choice=Integer.parseInt(input.nextLine().trim()); if(choice==8) break;
                    switch(choice) {
                        case 1: Student s=readStudent(input); service.register(s); System.out.println("Added "+s.id()); break;
                        case 2: for(Student student:service.students()) System.out.println(student.display()+" "+(student.average()>=75?"PASSED":"FAILED")); break;
                        case 3: System.out.println(service.find(input.nextLine().trim()).display()); break;
                        case 4: service.edit(readStudent(input)); System.out.println("Updated"); break;
                        case 5: service.delete(input.nextLine().trim()); System.out.println("Deleted"); break;
                        case 6: Student student=service.find(input.nextLine().trim()); System.out.println(student.id()+" "+student.grades()); break;
                        case 7: service.report(); break;
                        default: System.out.println("Choose 1–8");
                    }
                } catch(IllegalArgumentException | SQLException error) { System.out.println("Error: "+error.getMessage()); }
            }
        } catch(NoSuchElementException error) { System.out.println("Incomplete menu input"); }
    }
}
`;
