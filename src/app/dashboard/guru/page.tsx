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
import { ModuleDirectory } from './components/ModuleDirectory';
import { GuruBottomNav, type GuruDashboardTab } from './components/GuruBottomNav';
import { printStudentReport } from './reports/studentReport';

const StudentDetail = dynamic(() => import('./components/StudentDetail').then((module) => module.StudentDetail), { ssr: false });
const AiAssistantPanel = dynamic(() => import('./ai/AiAssistantPanel').then((module) => module.AiAssistantPanel), { ssr: false });

export default function GuruDashboardPage() {
  const { logout } = useAuth();
  const { comics, rows, summary, recentActivities, recentActivityLoading, loading, error } = useGuruDashboard();
  const studentFilter = useStudentFilter(rows, comics.length);
  const [selectedUid, setSelectedUid] = useState<string | null>(null);
  const [tab, setTab] = useState<GuruDashboardTab>('overview');

  const detail = useStudentDetail(selectedUid ?? '', comics);
  const aiInsight = useStudentAiInsight();

  const handleLogout = async () => {
    try { await logout(); } catch { /* ignore */ }
  };

  const handleSelectStudent = (uid: string) => {
    aiInsight.reset(uid);
    setSelectedUid(uid);
  };

  const handleBack = () => {
    aiInsight.reset();
    setSelectedUid(null);
  };

  const handleTabChange = (nextTab: GuruDashboardTab) => {
    if (selectedUid) {
      aiInsight.reset();
      setSelectedUid(null);
    }
    setTab(nextTab);
  };

  const handleGenerateInsight = () => {
    if (!detail.student || detail.student.uid !== selectedUid) return;
    void aiInsight.generate(detail.student.uid);
  };

  const handleGeneratePdf = () => {
    const row = rows.find((r) => r.uid === selectedUid);
    if (!row) return;
    printStudentReport(row, comics, aiInsight.insight);
  };

  const topStudents = [...rows].sort((a, b) => b.averageProgress - a.averageProgress);

  return (
    <div className="min-h-[100dvh] overflow-x-hidden bg-[#f0f7ff]">
      <GuruHeader summary={summary} loading={loading} />

      <main className="mx-auto max-w-5xl px-3 py-3 pb-[calc(88px+env(safe-area-inset-bottom))] sm:px-6 sm:py-5">
        {error && (
          <div role="alert" className="mb-3 rounded-2xl border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700">
            <p className="font-bold">Sebagian data dashboard tidak dapat dimuat.</p>
            <p className="mt-1 break-words">{error}</p>
          </div>
        )}

        {selectedUid ? (
          <StudentDetail
            key={selectedUid}
            uid={selectedUid}
            profile={detail.student}
            displayName={detail.student?.displayName?.trim()
              || detail.student?.nickname?.trim()
              || detail.student?.username?.trim()
              || 'Belum diisi'}
            email={detail.student?.email?.trim() || 'Belum diisi'}
            username={detail.student?.username}
            nickname={detail.student?.nickname}
            photoURL={detail.student?.photoURL ?? detail.student?.avatar}
            schoolId={detail.student?.schoolId}
            schoolName={detail.student?.schoolName?.trim() || 'Belum diisi'}
            classLevel={detail.student?.classLevel ?? null}
            gradeLevel={detail.student?.gradeLevel ?? null}
            isActive={detail.student?.isActive}
            gender={detail.student?.gender}
            bio={detail.student?.bio}
            createdAt={detail.student?.createdAt}
            comicProgress={detail.comicProgress}
            evaluation={detail.evaluation}
            reflections={detail.reflections}
            activities={detail.activities}
            applicationActivities={detail.applicationActivities}
            identificationAnswers={detail.identificationAnswers}
            moduleProgress={detail.moduleProgress}
            aiTutorChats={detail.aiTutorChats}
            insight={aiInsight.insight}
            insightLoading={aiInsight.loading}
            insightError={aiInsight.error}
            loading={detail.loading}
            error={detail.error}
            onBack={handleBack}
            onGenerateInsight={handleGenerateInsight}
            onGeneratePdf={handleGeneratePdf}
          />
        ) : tab === 'overview' ? (
          <DashboardOverview
            summary={summary}
            rows={rows}
            topStudents={topStudents}
            comics={comics}
            recentActivities={recentActivities}
            recentActivityLoading={recentActivityLoading}
            loading={loading}
            onSelectStudent={handleSelectStudent}
            onOpenAi={() => handleTabChange('ai')}
            onOpenStudents={() => handleTabChange('students')}
            onOpenModules={() => handleTabChange('modules')}
          />
        ) : tab === 'students' ? (
          <StudentDirectory
            rows={studentFilter.visible}
            totalCount={studentFilter.filtered.length}
            loading={loading}
            search={studentFilter.search}
            onSearch={studentFilter.setSearch}
            status={studentFilter.status}
            onStatus={studentFilter.setStatus}
            sortKey={studentFilter.sortKey}
            sortDir={studentFilter.sortDir}
            onSort={studentFilter.toggleSort}
            page={studentFilter.page}
            pageCount={studentFilter.pageCount}
            onPage={studentFilter.setPage}
            totalComics={comics.length}
            onSelect={handleSelectStudent}
          />
        ) : tab === 'ai' ? (
          <AiAssistantPanel
            students={rows}
            studentCount={summary.totalStudents}
            dashboardLoading={loading}
            onSelectStudent={handleSelectStudent}
          />
        ) : (
          <ModuleDirectory comics={comics} rows={rows} loading={loading} />
        )}
      </main>
      <GuruBottomNav activeTab={tab} onTabChange={handleTabChange} onLogout={handleLogout} />
    </div>
  );
}
