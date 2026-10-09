import { Link } from '@inertiajs/react';
import { BarChart3, BookOpen, ClipboardCheck, FlaskConical, LayoutDashboard, Users } from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { usePage } from '@inertiajs/react';
import type { NavItem } from '@/types';

export function AppSidebar() {
    const { auth } = usePage().props;
    const isTeacher = auth.user.role !== 'student';
    const mainNavItems: NavItem[] = isTeacher
        ? [
              { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
              { title: 'Students', href: '/students', icon: Users },
              { title: 'Courses', href: '/admin/courses', icon: BookOpen },
              { title: 'Modules & Lessons', href: '/admin/lessons', icon: BookOpen },
              { title: 'Activities', href: '/activities', icon: ClipboardCheck },
              { title: 'Course progress', href: '/admin/progress', icon: BarChart3 },
              { title: 'Lessons', href: '/lessons', icon: BookOpen },
              { title: 'Submissions', href: '/submissions', icon: ClipboardCheck },
              { title: 'Case Studies', href: '/case-studies', icon: FlaskConical },
              { title: 'Reports', href: '/reports', icon: BarChart3 },
          ]
        : [
              { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
              { title: 'My courses', href: '/my-courses', icon: BookOpen },
              { title: 'Activities', href: '/activities', icon: ClipboardCheck },
              { title: 'Projects', href: '/case-studies', icon: FlaskConical },
              { title: 'Learning profile', href: '/learning-profile', icon: Users },
          ];
    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/dashboard" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
