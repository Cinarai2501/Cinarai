(async () => {
  try {
    console.log('[debug] starting firestore debug run');
    const admin = await import('../src/lib/firebase/admin');
    console.log('[debug] admin import done');
    console.log('[debug] adminInitializationError:', admin.adminInitializationError);
    console.log('[debug] adminApp present:', Boolean(admin.adminApp));

    const firestore = admin.adminFirestore;
    if (!firestore) {
      throw new Error('adminFirestore is not initialized');
    }

    // helper to run a collection query with logs
    async function runQuery(label: string, fn: () => Promise<any>) {
      console.log(`[debug] querying ${label} - START`);
      try {
        const res = await fn();
        console.log(`[debug] querying ${label} - DONE, docs: ${Array.isArray(res.docs) ? res.docs.length : 'unknown'}`);
        return res;
      } catch (err) {
        console.error(`[debug] querying ${label} - ERROR`);
        if (err instanceof Error) console.error(err.stack);
        else console.error(String(err));
        throw err;
      }
    }

    // 1. users
    const usersSnapshot = await runQuery('users', async () => firestore.collection('users').where('role', '==', 'student').get());
    // iterate docs and try to access fields
    for (const doc of usersSnapshot.docs) {
      try {
        const data = doc.data();
        // attempt to read some fields
        void data.uid;
        void data.email;
      } catch (err) {
        console.error('[debug] failed parsing user doc', doc.id, err instanceof Error ? err.stack : String(err));
        throw err;
      }
    }

    // 2. progress (collectionGroup)
    const progressSnapshot = await runQuery('progress', async () => firestore.collectionGroup('progress').get());
    for (const doc of progressSnapshot.docs) {
      try {
        const data = doc.data();
        void data.userId;
        void data.percentage;
      } catch (err) {
        console.error('[debug] failed parsing progress doc', doc.id, err instanceof Error ? err.stack : String(err));
        throw err;
      }
    }

    // 3. reflections
    const reflectionsSnapshot = await runQuery('reflection', async () => firestore.collection('reflection').orderBy('createdAt', 'desc').limit(200).get());
    for (const doc of reflectionsSnapshot.docs) {
      try {
        const data = doc.data();
        void data.userId;
        void data.response;
      } catch (err) {
        console.error('[debug] failed parsing reflection doc', doc.id, err instanceof Error ? err.stack : String(err));
        throw err;
      }
    }

    // 4. activity
    const activitySnapshot = await runQuery('activity', async () => firestore.collection('activity').orderBy('occurredAt', 'desc').limit(20).get());
    for (const doc of activitySnapshot.docs) {
      try {
        const data = doc.data();
        void data.userId;
        void data.type;
      } catch (err) {
        console.error('[debug] failed parsing activity doc', doc.id, err instanceof Error ? err.stack : String(err));
        throw err;
      }
    }

    // 5. comics
    const comicsSnapshot = await runQuery('comics', async () => firestore.collection('comics').get());
    for (const doc of comicsSnapshot.docs) {
      try {
        const data = doc.data();
        void data.comicId;
        void data.title;
      } catch (err) {
        console.error('[debug] failed parsing comic doc', doc.id, err instanceof Error ? err.stack : String(err));
        throw err;
      }
    }

    // 6. build snapshot (call buildGuruDashboardSnapshot)
    console.log('[debug] building snapshot - START');
    const { buildGuruDashboardSnapshot } = await import('../src/app/dashboard/guru/services/guru/dashboard/dashboardModel');
    const students = usersSnapshot.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
    const comics = comicsSnapshot.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
    const progressDocuments = progressSnapshot.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
    const activities = activitySnapshot.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
    const reflections = reflectionsSnapshot.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));

    const snapshot = buildGuruDashboardSnapshot({ students, comics, progressDocuments, activities, reflections });
    console.log('[debug] building snapshot - DONE', { summary: snapshot.summary, modulesCount: snapshot.modules.length });

    console.log('[debug] firestore debug run completed successfully');
  } catch (err) {
    console.error('--- firestore debug FAILED ---');
    if (err instanceof Error) console.error(err.stack);
    else console.error(String(err));
    process.exitCode = 1;
  }
})();
