// src/App.tsx
import { useEffect, useState } from "react";
import "./App.css";
import { useAuth } from "./auth/AuthContext";
import AuthSection from "./components/Auth/AuthSection";
import CoursesSection from "./components/Courses/CoursesSection";
import ThreadsSection from "./components/Threads/ThreadsSection";
import VideoSection from "./components/Videos/VideoSection";
import type { Course, Message, Thread, Video } from "./types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

function App() {
  const { isLoggedIn, login, logout, idToken, userGroups } = useAuth();

  const [courses, setCourses] = useState<Course[]>([]);
  const [newCourseTitle, setNewCourseTitle] = useState("");
  const [newCourseDesc, setNewCourseDesc] = useState("");

  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [newThreadTitle, setNewThreadTitle] = useState("");

  const [videos, setVideos] = useState<Video[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);

  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessageBody, setNewMessageBody] = useState("");

  const [enrollCourseId, setEnrollCourseId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const loadVideos = async (course: Course) => {
    const courseId = extractCourseId(course);
    if (!courseId) {
      setError("courseId を解決できません");
      return;
    }
    setLoadingVideos(true);
    setError(null);
    try {
      const data = await authedFetch(`/courses/${courseId}/videos`, { method: "GET" });
      const list = Array.isArray(data) ? data : [];
      setVideos(list);
      setSelectedVideoId(list[0]?.videoId ?? null);
    } catch (e: any) {
      console.error(e);
      setError(e.message ?? "Unknown error");
    } finally {
      setLoadingVideos(false);
    }
  };

  const canManageCourses = userGroups.some(
    (group) => group === "TEACHER" || group === "ADMIN"
  );

  const createCourse = async () => {
    if (!newCourseTitle.trim()) return;
    if (!canManageCourses) return;
    setLoading(true);
    setError(null);
    try {
      await authedFetch("/courses", {
        method: "POST",
        body: JSON.stringify({
          title: newCourseTitle,
          description: newCourseDesc,
        }),
      });
      setNewCourseTitle("");
      setNewCourseDesc("");
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
    } catch (e: any) {
      console.error(e);
      setError(e.message ?? "Unknown error");
    } finally {
      setLoading(false);
    }
  };

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
    if (!courseId || !newThreadTitle.trim()) return;
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
    if (!selectedThread || !newMessageBody.trim()) return;
    const threadId = extractThreadId(selectedThread);
    if (!threadId) return;
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

  const handleSelectCourse = (course: Course) => {
    setSelectedCourse(course);

    setSelectedThread(null);
    setMessages([]);
    loadThreads(course);

    setVideos([]);
    setSelectedVideoId(null);
    loadVideos(course);
  };

  const handleSelectThread = (thread: Thread) => {
    setSelectedThread(thread);
    loadMessages(thread);
  };

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
    <div className="app-shell">
      <header className="app-header">
        <div>
          <p className="kicker">Learning Portal</p>
          <h1>LEdemy Course Hub</h1>
          <p className="lead">
            Cognitoでログインし、講座とスレッドを横断的に管理できるダッシュボードです。
          </p>
        </div>
        <div className="header-meta">
          <div className="meta-card">
            <p className="meta-label">選択中の講座</p>
            <p className="meta-value">
              {selectedCourse?.title || "未選択"}
            </p>
          </div>
          <div className="meta-card">
            <p className="meta-label">選択中のスレッド</p>
            <p className="meta-value">
              {selectedThread?.title || "未選択"}
            </p>
          </div>
        </div>
      </header>

      <AuthSection
        className="panel-auth"
        isLoggedIn={isLoggedIn}
        login={login}
        logout={logout}
        idToken={idToken ?? null}
      />

      <main className="dashboard-grid">
        <CoursesSection
          className="span-2"
          isLoggedIn={isLoggedIn}
          loading={loading}
          courses={courses}
          selectedCourse={selectedCourse}
          newCourseTitle={newCourseTitle}
          newCourseDesc={newCourseDesc}
          enrollCourseId={enrollCourseId}
          onLoadCourses={loadCourses}
          onCreateCourse={createCourse}
          onEnroll={enroll}
          onSelectCourse={handleSelectCourse}
          onNewCourseTitleChange={setNewCourseTitle}
          onNewCourseDescChange={setNewCourseDesc}
          onEnrollCourseIdChange={setEnrollCourseId}
          extractCourseId={extractCourseId}
          canManageCourses={canManageCourses}
        />
        {selectedCourse ? (
          <div className="right-column">
            <VideoSection
              isLoggedIn={isLoggedIn}
              loadingVideos={loadingVideos}
              videos={videos}
              selectedCourse={selectedCourse}
              extractCourseId={extractCourseId}
              onLoadVideos={(courseId) =>
                selectedCourse && extractCourseId(selectedCourse) === courseId
                  ? loadVideos(selectedCourse)
                  : loadVideos({ ...selectedCourse, courseId } as Course) // 안전하게 하려면 그냥 loadVideos(selectedCourse)만 써도 됨
              }
              selectedVideoId={selectedVideoId}
              onSelectVideo={setSelectedVideoId}
            />

            <ThreadsSection
              isLoggedIn={isLoggedIn}
              loading={loading}
              selectedCourse={selectedCourse}
              threads={threads}
              selectedThread={selectedThread}
              newThreadTitle={newThreadTitle}
              onCreateThread={createThread}
              onSelectThread={handleSelectThread}
              onNewThreadTitleChange={setNewThreadTitle}
              extractCourseId={extractCourseId}
              extractThreadId={extractThreadId}
            />
          </div>
        ) : (
          <section className="panel panel-placeholder">
            <div className="panel-header">
              <div>
                <p className="kicker">Threads</p>
                <h2>講座が未選択です</h2>
              </div>
            </div>
            <p className="panel-subtitle">
              右側のスレッドを表示するには、先に講座を選択してください。
            </p>
          </section>
        )}

        <section className="panel panel-messages span-2">
          {selectedThread ? (
            <>
              <div className="panel-header">
                <div>
                  <p className="kicker">Messages</p>
                  <h2>{selectedThread.title}</h2>
                </div>
              </div>
              <p className="panel-subtitle">
                {selectedThread.title} のディスカッションに参加しましょう。
              </p>
              <div className="form-inline">
                <input
                  className="input"
                  placeholder="Message"
                  value={newMessageBody}
                  onChange={(e) => setNewMessageBody(e.target.value)}
                />
                <button
                  className="btn btn-primary"
                  onClick={postMessage}
                  disabled={!isLoggedIn || loading || !newMessageBody.trim()}
                >
                  Post
                </button>
              </div>
              <ul className="messages-list">
                {messages.map((message) => (
                  <li key={message.sk} className="message-item">
                    <p className="message-body">{message.body}</p>
                    <p className="message-meta">
                      by {message.postedBy} ・ {message.postedAt}
                    </p>
                  </li>
                ))}
                {messages.length === 0 && (
                  <li className="empty-state">まだメッセージがありません</li>
                )}
              </ul>
            </>
          ) : (
            <div className="empty-wrapper">
              <p className="kicker">Messages</p>
              <h2>スレッドを選択してください</h2>
              <p className="panel-subtitle">
                スレッドを選ぶと、ここにメッセージのタイムラインが表示されます。
              </p>
            </div>
          )}
        </section>
      </main>

      {error && <div className="alert alert-error">Error: {error}</div>}
    </div>
  );
}

export default App;
