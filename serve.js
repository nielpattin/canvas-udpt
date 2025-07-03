// Node.js static file server + API for quiz_search.html and SQLite
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const Database = require('better-sqlite3');

const PORT = 8080;
const MIME = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.css': 'text/css',
  '.ico': 'image/x-icon'
};

const db = new Database('data/quiz.db');

function getClosestQuiz(query) {
  if (!query || !query.trim()) return null;
  // Simple LIKE search for demo, returns the first match
  const stmt = db.prepare(
    "SELECT * FROM quizzes WHERE question_text LIKE ? ORDER BY LENGTH(question_text) LIMIT 1"
  );
  let row = stmt.get(`%${query}%`);
  if (!row) {
    // fallback: return the question with the most word overlap
    const all = db.prepare("SELECT * FROM quizzes").all();
    const norm = s => s.toLowerCase().replace(/\s+/g, ' ').trim();
    const inputWords = new Set(norm(query).split(' '));
    let best = null, bestScore = -1;
    for (const q of all) {
      const qWords = new Set(norm(q.question_text).split(' '));
      const common = [...inputWords].filter(w => qWords.has(w)).length;
      if (common > bestScore) {
        bestScore = common;
        best = q;
      }
    }
    row = best;
  }
  if (!row) return null;
  return {
    question_id: row.question_id,
    question_text: row.question_text,
    question_type: row.question_type,
    answers: JSON.parse(row.answers)
  };
}

http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  if (parsedUrl.pathname === '/api/search') {
    const q = parsedUrl.query.q || '';
    const quiz = getClosestQuiz(q);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(quiz || {}));
    return;
  }

  let filePath = '.' + decodeURIComponent(req.url.split('?')[0]);
  if (filePath === './') filePath = './quiz_search.html';
  if (!fs.existsSync(filePath)) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }
  const ext = path.extname(filePath);
  res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
  fs.createReadStream(filePath).pipe(res);
}).listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});