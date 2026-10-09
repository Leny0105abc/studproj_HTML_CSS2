export type Program = {
    id: number;
    name: string;
    slug: string;
    description?: string;
    courses?: Course[];
};
export type Course = {
    id: number;
    name: string;
    slug: string;
    short_description?: string;
    description?: string;
    difficulty: string;
    status: string;
    editor_type: string;
    execution_provider?: string;
    education_levels?: Program[];
    levels?: {
        id: number;
        name: string;
        description?: string;
        status: string;
    }[];
    lessons_count?: number;
};
export type CourseCard = Course & {
    programs: string[];
    total: number;
    completed: number;
    progress: number;
    nextLesson: { id: number; title: string } | null;
};
export type Pagination<T> = {
    data: T[];
    links: { url: string | null; label: string; active: boolean }[];
    total: number;
};
