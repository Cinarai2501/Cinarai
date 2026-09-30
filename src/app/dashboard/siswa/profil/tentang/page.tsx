import Image from 'next/image';
import Link from 'next/link';
import DashboardPage from '@/components/dashboard/DashboardPage';
import SoftCard from '@/components/ui/SoftCard';
import appPackage from '../../../../../../package.json';

const learningSteps = [
	{ title: 'Orientasi Masalah', description: 'Mengenali masalah dan membuat dugaan awal.' },
	{ title: 'Eksplorasi', description: 'Mengamati objek dan mencari informasi yang diperlukan.' },
	{ title: 'Identifikasi & Analisis', description: 'Memilah informasi, fakta, dugaan, dan bukti.' },
	{ title: 'Pemecahan Masalah', description: 'Menggunakan matematika, menghitung, lalu memeriksa jawaban.' },
	{ title: 'Kreasi Solusi', description: 'Membuat dan mengembangkan solusi sendiri.' },
	{ title: 'Refleksi', description: 'Melihat kembali cara berpikir dan hal yang sudah dipelajari.' },
];

const thinkingSkills = [
	'Mengamati',
	'Menemukan informasi',
	'Membedakan fakta dan dugaan',
	'Menggunakan bukti',
	'Melakukan perhitungan',
	'Memeriksa jawaban',
	'Mengevaluasi informasi AI',
	'Memberikan alasan',
	'Mengambil keputusan',
];

const sectionIcons = {
	about: '💡',
	steps: '🧭',
	culture: '🏛️',
	ar: '🔎',
	ai: '🤖',
	info: '📘',
};

function SectionHeading({ icon, title, id }: { icon: string; title: string; id?: string }) {
	return (
		<div className="mb-3 flex items-center gap-3">
			<span className="grid h-11 w-11 shrink-0 place-items-center rounded-[16px] bg-[#CCFBF1] text-xl" aria-hidden="true">
				{icon}
			</span>
			<h2 id={id} className="text-[17px] font-extrabold leading-snug text-[#1E293B]">{title}</h2>
		</div>
	);
}

