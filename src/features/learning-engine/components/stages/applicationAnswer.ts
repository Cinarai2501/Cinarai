export function normalizeApplicationAnswer(value: string): string {
  return value.normalize('NFKC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('id-ID');
}

export function isApplicationAnswerCorrect(selected: string[], correctAnswer?: string, acceptableAnswers: string[] = []): boolean {
  if (selected.length !== 1) return false;
  const expectedAnswers = [correctAnswer, ...acceptableAnswers].filter((answer): answer is string => Boolean(answer));
  const normalizedSelected = normalizeApplicationAnswer(selected[0]);
  return expectedAnswers.some((answer) => normalizedSelected === normalizeApplicationAnswer(answer));
}

export function areApplicationCardsCompleted(cardIds: string[], cardResults: Record<string, boolean>): boolean {
  return cardIds.length > 0 && cardIds.every((cardId) => cardResults[cardId] === true);
}