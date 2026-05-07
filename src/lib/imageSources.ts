export interface OptimizedImageSources {
	avif: string;
	webp: string;
	fallback: string;
}

function splitExtension(src: string) {
	const dot = src.lastIndexOf('.');
	if (dot === -1) return { base: src, ext: '' };
	return { base: src.slice(0, dot), ext: src.slice(dot).toLowerCase() };
}

function getOptimizedBase(base: string) {
	return base.endsWith('@1x') || base.endsWith('@2x') ? base : `${base}@1x`;
}

export function getOptimizedImageSources(src: string): OptimizedImageSources {
	const { base, ext } = splitExtension(src);

	if (ext !== '.png') {
		return { avif: '', webp: '', fallback: src };
	}

	const optimizedBase = getOptimizedBase(base);
	const isScaledInput = optimizedBase === base;

	return {
		avif: isScaledInput
			? `${optimizedBase}.avif`
			: `${base}@1x.avif 1x, ${base}@2x.avif 2x`,
		webp: isScaledInput
			? `${optimizedBase}.webp`
			: `${base}@1x.webp 1x, ${base}@2x.webp 2x`,
		fallback: src,
	};
}

export function getOptimizedImageUrl(src: string) {
	const sources = getOptimizedImageSources(src);
	return sources.webp.split(',')[0]?.trim().split(' ')[0] || sources.fallback;
}
