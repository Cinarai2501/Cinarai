export function deduplicateActivitiesById<T extends { id: string }>(activities: T[]): T[] {
  const unique = new Map<string, T>();
  activities.forEach((activity) => {
    if (!unique.has(activity.id)) unique.set(activity.id, activity);
  });
  return Array.from(unique.values());
}
