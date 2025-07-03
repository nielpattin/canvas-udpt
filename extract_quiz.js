import { readFileSync, writeFileSync, createWriteStream } from "fs";
import { load } from "cheerio";
import Database from "better-sqlite3";
import { format } from "fast-csv";

// Load HTML content (replace with your HTML file or string)
const htmlContent = readFileSync("data/quiz.html", "utf8");
const $ = load(htmlContent);

// Initialize better-sqlite3 database
const db = new Database("data/quiz.db", { verbose: console.log });

// Create table for quiz data
db.exec(`
  CREATE TABLE IF NOT EXISTS quizzes (
    question_id TEXT PRIMARY KEY,
    question_text TEXT,
    question_type TEXT,
    answers JSON
  )
`);

// Prepare insert statement
const insert = db.prepare(`
  INSERT OR REPLACE INTO quizzes (question_id, question_text, question_type, answers)
VALUES (?, ?, ?, ?)
`);

// Array to store quiz data
const quizData = [];

// Parse quiz questions
$(".display_question").each((index, element) => {
  const questionId = $(element).attr("id").replace("question_", "");
  const questionText = $(element).find(".question_text").text().trim();
  const questionType = $(element).find(".question_type").text().trim();

  const answers = [];
  $(element)
    .find(".answers .answer")
    .each((i, answerElement) => {
      const answerId = $(answerElement).find(".hidden.id").text().trim();
      // Remove MathJax asciimath script and only keep visible text
      const answerDiv = $(answerElement).find(".answer_text");
      let answerClone = answerDiv.clone();
      answerClone.find('script[type="math/asciimath"]').remove();
      let answerText = answerClone.text().trim();

      const isCorrect = $(answerElement).hasClass("correct_answer");

      answers.push({
        answer_id: answerId,
        answer_text: answerText,
        is_correct: isCorrect,
      });
    });

  const quizItem = {
    question_id: questionId,
    question_text: questionText,
    question_type: questionType,
    answers: answers,
  };

  quizData.push(quizItem);

  // Insert into SQLite
  insert.run(questionId, questionText, questionType, JSON.stringify(answers));
});

// Export to JSON
writeFileSync("data/quiz_data.json", JSON.stringify(quizData, null, 2), "utf8");
console.log("Exported to quiz_data.json");

// Export to CSV using fast-csv
const csvStream = format({
  headers: ["Question ID", "Question Text", "Question Type", "Answers"],
});
const writableStream = createWriteStream("data/quiz_data.csv");

csvStream
  .pipe(writableStream)
  .on("end", () => console.log("Exported to quiz_data.csv"))
  .on("error", (err) => console.error("Error writing CSV:", err));

// Transform data for CSV (flatten answers)
quizData.forEach((item) => {
  csvStream.write({
    "Question ID": item.question_id,
    "Question Text": item.question_text,
    "Question Type": item.question_type,
    Answers: JSON.stringify(item.answers),
  });
});

csvStream.end();

// Close the database
db.close();
console.log("Closed the database connection.");
