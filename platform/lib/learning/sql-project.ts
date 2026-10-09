export const sqlTasks = [
  {
    title: "Find unenrolled students",
    prompt:
      "Return the name of each student with no enrollment. Sort names ascending.",
    starter: "SELECT name FROM students ORDER BY name;",
    solution:
      "SELECT s.name FROM students s LEFT JOIN enrollments e ON e.student_id = s.id WHERE e.student_id IS NULL ORDER BY s.name;",
    expected: [["Chitra"], ["Dev"]],
    hint: "Keep all students with a LEFT JOIN, then look for a missing enrollment.",
  },
  {
    title: "Count enrollments per course",
    prompt:
      "Return course title and enrollment count, including courses with zero students. Sort by title.",
    starter: "SELECT title FROM courses ORDER BY title;",
    solution:
      "SELECT c.title, COUNT(e.student_id) AS enrolled FROM courses c LEFT JOIN enrollments e ON e.course_id = c.id GROUP BY c.id, c.title ORDER BY c.title;",
    expected: [
      ["Algorithms", 2],
      ["Databases", 1],
      ["Networks", 0],
    ],
    hint: "COUNT(column) skips NULL. COUNT(*) would count the empty-side row from a LEFT JOIN.",
  },
  {
    title: "Find students taking both courses",
    prompt:
      "Return the names of students enrolled in both Algorithms and Databases. Sort names ascending.",
    starter:
      "SELECT s.name FROM students s JOIN enrollments e ON e.student_id = s.id;",
    solution:
      "SELECT s.name FROM students s JOIN enrollments e ON e.student_id = s.id WHERE e.course_id IN (1,2) GROUP BY s.id, s.name HAVING COUNT(DISTINCT e.course_id) = 2 ORDER BY s.name;",
    expected: [["Anika"]],
    hint: "Group enrollments per student, then use HAVING to require both distinct course IDs.",
  },
];
export const sqlSetup = `PRAGMA foreign_keys = ON;
CREATE TABLE students(id INTEGER PRIMARY KEY, name TEXT NOT NULL);
CREATE TABLE courses(id INTEGER PRIMARY KEY, title TEXT NOT NULL);
CREATE TABLE enrollments(student_id INTEGER REFERENCES students(id), course_id INTEGER REFERENCES courses(id), PRIMARY KEY(student_id, course_id));
INSERT INTO students VALUES(1,'Anika'),(2,'Ben'),(3,'Chitra'),(4,'Dev');
INSERT INTO courses VALUES(1,'Algorithms'),(2,'Databases'),(3,'Networks');
INSERT INTO enrollments VALUES(1,1),(1,2),(2,1);`;
