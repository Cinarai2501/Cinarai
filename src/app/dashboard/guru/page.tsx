'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useAuth } from '@/hooks/useAuth';
import { useGuruDashboard } from './hooks/useGuruDashboard';
import { useStudentFilter } from './hooks/useStudentFilter';
import { useStudentDetail } from './hooks/useStudentDetail';
import { useStudentAiInsight } from './hooks/useStudentAiInsight';
import { GuruHeader } from './components/GuruHeader';
import { DashboardOverview } from './components/DashboardOverview';
import { StudentDirectory } from './components/StudentDirectory';
import { printStudentReport } from './reports/studentReport';

const StudentDetail = dynamic(() => import('./components/StudentDetail').then((module) => module.StudentDetail), { ssr: false });
const AiAssistantPanel = dynamic(() => import('./ai/AiAssistantPanel').then((module) => module.AiAssistantPanel), { ssr: false });

export default function GuruDashboardPage() {
  const { logout } = useAuth();
  const { comics, rows, summary, loading, error } = useGuruDashboard();
  const { filtered, search, setSearch, sortKey, sortDir, toggleSort } = useStudentFilter(rows);
  const [selectedUid, setSelectedUid] = useState<string | null>(null);
  const [tab, setTab] = useState<'overview' | 'students' | 'ai'>('overview');

  const detail = useStudentDetail(selectedUid ?? '', comics);
  const aiInsight = useStudentAiInsight();

  const handleLogout = async () => {
    try { await logout(); } catch { /* ignore */ }
  };

  const handleSelectStudent = (uid: string) => {
    setSelectedUid(uid);
    aiInsight.insight && void 0; // reset handled inside hook
  };

  const handleBack = () => {
    setSelectedUid(null);
  };

  const handleGenerateInsight = () => {
    if (!detail.student) return;
    void aiInsight.generate(
      detail.student.displayName ?? detail.student.email,
      detail.student.email,
      detail.progressList,
      detail.reflections,
      detail.activities
    );
  };

  const handleGeneratePdf = () => {
    const row = rows.find((r) => r.uid === selectedUid);
    if (!row) return;
    printStudentReport(row, comics, aiInsight.insight);
  };

  const topStudents = [...rows].sort((a, b) => b.averageProgress - a.averageProgress);

  return (
    <div className="min-h-screen bg-[#f0f7ff] overflow-x-hidden">
      <GuruHeader summary={summary} loading={loading} onLogout={handleLogout} />

      <div className="relative -mt-16 mx-auto max-w-5xl px-4 pb-12 sm:px-6">
        {error && (
          <div className="mb-4 rounded-2xl bg-error-50 border border-error-200 px-5 py-4 text-sm text-error-700">
            ⚠️ {error}
          </div>
        )}

        {/* Tab nav */}
        {!selectedUid && (
          <div className="mb-4 flex gap-2 overflow-x-auto scrollbar-none pb-1">
            {(['overview', 'students', 'ai'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-shrink-0 rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
                  tab === t
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50'
                }`}
              >
                {t === 'overview' ? '📊 Ringkasan' : t === 'students' ? '👨🎓 Siswa' : '🤖 AI'}
              </button>
            ))}
          </div>
        )}

        {selectedUid ? (
          <StudentDetail
            uid={selectedUid}
            displayName={detail.student?.displayName ?? '—'}
            email={detail.student?.email ?? '—'}
            schoolName={detail.student?.schoolName ?? '—'}
            gradeLevel={detail.student?.gradeLevel ?? null}
            isActive={detail.student?.isActive ?? false}
            comicProgress={detail.comicProgress}
            reflections={detail.reflections}
            activities={detail.activities}
            insight={aiInsight.insight}
            insightLoading={aiInsight.loading}
            insightError={aiInsight.error}
            loading={detail.loading}
            onBack={handleBack}
            onGenerateInsight={handleGenerateInsight}
            onGeneratePdf={handleGeneratePdf}
          />
        ) : tab === 'overview' ? (
          <DashboardOverview summary={summary} topStudents={topStudents} loading={loading} />
        ) : tab === 'students' ? (
          <StudentDirectory
            rows={filtered}
            loading={loading}
            search={search}
            onSearch={setSearch}
            sortKey={sortKey}
            sortDir={sortDir}
            onSort={toggleSort}
            onSelect={handleSelectStudent}
          />
        ) : (
          <AiAssistantPanel rows={rows} comics={comics} />
        )}
      </div>
    </div>
  );
}
