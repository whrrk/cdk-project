import type { Course, Video } from "../../types";

type VideoSectionProps = {
    isLoggedIn: boolean;
    loadingVideos: boolean;
    videos: Video[];
    selectedCourse: Course | null;

    onLoadVideos: (courseId: string) => void;

    // optional: 映像 選択/再生 UXを為
    selectedVideoId?: string | null;
    onSelectVideo?: (videoId: string) => void;

    extractCourseId: (course: Course) => string | null;
    className?: string;

    // optional: teacher用アップロード
    canManageVideos?: boolean;

    onUploadVideo?: (file: File, title: string) => void;
    canUpload?: boolean;
};

const VideoSection = ({
    isLoggedIn,
    loadingVideos,
    videos,
    selectedCourse,
    onLoadVideos,
    extractCourseId,
    className,
    selectedVideoId,
    onSelectVideo,
    canUpload,
    onUploadVideo
}: VideoSectionProps) => {
    const courseId = selectedCourse ? extractCourseId(selectedCourse) : null;

    const canLoad = isLoggedIn && !!courseId && !loadingVideos;

    const activeVideo =
        selectedVideoId
            ? videos.find((v) => v.videoId === selectedVideoId)
            : videos[0];

    return (
        <section className={["panel", "panel-videos", className].filter(Boolean).join(" ")}>
            <div className="panel-header">
                <div>
                    <p className="kicker">Videos</p>
                    <h2>動画一覧</h2>
                </div>

                <button
                    className="btn btn-link"
                    onClick={() => courseId && onLoadVideos(courseId)}
                    disabled={!canLoad}
                >
                    {loadingVideos ? "読み込み中..." : "再読み込み"}
                </button>
            </div>

            {!selectedCourse && (
                <p className="empty-state">左の講座一覧から講座を選択してください。</p>
            )}

            {selectedCourse && !courseId && (
                <p className="empty-state">講座IDの取得に失敗しました。</p>
            )}

            {canUpload && (
                <div className="upload-box">
                    <div className="upload-box__header">
                        <div>
                            <p className="upload-label">動画アップロード</p>
                            <p className="upload-hint">mp4, mov などのファイルをアップロードできます。</p>
                        </div>
                        <span className="upload-tag">Teacher only</span>
                    </div>
                    <label className="upload-dropzone">
                        <input
                            className="upload-input"
                            type="file"
                            accept="video/*"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                onUploadVideo?.(file, file.name);
                                e.target.value = "";
                            }}
                        />
                        <div className="upload-dropzone__content">
                            <div className="upload-icon">+</div>
                            <p className="upload-dropzone__title">ドラッグ & ドロップ</p>
                            <p className="upload-dropzone__hint">またはクリックして動画を選択</p>
                        </div>
                    </label>
                </div>
            )}

            {selectedCourse && courseId && (
                <>
                    <p className="panel-subtitle">選択中の講座: [{courseId}]</p>

                    {videos.length === 0 && !loadingVideos && (
                        <p className="empty-state">この講座には動画がまだありません。</p>
                    )}

                    {videos.length > 0 && (
                        <div className="video-layout">
                            <ul className="item-list video-list">
                                {videos.map((v) => {
                                    const isSelected = v.videoId === (selectedVideoId ?? videos[0]?.videoId);
                                    const handleClick = () => {
                                        onSelectVideo?.(v.videoId);
                                        if (v.url) {
                                            window.open(v.url, "_blank", "noopener,noreferrer");
                                        }
                                    };
                                    return (
                                        <li
                                            key={v.videoId}
                                            className={`item ${isSelected ? "is-selected" : ""}`}
                                            onClick={handleClick}
                                        >
                                            <div className="item-title">{v.title || "(no title)"}</div>
                                            <div className="item-meta">
                                                [{v.videoId}]
                                                {typeof v.duration === "number" ? ` ・${v.duration}s` : ""}
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>

                            <div className="video-player">
                                {activeVideo?.url ? (
                                    <video
                                        src={activeVideo.url}
                                        controls
                                        preload="metadata"
                                        playsInline
                                        style={{ width: "100%", borderRadius: 12 }}
                                    />
                                ) : (
                                    <div className="empty-state">再生する動画を選んでください。</div>
                                )}
                            </div>
                        </div>
                    )}
                </>
            )}
        </section>
    );
};

export default VideoSection;
