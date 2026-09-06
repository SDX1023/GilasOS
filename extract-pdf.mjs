import fs from 'fs';
import pdf from 'pdf-parse';

const dataBuffer = fs.readFileSync('C:\\Users\\Sofia\\Downloads\\Copy of PHILIPPINE HISTORY.docx.pdf');
const data = await pdf(dataBuffer);
console.log(data.text);
