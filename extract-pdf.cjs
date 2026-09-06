const fs = require('fs');
const pdf = require('pdf-parse/lib/pdf-parse.js');

const dataBuffer = fs.readFileSync('C:\\Users\\Sofia\\Downloads\\Copy of PHILIPPINE HISTORY.docx.pdf');
pdf(dataBuffer).then(data => {
  console.log(data.text);
});
