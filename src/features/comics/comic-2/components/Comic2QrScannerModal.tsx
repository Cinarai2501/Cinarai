"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import jsQR from "jsqr";
import type { ComicContentPackageLike } from "@/features/comics/types";
import { resolveComic2ObjectByScanValue } from "@/features/comics/comic-2/content/qrAssetRegistry";

interface Comic2QrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onObjectResolved: (object: ComicContentPackageLike["learningObjects"][number]) => void;
}

export function Comic2QrScannerModal({
  isOpen,
  onClose,
  onObjectResolved,
}: Comic2QrScannerModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [status, setStatus] = useState<"idle" | "scanning" | "error">("idle");
  const [message, setMessage] = useState("Arahkan kamera ke QR Code objek Candi Penataran.");
  const resolvedRef = useRef(false);

  useEffect(() => {
    if (!isOpen) {
      setStatus("idle");
      setMessage("Arahkan kamera ke QR Code objek Candi Penataran.");
      resolvedRef.current = false;
      return;
    }

    let cancelled = false;
    let stream: MediaStream | null = null;
    let loopId: ReturnType<typeof setInterval> | null = null;

    const stopStream = () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      if (loopId) {
        clearInterval(loopId);
      }
    };

    const startScan = async () => {
      if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia) {
        setStatus("error");
        setMessage("Kamera tidak tersedia di perangkat ini.");
        return;
      }

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });

        if (cancelled) {
          stopStream();
          return;
        }

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        setStatus("scanning");
        setMessage("Memindai QR Code…");

        loopId = setInterval(() => {
          if (!videoRef.current || !canvasRef.current || cancelled) {
            return;
          }

          const video = videoRef.current;
          const canvas = canvasRef.current;
          const context = canvas.getContext("2d", { willReadFrequently: true });
          if (!context || video.readyState < 2) {
            return;
          }

          const width = video.videoWidth || 640;
          const height = video.videoHeight || 480;
          canvas.width = width;
          canvas.height = height;
          context.drawImage(video, 0, 0, width, height);

          const imageData = context.getImageData(0, 0, width, height);
          const code = jsQR(imageData.data, width, height);

          if (!code || resolvedRef.current) {
            return;
          }

          const matchedObject = resolveComic2ObjectByScanValue(code.data);
          if (!matchedObject) {
            resolvedRef.current = false;
            setStatus("error");
            setMessage("QR Code tidak dikenali.");
            return;
          }

          resolvedRef.current = true;
          setStatus("scanning");
          setMessage(`Membuka ${matchedObject.title}…`);
          onObjectResolved(matchedObject);
          onClose();
        }, 250);
      } catch (error) {
        if (!cancelled) {
          setStatus("error");
          setMessage("Tidak bisa mengakses kamera. Pastikan izin kamera sudah aktif.");
        }
      }
    };

    void startScan();

    return () => {
      cancelled = true;
      stopStream();
    };
  }, [isOpen, onClose, onObjectResolved]);

  useEffect(() => {
    if (!isOpen) {
      resolvedRef.current = false;
    }
  }, [isOpen]);

  if (!isOpen || typeof document === "undefined") {
    return null;
  }

  const modalContent = (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 px-4 py-6"
      role="dialog"
      aria-modal="true"
      aria-label="Pindai QR objek"
    >
      <div className="w-full max-w-md rounded-[24px] border border-neutral-200 bg-white p-4 shadow-[0_24px_60px_rgba(0,0,0,0.28)] sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-primary-600">
              Scan QR
            </p>
            <h3 className="mt-1 text-lg font-black text-neutral-900">
              Pindai objek Candi Penataran
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-neutral-200 bg-white text-sm font-semibold text-neutral-700 transition hover:bg-neutral-100"
            aria-label="Tutup scanner"
          >
            ✕
          </button>
        </div>

        <div className="mt-4 overflow-hidden rounded-[20px] border border-neutral-200 bg-neutral-100">
          <video
            ref={videoRef}
            className="h-[320px] w-full object-cover sm:h-[360px]"
            playsInline
            autoPlay
            muted
          />
          <canvas ref={canvasRef} className="hidden" />
        </div>

        <div className="mt-4 rounded-[16px] border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-700">
          <p className="font-semibold text-neutral-900">
            {status === "error" ? "Scan gagal" : status === "scanning" ? "Sedang memindai" : "Siap memindai"}
          </p>
          <p className="mt-1 leading-relaxed">{message}</p>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
