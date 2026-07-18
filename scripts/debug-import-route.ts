(async () => {
  try {
    const path = `${process.cwd()}/src/app/api/dashboard/guru/route.ts`;
    console.log('[debug] importing route from', path);
    const mod = await import(path);
    console.log('[debug] route module imported successfully');

    // Build a minimal mock NextRequest-like object
    const mockReq = {
      headers: {
        get: (_name: string) => null,
      },
    } as any;

    if (typeof mod.GET === 'function') {
      console.log('[debug] invoking GET handler');
      const res = await mod.GET(mockReq);
      console.log('[debug] GET returned:', res);
    } else {
      console.log('[debug] GET handler not found on module');
    }
  } catch (err) {
    console.error('--- Debug import error stacktrace ---');
    if (err instanceof Error) {
      console.error(err.stack);
    } else {
      console.error(String(err));
    }
    process.exitCode = 1;
  }
})();
