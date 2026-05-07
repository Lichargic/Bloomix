import { useEffect, useRef } from "react";
import { SEASONS, getTreeStages } from "../lib/theme";
import { getOptimizedImageUrl } from "../lib/imageSources";
import { Particles } from "./Particles";
import { useTheme } from "../providers/ThemeProvider";
import type { Season } from "../lib/theme";
import { getSkinById } from "../lib/store";
import type { SkinId } from "../lib/store";

// ─── Animated canvas tree (wind-sway shader) ─────────────────────────────────

export interface AnimatedTreeProps {
	src: string;
	className?: string;
	mobile?: boolean;
}

export function AnimatedTree({ src, className = "tree-canvas", mobile = false }: AnimatedTreeProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const imgRef   = useRef<HTMLImageElement | null>(null);

	// Animation loop — runs once per mount, reads imgRef each frame so src
	// swaps are seamless with no loop restart or canvas clear.
	useEffect(() => {
		const canvas = canvasRef.current;
		const ctx = canvas?.getContext("2d");
		if (!canvas || !ctx) return;

		let frame = 0;
		let active = true;

		function fitRect(img: HTMLImageElement, width: number, height: number) {
			const iw = img.naturalWidth || img.width;
			const ih = img.naturalHeight || img.height;
			const scale = Math.min(width / iw, height / ih);
			const w = iw * scale;
			const h = ih * scale;
			return { x: (width - w) / 2, y: height - h, w, h };
		}

		function resize() {
			const box = canvas!.getBoundingClientRect();
			const dpr = Math.min(window.devicePixelRatio || 1, 2);
			const width  = Math.max(1, Math.round(box.width));
			const height = Math.max(1, Math.round(box.height));
			canvas!.width  = Math.round(width  * dpr);
			canvas!.height = Math.round(height * dpr);
			ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
		}

		function draw(now: number) {
			if (!active) return;
			const img    = imgRef.current;
			const width  = canvas!.clientWidth;
			const height = canvas!.clientHeight;
			ctx!.clearRect(0, 0, width, height);

			if (img) {
				const rect   = fitRect(img, width, height);
				const slice  = mobile ? 5 : 6;
				const maxAmp = mobile ? 5 : 9;
				const phase  = now * 0.00042;
				const overlap = 0.5;

				for (let y = 0; y < rect.h; y += slice) {
					const h       = Math.min(slice, rect.h - y);
					const fromTop = y / rect.h;
					const bend    = Math.pow(1 - fromTop, 1.75);
					const offset  =
						Math.sin(phase + fromTop * 1.9) * maxAmp * bend +
						Math.sin(phase * 0.63 + fromTop * 3.1) * maxAmp * 0.22 * bend;

					const srcY  = (y / rect.h) * img.naturalHeight;
					const srcH  = (h / rect.h) * img.naturalHeight;
					const destH = h + (y + h < rect.h ? overlap : 0);

					ctx!.drawImage(img, 0, srcY, img.naturalWidth, srcH, rect.x + offset, rect.y + y, rect.w, destH);
				}
			}

			frame = window.requestAnimationFrame(draw);
		}

		resize();
		frame = window.requestAnimationFrame(draw);

		const ro = new ResizeObserver(resize);
		ro.observe(canvas);

		return () => {
			active = false;
			ro.disconnect();
			window.cancelAnimationFrame(frame);
		};
	}, [mobile]);

	// Image loader — updates the ref so the running loop picks up the new
	// image on the next frame without any gap or canvas clear.
	useEffect(() => {
		let cancelled = false;
		const img = new Image();
		img.onload  = () => { if (!cancelled) imgRef.current = img; };
		img.onerror = () => { if (!cancelled) imgRef.current = null; };
		img.src = src;
		return () => { cancelled = true; };
	}, [src]);

	return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}

// ─── Tree stage ──────────────────────────────────────────────────────────────

interface TreeStageProps {
	season: Season;
	growth: number; // 0–100
	treeStage?: number;
	tendedDays?: number;
	todayCare?: number;
	greeting: string;
	weather?: string;
	day?: number;
	mobile?: boolean;
	skinId?: SkinId | null;
}

