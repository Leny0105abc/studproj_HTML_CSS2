import { Head, Link } from '@inertiajs/react';
import { ArrowRight, BookOpen, Code2, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Program, Course } from '@/types/platform';

export default function Landing({
    programs = [],
    featured = [],
}: {
    programs?: Program[];
    featured?: Course[];
}) {
    return (
        <>
            <Head title="CodeLab · Learn. Code. Practice. Build." />
            <div className="min-h-screen bg-white text-slate-950">
                <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-6">
                    <Link
                        href="/"
                        className="flex items-center gap-2 text-xl font-extrabold"
                    >
                        <Code2 className="size-7 text-indigo-600" />
                        CODELAB
                    </Link>
                    <nav className="flex items-center gap-4 text-sm">
                        <Link href="/courses">Explore courses</Link>
                        <Button asChild variant="outline">
                            <Link href="/login">Sign in</Link>
                        </Button>
                    </nav>
                </header>
                <main>
                    <section className="mx-auto grid max-w-6xl gap-10 px-5 py-16 sm:py-24 lg:grid-cols-[1.3fr_1fr] lg:items-center">
                        <div>
                            <p className="text-sm font-semibold tracking-widest text-indigo-600 uppercase">
                                Programming education for every next step
                            </p>
                            <h1 className="mt-5 text-5xl font-extrabold tracking-tight sm:text-6xl">
                                Learn. Code.
                                <br />
                                Practice. Build.
                            </h1>
                            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
                                A structured programming learning platform for
                                High School and College students. Follow clear
                                lessons, practice your skills, and build with
                                teacher guidance.
                            </p>
                            <div className="mt-8 flex flex-wrap gap-3">
                                <Button asChild size="lg">
                                    <Link href="/courses">
                                        Explore courses
                                        <ArrowRight />
                                    </Link>
                                </Button>
                                <Button asChild variant="outline" size="lg">
                                    <Link href="/login">Sign in to learn</Link>
                                </Button>
                            </div>
                        </div>
                        <div className="rounded-3xl bg-slate-950 p-7 text-white shadow-xl">
                            <div className="mb-6 flex gap-2">
                                <span className="size-3 rounded-full bg-rose-400" />
                                <span className="size-3 rounded-full bg-amber-400" />
                                <span className="size-3 rounded-full bg-emerald-400" />
                            </div>
                            <p className="font-mono text-sm text-slate-400">
                                your-learning-path
                            </p>
                            <ol className="mt-6 space-y-5">
                                {[
                                    'Understand a new idea',
                                    'Try it in your coding workspace',
                                    'Complete an activity and quiz',
                                    'Build a project you can be proud of',
                                ].map((text, i) => (
                                    <li key={text} className="flex gap-4">
                                        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-indigo-500/20 text-indigo-200">
                                            {i + 1}
                                        </span>
                                        <span className="pt-1 text-slate-200">
                                            {text}
                                        </span>
                                    </li>
                                ))}
                            </ol>
                        </div>
                    </section>
                    <section className="bg-slate-50 px-5 py-16">
                        <div className="mx-auto max-w-6xl">
                            <h2 className="text-3xl font-bold">
                                Choose your learning program
                            </h2>
                            <p className="mt-3 text-slate-600">
                                Courses organized for your education level, with
                                room to grow.
                            </p>
                            <div className="mt-8 grid gap-6 md:grid-cols-2">
                                {programs.map((program) => (
                                    <article
                                        key={program.id}
                                        className="rounded-2xl border bg-white p-7"
                                    >
                                        <GraduationCap className="mb-5 size-9 text-indigo-600" />
                                        <h3 className="text-2xl font-bold">
                                            {program.name} Program
                                        </h3>
                                        <p className="mt-3 leading-7 text-slate-600">
                                            {program.description}
                                        </p>
                                        <p className="mt-4 text-sm text-slate-500">
                                            {program.courses?.length
                                                ? program.courses
                                                      .map((c) => c.name)
                                                      .join(' · ')
                                                : 'New course content is being prepared.'}
                                        </p>
                                        <Button
                                            asChild
                                            variant="outline"
                                            className="mt-6"
                                        >
                                            <Link
                                                href={
                                                    '/programs/' + program.slug
                                                }
                                            >
                                                Explore {program.name} courses
                                                <ArrowRight className="size-4" />
                                            </Link>
                                        </Button>
                                    </article>
                                ))}
                            </div>
                        </div>
                    </section>
                    <section className="mx-auto max-w-6xl px-5 py-16">
                        <h2 className="text-3xl font-bold">Featured courses</h2>
                        <div className="mt-8 grid gap-5 md:grid-cols-3">
                            {featured.map((course) => (
                                <article
                                    key={course.id}
                                    className="rounded-2xl border p-6"
                                >
                                    <BookOpen className="size-8 text-indigo-600" />
                                    <h3 className="mt-5 text-xl font-bold">
                                        {course.name}
                                    </h3>
                                    <p className="mt-3 text-sm leading-6 text-slate-600">
                                        {course.short_description}
                                    </p>
                                    <Link
                                        href={'/courses/' + course.slug}
                                        className="mt-5 inline-block text-sm font-semibold text-indigo-600"
                                    >
                                        Explore course →
                                    </Link>
                                </article>
                            ))}
                        </div>
                    </section>
                    <section className="mx-auto grid max-w-6xl gap-8 px-5 pb-20 md:grid-cols-3">
                        {[
                            [
                                'A clear learning path',
                                'Progress through organized lessons, practice activities and quizzes.',
                            ],
                            [
                                'Learn by building',
                                'Write code, see results and apply what you learn in real projects.',
                            ],
                            [
                                'Teacher-guided progress',
                                'Get feedback, keep your work saved and move forward with confidence.',
                            ],
                        ].map(([title, text]) => (
                            <article key={title}>
                                <h2 className="text-lg font-bold">{title}</h2>
                                <p className="mt-2 text-sm leading-7 text-slate-600">
                                    {text}
                                </p>
                            </article>
                        ))}
                    </section>
                </main>
                <footer className="border-t px-5 py-8 text-center text-sm text-slate-500">
                    CodeLab · Learn. Code. Practice. Build.
                </footer>
            </div>
        </>
    );
}
