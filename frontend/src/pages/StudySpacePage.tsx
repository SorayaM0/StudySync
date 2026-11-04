import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  clearAccessToken,
  createNote,
  getCurrentUser,
  getNotes,
  getSpaceMembers,
  getStudySpace,
} from "../services/api";
import type {
  Member,
  Note,
  StudySpace,
  User,
} from "../services/api";

function StudySpacePage() {
  const navigate = useNavigate();
  const { spaceId } = useParams();

  const [user, setUser] = useState<User | null>(null);
  const [space, setSpace] = useState<StudySpace | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [isNoteModalOpen, setIsNoteModalOpen] =
    useState(false);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [noteError, setNoteError] = useState("");
  const [isCreatingNote, setIsCreatingNote] =
    useState(false);

  const numericSpaceId = Number(spaceId);

  useEffect(() => {
    async function loadSpace() {
      if (
        !Number.isInteger(numericSpaceId) ||
        numericSpaceId <= 0
      ) {
        setError("This study space doesn't exist.");
        setIsLoading(false);
        return;
      }

      try {
        const [
          currentUser,
          currentSpace,
          currentMembers,
          currentNotes,
        ] = await Promise.all([
          getCurrentUser(),
          getStudySpace(numericSpaceId),
          getSpaceMembers(numericSpaceId),
          getNotes(numericSpaceId),
        ]);

        setUser(currentUser);
        setSpace(currentSpace);
        setMembers(currentMembers);
        setNotes(currentNotes);
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Unable to load this study space.";

        setError(message);

        if (
          message.includes("session") ||
          message.includes("sign in")
        ) {
          navigate("/login", {
            replace: true,
          });
        }
      } finally {
        setIsLoading(false);
      }
    }

    loadSpace();
  }, [navigate, numericSpaceId]);

  function handleSignOut() {
    clearAccessToken();

    navigate("/login", {
      replace: true,
    });
  }

  function openNoteModal() {
    setNoteError("");
    setNoteTitle("");
    setNoteContent("");
    setIsNoteModalOpen(true);
  }

  function closeNoteModal() {
    if (isCreatingNote) {
      return;
    }

    setIsNoteModalOpen(false);
    setNoteError("");
  }

  async function handleCreateNote(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const cleanTitle = noteTitle.trim();

    if (!cleanTitle) {
      setNoteError("Give your note a title first.");
      return;
    }

    setNoteError("");
    setIsCreatingNote(true);

    try {
      const newNote = await createNote(
        numericSpaceId,
        {
          title: cleanTitle,
          content: noteContent,
        },
      );

      setNotes((currentNotes) => [
        newNote,
        ...currentNotes,
      ]);

      setNoteTitle("");
      setNoteContent("");
      setIsNoteModalOpen(false);
    } catch (err) {
      setNoteError(
        err instanceof Error
          ? err.message
          : "Unable to save your note.",
      );
    } finally {
      setIsCreatingNote(false);
    }
  }

  if (isLoading) {
    return (
      <main className="dashboard-loading">
        <div className="loading-flower">✿</div>
        <p>opening your study space...</p>
      </main>
    );
  }

  if (error || !space) {
    return (
      <main className="space-error-page">
        <div className="space-error-card">
          <span>♡</span>

          <h1>Couldn't open this space.</h1>

          <p>
            {error ||
              "This study space isn't available."}
          </p>

          <button
            type="button"
            onClick={() =>
              navigate("/dashboard")
            }
          >
            ← back to dashboard
          </button>
        </div>
      </main>
    );
  }

  const isOwner = space.owner_id === user?.id;

  return (
    <main className="study-space-page">
      <header className="dashboard-header">
        <button
          type="button"
          className="dashboard-brand space-brand-button"
          onClick={() =>
            navigate("/dashboard")
          }
        >
          <div className="dashboard-brand-mark">
            S
          </div>

          <span>StudySync</span>
        </button>

        <div className="dashboard-user">
          <div className="user-copy">
            <strong>
              {user?.display_name}
            </strong>

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

      <div className="study-space-shell">
        <aside className="space-sidebar">
          <button
            type="button"
            className="back-dashboard-button"
            onClick={() =>
              navigate("/dashboard")
            }
          >
            ← all spaces
          </button>

          <div className="space-sidebar-course">
            <span>
              {space.course_code}
            </span>

            <h2>{space.name}</h2>

            {space.description && (
              <p>{space.description}</p>
            )}
          </div>

          <nav className="space-nav">
            <button
              type="button"
              className="space-nav-item active"
            >
              <span>✎</span>
              notes
            </button>

            <button
              type="button"
              className="space-nav-item"
            >
              <span>♡</span>
              study friends
            </button>
          </nav>

          <div className="space-sidebar-members">
            <div className="sidebar-members-heading">
              <span>studying here</span>

              <strong>
                {members.length}
              </strong>
            </div>

            <div className="member-stack">
              {members
                .slice(0, 4)
                .map((member) => (
                  <div
                    className="sidebar-member"
                    key={
                      member.membership_id
                    }
                  >
                    <div className="mini-avatar">
                      {member.display_name
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    <div>
                      <strong>
                        {member.display_name}
                      </strong>

                      <span>
                        {member.role}
                      </span>
                    </div>
                  </div>
                ))}
            </div>

            {isOwner && (
              <button
                type="button"
                className="invite-sidebar-button"
              >
                + invite someone
              </button>
            )}
          </div>

          <div className="sidebar-note">
            <span>study note</span>

            <p>
              messy notes are still notes.
              keep going ♡
            </p>
          </div>
        </aside>

        <section className="space-main">
          <header className="space-hero">
            <div>
              <span className="space-eyebrow">
                {space.course_code}
                {" · "}
                {isOwner
                  ? "your space"
                  : "shared space"}
              </span>

              <h1>{space.name}</h1>

              <p>
                {space.description ||
                  "A little place for everything you're learning together."}
              </p>
            </div>

            <button
              type="button"
              className="new-note-button"
              onClick={openNoteModal}
            >
              <span>＋</span>
              new note
            </button>
          </header>

          <div className="space-divider">
            <span>shared notes</span>

            <div />

            <span>
              {notes.length}{" "}
              {notes.length === 1
                ? "note"
                : "notes"}
            </span>
          </div>

          {notes.length === 0 ? (
            <section className="notes-empty-state">
              <div className="empty-note-paper">
                <span>✦</span>

                <h2>
                  Start the first note.
                </h2>

                <p>
                  Lecture notes, exam review,
                  confusing concepts — put it
                  here so everyone can build on
                  it together.
                </p>

                <button
                  type="button"
                  onClick={openNoteModal}
                >
                  write a note →
                </button>
              </div>
            </section>
          ) : (
            <section className="notes-grid">
              {notes.map(
                (note, index) => (
                  <button
                    type="button"
                    className={`note-card note-card-${
                      (index % 3) + 1
                    }`}
                    key={note.id}
                  >
                    <div className="note-card-top">
                      <span>
                        note{" "}
                        {String(
                          index + 1,
                        ).padStart(
                          2,
                          "0",
                        )}
                      </span>

                      <span>↗</span>
                    </div>

                    <div>
                      <h2>
                        {note.title}
                      </h2>

                      <p>
                        {note.content ||
                          "This note is waiting for something brilliant."}
                      </p>
                    </div>

                    <footer>
                      <span>
                        updated{" "}
                        {new Date(
                          note.updated_at,
                        ).toLocaleDateString(
                          undefined,
                          {
                            month: "short",
                            day: "numeric",
                          },
                        )}
                      </span>

                      <span>♡</span>
                    </footer>
                  </button>
                ),
              )}
            </section>
          )}

          <section className="space-members-section">
            <div className="space-divider">
              <span>study friends</span>

              <div />

              <span>
                {members.length}
              </span>
            </div>

            <div className="members-list">
              {members.map((member) => (
                <article
                  className="member-card"
                  key={
                    member.membership_id
                  }
                >
                  <div className="member-avatar">
                    {member.display_name
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                  <div className="member-details">
                    <strong>
                      {member.display_name}
                    </strong>

                    <span>
                      {member.email}
                    </span>
                  </div>

                  <span className="member-role">
                    {member.role}
                  </span>
                </article>
              ))}

              {isOwner && (
                <button
                  type="button"
                  className="member-invite-card"
                >
                  <span>＋</span>

                  <div>
                    <strong>
                      invite a study friend
                    </strong>

                    <small>
                      add them by email
                    </small>
                  </div>
                </button>
              )}
            </div>
          </section>
        </section>
      </div>

      {isNoteModalOpen && (
        <div
          className="modal-backdrop"
          onMouseDown={closeNoteModal}
        >
          <section
            className="create-space-modal note-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-note-title"
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
                  shared note ♡
                </span>

                <h2 id="new-note-title">
                  Write something down
                </h2>

                <p>
                  Add lecture notes, review
                  material, or something your
                  study friends shouldn't forget.
                </p>
              </div>

              <button
                type="button"
                className="modal-close"
                onClick={closeNoteModal}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <form
              className="create-space-form"
              onSubmit={handleCreateNote}
            >
              <label>
                Note title
                <input
                  type="text"
                  value={noteTitle}
                  onChange={(event) =>
                    setNoteTitle(
                      event.target.value,
                    )
                  }
                  placeholder="ex. Dynamic Programming Review"
                  maxLength={200}
                  autoFocus
                  required
                />
              </label>

              <label>
                Your notes
                <textarea
                  className="note-content-input"
                  value={noteContent}
                  onChange={(event) =>
                    setNoteContent(
                      event.target.value,
                    )
                  }
                  placeholder="Start typing..."
                  maxLength={50000}
                  rows={10}
                />
              </label>

              {noteError && (
                <div className="form-error">
                  {noteError}
                </div>
              )}

              <div className="note-character-count">
                {noteContent.length.toLocaleString()}
                {" / "}
                50,000
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="modal-cancel"
                  onClick={closeNoteModal}
                  disabled={isCreatingNote}
                >
                  maybe later
                </button>

                <button
                  type="submit"
                  className="modal-create"
                  disabled={isCreatingNote}
                >
                  {isCreatingNote
                    ? "saving..."
                    : "save note →"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}

export default StudySpacePage;