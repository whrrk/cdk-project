import type { Course } from "../../types";

type CoursesSectionProps = {
  isLoggedIn: boolean;
  loading: boolean;
  courses: Course[];
  selectedCourse: Course | null;
  newCourseTitle: string;
  newCourseDesc: string;
  enrollCourseId: string;
  onLoadCourses: () => void;
  onCreateCourse: () => void;
  onEnroll: () => void;
  onSelectCourse: (course: Course) => void;
  onNewCourseTitleChange: (value: string) => void;
  onNewCourseDescChange: (value: string) => void;
  onEnrollCourseIdChange: (value: string) => void;
  extractCourseId: (course: Course) => string | null;
  className?: string;
  canManageCourses: boolean;
};

const CoursesSection = ({
  isLoggedIn,
  loading,
  courses,
  selectedCourse,
  newCourseTitle,
  newCourseDesc,
  enrollCourseId,
  onLoadCourses,
  onCreateCourse,
  onEnroll,
  onSelectCourse,
  onNewCourseTitleChange,
  onNewCourseDescChange,
  onEnrollCourseIdChange,
  extractCourseId,
  className,
  canManageCourses,
}: CoursesSectionProps) => {
  return (
    <section className={["panel", "panel-courses", className]
      .filter(Boolean)
      .join(" ")}>
      <div className="panel-header">
        <div>
          <p className="kicker">Courses</p>
          <h2>講座一覧</h2>
        </div>
        <button
          className="btn btn-link"
          onClick={onLoadCourses}
          disabled={!isLoggedIn || loading}
        >
          {loading ? "読み込み中..." : "再読み込み"}
        </button>
      </div>

      <p className="panel-subtitle">
        新規講座の作成や既存講座への参加をここから行えます。
      </p>

      {canManageCourses && (
        <div className="form-grid">
          <input
            className="input"
            placeholder="講座タイトル"
            value={newCourseTitle}
            onChange={(e) => onNewCourseTitleChange(e.target.value)}
          />
          <input
            className="input"
            placeholder="概要"
            value={newCourseDesc}
            onChange={(e) => onNewCourseDescChange(e.target.value)}
          />
          <button
            className="btn btn-primary"
            onClick={onCreateCourse}
            disabled={!isLoggedIn || loading || !newCourseTitle.trim()}
          >
            講座を作成
          </button>
        </div>
      )}

      <div className="form-inline">
        <input
          className="input"
          placeholder="参加したい講座ID"
          value={enrollCourseId}
          onChange={(e) => onEnrollCourseIdChange(e.target.value)}
        />
        <button
          className="btn btn-secondary"
          onClick={onEnroll}
          disabled={!isLoggedIn || loading || !enrollCourseId.trim()}
        >
          参加する
        </button>
      </div>

      <ul className="item-list">
        {courses.map((course) => {
          const courseId = extractCourseId(course);
          const isSelected =
            selectedCourse && extractCourseId(selectedCourse) === courseId;

          return (
            <li
              key={courseId || course.pk}
              className={`item ${isSelected ? "is-selected" : ""}`}
              onClick={() => onSelectCourse(course)}
            >
              <div className="item-title">{course.title || "(no title)"}</div>
              <div className="item-meta">[{courseId}]</div>
            </li>
          );
        })}
        {courses.length === 0 && (
          <li className="empty-state">講座がまだありません</li>
        )}
      </ul>
    </section>
  );
};

export default CoursesSection;
