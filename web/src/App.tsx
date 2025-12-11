// src/App.tsx
import { useEffect, useState } from "react";
import { useAuth } from "./auth/AuthContext";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

type Course = {
  courseId?: string;
  pk?: string;
  sk?: string;
  title?: string;
  description?: string;
  createdAt?: string;
  [key: string]: any;
};

type Thread = {
  pk: string;
  sk: string;
  courseId: string;
  title: string;
  createdBy: string;
  createdAt: string;
  [key: string]: any;
};

type Message = {
  pk: string;
  sk: string;
  body: string;
  postedBy: string;
  postedAt: string;
  [key: string]: any;
};

function App() {
  const { isLoggedIn, login, logout, idToken } = useAuth();

  const [courses, setCourses] = useState<Course[]>([]);
  const [newCourseTitle, setNewCourseTitle] = useState("");
  const [newCourseDesc, setNewCourseDesc] = useState("");

  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [newThreadTitle, setNewThreadTitle] = useState("");

  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessageBody, setNewMessageBody] = useState("");

  const [enrollCourseId, setEnrollCourseId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 共通 fetch ヘルパ
  const authedFetch = async (
    path: string,
    options: RequestInit = {}
  ): Promise<any> => {
    if (!idToken) throw new Error("ログインが必要です");
    const res = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        ...(options.headers || {}),
        Authorization: idToken,
        "Content-Type": "application/json",
      },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.message || `API error: ${res.status}`);
    }
    return data;
  };

  // --- Courses ---
  const loadCourses = async () => {
    if (!idToken) {
      setError("ログインが必要です");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await authedFetch("/courses", { method: "GET" });
      setCourses(Array.isArray(data) ? data : []);
    } catch (e: any) {
      console.error(e);
      setError(e.message ?? "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const createCourse = async () => {
    if (!newCourseTitle.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await authedFetch("/courses", {
        method: "POST",
        body: JSON.stringify({
          title: newCourseTitle,
          description: newCourseDesc,
        }),
      });
      setNewCourseTitle("");
      setNewCourseDesc("");
      // すぐ一覧に反映
      await loadCourses();
    } catch (e: any) {
      console.error(e);
      setError(e.message ?? "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const enroll = async () => {
    if (!enrollCourseId.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await authedFetch(`/courses/${enrollCourseId}/enroll`, {
        method: "POST",
        body: JSON.stringify({ role: "student" }),
      });
      setEnrollCourseId("");
      // enroll 後の挙動は後で listCourses の実装と合わせる
    } catch (e: any) {
      console.error(e);
      setError(e.message ?? "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  // --- Threads ---
  const loadThreads = async (course: Course) => {
    if (!course) return;
    const courseId = extractCourseId(course);
    if (!courseId) {
      setError("courseId を解決できません");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await authedFetch(`/courses/${courseId}/threads`, {
        method: "GET",
      });
      setThreads(Array.isArray(data) ? data : []);
    } catch (e: any) {
      console.error(e);
      setError(e.message ?? "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const createThread = async () => {
    if (!selectedCourse) return;
    const courseId = extractCourseId(selectedCourse);
    if (!courseId) return;
    if (!newThreadTitle.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await authedFetch(`/courses/${courseId}/threads`, {
        method: "POST",
        body: JSON.stringify({ title: newThreadTitle }),
      });
      setNewThreadTitle("");
      await loadThreads(selectedCourse);
    } catch (e: any) {
      console.error(e);
      setError(e.message ?? "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  // --- Messages ---
  const loadMessages = async (thread: Thread) => {
    const threadId = extractThreadId(thread);
    if (!threadId) {
      setError("threadId を解決できません");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await authedFetch(`/threads/${threadId}/messages`, {
        method: "GET",
      });
      setMessages(Array.isArray(data) ? data : []);
    } catch (e: any) {
      console.error(e);
      setError(e.message ?? "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const postMessage = async () => {
    if (!selectedThread) return;
    const threadId = extractThreadId(selectedThread);
    if (!threadId) return;
    if (!newMessageBody.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await authedFetch(`/threads/${threadId}/messages`, {
        method: "POST",
        body: JSON.stringify({ body: newMessageBody }),
      });
      setNewMessageBody("");
      await loadMessages(selectedThread);
    } catch (e: any) {
      console.error(e);
      setError(e.message ?? "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  // ヘルパ: Dynamo の pk / sk から ID 抜く
  function extractCourseId(course: Course): string | null {
    if (course.courseId) return course.courseId;
    if (course.pk && course.pk.startsWith("COURSE#")) {
      return course.pk.replace("COURSE#", "");
    }
    return null;
  }

  function extractThreadId(thread: Thread): string | null {
    if (thread.pk && thread.pk.startsWith("THREAD#")) {
      return thread.pk.replace("THREAD#", "");
    }
    return null;
  }

  useEffect(() => {
    if (isLoggedIn) {
      loadCourses();
    } else {
      setCourses([]);
      setThreads([]);
      setMessages([]);
      setSelectedCourse(null);
      setSelectedThread(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn]);

  return (
    <div style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>
      {/* Auth */}
      <section
        style={{
          padding: 16,
          border: "1px solid #ddd",
          borderRadius: 8,
          marginBottom: 16,
        }}
      >
        <h2>認証</h2>
        {isLoggedIn ? (
          <>
            <p>✅ ログイン中</p>
            <button onClick={logout}>ログアウト</button>
            <p style={{ fontSize: 12, marginTop: 8 }}>
              idToken (先頭だけ): {idToken?.slice(0, 20)}...
            </p>
          </>
        ) : (
          <>
            <p>❌ 未ログイン</p>
            <button onClick={login}>Cognito でログイン</button>
          </>
        )}
      </section>

      {/* Courses */}
      <section
        style={{
          padding: 16,
          border: "1px solid #ddd",
          borderRadius: 8,
          marginBottom: 16,
        }}
      >
        <h2>講座</h2>
        <div style={{ marginBottom: 8 }}>
          <button onClick={loadCourses} disabled={!isLoggedIn || loading}>
            {loading ? "Loading..." : "Reload Courses"}
          </button>
        </div>
        <div style={{ marginBottom: 8 }}>
          <input
            placeholder="Course title"
            value={newCourseTitle}
            onChange={(e) => setNewCourseTitle(e.target.value)}
          />
          <input
            placeholder="Description"
            value={newCourseDesc}
            onChange={(e) => setNewCourseDesc(e.target.value)}
            style={{ marginLeft: 8 }}
          />
          <button
            onClick={createCourse}
            disabled={!isLoggedIn || loading || !newCourseTitle.trim()}
            style={{ marginLeft: 8 }}
          >
            Create Course
          </button>
        </div>

        <div style={{ marginBottom: 8 }}>
          <input
            placeholder="CourseId to enroll"
            value={enrollCourseId}
            onChange={(e) => setEnrollCourseId(e.target.value)}
          />
          <button
            onClick={enroll}
            disabled={!isLoggedIn || loading || !enrollCourseId.trim()}
            style={{ marginLeft: 8 }}
          >
            Enroll
          </button>
        </div>

        <ul>
          {courses.map((c) => {
            const courseId = extractCourseId(c);
            const isSelected =
              selectedCourse && extractCourseId(selectedCourse) === courseId;
            return (
              <li
                key={courseId || c.pk}
                style={{
                  cursor: "pointer",
                  padding: 4,
                  background: isSelected ? "#eef" : undefined,
                }}
                onClick={() => {
                  setSelectedCourse(c);
                  setSelectedThread(null);
                  setMessages([]);
                  loadThreads(c);
                }}
              >
                <strong>{c.title || "(no title)"}</strong>{" "}
                <span style={{ fontSize: 12, color: "#555" }}>
                  [{courseId}]
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Threads */}
      {selectedCourse && (
        <section
          style={{
            padding: 16,
            border: "1px solid #ddd",
            borderRadius: 8,
            marginBottom: 16,
          }}
        >
          <h2>
            講座　スレッド:{" "}
            {selectedCourse.title || extractCourseId(selectedCourse)}
          </h2>
          <div style={{ marginBottom: 8 }}>
            <input
              placeholder="Thread title"
              value={newThreadTitle}
              onChange={(e) => setNewThreadTitle(e.target.value)}
            />
            <button
              onClick={createThread}
              disabled={!isLoggedIn || loading || !newThreadTitle.trim()}
              style={{ marginLeft: 8 }}
            >
              Create Thread
            </button>
          </div>
          <ul>
            {threads.map((t) => {
              const threadId = extractThreadId(t);
              const isSelected =
                selectedThread &&
                extractThreadId(selectedThread) === threadId;
              return (
                <li
                  key={threadId || t.pk}
                  style={{
                    cursor: "pointer",
                    padding: 4,
                    background: isSelected ? "#efe" : undefined,
                  }}
                  onClick={() => {
                    setSelectedThread(t);
                    loadMessages(t);
                  }}
                >
                  <strong>{t.title}</strong>{" "}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* Messages */}
      {selectedThread && (
        <section
          style={{
            padding: 16,
            border: "1px solid #ddd",
            borderRadius: 8,
          }}
        >
          <h2>
            {selectedThread.title}　メッセージ 
          </h2>
          <div style={{ marginBottom: 8 }}>
            <input
              placeholder="Message"
              value={newMessageBody}
              onChange={(e) => setNewMessageBody(e.target.value)}
              style={{ width: "60%" }}
            />
            <button
              onClick={postMessage}
              disabled={!isLoggedIn || loading || !newMessageBody.trim()}
              style={{ marginLeft: 8 }}
            >
              Post
            </button>
          </div>
          <ul>
            {messages.map((m) => (
              <li key={m.sk}>
                <span>{m.body}</span>{" "}
                <span style={{ fontSize: 12, color: "#555" }}>
                  by {m.postedBy} at {m.postedAt}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {error && (
        <p style={{ color: "red", marginTop: 8 }}>Error: {error}</p>
      )}
    </div>
  );
}

export default App;
