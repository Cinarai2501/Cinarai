/** Step navigasi dalam Identification */
export type IdentificationStep = 'OBSERVE' | 'IDENTIFY' | 'CONFIRM';

/** Status satu item identifikasi */
export type IdentificationItemStatus = 'PENDING' | 'OBSERVED';

/** Status jawaban satu item */
export type AnswerStatus = 'UNANSWERED' | 'ANSWERED' | 'SAVED';

/** Status alasan satu item */
export type ReasonStatus = 'EMPTY' | 'DRAFT' | 'SAVED';

/** Satu pilihan jawaban */
export interface AnswerOption {
  readonly id: string;
  readonly text: string;
}

/** Satu item identifikasi — merepresentasikan satu learning target */
export interface IdentificationItem {
  readonly id: string;
  readonly targetIndex: number;
  readonly targetText: string;
  readonly question: string;
  readonly image: string;
  readonly options: AnswerOption[];
  readonly correctOptionId: string;
  readonly explanation: string;
  status: IdentificationItemStatus;
  selectedOptionId: string | null;
  note: string;
  answerStatus: AnswerStatus;
  reason: string;
  reasonStatus: ReasonStatus;
}

/** State Step 1 — Amati */
export interface ObserveState {
  /** Catatan bebas siswa saat mengamati */
  note: string;
  /** true setelah siswa menekan tombol Lanjut di step Amati */
  isDone: boolean;
}

/** State keseluruhan Identification Engine */
export interface IdentificationState {
  readonly comicId: number;
  readonly lokasi: string;
  readonly cover: string;
  readonly title: string;
  observe: ObserveState;
  items: IdentificationItem[];
  /** Jumlah item yang sudah SAVED */
  observedCount: number;
  /** true jika semua item sudah SAVED */
  isComplete: boolean;
}

/** Payload untuk aksi mark-observed */
export interface MarkObservedPayload {
  itemId: string;
}

/** Payload untuk memilih jawaban */
export interface SelectAnswerPayload {
  itemId: string;
  optionId: string;
}

/** Payload untuk update catatan */
export interface UpdateNotePayload {
  itemId: string;
  note: string;
}

/** Payload untuk simpan jawaban */
export interface SaveAnswerPayload {
  itemId: string;
}
