import type { Meta, StoryObj } from "@storybook/react";
import CoursesSection from "./CoursesSection";
import type { Course } from "../../types";

const extractCourseId = (course: Course) =>
    // 프로젝트 로직에 맞춰 수정 (예시)
    // course.pk 가 "COURSE#abc" 같은 형태면 여기서 파싱
    (course as any).courseId ?? (course as any).id ?? null;

const sampleCourses: Course[] = [
    { pk: "COURSE#1", title: "React 入門" } as any,
    { pk: "COURSE#2", title: "TypeScript 実践" } as any,
    { pk: "COURSE#3", title: "AWS CDK ハンズオン" } as any,
];

function fn() {
    return () => { /* noop */ };
}

const meta: Meta<typeof CoursesSection> = {
    title: "Sections/CoursesSection",
    component: CoursesSection,
    args: {
        isLoggedIn: true,
        loading: false,
        courses: sampleCourses,
        selectedCourse: sampleCourses[1],
        newCourseTitle: "",
        newCourseDesc: "",
        enrollCourseId: "",
        canManageCourses: true,

        // handlers: 일단은 mock으로
        onLoadCourses: fn(),
        onCreateCourse: fn(),
        onEnroll: fn(),
        onSelectCourse: fn(),
        onNewCourseTitleChange: fn(),
        onNewCourseDescChange: fn(),
        onEnrollCourseIdChange: fn(),
        extractCourseId,
    },
};
export default meta;



type Story = StoryObj<typeof CoursesSection>;
