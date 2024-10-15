import express from 'express';
import multer from 'multer';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const upload = multer({ dest: 'uploads/' });
const port = 3000;

// Initialize SQLite database
let db;
(async () => {
  db = await open({
    filename: 'qa_dataset.db',
    driver: sqlite3.Database
  });
  await db.run('CREATE TABLE IF NOT EXISTS qa_pairs (id INTEGER PRIMARY KEY AUTOINCREMENT, question TEXT, answer TEXT)');
})();

app.use(express.json());

// API routes
const apiRouter = express.Router();

// API endpoint to upload and process document
apiRouter.post('/upload', upload.single('document'), async (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }

  try {
    const fileContent = fs.readFileSync(req.file.path, 'utf8');
    const qaPairs = await generateQAPairs(fileContent);
    
    for (const pair of qaPairs) {
      await db.run('INSERT INTO qa_pairs (question, answer) VALUES (?, ?)', [pair.question, pair.answer]);
    }

    fs.unlinkSync(req.file.path); // Clean up uploaded file
    res.status(200).send('Document processed successfully.');
  } catch (error) {
    console.error('Error processing document:', error);
    res.status(500).send('Error processing document.');
  }
});

// API endpoint to get the current dataset
apiRouter.get('/dataset', async (req, res) => {
  try {
    const dataset = await db.all('SELECT question, answer FROM qa_pairs');
    res.json(dataset);
  } catch (error) {
    console.error('Error fetching dataset:', error);
    res.status(500).send('Error fetching dataset.');
  }
});

// API endpoint to export the dataset
apiRouter.get('/export', async (req, res) => {
  try {
    const dataset = await db.all('SELECT question, answer FROM qa_pairs');
    res.json(dataset);
  } catch (error) {
    console.error('Error exporting dataset:', error);
    res.status(500).send('Error exporting dataset.');
  }
});

// Use API router
app.use('/api', apiRouter);

// Serve static files
app.use(express.static(path.join(__dirname, 'dist')));

// Serve index.html for any other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Function to generate Q&A pairs using Ollama API
async function generateQAPairs(text) {
  try {
    const response = await axios.post('http://localhost:11434/api/generate', {
      model: 'llama2',
      prompt: `Generate 5 question-answer pairs based on the following text. Format the output as a JSON array of objects with 'question' and 'answer' keys:\n\n${text}`
    });

    return JSON.parse(response.data.response);
  } catch (error) {
    console.error('Error generating Q&A pairs:', error);
    throw error;
  }
}

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});