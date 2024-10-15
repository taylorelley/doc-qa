import React, { useState, useEffect } from 'react';
import { Upload, Database, Download } from 'lucide-react';
import axios from 'axios';

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [dataset, setDataset] = useState<Array<{ question: string; answer: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchDataset();
  }, []);

  const fetchDataset = async () => {
    try {
      const response = await axios.get('/api/dataset');
      setDataset(response.data);
    } catch (error) {
      console.error('Error fetching dataset:', error);
      setDataset([]);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFile(event.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsLoading(true);
    const formData = new FormData();
    formData.append('document', file);

    try {
      await axios.post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await fetchDataset();
      setFile(null);
    } catch (error) {
      console.error('Error uploading file:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const response = await axios.get('/api/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'qa_dataset.json');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error exporting dataset:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold mb-8">Q&A Dataset Builder</h1>
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-2xl">
        <div className="mb-4">
          <label htmlFor="file-upload" className="block text-sm font-medium text-gray-700 mb-2">
            Upload Document
          </label>
          <div className="flex items-center">
            <input
              id="file-upload"
              type="file"
              onChange={handleFileChange}
              className="hidden"
              accept=".txt,.pdf,.doc,.docx"
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer bg-blue-500 text-white px-4 py-2 rounded-l-md hover:bg-blue-600 flex items-center"
            >
              <Upload size={18} className="mr-2" />
              Choose File
            </label>
            <span className="border border-gray-300 rounded-r-md px-4 py-2 w-full">
              {file ? file.name : 'No file chosen'}
            </span>
          </div>
        </div>
        <button
          onClick={handleUpload}
          disabled={!file || isLoading}
          className="w-full bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Processing...' : 'Upload and Process'}
        </button>
      </div>
      <div className="mt-8 bg-white p-6 rounded-lg shadow-md w-full max-w-2xl">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <Database size={24} className="mr-2" />
          Dataset ({dataset.length} Q&A pairs)
        </h2>
        <div className="max-h-64 overflow-y-auto mb-4">
          {dataset.map((item, index) => (
            <div key={index} className="mb-4 p-3 bg-gray-50 rounded-md">
              <p className="font-semibold">Q: {item.question}</p>
              <p>A: {item.answer}</p>
            </div>
          ))}
        </div>
        <button
          onClick={handleExport}
          className="w-full bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 flex items-center justify-center"
        >
          <Download size={18} className="mr-2" />
          Export Dataset
        </button>
      </div>
    </div>
  );
}

export default App;