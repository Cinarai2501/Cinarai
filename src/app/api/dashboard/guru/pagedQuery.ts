export async function readAllPages<T>(
  fetchPage: (cursor: T | undefined, pageSize: number) => Promise<readonly T[]>,
  pageSize: number,
): Promise<T[]> {
  if (!Number.isInteger(pageSize) || pageSize < 1) {
    throw new RangeError('Page size must be a positive integer.');
  }

  const items: T[] = [];
  let cursor: T | undefined;

  while (true) {
    const page = await fetchPage(cursor, pageSize);
    items.push(...page);
    if (page.length < pageSize) return items;
    cursor = page[page.length - 1];
  }
}
