import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  loginUser,
  registerUser,
} from "../services/api";

function RegisterPage() {
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setIsSubmitting(true);

    try {
      await registerUser({
        display_name: displayName,
        email,
        password,
      });

      const loginResult = await loginUser({
        email,
        password,
      });

      localStorage.setItem(
        "studysync_access_token",
        loginResult.access_token,
      );

      navigate("/dashboard");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to create your account.",
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
          <span className="eyebrow">your study space starts here ♡</span>

          <h2>
            Make studying feel
            <br />
            a little lighter.
          </h2>

          <p>
            Create your account and bring your courses,
            notes, and favorite study people together.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            Your name
            <input
              type="text"
              value={displayName}
              onChange={(event) =>
                setDisplayName(event.target.value)
              }
              placeholder="What should we call you?"
              required
            />
          </label>

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
              onChange={(event) =>
                setPassword(event.target.value)
              }
              placeholder="At least 8 characters"
              minLength={8}
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
            {isSubmitting
              ? "Creating your space..."
              : "Create my account →"}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account?{" "}
          <Link to="/login">Sign in</Link>
        </p>
      </section>

      <section className="auth-visual">
        <div className="visual-content">
          <span className="eyebrow">
            made for study friends
          </span>

          <h2>
            Your notes don't have
            <br />
            to study <em>alone.</em>
          </h2>

          <p>
            Make a space for each course, invite your classmates,
            and keep everyone's notes in sync.
          </p>

          <div className="feature-preview">
            <div>
              <strong>CS 336 · Database Systems</strong>
              <span>4 shared notes · exam next week</span>
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

export default RegisterPage;