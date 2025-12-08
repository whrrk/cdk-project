// src/App.tsx
import { useState } from "react";
import { useAuth } from "./auth/AuthContext";

// CDK の RestApi URL に合わせて書き換える
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;;

type Course = {
  id?: string;
  [key: string]: any;
};

function App() {
  const { isLoggedIn, login, logout, idToken } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCourses = async () => {
    if (!idToken) {
      setError("ログインが必要です");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/courses`, {
        method: "GET",
        headers: {
          Authorization: idToken, // ここポイント（Bearer 付けない）
        },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "API error");
      }
      setCourses(Array.isArray(data) ? data : []);
    } catch (e: any) {
      console.error(e);
      setError(e.message ?? "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 24, fontFamily: "sans-serif" }}>
      <h1>Day4: React + Cognito Login</h1>

      <section style={{ marginBottom: 16 }}>
        {isLoggedIn ? (
          <>
            <p>✅ ログイン中</p>
            <button onClick={logout}>ログアウト</button>
            <p style={{ fontSize: 12, marginTop: 8 }}>
              idToken (先頭だけ表示): {idToken?.slice(0, 20)}...
            </p>
          </>
        ) : (
          <>
            <p>❌ 未ログイン</p>
            <button onClick={login}>Cognito でログイン</button>
          </>
        )}
      </section>

      <section>
        <h2>/courses を呼び出すテスト</h2>
        <button onClick={fetchCourses} disabled={!isLoggedIn || loading}>
          {loading ? "読み込み中..." : "GET /courses"}
        </button>
        {error && (
          <p style={{ color: "red", marginTop: 8 }}>Error: {error}</p>
        )}
        <pre style={{ marginTop: 12, fontSize: 12, background: "#eee", padding: 8 }}>
          {JSON.stringify(courses, null, 2)}
        </pre>
      </section>
    </div>
  );
}

export default App;
