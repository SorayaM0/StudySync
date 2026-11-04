import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import {
  clearAccessToken,
  createStudySpace,
  getCurrentUser,
  getStudySpaces,
} from "../services/api";
import type {
  StudySpace,
  User,
} from "../services/api";

function DashboardPage() {
  const navigate = useNavigate();

  const [user, setUser] = useState<User | null>(null);
  const [spaces, setSpaces] = useState<StudySpace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [courseCode, setCourseCode] = useState("");
  const [spaceName, setSpaceName] = useState("");
  const [description, setDescription] = useState("");
  const [createError, setCreateError] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [currentUser, studySpaces] =
          await Promise.all([
            getCurrentUser(),
            getStudySpaces(),
          ]);

        setUser(currentUser);
        setSpaces(studySpaces);
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Unable to load your dashboard.";

        setError(message);

        if (
          message.includes("session") ||
          message.includes("sign in")
        ) {
          navigate("/login", { replace: true });
        }
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboard();
  }, [navigate]);

  function handleSignOut() {
    clearAccessToken();
    navigate("/login", { replace: true });
  }

  function openCreateModal() {
    setCreateError("");
    setIsCreateOpen(true);
  }

  function closeCreateModal() {
    if (isCreating) {
      return;
    }

    setIsCreateOpen(false);
    setCreateError("");
  }

  async function handleCreateSpace(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const cleanCourseCode = courseCode.trim();
    const cleanSpaceName = spaceName.trim();
    const cleanDescription = description.trim();

    if (!cleanCourseCode || !cleanSpaceName) {
      setCreateError(
        "Add a course code and a name for your study space.",
      );
      return;
    }

    setCreateError("");
    setIsCreating(true);

    try {
      const newSpace = await createStudySpace({
        course_code: cleanCourseCode,
        name: cleanSpaceName,
        description: cleanDescription || undefined,
      });

      setSpaces((currentSpaces) => [
        newSpace,
        ...currentSpaces,
      ]);

      setCourseCode("");
      setSpaceName("");
      setDescription("");
      setIsCreateOpen(false);
    } catch (err) {
      setCreateError(
        err instanceof Error
          ? err.message
          : "Unable to create your study space.",
      );
    } finally {
      setIsCreating(false);
    }
  }

  if (isLoading) {
    return (
      <main className="dashboard-loading">
        <div className="loading-flower">✿</div>
        <p>getting your study space ready...</p>
      </main>
    );
  }

  return (
    <main className="dashboard-page">
      <header className="dashboard-header">
        <div className="dashboard-brand">
          <div className="dashboard-brand-mark">S</div>
          <span>StudySync</span>
        </div>

        <div className="dashboard-user">
          <div className="user-copy">
            <strong>{user?.display_name}</strong>
            <span>{user?.email}</span>
          </div>

          <div className="user-avatar">
            {user?.display_name
              ?.charAt(0)
              .toUpperCase() ?? "S"}
          </div>

          <button
            type="button"
            className="sign-out-button"
            onClick={handleSignOut}
          >
            sign out
          </button>
        </div>
      </header>

      <div className="dashboard-shell">
        <aside className="dashboard-sidebar">
          <nav className="dashboard-nav">
            <button
              type="button"
              className="nav-item active"
            >
              <span>⌂</span>
              home
            </button>

            <button
              type="button"
              className="nav-item"
            >
              <span>□</span>
              my spaces
            </button>

            <button
              type="button"
              className="nav-item"
            >
              <span>♡</span>
              shared with me
            </button>
          </nav>

          <div className="sidebar-note">
            <span>little reminder</span>
            <p>
              you don't have to finish everything today ♡
            </p>
          </div>
        </aside>

        <section className="dashboard-content">
          <div className="dashboard-welcome">
            <div>
              <span className="dashboard-date">
                your study corner
              </span>

              <h1>
                hi,{" "}
                <em>
                  {user?.display_name?.split(" ")[0] ??
                    "friend"}
                </em>{" "}
                ♡
              </h1>

              <p>
                What are we working on today?
              </p>
            </div>

            <button
              type="button"
              className="new-space-button"
              onClick={openCreateModal}
            >
              <span>＋</span>
              new study space
            </button>
          </div>

          {error && (
            <div className="dashboard-error">
              {error}
            </div>
          )}

          <section className="spaces-section">
            <div className="section-heading">
              <div>
                <span>01</span>
                <h2>your spaces</h2>
              </div>

              <p>
                {spaces.length}{" "}
                {spaces.length === 1
                  ? "space"
                  : "spaces"}
              </p>
            </div>

            {spaces.length === 0 ? (
              <div className="empty-spaces">
                <span className="empty-icon">✿</span>

                <h3>Your desk is a little empty.</h3>

                <p>
                  Make a study space for a course and
                  invite your classmates when you're ready.
                </p>

                <button
                  type="button"
                  onClick={openCreateModal}
                >
                  create your first space →
                </button>
              </div>
            ) : (
              <div className="spaces-grid">
                {spaces.map((space, index) => (
                  <button
                    type="button"
                    className={`space-card space-card-${
                      (index % 3) + 1
                    }`}
                    key={space.id}
                    onClick={() =>
                      navigate(`/spaces/${space.id}`)
                    }
                  >
                    <div className="space-card-top">
                      <span className="course-code">
                        {space.course_code}
                      </span>

                      <span className="space-arrow">
                        ↗
                      </span>
                    </div>

                    <div className="space-card-copy">
                      <h3>{space.name}</h3>

                      <p>
                        {space.description ||
                          "Your shared space for notes and studying."}
                      </p>
                    </div>

                    <div className="space-card-footer">
                      <span>
                        {space.owner_id === user?.id
                          ? "your space"
                          : "shared with you"}
                      </span>

                      <span className="tiny-heart">
                        ♡
                      </span>
                    </div>
                  </button>
                ))}

                <button
                  type="button"
                  className="add-space-card"
                  onClick={openCreateModal}
                >
                  <span>＋</span>
                  <strong>new space</strong>
                  <small>
                    start something together
                  </small>
                </button>
              </div>
            )}
          </section>

          <section className="dashboard-bottom-grid">
            <article className="dashboard-paper">
              <div className="paper-label">
                today
              </div>

              <h3>a tiny study list</h3>

              <div className="study-list">
                <label>
                  <input type="checkbox" />
                  <span>review today's notes</span>
                </label>

                <label>
                  <input type="checkbox" />
                  <span>
                    finish one practice problem
                  </span>
                </label>

                <label>
                  <input type="checkbox" />
                  <span>
                    ask a study friend for help
                  </span>
                </label>
              </div>

              <p className="paper-message">
                small progress still counts.
              </p>
            </article>

            <article className="recent-card">
              <div className="recent-card-heading">
                <div>
                  <span>02</span>
                  <h3>recently</h3>
                </div>

                <span className="recent-heart">
                  ♡
                </span>
              </div>

              <div className="recent-placeholder">
                <span>✦</span>

                <div>
                  <strong>
                    Shared notes will live here.
                  </strong>

                  <p>
                    Once you start working inside a
                    space, your latest notes will be
                    easy to find.
                  </p>
                </div>
              </div>
            </article>
          </section>
        </section>
      </div>

      {isCreateOpen && (
        <div
          className="modal-backdrop"
          onMouseDown={closeCreateModal}
        >
          <section
            className="create-space-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-space-title"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className="modal-decoration">
              ✦
            </div>

            <div className="modal-heading">
              <div>
                <span className="eyebrow">
                  something new ♡
                </span>

                <h2 id="create-space-title">
                  Make a study space
                </h2>

                <p>
                  Give your course a little corner
                  for notes, classmates, and study
                  sessions.
                </p>
              </div>

              <button
                type="button"
                className="modal-close"
                onClick={closeCreateModal}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <form
              className="create-space-form"
              onSubmit={handleCreateSpace}
            >
              <label>
                Course code
                <input
                  type="text"
                  value={courseCode}
                  onChange={(event) =>
                    setCourseCode(event.target.value)
                  }
                  placeholder="ex. CS 336"
                  maxLength={50}
                  autoFocus
                  required
                />
              </label>

              <label>
                Space name
                <input
                  type="text"
                  value={spaceName}
                  onChange={(event) =>
                    setSpaceName(event.target.value)
                  }
                  placeholder="ex. Database Systems"
                  maxLength={150}
                  required
                />
              </label>

              <label>
                Description
                <textarea
                  value={description}
                  onChange={(event) =>
                    setDescription(event.target.value)
                  }
                  placeholder="What are you studying together?"
                  maxLength={1000}
                  rows={4}
                />
              </label>

              {createError && (
                <div className="form-error">
                  {createError}
                </div>
              )}

              <div className="modal-actions">
                <button
                  type="button"
                  className="modal-cancel"
                  onClick={closeCreateModal}
                  disabled={isCreating}
                >
                  maybe later
                </button>

                <button
                  type="submit"
                  className="modal-create"
                  disabled={isCreating}
                >
                  {isCreating
                    ? "creating..."
                    : "create space →"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}

export default DashboardPage;