### Script for result page

```javascript
document.querySelectorAll('.question_holder').forEach(holder => {
  // Find the <a name="question_..."> tag directly under .question_holder
  const aTag = Array.from(holder.children).find(
    el => el.tagName === 'A' && el.name && el.name.startsWith('question_')
  );
  if (!aTag) return;
  const questionId = aTag.name.replace('question_', '');

  // Find the header span (question_name)
  const header = holder.querySelector('.header .question_name');
  if (!header) return;

  // Prevent duplicate badge
  if (header.querySelector('.question-id-badge')) return;

  // Create the ID badge/button
  const idBtn = document.createElement('button');
  idBtn.textContent = `ID: ${questionId}`;
  idBtn.className = 'question-id-badge';
  idBtn.style.marginLeft = '10px';
  idBtn.style.fontSize = '0.9em';
  idBtn.style.cursor = 'pointer';
  idBtn.title = 'Click to copy Question ID';

  // No action on click, just display the ID
  // The button already displays the ID by default
  // idBtn.onclick = () => {
  //   // No action needed, as the button already displays the ID
  // };

  header.appendChild(idBtn);
});
```


### Wayground scrapper script

```javascript
(() => {
  // Select all quiz containers on the page
  const quizContainers = document.querySelectorAll('[data-testid="quiz-container"]');

  quizContainers.forEach((container, index) => {
    const questionId = container.getAttribute("data-quesid") || `question_${index}`;
    const questionTextElem = container.querySelector("#questionText");
    const questionText = questionTextElem ? questionTextElem.innerText.trim() : "Unknown Question";

    // First log: just question text
    console.log(questionText);

    const answerButtons = container.querySelectorAll("button.option");
    const answers = Array.from(answerButtons).map((btn, i) => {
      const textElem = btn.querySelector("#optionText .resizeable");
      const text = textElem ? textElem.innerText.trim() : `Answer ${i + 1}`;
      return {
        answer_id: `${index}-${i}`, // mock id
        answer_text: text,
        is_correct: false
      };
    });

    const type = container.querySelector(".is-msq") ? "multiple_answers_question" : "single_answer_question";

    const output = {
      question_id: questionId,
      question_text: questionText,
      question_type: type,
      answers: answers
    };

    // Second log: full JSON object
    console.log(JSON.stringify(output, null, 2));
  });
})();

```