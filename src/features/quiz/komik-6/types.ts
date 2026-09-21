export type Comic6Question =
  | { id: 'komik6-q1' | 'komik6-q2' | 'komik6-q3' | 'komik6-q4'; type: 'essay'; question: string; requiresManualGrading: true }
  | { id: 'komik6-q5'; type: 'drawing'; question: string; requiresManualGrading: true };

export type Comic6DrawingAnswer = {
  type: 'drawing';
  storagePath: string;
  downloadUrl: string;
  submitted: boolean;
};

export type Comic6Answers = Partial<{
  'komik6-q1': string;
  'komik6-q2': string;
  'komik6-q3': string;
  'komik6-q4': string;
  'komik6-q5': Comic6DrawingAnswer;
}>;
