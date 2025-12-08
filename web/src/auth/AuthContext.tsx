// src/auth/AuthContext.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

type AuthContextValue = {
  idToken: string | null;
  isLoggedIn: boolean;
  login: () => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ==== ここを自分の環境に合わせて書き換える ====
const COGNITO_DOMAIN = import.meta.env.VITE_COGNITO_DOMAIN;
const COGNITO_CLIENT_ID = import.meta.env.VITE_COGNITO_CLIENT_ID;
const REDIRECT_URI = import.meta.env.VITE_REDIRECT_URI;

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [idToken, setIdToken] = useState<string | null>(null);

  // 起動時に localStorage から復元
  useEffect(() => {
    const stored = window.localStorage.getItem("idToken");
    if (stored) {
      setIdToken(stored);
    }
  }, []);

  // URL から id_token を拾う（Hosted UI からリダイレクトされたとき）
  useEffect(() => {
    const tokenFromHash = getParamFromLocation(window.location.hash, "id_token");
    const tokenFromQuery = getParamFromLocation(
      window.location.search,
      "id_token"
    );

    const token = tokenFromHash || tokenFromQuery;

    if (token) {
      setIdToken(token);
      window.localStorage.setItem("idToken", token);
      // URL からトークンを消してきれいにする
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const login = () => {
    const redirect = encodeURIComponent(REDIRECT_URI);

    // 今回は implicit flow (response_type=token) を使う
    const url =
      `${COGNITO_DOMAIN}/login?` +
      `client_id=${COGNITO_CLIENT_ID}` +
      `&response_type=token` +
      `&scope=openid+email+profile` +
      `&redirect_uri=${redirect}`;

    window.location.href = url;
  };

  const logout = () => {
    setIdToken(null);
    window.localStorage.removeItem("idToken");
    // 必要なら Cognito のログアウト URL に飛ばしても良い
  };

  const value: AuthContextValue = {
    idToken,
    isLoggedIn: !!idToken,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

function getParamFromLocation(str: string, key: string): string | null {
  if (!str) return null;
  const clean = str.replace(/^(\?|#)/, "");
  const params = new URLSearchParams(clean);
  return params.get(key);
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
