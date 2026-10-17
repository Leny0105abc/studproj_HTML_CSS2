import { Link } from '@inertiajs/react';
import { ArrowLeft, Braces, Check, Code2, GraduationCap } from 'lucide-react';
import AppLogoIcon from '@/components/app-logo-icon';
import type { AuthLayoutProps } from '@/types';

export default function AuthLoginLayout({ children, title, description }: AuthLayoutProps) {
    return (
        <div className="relative isolate min-h-svh overflow-hidden bg-slate-950 text-white">
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_15%_30%,rgba(79,70,229,0.26),transparent_55%),radial-gradient(ellipse_at_90%_85%,rgba(245,158,11,0.09),transparent_45%)]" />
                <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.04)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:linear-gradient(to_bottom,transparent,black_25%,black_75%,transparent)]" />
            </div>

            <header className="relative mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-5 py-6 sm:px-8 lg:px-10">
                <Link href="/" className="flex items-center gap-3 text-base font-bold tracking-tight sm:text-lg">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-indigo-600 shadow-lg shadow-indigo-950/30">
                        <AppLogoIcon aria-hidden="true" className="size-6 text-white" />
                    </span>
                    CodeLab Academy
                </Link>
                <Link href="/" aria-label="Back to homepage" className="flex min-h-10 items-center gap-2 rounded-lg px-2 text-sm text-slate-300 transition-colors hover:text-white focus-visible:outline-indigo-300">
                    <ArrowLeft aria-hidden="true" className="size-4" />
                    <span className="hidden sm:inline">Back to home</span>
                </Link>
            </header>

            <main className="relative mx-auto grid min-h-[calc(100svh-88px)] w-full max-w-7xl items-center gap-12 px-5 pb-10 pt-5 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16 lg:px-10 lg:py-12">
                <section className="hidden max-w-xl lg:block" aria-label="Learn with CodeLab">
                    <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/25 bg-indigo-400/10 px-3 py-2 text-xs font-medium text-indigo-200">
                        <GraduationCap aria-hidden="true" className="size-4" />
                        A space to learn. A place to create.
                    </div>
                    <h2 className="mt-7 text-5xl font-black leading-[1.06] tracking-tight xl:text-6xl">
                        Learn the web.<br />
                        <span className="text-amber-300">Build it live.</span>
                    </h2>
                    <p className="mt-5 max-w-md text-base leading-7 text-slate-300">
                        Turn your curiosity into something you can see. Pick up a lesson, try an idea, and bring your next project to life.
                    </p>

                    <div aria-hidden="true" className="mt-9 overflow-hidden rounded-2xl border border-white/10 bg-slate-900/80 shadow-2xl shadow-black/20">
                        <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
                            <div className="flex items-center gap-2"><span className="size-2.5 rounded-full bg-rose-400" /><span className="size-2.5 rounded-full bg-amber-300" /><span className="size-2.5 rounded-full bg-emerald-400" /></div>
                            <span className="flex items-center gap-2 font-mono text-xs text-slate-400"><Code2 className="size-3.5" /> index.html</span>
                            <span className="text-[10px] font-medium uppercase tracking-widest text-slate-500">Your workspace</span>
                        </div>
                        <div className="grid grid-cols-[1fr_0.95fr]">
                            <div className="flex gap-4 px-5 py-7 font-mono text-xs leading-7 xl:text-sm">
                                <span className="select-none text-right text-slate-600">1<br />2<br />3<br />4<br />5</span>
                                <pre className="text-slate-300"><code><span className="text-indigo-300">&lt;main&gt;</span>{'\n  '}<span className="text-indigo-300">&lt;h1&gt;</span>{'\n    '}Hello, web!{'\n  '}<span className="text-indigo-300">&lt;/h1&gt;</span>{'\n'}<span className="text-indigo-300">&lt;/main&gt;</span></code></pre>
                            </div>
                            <div className="flex items-center bg-indigo-50 p-5">
                                <div className="w-full rounded-xl bg-white p-5 shadow-sm">
                                    <Braces className="size-7 text-indigo-600" />
                                    <p className="mt-3 text-xl font-bold tracking-tight text-slate-900">Hello, web!</p>
                                    <p className="mt-1 text-xs leading-5 text-slate-500">A little code.<br />A world of possibilities.</p>
                                    <span className="mt-4 inline-flex items-center gap-1.5 text-[10px] font-medium text-emerald-700"><Check className="size-3" /> Built by you</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <p className="mt-6 flex items-center gap-2 text-xs text-slate-400"><span className="size-1.5 rounded-full bg-amber-300" /> Guided lessons. Hands-on practice. Teacher feedback.</p>
                </section>

                <section className="mx-auto w-full max-w-[440px]" aria-labelledby="login-title">
                    <p className="mb-6 text-center text-sm text-slate-300 lg:hidden">Learn the web. <span className="text-amber-300">Build it live.</span></p>
                    <div className="rounded-3xl border border-white/15 bg-card p-6 text-card-foreground shadow-2xl shadow-black/25 sm:p-9">
                        <span className="mb-6 inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-indigo-700 dark:bg-indigo-400/10 dark:text-indigo-200"><GraduationCap aria-hidden="true" className="size-3.5" /> Student &amp; teacher portal</span>
                        <h1 id="login-title" className="text-3xl font-bold tracking-tight">{title}</h1>
                        <p className="mb-8 mt-3 text-sm leading-6 text-muted-foreground">{description}</p>
                        {children}
                    </div>
                    <p className="mt-6 text-center text-xs text-slate-400">Your next lesson is a sign-in away.</p>
                </section>
            </main>
        </div>
    );
}
