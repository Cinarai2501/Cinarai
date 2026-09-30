import type { ReactNode } from 'react';
import Link from 'next/link';
import DashboardPage from '@/components/dashboard/DashboardPage';
import SoftCard from '@/components/ui/SoftCard';

const frequentlyAskedQuestions: Array<{ question: string; answer: ReactNode }> = [
  {
    question: 'Apa itu CINARAI?',
    answer: (
      <p>
        CINARAI — Critical Numeracy with AR &amp; AI adalah aplikasi pembelajaran yang membantu kamu belajar numerasi kritis melalui aktivitas belajar, konteks budaya, AR, dan AI.
      </p>
    ),
  },
  {
    question: 'Bagaimana cara memulai pembelajaran?',
    answer: (
      <p>
        Dari halaman utama, buka pembelajaran yang ingin kamu ikuti. Pilih komik yang tersedia, lalu ikuti tahapan yang muncul di layar.
      </p>
    ),
  },
  {
    question: 'Apa itu Sinteks?',
    answer: (
      <>
        <p>Sinteks adalah tahapan dalam perjalanan pembelajaran CINARAI. Perjalanan ini terdiri dari Sinteks 1 sampai Sinteks 6.</p>
        <p className="mt-2">Setelah perjalanan pembelajaran selesai, kamu dapat mengikuti Evaluasi CINARAI sebagai tantangan akhir. Evaluasi bukan Sinteks 7.</p>
      </>
    ),
  },
  {
    question: 'Bagaimana cara mengerjakan Komik?',
    answer: (
      <p>
        Buka tab Komik, pilih komik, lalu baca cerita dan ikuti aktivitas yang tersedia dalam tahapan pembelajarannya.
      </p>
    ),
  },
  {
    question: 'Apa itu AI Tutor?',
    answer: (
      <p>
        AI Tutor dapat membantu menjelaskan materi dan mengajakmu berpikir melalui pertanyaan atau masukan. Jawaban AI tetap perlu kamu pahami dan periksa.
      </p>
    ),
  },
  {
    question: 'Apa fungsi AR?',
    answer: (
      <p>
        AR membantu kamu mengeksplorasi atau melihat objek dengan lebih visual pada aktivitas yang menyediakan AR. AR adalah alat bantu belajar, bukan pengganti pengamatan dan proses berpikirmu.
      </p>
    ),
  },
  {
    question: 'Bagaimana jika saya tidak memahami soal?',
    answer: (
      <ol className="list-decimal space-y-1.5 pl-5">
        <li>Baca kembali masalahnya.</li>
        <li>Perhatikan informasi yang diberikan.</li>
        <li>Gunakan fitur bantuan yang tersedia.</li>
        <li>Coba AI Tutor jika tersedia.</li>
        <li>Ceritakan kembali apa yang sudah kamu pahami.</li>
      </ol>
    ),
  },
  {
    question: 'Bagaimana cara melihat perkembangan belajar?',
    answer: (
      <p>
        Buka tab Komik. Setiap kartu komik menampilkan persentase progres, jumlah tahapan yang selesai, dan status seperti Belum Mulai, Berlangsung, atau Selesai.
      </p>
    ),
  },
  {
    question: 'Bagaimana cara mengulang pembelajaran?',
    answer: (
      <p>
        Saat membuka pembelajaran sebuah komik, pilih <strong>Ulang Pembelajaran</strong> di bagian bawah dan konfirmasi. Progres serta jawaban yang tersimpan untuk komik itu akan dihapus dan dimulai lagi dari awal.
      </p>
    ),
  },
  {
    question: 'Bagaimana cara keluar dari akun?',
    answer: (
      <p>
        Buka Profil, lalu tekan <strong>Keluar</strong>.
      </p>
    ),
  },
];

export default function StudentHelpPage() {
  return (
    <DashboardPage
      title="Pusat Bantuan"
      subtitle="Butuh bantuan menggunakan CINARAI? Temukan jawabannya di sini."
      gradientFrom="#0F766E"
      gradientTo="#14B8A6"
      rightContent={(
        <div className="grid h-[60px] w-[60px] shrink-0 place-items-center rounded-[18px] bg-white/20 text-white">
          <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="9" />
            <path d="M9.5 9a2.5 2.5 0 1 1 4.2 1.8c-1.1 1-1.7 1.4-1.7 2.7" />
            <path d="M12 17h.01" />
          </svg>
        </div>
      )}
      headerAction={(
        <Link
          href="/dashboard/siswa/profil"
          className="inline-flex min-h-9 items-center gap-2 rounded-full px-2 text-sm font-bold text-white transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <span aria-hidden="true">←</span>
          Kembali ke Profil
        </Link>
      )}
      contentClassName="pt-4 sm:pt-5"
    >
      <div className="space-y-4 pb-4">
        <section aria-labelledby="faq-heading" className="space-y-3">
          <div className="px-1">
            <h2 id="faq-heading" className="text-[17px] font-extrabold text-[#1E293B]">Pertanyaan yang Sering Ditanyakan</h2>
            <p className="mt-1 text-xs leading-relaxed text-[#64748B]">Pilih pertanyaan untuk membaca jawabannya.</p>
          </div>

          <div className="space-y-2.5">
            {frequentlyAskedQuestions.map((item, index) => (
              <SoftCard key={item.question} as="details" className="group overflow-hidden rounded-[20px]">
                <summary className="flex min-h-[60px] cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0F766E] [&::-webkit-details-marker]:hidden">
                  <span className="flex min-w-0 items-start gap-3">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#CCFBF1] text-xs font-black text-[#0F766E]" aria-hidden="true">{index + 1}</span>
                    <span className="pt-0.5 text-sm font-bold leading-snug text-[#1E293B]">{item.question}</span>
                  </span>
                  <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-[#0F766E] transition-transform duration-200 group-open:rotate-180" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </summary>
                <div className="border-t border-slate-100 px-4 pb-4 pt-3 pl-14 text-sm leading-relaxed text-[#475569]">
                  {item.answer}
                </div>
              </SoftCard>
            ))}
          </div>
        </section>

        <SoftCard className="rounded-[22px] border border-[#FDE68A] bg-[#FFFBEB] p-4">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[14px] bg-[#FEF3C7] text-xl" aria-hidden="true">💡</span>
            <div className="min-w-0">
              <h2 className="text-sm font-extrabold text-[#713F12]">Tips Belajar</h2>
              <p className="mt-1 text-xs leading-relaxed text-[#854D0E]">
                Jangan terburu-buru mencari jawaban. Amati masalahnya, cari informasi penting, gunakan bukti, hitung dengan teliti, lalu periksa kembali jawabanmu.
              </p>
            </div>
          </div>
        </SoftCard>

        <Link
          href="/dashboard/siswa/profil"
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-[18px] border border-[#99F6E4] bg-white px-4 py-3 text-sm font-extrabold text-[#0F766E] transition hover:bg-[#F0FDFA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E]"
        >
          <span aria-hidden="true">←</span>
          Kembali ke Profil
        </Link>
      </div>
    </DashboardPage>
  );
}