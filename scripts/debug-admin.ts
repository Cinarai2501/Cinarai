(async () => {
  try {
    const path = `${process.cwd()}/src/lib/firebase/admin.ts`;
    console.log('[debug] importing admin from', path);
    const mod = await import(path);
    console.log('[debug] admin module imported');
    console.log('adminApp:', Boolean(mod.adminApp));
    console.log('adminAuth:', Boolean(mod.adminAuth));
    console.log('adminFirestore:', Boolean(mod.adminFirestore));
    console.log('adminInitializationError:', mod.adminInitializationError);
  } catch (err) {
    console.error('error importing admin:', err instanceof Error ? err.stack : String(err));
    process.exitCode = 1;
  }
})();
