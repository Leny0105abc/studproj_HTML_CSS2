import { Head } from '@inertiajs/react';
import Pagination from '@/components/platform/pagination';
import type { Pagination as Page } from '@/types/platform';

export default function Audit({
    records,
}: {
    records: Page<{
        id: number;
        user?: { name: string };
        event: string;
        subject_type?: string;
        subject_id?: number;
        ip_address?: string;
        occurred_at: string;
    }>;
}) {
    return (
        <>
            <Head title="Audit log" />
            <main className="space-y-6 p-5 sm:p-8">
                <h1 className="text-3xl font-bold">Audit log</h1>
                <div className="overflow-x-auto rounded-xl border">
                    <table className="w-full min-w-[700px] text-left text-sm">
                        <thead>
                            <tr>
                                {[
                                    'User',
                                    'Action',
                                    'Record',
                                    'IP address',
                                    'Time',
                                ].map((t) => (
                                    <th key={t} className="border-b p-3">
                                        {t}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {records.data.map((row) => (
                                <tr key={row.id} className="border-b">
                                    <td className="p-3">{row.user?.name}</td>
                                    <td>{row.event.replaceAll('_', ' ')}</td>
                                    <td>
                                        {row.subject_type?.split('\\').pop()} #
                                        {row.subject_id}
                                    </td>
                                    <td>{row.ip_address ?? '—'}</td>
                                    <td>
                                        {new Date(
                                            row.occurred_at,
                                        ).toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <Pagination links={records.links} />
            </main>
        </>
    );
}
