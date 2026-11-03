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
  const { comics, rows, summary, loading, error, dataState, hasLoaded, retry } = useGuruDashboard();
  const studentFilter = useStudentFilter(rows, comics.length);
  const [selectedUid, setSelectedUid] = useState<string | null>(null);
  const [tab, setTab] = useState<GuruDashboardTab>('overview');
  const [moduleToOpen, setModuleToOpen] = useState<number | null>(null);

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
    setModuleToOpen(null);
    setTab(nextTab);
  };

  const handleOpenModule = (comicId: number) => {
    if (selectedUid) {
      aiInsight.reset();
      setSelectedUid(null);
    }
    setModuleToOpen(comicId);
    setTab('modules');
  };

  const handleGenerateInsight = (forceRefresh = false) => {
    if (!detail.student || detail.student.uid !== selectedUid) return;
    void aiInsight.generate(detail.student.uid, forceRefresh);
  };

  const handleGeneratePdf = () => {
    const row = rows.find((r) => r.uid === selectedUid);
    if (!row) return;
    printStudentReport(row, comics, aiInsight.insight);
  };

  return (
    <div className="guru-dashboard-shell min-h-[100dvh] overflow-x-hidden bg-canvas text-ink lg:pl-64">
      <GuruHeader />

      <main className="mx-auto max-w-[1440px] px-3 py-4 pb-[calc(96px+env(safe-area-inset-bottom))] sm:px-6 sm:py-6 lg:px-8 lg:pb-8">
        {error && (selectedUid || (tab !== 'overview' && tab !== 'students')) && (
          <div role="alert" className="mb-3 rounded-2xl border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700">
            <p className="font-bold">Data dashboard belum dapat diperbarui.</p>
            <p className="mt-1 break-words">{error}</p>
            <button type="button" onClick={retry} className="mt-3 min-h-11 rounded-lg bg-error-700 px-4 text-sm font-bold text-white">
              Coba lagi
            </button>
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
            insightRetryAfterSeconds={aiInsight.retryAfterSeconds}
            insightGeneratedAt={aiInsight.analysisGeneratedAt}
            insightCacheHit={aiInsight.cacheHit}
            insightCacheWarning={aiInsight.cacheWarning}
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
            comics={comics}
            loading={loading}
            hasLoaded={hasLoaded}
            dataState={dataState}
            error={error}
            onRetry={retry}
            onSelectStudent={handleSelectStudent}
            onOpenStudents={() => handleTabChange('students')}
            onOpenModules={() => handleTabChange('modules')}
            onOpenModule={handleOpenModule}
          />
        ) : tab === 'students' ? (
          <StudentDirectory
            rows={studentFilter.visible}
            totalCount={studentFilter.filtered.length}
            loading={loading}
            hasLoaded={hasLoaded}
            error={error}
            onRetry={retry}
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
          <ModuleDirectory
            key={moduleToOpen ?? 'directory'}
            comics={comics}
            rows={rows}
            loading={loading}
            initialComicId={moduleToOpen}
            onSelectStudent={handleSelectStudent}
          />
        )}
      </main>
      <GuruBottomNav activeTab={tab} onTabChange={handleTabChange} onLogout={handleLogout} />
    </div>
  );
}
