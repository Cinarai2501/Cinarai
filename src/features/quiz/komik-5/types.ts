export type Comic5Question = {
  id: `komik5-q${1 | 2 | 3 | 4 | 5}`;
  type: 'essay' | 'multiple_choice';
  question: string;
  options?: readonly { key: 'A' | 'B' | 'C' | 'D'; label: string }[];
  correctAnswer?: 'A' | 'B' | 'C' | 'D';
  requiresManualGrading: boolean;
};

export type Comic5Answers = Partial<Record<Comic5Question['id'], string>>;
