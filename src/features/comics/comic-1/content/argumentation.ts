import { packageContent } from './packageContent';

import type { StaticImageData } from 'next/image';
import KubusImg from '@/features/comics/comic-1/assets/argumentation/Kubus.png';
import BalokImg from '@/features/comics/comic-1/assets/argumentation/Balok.png';
import PrismaImg from '@/features/comics/comic-1/assets/argumentation/Prismasegiempat.png';
import LimasImg from '@/features/comics/comic-1/assets/argumentation/Limassegiempat.png';
import KerucutImg from '@/features/comics/comic-1/assets/argumentation/Kerucut.png';

const assetMap: Record<string, StaticImageData> = {
	'kubus.png': KubusImg,
	'balok.png': BalokImg,
	'prismasegiempat.png': PrismaImg,
	'limassegiempat.png': LimasImg,
	'kerucut.png': KerucutImg,
};

function resolveArgumentationImage(value: unknown): string | undefined {
	if (!value || typeof value !== 'string') return undefined;
	const lower = value.trim().toLowerCase();
	// If the package already points to the src path inside the repo, map it to imported asset.
	const parts = lower.split('/');
	const file = parts[parts.length - 1];
	const found = assetMap[file];
	if (found && typeof (found as StaticImageData).src === 'string') return (found as StaticImageData).src;
	return undefined;
}

// Create a mapped copy of packageContent.argumentation that replaces any
// string references to the local argumentation assets with proper static imports.
export const argumentation = (() => {
	const base = packageContent.argumentation;
	if (!base || !Array.isArray(base.questions)) return base;

	const mapped = {
		...base,
		questions: base.questions.map((q) => ({
			...q,
			// prefer explicit `image` field, otherwise fall back to photoSrc
			image: resolveArgumentationImage(q.image ?? q.photoSrc),
		})),
	};

	return mapped;
})();
