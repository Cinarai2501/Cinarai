// ── Asset kinds ───────────────────────────────────────────────────────────────

export type ComicAssetKind = 'pdf' | 'cover' | 'thumbnail' | 'marker' | 'model';

export type QrTargetKind = 'model' | 'quiz';

// ── Core asset metadata ───────────────────────────────────────────────────────

export interface ComicAsset {
  /** Unique asset identifier: `{comicId}_{kind}` */
  id: string;
  comicId: number;
  kind: ComicAssetKind;
  /** Public URL or storage path */
  path: string;
  /** File name with extension */
  filename: string;
  /** MIME type, e.g. "application/pdf", "image/png" */
  mimeType: string;
  /** File size in bytes; null if unknown */
  sizeBytes: number | null;
  uploadedAt: Date | null;
  updatedAt: Date | null;
}

// ── QR link ───────────────────────────────────────────────────────────────────

export interface QrLink {
  /** Unique QR link identifier: `{comicId}_{targetKind}_{targetId}` */
  id: string;
  comicId: number;
  targetKind: QrTargetKind;
  /** ID of the linked model or quiz */
  targetId: string;
  /** Encoded QR payload */
  payload: string;
  createdAt: Date | null;
}

// ── Pipeline result ───────────────────────────────────────────────────────────

export type PipelineStatus = 'idle' | 'processing' | 'done' | 'error';

export interface PipelineResult<T> {
  status: PipelineStatus;
  data: T | null;
  error: string | null;
}

// ── Repository contracts ──────────────────────────────────────────────────────

export interface ComicAssetRepository {
  getAsset(comicId: number, kind: ComicAssetKind): Promise<ComicAsset | null>;
  listAssets(comicId: number): Promise<ComicAsset[]>;
  saveAsset(asset: ComicAsset): Promise<void>;
  deleteAsset(comicId: number, kind: ComicAssetKind): Promise<void>;
}

export interface QrLinkRepository {
  getQrLink(comicId: number, targetKind: QrTargetKind, targetId: string): Promise<QrLink | null>;
  listQrLinks(comicId: number): Promise<QrLink[]>;
  saveQrLink(link: QrLink): Promise<void>;
  deleteQrLink(id: string): Promise<void>;
}

// ── Pipeline contracts ────────────────────────────────────────────────────────

export interface ComicAssetPipeline {
  readAssets(comicId: number): Promise<PipelineResult<ComicAsset[]>>;
  saveMetadata(asset: ComicAsset): Promise<PipelineResult<void>>;
  linkQrModel(comicId: number, modelId: string): Promise<PipelineResult<QrLink>>;
  linkQrQuiz(comicId: number, quizId: string): Promise<PipelineResult<QrLink>>;
}

// ── Primary repository contract (Comic → ComicAsset) ─────────────────────────

export interface IComicAssetRepository {
  /** Fetch all assets for a single comic. */
  getComicAsset(comicId: number): Promise<ComicAsset[]>;
  /** Fetch assets for every comic. */
  getAllComicAssets(): Promise<ComicAsset[]>;
}

// ── Primary pipeline contract ─────────────────────────────────────────────────

export type PipelineState = 'idle' | 'loading' | 'ready' | 'error';

export interface IComicAssetPipeline {
  /** Current pipeline state. */
  readonly state: PipelineState;
  /** Load (or return cached) assets for all comics. */
  loadComicAssets(): Promise<PipelineResult<ComicAsset[]>>;
  /** Force re-fetch, bypassing cache. */
  refresh(): Promise<PipelineResult<ComicAsset[]>>;
  /** Release resources and reset internal state. */
  dispose(): void;
}

// ── QR classifier contracts ───────────────────────────────────────────────────

export interface QrClassifierResult {
  targetKind: QrTargetKind;
  targetId: string;
  comicId: number;
}

export interface QrClassifier {
  classify(payload: string): QrClassifierResult | null;
  buildPayload(comicId: number, targetKind: QrTargetKind, targetId: string): string;
}

// ── QR category ───────────────────────────────────────────────────────────────

export type QrCategory = 'MODEL_3D' | 'QUIZ' | 'VIDEO' | 'WEBSITE' | 'UNKNOWN';

export interface ClassifiedQr {
  page: number;
  value: string;
  image: string;
  category: QrCategory;
  title?: string;
  /** Short 1–2 sentence description for the Navigation card */
  description?: string;
  /** Preview image path (local public/ path) shown before opening the 3D model */
  previewImage?: string;
  /** QR image asset used by the QR modal */
  qrImage?: string;
  /** Preferred normalized field used by NavigationStage */
  qrUrl?: string;
  /** Legacy aliases kept for compatibility during metadata normalization */
  qr?: string;
  assemblrQR?: string;
  url?: string;
}

// ── Comic metadata ────────────────────────────────────────────────────────────

export interface ComicAssetEntry {
  page: number;
  title: string;
  /** Short 1–2 sentence description shown in the Navigation card */
  description?: string;
  /** Preview image path shown before the user opens the 3D model */
  previewImage?: string;
  buttonLabel: string;
  provider?: string;
  /** AR / 3D model URL used by the Model 3D button */
  arUrl: string;
  /** QR image asset used by the QR button */
  qrImage?: string;
}

export interface ComicAssetGroup {
  model3D: ComicAssetEntry[];
  quiz: ComicAssetEntry[];
  video: ComicAssetEntry[];
  website: ComicAssetEntry[];
}

export interface ComicMetadata {
  comicId: number;
  title: string;
  pageCount: number;
  assets: ComicAssetGroup;
}
