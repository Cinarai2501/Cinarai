export function normalizeApplicationAnswer(value: string): string {
  return value.normalize('NFKC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('id-ID');
}

export function isApplicationAnswerCorrect(selected: string[], correctAnswer?: string): boolean {
  if (!correctAnswer || selected.length !== 1) return false;
  return normalizeApplicationAnswer(selected[0]) === normalizeApplicationAnswer(correctAnswer);
}