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