export default function AboutCinaraiPage() {
	return (
		<DashboardPage
			title="Tentang CINARAI"
			subtitle="Kenali teman belajar numerasimu"
			gradientFrom="#0F766E"
			gradientTo="#14B8A6"
			rightContent={(
				<div className="grid h-[62px] w-[62px] shrink-0 place-items-center rounded-[18px] bg-white p-1.5 shadow-sm">
					<Image src="/images/logo/logo.png" alt="Logo CINARAI" width={52} height={52} className="h-full w-full object-contain" />
				</div>
			)}
			contentClassName="pt-4 sm:pt-5"
		>
			<div className="space-y-5 pb-4">
				<Link
					href="/dashboard/siswa/profil"
					className="inline-flex min-h-10 items-center gap-2 rounded-full px-3 text-sm font-bold text-[#0F766E] transition hover:bg-[#CCFBF1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E]"
				>
					<span aria-hidden="true">←</span>
					Kembali ke Profil
				</Link>

				<SoftCard className="overflow-hidden rounded-[28px] border border-[#CCFBF1] bg-white p-5 sm:p-6">
					<div className="flex items-center gap-4">
						<div className="grid h-[76px] w-[76px] shrink-0 place-items-center rounded-[22px] bg-[#E6FFFA] p-2">
							<Image src="/images/logo/logo.png" alt="Identitas CINARAI" width={60} height={60} className="h-full w-full object-contain" />
						</div>
						<div className="min-w-0">
							<p className="text-[22px] font-black leading-tight text-[#0F766E]">CINARAI</p>
							<p className="mt-1 text-sm font-bold leading-snug text-[#475569]">Critical Numeracy with AR &amp; AI</p>
						</div>
					</div>
					<p className="mt-5 text-[15px] font-bold leading-relaxed text-[#1E293B]">
						Belajar matematika dengan mengamati, menemukan bukti, berpikir, dan mengambil keputusan.
					</p>
				</SoftCard>

				<section aria-labelledby="about-title">
					  <SectionHeading id="about-title" icon={sectionIcons.about} title="Apa itu CINARAI?" />
					<SoftCard className="rounded-[24px] p-5">
						<p className="text-sm leading-6 text-[#475569]">
							CINARAI adalah aplikasi pembelajaran yang mengajakmu belajar matematika melalui masalah nyata, budaya, dan lingkungan di sekitar kita. Kamu tidak hanya mencari jawaban, tetapi juga belajar mengamati, memakai bukti, memberi alasan, dan memilih keputusan yang tepat.
						</p>
						<ul className="mt-4 grid grid-cols-1 gap-2 min-[390px]:grid-cols-2" aria-label="Kemampuan yang dilatih di CINARAI">
							{thinkingSkills.map((skill) => (
								<li key={skill} className="flex min-h-10 items-center gap-2 rounded-[14px] bg-[#F0FDFA] px-3 py-2 text-xs font-semibold leading-snug text-[#245B55]">
									<span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#CCFBF1] text-[11px] font-black text-[#0F766E]" aria-hidden="true">✓</span>
									{skill}
								</li>
							))}
						</ul>
					</SoftCard>
				</section>

				<section aria-labelledby="learning-title">
					  <SectionHeading id="learning-title" icon={sectionIcons.steps} title="Bagaimana Cara Belajarnya?" />
					<p className="mb-3 px-1 text-xs leading-relaxed text-[#64748B]">
						Kamu akan melalui Sinteks 1–6. Setelah itu, ada Evaluasi CINARAI sebagai tantangan akhir.
					</p>
					<div className="space-y-2.5">
						{learningSteps.map((step, index) => (
							<SoftCard key={step.title} className="flex items-start gap-3 rounded-[20px] p-4">
								<span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#CCFBF1] text-sm font-black text-[#0F766E]" aria-label={`Tahap ${index + 1}`}>
									{index + 1}
								</span>
								<div className="min-w-0 pt-0.5">
									<h3 className="text-sm font-extrabold leading-snug text-[#1E293B]">{step.title}</h3>
									<p className="mt-1 text-xs leading-relaxed text-[#64748B]">{step.description}</p>
								</div>
							</SoftCard>
						))}
					</div>
					<SoftCard className="mt-3 rounded-[22px] border border-[#FED7AA] bg-[#FFF7ED] p-4">
						<div className="flex items-start gap-3">
							<span className="grid h-10 w-10 shrink-0 place-items-center rounded-[14px] bg-[#FFEDD5] text-xl" aria-hidden="true">🏁</span>
							<div className="min-w-0">
								<p className="text-[11px] font-black uppercase text-[#C2410C]">Tantangan akhir</p>
								<h3 className="mt-0.5 text-sm font-extrabold text-[#7C2D12]">Evaluasi CINARAI</h3>
								<p className="mt-1 text-xs leading-relaxed text-[#9A3412]">Menguji kemampuan numerasi kritis setelah perjalanan belajarmu selesai.</p>
							</div>
						</div>
					</SoftCard>
				</section>

				<section aria-labelledby="culture-title">
					  <SectionHeading id="culture-title" icon={sectionIcons.culture} title="Matematika Ada di Sekitar Kita" />
					<SoftCard className="overflow-hidden rounded-[24px]">
						<div className="relative aspect-[16/9] w-full bg-[#E6FFFA]">
							<Image
								src="/comics/komik-1/cover.png"
								alt="Sampul komik pembelajaran tentang Candi Jawi"
								fill
								sizes="(max-width: 480px) 100vw, 480px"
								className="object-cover"
							/>
						</div>
						<div className="p-5">
							<h3 className="text-base font-extrabold text-[#1E293B]">Kenali bentuk di Candi Jawi</h3>
							<p className="mt-2 text-sm leading-6 text-[#475569]">
								Lewat komik CINARAI, kamu dapat mengamati Candi Jawi dan menemukan matematika pada bentuk, ukuran, serta bangun ruangnya. Kita belajar dari objek budaya dengan melihat bukti, bukan menebak saja.
							</p>
						</div>
					</SoftCard>
				</section>

				<section aria-labelledby="tools-title">
					<h2 id="tools-title" className="mb-3 px-1 text-[17px] font-extrabold text-[#1E293B]">Alat Bantu Belajar</h2>
					<div className="space-y-3">
						<SoftCard className="rounded-[24px] p-5">
							<SectionHeading icon={sectionIcons.ar} title="AR Membantu Kita Mengamati" />
							<p className="text-sm leading-6 text-[#475569]">
								AR membantu kamu melihat dan mengeksplorasi objek dari sudut yang berbeda. Setelah itu, amati lagi dan gunakan bukti untuk membuat kesimpulanmu sendiri.
							</p>
						</SoftCard>
						<SoftCard className="rounded-[24px] p-5">
							<SectionHeading icon={sectionIcons.ai} title="AI adalah Teman Berpikir" />
							<p className="text-sm leading-6 text-[#475569]">
								AI bisa membantu mencari penjelasan, mendapatkan informasi, memeriksa pemahaman, dan memberi masukan. Jawaban AI tetap perlu kamu periksa.
							</p>
							<p className="mt-3 rounded-[16px] bg-[#EEF7FF] p-3 text-sm font-bold leading-relaxed text-[#24527B]">
								Dengarkan AI, periksa informasinya, gunakan bukti, lalu buat keputusan sendiri.
							</p>
						</SoftCard>
					</div>
				</section>

				<SoftCard className="rounded-[26px] bg-[#0F766E] p-5 text-white shadow-[0_12px_28px_rgba(15,118,110,0.18)] sm:p-6">
					<p className="text-[11px] font-black uppercase text-[#99F6E4]">Yang Paling Penting</p>
					<p className="mt-2 text-base font-extrabold leading-relaxed">
						Teknologi membantu kita belajar. Tetapi memahami, memeriksa bukti, berpikir, dan mengambil keputusan tetap dilakukan oleh kita.
					</p>
				</SoftCard>

				<section aria-labelledby="app-info-title">
					  <SectionHeading id="app-info-title" icon={sectionIcons.info} title="Informasi Aplikasi" />
					<SoftCard className="rounded-[24px] px-5 py-1">
						{[
							['Nama Aplikasi', 'CINARAI'],
							['Kepanjangan', 'Critical Numeracy with AR & AI'],
							['Platform', 'Aplikasi pembelajaran digital'],
							['Versi', appPackage.version],
						].map(([label, value]) => (
							<div key={label} className="grid grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] gap-3 border-b border-slate-100 py-3 last:border-b-0">
								<dt className="text-xs font-semibold leading-relaxed text-[#64748B]">{label}</dt>
								<dd className="break-words text-right text-xs font-bold leading-relaxed text-[#1E293B]">{value}</dd>
							</div>
						))}
					</SoftCard>
				</section>

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
