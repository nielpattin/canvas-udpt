import { readFileSync, writeFileSync } from "fs";
import { load } from "cheerio";
import Database from "better-sqlite3";

import { readdirSync } from "fs";

const quizFiles = readdirSync("db/quizzes").filter(f => f.endsWith(".html"));
const quizData = [];
const seenQuestionIds = new Set();

const db = new Database("db/quiz.db", { verbose: console.log });

let insert = db.prepare(`
  INSERT OR REPLACE INTO quizzes (question_id, question_text, question_type, answers)
  VALUES (?, ?, ?, ?)
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS quizzes (
    question_id TEXT PRIMARY KEY,
    question_text TEXT,
    question_type TEXT,
    answers JSON
  )
`);

for (const file of quizFiles) {
  const htmlContent = readFileSync(`db/quizzes/${file}`, "utf8");
  const $ = load(htmlContent);

  // Remove MathJax asciimath script and only keep visible text
  $(".display_question").each((index, element) => {
    const questionId = $(element).attr("id").replace("question_", "");
    let questionText = $(element).find(".question_text").text().replace(/\n+/g, '').trim();
    const questionType = $(element).find(".question_type").text().trim();
  
    const answers = [];
    $(element)
      .find(".answers .answer")
      .each((i, answerElement) => {
        const answerId = $(answerElement).find(".hidden.id").text().trim();
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

    if (!seenQuestionIds.has(questionId)) {
      quizData.push(quizItem);
      seenQuestionIds.add(questionId);
    }

    insert.run(questionId, questionText, questionType, JSON.stringify(answers));
  });
}

db.exec(`
  CREATE TABLE IF NOT EXISTS quizzes (
    question_id TEXT PRIMARY KEY,
    question_text TEXT,
    question_type TEXT,
    answers JSON
  )
`);




writeFileSync("db/quiz_data.json", JSON.stringify(quizData, null, 2), "utf8");
console.log("Exported to quiz_data.json");

db.close();
console.log("Closed the database connection.");
