import React, { useState } from 'react';


const API_BASE = import.meta.env.VITE_API_URL || '';

const VerifyPage = ({ onVerify }) => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/verify/secret-code`);
      if (!res.ok) throw new Error('Could not fetch verification info');
      const data = await res.json();
      if (name.trim() === data.name && code.trim() === data.code) {
        onVerify();
      } else {
        setError('Verification failed.');
      }
    } catch (err) {
      setError('Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '10vh' }}>
      <h2>Verification Required</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '300px' }}>
        <label>
          Who are you?
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Enter your name"
            required
          />
        </label>
        <label>
          Verification Code
          <input
            type="password"
            value={code}
            onChange={e => setCode(e.target.value)}
            placeholder="Enter code (e.g., 1234)"
            required
          />
        </label>
        <button type="submit" disabled={loading}>{loading ? 'Verifying...' : 'Verify'}</button>
        {error && <div style={{ color: 'red' }}>{error}</div>}
      </form>
    </div>
  );
};

export default VerifyPage;
