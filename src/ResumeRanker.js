import React, { useState } from 'react';
import axios from 'axios';

function ResumeRanker() {
  const [jdFile, setJdFile] = useState(null);
  const [resumeFiles, setResumeFiles] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [jdId, setJdId] = useState('');
  const [resumeIds, setResumeIds] = useState([]);

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
    return res.data.id;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      // Upload JD
      const jd_id = await uploadFile(jdFile, 'jd');
      setJdId(jd_id);
      // Upload resumes
      const resume_ids = [];
      for (let file of resumeFiles) {
        const rid = await uploadFile(file, 'resume');
        resume_ids.push(rid);
      }
      setResumeIds(resume_ids);
      // Rank resumes
      const formData = new FormData();
      formData.append('jd_id', jd_id);
      formData.append('resume_ids', resume_ids.join(','));
      const res = await axios.post('http://localhost:8000/rank/', formData);
      setResults(res.data);
    } catch (err) {
      setError('Error: ' + (err.response?.data?.error || err.message));
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 600, margin: 'auto' }}>
      <h2>AI-Powered Resume Ranker</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Job Description (PDF/DOCX): </label>
          <input type="file" accept=".pdf,.docx" onChange={handleJdChange} required />
        </div>
        <div>
          <label>Resumes (PDF/DOCX, multiple): </label>
          <input type="file" accept=".pdf,.docx" multiple onChange={handleResumeChange} required />
        </div>
        <button type="submit" disabled={loading}>Rank Resumes</button>
      </form>
      {loading && <p>Processing...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {results.length > 0 && (
        <div>
          <h3>Results</h3>
          <table border="1" cellPadding="8">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Resume ID</th>
                <th>Score</th>
                <th>Missing Keywords</th>
              </tr>
            </thead>
            <tbody>
              {results.map(r => (
                <tr key={r.resumeId}>
                  <td>{r.rank}</td>
                  <td>{r.resumeId}</td>
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
