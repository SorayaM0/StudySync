import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

import { loginUser } from "../services/api";

function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setIsSubmitting(true);

    try {
      const result = await loginUser({
        email,
        password,
      });

      localStorage.setItem(
        "studysync_access_token",
        result.access_token,
      );

      navigate("/dashboard");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to sign in.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-panel">
        <div className="brand">
          <div className="brand-mark">S</div>

          <div>
            <h1>StudySync</h1>
            <p>study better, together.</p>
          </div>
        </div>

        <div className="auth-heading">
          <span className="eyebrow">welcome back ♡</span>

          <h2>
            Ready for another
            <br />
            study session?
          </h2>

          <p>
            Your courses, notes, and study friends are right
            where you left them.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              required
            />
          </label>

          {error && (
            <div className="form-error">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="primary-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Signing in..." : "Sign in →"}
          </button>
        </form>

        <p className="auth-switch">
          New to StudySync?{" "}
          <Link to="/register">Create an account</Link>
        </p>
      </section>

      <section className="auth-visual">
        <div className="visual-content">
          <span className="eyebrow">
            your study corner
          </span>

          <h2>
            Everything for class,
            <br />
            <em>together.</em>
          </h2>

          <p>
            Keep notes close, classmates closer, and everything
            you're working on in one calm little space.
          </p>

          <div className="feature-preview">
            <div>
              <strong>CS 336 · Database Systems</strong>
              <span>exam review · updated 12 min ago</span>
            </div>

            <div className="preview-members">
              <span>S + 2</span>
              <span className="live-dot">studying</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default LoginPage;