export type ConversationHistoryGroup = Record<string, Array<{ id: string; title: string; updatedAt: string }>>;

export function buildSuggestedQuestions(question: string): string[] {
  const normalized = question.toLowerCase();

  if (normalized.includes('balok')) {
    return ['Apa rumus volume balok?', 'Contoh balok di rumah', 'Apa beda balok dan kubus?', 'Latihan singkat'];
  }

  if (normalized.includes('kubus')) {
    return ['Apa ciri kubus?', 'Apa rumus kubus?', 'Contoh kubus di rumah', 'Latihan singkat'];
  }

  if (normalized.includes('lingkaran')) {
    return ['Apa ciri lingkaran?', 'Contoh lingkaran di rumah', 'Apa beda lingkaran dan bola?', 'Latihan singkat'];
  }

  return ['Apa ciri bangun ini?', 'Contoh di rumah', 'Latihan singkat', 'Yuk lanjutkan'];
}

export function groupConversationHistoryByPeriod(
  conversations: Array<{ id: string; title: string; updatedAt: string }>,
  now: Date = new Date(),
): ConversationHistoryGroup {
  const groups: ConversationHistoryGroup = {
    'Hari ini': [],
    'Kemarin': [],
    '7 Hari lalu': [],
    '30 Hari lalu': [],
  };

  const cutoffToday = new Date(now); 
  cutoffToday.setHours(0, 0, 0, 0);
  const cutoffYesterday = new Date(cutoffToday);
  cutoffYesterday.setDate(cutoffYesterday.getDate() - 1);
  const cutoff7 = new Date(cutoffToday);
  cutoff7.setDate(cutoff7.getDate() - 7);
  const cutoff30 = new Date(cutoffToday);
  cutoff30.setDate(cutoff30.getDate() - 30);

  conversations.forEach((conversation) => {
    const updatedAt = new Date(conversation.updatedAt);
    if (Number.isNaN(updatedAt.getTime())) {
      groups['30 Hari lalu'].push(conversation);
      return;
    }

    if (updatedAt >= cutoffToday) {
      groups['Hari ini'].push(conversation);
    } else if (updatedAt >= cutoffYesterday) {
      groups['Kemarin'].push(conversation);
    } else if (updatedAt >= cutoff7) {
      groups['7 Hari lalu'].push(conversation);
    } else {
      groups['30 Hari lalu'].push(conversation);
    }
  });

  return groups;
}

export function getConversationTitle(question: string): string {
  const normalized = question.trim().toLowerCase();

  if (normalized.includes('kubus')) {
    return 'Kubus';
  }

  if (normalized.includes('balok')) {
    return 'Balok';
  }

  if (normalized.includes('lingkaran')) {
    return 'Lingkaran';
  }

  if (normalized.includes('segitiga')) {
    return 'Segitiga';
  }

  return 'Percakapan baru';
}
