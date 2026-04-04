import React, { useEffect, useMemo, useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "";

const VerifyPage = ({ onVerify }) => {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [lockSecondsRemaining, setLockSecondsRemaining] = useState(0);

  const isLocked = lockSecondsRemaining > 0;

  const countdownLabel = useMemo(() => {
    const minutes = Math.floor(lockSecondsRemaining / 60);
    const seconds = lockSecondsRemaining % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }, [lockSecondsRemaining]);

  useEffect(() => {
    if (!isLocked) {
      return undefined;
    }

    const timer = setInterval(() => {
      setLockSecondsRemaining((previous) => (previous <= 1 ? 0 : previous - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [isLocked]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isLocked) {
      setError(`Too many failed attempts. Try again in ${countdownLabel}.`);
      return;
    }

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
        let data;
        let message = "Verification failed.";
        try {
          data = await res.json();
          message = data?.message || message;
        } catch (_parseError) {
          // Use default message when error body is not JSON.
        }

        const retryAfterSeconds = Number(data?.retryAfterSeconds || 0);
        if (retryAfterSeconds > 0) {
          setLockSecondsRemaining(retryAfterSeconds);
        }

        throw new Error(message);
      }

      setLockSecondsRemaining(0);
      onVerify();
    } catch (requestError) {
      setError(requestError.message || "Verification failed.");
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
              disabled={loading || isLocked}
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
              disabled={loading || isLocked}
              required
            />
          </label>

          <button className="btn btn--primary verify-btn" type="submit" disabled={loading || isLocked}>
            {loading ? "Verifying..." : "Verify and Continue"}
          </button>

          {isLocked ? (
            <p className="verify-lockdown">Temporary IP ban active. Try again in {countdownLabel}.</p>
          ) : null}

          {error ? <p className="error-message verify-error">{error}</p> : null}
        </form>
      </section>
    </main>
  );
};

export default VerifyPage;
