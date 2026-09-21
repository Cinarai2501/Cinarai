export type Comic3Question =
  | {
      id: 'komik3-q1' | 'komik3-q2';
      type: 'essay';
      question: string;
    }
  | {
      id: 'komik3-q3';
      type: 'image-identification';
      question: string;
      imagePrompts: readonly [
        { id: 'shape-1'; label: 'Bangun 1'; assetPath: string },
        { id: 'shape-2'; label: 'Bangun 2'; assetPath: string },
        { id: 'shape-3'; label: 'Bangun 3'; assetPath: string },
      ];
    };

export type Comic3Answers = {
  'komik3-q1'?: string;
  'komik3-q2'?: string;
  'komik3-q3'?: Record<'shape-1' | 'shape-2' | 'shape-3', string>;
};