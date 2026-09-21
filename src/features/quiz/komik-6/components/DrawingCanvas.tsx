'use client';

import { useEffect, useRef, useState } from 'react';

type DrawingCanvasProps = { initialImage?: string; onChange: (dataUrl: string) => void };
const CANVAS_WIDTH = 900;
const CANVAS_HEIGHT = 520;

function paintBackground(canvas: HTMLCanvasElement) {
  const context = canvas.getContext('2d');
  if (!context) return;
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  context.lineCap = 'round';
  context.lineJoin = 'round';
}

export default function DrawingCanvas({ initialImage, onChange }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const historyRef = useRef<string[]>([]);
  const drawingRef = useRef(false);
  const [isErasing, setIsErasing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    paintBackground(canvas);
    if (!initialImage) return;
    const image = new Image();
    image.onload = () => canvas.getContext('2d')?.drawImage(image, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    image.src = initialImage;
  }, [initialImage]);

  const getPoint = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const bounds = canvas.getBoundingClientRect();
    return { x: ((event.clientX - bounds.left) / bounds.width) * CANVAS_WIDTH, y: ((event.clientY - bounds.top) / bounds.height) * CANVAS_HEIGHT };
  };
  const snapshot = () => { const canvas = canvasRef.current; if (canvas) historyRef.current = [...historyRef.current.slice(-19), canvas.toDataURL('image/png')]; };
  const notifyChange = () => { const canvas = canvasRef.current; if (canvas) onChange(canvas.toDataURL('image/png')); };

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const location = getPoint(event);
    if (!canvas || !location) return;
    event.preventDefault();
    canvas.setPointerCapture(event.pointerId);
    snapshot();
    const context = canvas.getContext('2d');
    if (!context) return;
    context.strokeStyle = isErasing ? '#ffffff' : '#172033';
    context.lineWidth = isErasing ? 28 : 5;
    context.beginPath();
    context.moveTo(location.x, location.y);
    drawingRef.current = true;
  };
  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    event.preventDefault();
    const location = getPoint(event);
    const context = canvasRef.current?.getContext('2d');
    if (!location || !context) return;
    context.lineTo(location.x, location.y);
    context.stroke();
  };
  const finishStroke = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    event.preventDefault();
    drawingRef.current = false;
    if (canvasRef.current?.hasPointerCapture(event.pointerId)) canvasRef.current.releasePointerCapture(event.pointerId);
    notifyChange();
  };
  const clear = () => { const canvas = canvasRef.current; if (!canvas) return; snapshot(); paintBackground(canvas); onChange(''); };
  const undo = () => {
    const canvas = canvasRef.current;
    const previous = historyRef.current.pop();
    if (!canvas || !previous) return;
    const image = new Image();
    image.onload = () => { paintBackground(canvas); canvas.getContext('2d')?.drawImage(image, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT); notifyChange(); };
    image.src = previous;
  };

  return <div className="mt-5 space-y-3">
    <div className="overflow-hidden rounded-xl border-2 border-slate-300 bg-white"><canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={finishStroke} onPointerCancel={finishStroke} className="block h-auto w-full touch-none" aria-label="Area menggambar jawaban" /></div>
    <div className="flex flex-wrap gap-3">
      <button type="button" onClick={() => setIsErasing((current) => !current)} aria-label="Hapus goresan" className={`min-h-11 rounded-xl border px-4 py-2 text-sm font-bold ${isErasing ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-300 text-slate-700'}`}>{isErasing ? 'Selesai Menghapus' : 'Penghapus'}</button>
      <button type="button" onClick={clear} aria-label="Hapus gambar" className="min-h-11 rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700">Hapus</button>
      <button type="button" onClick={undo} aria-label="Batalkan goresan terakhir" className="min-h-11 rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700">Undo</button>
      <button type="button" onClick={clear} className="min-h-11 rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700">Ulangi Gambar</button>
    </div>
  </div>;
}