export function TreeStage({
	season,
	growth,
	treeStage = 6,
	tendedDays,
	todayCare,
	greeting,
	weather = "default",
	day = 1,
	mobile = false,
	skinId,
}: TreeStageProps) {
	const { treeShape } = useTheme();
	const s = SEASONS[season];
	const skin = getSkinById(skinId);
	const imageSeason = skin ? skin.placeholderSeason : season;
	const stages = getTreeStages(imageSeason, treeShape);
	const safeStage = Math.max(0, Math.min(stages.length - 1, treeStage));
	const treeImg = getOptimizedImageUrl(stages[safeStage]);
	const vit = Math.max(0, Math.min(1, growth / 100));
	const halo = 0.15 + vit * 0.55;
	const tint = 0.5 + vit * 0.5;
	const particleCount = Math.round(8 + vit * 18);

	const skinVars = skin ? {
		'--weather': `linear-gradient(180deg, ${skin.treeTheme.skyTop} 0%, ${skin.treeTheme.skyBot} 60%)`,
		'--accent-2': skin.treeTheme.accent2,
		'--panel': skin.treeTheme.panel,
		'--accent': skin.treeTheme.haloColor,
	} : {};

	const blooms = [
		{ left: "32%", top: "22%", at: 20 },
		{ left: "58%", top: "18%", at: 35 },
		{ left: "44%", top: "30%", at: 55 },
		{ left: "26%", top: "38%", at: 70 },
		{ left: "62%", top: "36%", at: 85 },
	];
	const bloomGlyph =
		season === "winter" ? "❄"
		: season === "autumn" ? "❦"
		: "✿";

	return (
		<div
			className="tree-stage"
			role="group"
			aria-label={`Bloomix tree, ${s.label}, stage ${safeStage + 1} of ${s.treeStages.length}, ${growth}% grown`}
			style={
				{
					"--tree-img": `url(${treeImg})`,
					"--tree-tint": tint,
					"--halo": halo,
					...skinVars,
				} as unknown as React.CSSProperties
			}
			data-screen-label="Tree stage">
			{weather !== "none" && (
				<Particles
					season={season}
					count={particleCount}
					glyphs={skin?.treeTheme.particleGlyphs}
					color1={skin?.treeTheme.particleColor1}
					color2={skin?.treeTheme.particleColor2}
				/>
			)}

			<div className="tree-clouds" aria-hidden="true">
				<div className="tree-cloud tree-cloud-main" />
				<div className="tree-cloud tree-cloud-secondary" />
				<div className="tree-cloud tree-cloud-haze" />
			</div>

			<div className="sky-mark" aria-hidden="true">
				{season === "winter" ?
					"❄"
				: season === "autumn" ?
					"❦"
				:	"☀"}
			</div>

			<div className="hills" aria-hidden="true" />
			<div className="ground" aria-hidden="true" />

			<div className="stage-label">
				<span className="dot" aria-hidden="true" />
				<span>
					{s.label} · stage {safeStage + 1}/{s.treeStages.length}
					{typeof tendedDays === "number" ?
						` · ${tendedDays} tended day${tendedDays === 1 ? "" : "s"}`
					:	` · day ${day}`}
				</span>
			</div>

			<div className="tree-wrap">
				<div className="tree-halo" aria-hidden="true" />
				<AnimatedTree src={treeImg} mobile={mobile} />
				{blooms.map((b, i) => (
					<span
						key={i}
						className="tree-bloom"
						aria-hidden="true"
						style={{
							left: b.left,
							top: b.top,
							opacity: growth >= b.at ? 1 : 0,
							transform: growth >= b.at ? "scale(1)" : "scale(0.4)",
							transitionDelay: `${i * 70}ms`,
							color: skin ? skin.treeTheme.particleColor1 : s.petal,
						}}>
						{bloomGlyph}
					</span>
				))}
			</div>

			<div className="greeting">
				<p>{greeting}</p>
			</div>

			<div
				className="grow-meter"
				role="progressbar"
				aria-label={`Tree growth: ${growth}% complete`}
				aria-valuenow={growth}
				aria-valuemin={0}
				aria-valuemax={100}
				title={`${growth}% of this tree cycle complete`}>
				<span className="grow-fill" style={{ width: `${growth}%` }}>
					<span className="sun" aria-hidden="true">
						{growth >= 100 ? "✿" : "☀"}
					</span>
				</span>
			</div>

			{typeof todayCare === "number" && <div className="care-caption">Today's care: {todayCare}%</div>}
		</div>
	);
}
