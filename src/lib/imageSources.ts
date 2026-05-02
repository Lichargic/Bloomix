export interface OptimizedImageSources {
	avif: string;
	webp: string;
	fallback: string;
}

export function stripExtension(src: string) {
	return src.replace(/\.[a-z0-9]+$/i, "");
}

export function getOptimizedImageSources(src: string): OptimizedImageSources {
	return {
		avif: "",
		webp: "",
		fallback: src,
	};
}

export function getOptimizedImageUrl(src: string) {
	return src;
}
