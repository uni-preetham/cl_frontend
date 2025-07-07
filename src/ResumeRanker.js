import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

function ResumeRanker() {
  const [jdFile, setJdFile] = useState(null);
  const [resumeFiles, setResumeFiles] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [jdId, setJdId] = useState('');
  // Store array of { id, filename }
  const [resumeMeta, setResumeMeta] = useState([]);

  const handleJdChange = (e) => {
    setJdFile(e.target.files[0]);
  };

  const handleResumeChange = (e) => {
    setResumeFiles(Array.from(e.target.files));
  };

  const uploadFile = async (file, type) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('file_type', type);
    const res = await axios.post('http://localhost:8000/upload/', formData);
    return res.data;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResults([]);
    try {
      // Upload JD
      const jdMeta = await uploadFile(jdFile, 'jd');
      setJdId(jdMeta.id);
      // Upload resumes and keep meta
      const resumeMetaArr = [];
      const resume_ids = [];
      for (let file of resumeFiles) {
        const meta = await uploadFile(file, 'resume');
        resumeMetaArr.push({ id: meta.id, filename: meta.filename });
        resume_ids.push(meta.id);
      }
      setResumeMeta(resumeMetaArr);
      // Rank resumes
      const formData = new FormData();
      formData.append('jd_id', jdMeta.id);
      formData.append('resume_ids', resume_ids.join(','));
      const res = await axios.post('http://localhost:8000/rank/', formData);
      setResults(res.data);
    } catch (err) {
      setError('Error: ' + (err.response?.data?.error || err.message));
    }
    setLoading(false);
  };

  // Helper to get filename from resumeId
  const getFilename = (resumeId) => {
    const meta = resumeMeta.find(m => m.id === resumeId);
    return meta ? meta.filename : resumeId;
  };

  return (
    <div className="resume-ranker-container">
      <h2>AI-Powered Resume Ranker</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Job Description (PDF/DOCX):</label>
          <input type="file" accept=".pdf,.docx,.txt" onChange={handleJdChange} required />
        </div>
        <div>
          <label>Resumes (PDF/DOCX/TXT, multiple):</label>
          <input type="file" accept=".pdf,.docx,.txt" multiple onChange={handleResumeChange} required />
        </div>
        <button type="submit" disabled={loading}>Rank Resumes</button>
      </form>
      {loading && <div className="loading">Processing...</div>}
      {error && <div className="error">{error}</div>}
      {results.length > 0 && (
        <div>
          <h3 style={{textAlign: 'center', color: '#3730a3', marginTop: '2rem'}}>Results</h3>
          <table className="results-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Resume Name</th>
                <th>Score</th>
                <th>Missing Keywords</th>
              </tr>
            </thead>
            <tbody>
              {results.map(r => (
                <tr key={r.resumeId}>
                  <td>{r.rank}</td>
                  <td>{getFilename(r.resumeId)}</td>
                  <td>{r.score.toFixed(2)}</td>
                  <td>{r.missingKeywords.join(', ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default ResumeRanker;
