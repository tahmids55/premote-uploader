import React, { useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "";

const VerifyPage = ({ onVerify }) => {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/verify/check`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({
          name: name.trim(),
          code: code.trim()
        })
      });

      if (!res.ok) {
        throw new Error("Verification failed");
      }

      onVerify();
    } catch (_error) {
      setError("Verification failed. Check both fields and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="app-shell app-shell--verify">
      <section className="hero hero--verify">
        <p className="hero__kicker">Protected Access</p>
        <h1>Identity Check</h1>
        <p>Complete both fields to unlock the uploader.</p>
      </section>

      <section className="card verify-card">
        <form className="verify-form" onSubmit={handleSubmit}>
          <label className="field-group" htmlFor="verifyName">
            <span>Who are you?</span>
            <input
              id="verifyName"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter verification name"
              autoComplete="off"
              required
            />
          </label>

          <label className="field-group" htmlFor="verifyCode">
            <span>Secret code</span>
            <input
              id="verifyCode"
              type="password"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter secret code"
              autoComplete="off"
              required
            />
          </label>

          <button className="btn btn--primary verify-btn" type="submit" disabled={loading}>
            {loading ? "Verifying..." : "Verify and Continue"}
          </button>

          {error ? <p className="error-message verify-error">{error}</p> : null}
        </form>
      </section>
    </main>
  );
};

export default VerifyPage;
