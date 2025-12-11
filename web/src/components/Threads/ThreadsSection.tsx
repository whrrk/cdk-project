import type { Course, Thread } from "../../types";

type ThreadsSectionProps = {
  isLoggedIn: boolean;
  loading: boolean;
  selectedCourse: Course;
  threads: Thread[];
  selectedThread: Thread | null;
  newThreadTitle: string;
  onCreateThread: () => void;
  onSelectThread: (thread: Thread) => void;
  onNewThreadTitleChange: (value: string) => void;
  extractCourseId: (course: Course) => string | null;
  extractThreadId: (thread: Thread) => string | null;
  className?: string;
};

const ThreadsSection = ({
  isLoggedIn,
  loading,
  selectedCourse,
  threads,
  selectedThread,
  newThreadTitle,
  onCreateThread,
  onSelectThread,
  onNewThreadTitleChange,
  extractCourseId,
  extractThreadId,
  className,
}: ThreadsSectionProps) => {
  return (
    <section className={["panel", "panel-threads", className]
      .filter(Boolean)
      .join(" ")}>
      <div className="panel-header">
        <div>
          <p className="kicker">Threads</p>
          <h2>
            {selectedCourse.title || extractCourseId(selectedCourse)} のスレッド
          </h2>
        </div>
      </div>
      <p className="panel-subtitle">
        質問や議題ごとにスレッドを立てて受講生と議論しましょう。
      </p>
      <div className="form-inline">
        <input
          className="input"
          placeholder="Thread title"
          value={newThreadTitle}
          onChange={(e) => onNewThreadTitleChange(e.target.value)}
        />
        <button
          className="btn btn-primary"
          onClick={onCreateThread}
          disabled={!isLoggedIn || loading || !newThreadTitle.trim()}
        >
          Create Thread
        </button>
      </div>
      <ul className="item-list">
        {threads.map((thread) => {
          const threadId = extractThreadId(thread);
          const isSelected =
            selectedThread && extractThreadId(selectedThread) === threadId;
          const createdAtLabel = thread.createdAt
            ? new Date(thread.createdAt).toLocaleString()
            : "";

          return (
            <li
              key={threadId || thread.pk}
              className={`item ${isSelected ? "is-selected" : ""}`}
              onClick={() => onSelectThread(thread)}
            >
              <div className="item-title">{thread.title}</div>
              <div className="item-meta">
                by {thread.createdBy}
                {createdAtLabel ? ` ・ ${createdAtLabel}` : ""}
              </div>
            </li>
          );
        })}
        {threads.length === 0 && (
          <li className="empty-state">まだスレッドがありません</li>
        )}
      </ul>
    </section>
  );
};

export default ThreadsSection;
