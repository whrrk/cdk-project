type AuthSectionProps = {
  isLoggedIn: boolean;
  login: () => void;
  logout: () => void;
  idToken: string | null;
  className?: string;
};

const AuthSection = ({
  isLoggedIn,
  login,
  logout,
  idToken,
  className,
}: AuthSectionProps) => {
  const statusLabel = isLoggedIn ? "ログイン中" : "未ログイン";
  const statusClass = isLoggedIn ? "is-success" : "is-danger";

  return (
    <section className={["panel", "panel-auth", className]
      .filter(Boolean)
      .join(" ")}>
      <div className="panel-header">
        <div>
          <p className="kicker">Account</p>
          <h2>認証</h2>
        </div>
        <span className={`status-pill ${statusClass}`}>{statusLabel}</span>
      </div>
      <p className="panel-subtitle">
        Cognitoでログインして講座・スレッドを閲覧できます。
      </p>
      <div className="panel-actions">
        {isLoggedIn ? (
          <button className="btn btn-secondary" onClick={logout}>
            ログアウト
          </button>
        ) : (
          <button className="btn btn-primary" onClick={login}>
            Cognitoでログイン
          </button>
        )}
      </div>
      {isLoggedIn && (
        <p className="token-preview">
          idToken (先頭だけ): {idToken?.slice(0, 20)}...
        </p>
      )}
    </section>
  );
};

export default AuthSection;
