export type Season = "spring" | "summer" | "autumn" | "winter";
export type Tone = "soft" | "whimsy" | "matter";
export type TreeShape = "shape-1" | "shape-2" | "shape-3";
export type Category = string;


export function getTreeStages(season: Season, shape: TreeShape): readonly string[] {
	return [0, 1, 2, 3, 4, 5, 6].map((i) => `/assets/trees/${shape}/${season}/stage-${i}.png`);
}

export interface SeasonConfig {
	label: string;
	mood: string;
	treeImg: string;
	treeStages: readonly string[];
	logo: string;
	petal: string;
	petal2: string;
	weatherIcon: string;
	weather: string;
}

export interface ToneConfig {
	greet: (name: string, pct: number) => string;
	miss: string;
	deadline: (n: number) => string;
}

export interface CategoryConfig {
	label: string;
	color: string;
	icon: string;
}

export const SEASONS: Record<Season, SeasonConfig> = {
	spring: {
		label: "Spring",
		mood: "soft & blooming",
		treeImg: "/assets/trees/shape-1/spring/stage-6.png",
		treeStages: [
			"/assets/trees/shape-1/spring/stage-0.png",
			"/assets/trees/shape-1/spring/stage-1.png",
			"/assets/trees/shape-1/spring/stage-2.png",
			"/assets/trees/shape-1/spring/stage-3.png",
			"/assets/trees/shape-1/spring/stage-4.png",
			"/assets/trees/shape-1/spring/stage-5.png",
			"/assets/trees/shape-1/spring/stage-6.png",
		],
		logo: "/assets/logos/spring.png",
		petal: "#edacc0",
		petal2: "#ffd6e1",
		weatherIcon: "✿",
		weather: "gentle breeze, scattered petals",
	},
	summer: {
		label: "Summer",
		mood: "lush & warm",
		treeImg: "/assets/trees/shape-1/summer/stage-6.png",
		treeStages: [
			"/assets/trees/shape-1/summer/stage-0.png",
			"/assets/trees/shape-1/summer/stage-1.png",
			"/assets/trees/shape-1/summer/stage-2.png",
			"/assets/trees/shape-1/summer/stage-3.png",
			"/assets/trees/shape-1/summer/stage-4.png",
			"/assets/trees/shape-1/summer/stage-5.png",
			"/assets/trees/shape-1/summer/stage-6.png",
		],
		logo: "/assets/logos/summer.png",
		petal: "#82ba89",
		petal2: "#c4d489",
		weatherIcon: "☀",
		weather: "long daylight, soft sun",
	},
	autumn: {
		label: "Autumn",
		mood: "amber & quiet",
		treeImg: "/assets/trees/shape-1/autumn/stage-6.png",
		treeStages: [
			"/assets/trees/shape-1/autumn/stage-0.png",
			"/assets/trees/shape-1/autumn/stage-1.png",
			"/assets/trees/shape-1/autumn/stage-2.png",
			"/assets/trees/shape-1/autumn/stage-3.png",
			"/assets/trees/shape-1/autumn/stage-4.png",
			"/assets/trees/shape-1/autumn/stage-5.png",
			"/assets/trees/shape-1/autumn/stage-6.png",
		],
		logo: "/assets/logos/autumn.png",
		petal: "#dda25e",
		petal2: "#bc6c25",
		weatherIcon: "❦",
		weather: "leaves drifting, cool air",
	},
	winter: {
		label: "Winter",
		mood: "frosted & still",
		treeImg: "/assets/trees/shape-1/winter/stage-6.png",
		treeStages: [
			"/assets/trees/shape-1/winter/stage-0.png",
			"/assets/trees/shape-1/winter/stage-1.png",
			"/assets/trees/shape-1/winter/stage-2.png",
			"/assets/trees/shape-1/winter/stage-3.png",
			"/assets/trees/shape-1/winter/stage-4.png",
			"/assets/trees/shape-1/winter/stage-5.png",
			"/assets/trees/shape-1/winter/stage-6.png",
		],
		logo: "/assets/logos/winter.png",
		petal: "#bbd2f6",
		petal2: "#5e86ba",
		weatherIcon: "❄",
		weather: "frosted hush, slow snow",
	},
};

export const TONE: Record<Tone, ToneConfig> = {
	soft: {
		greet: (name, pct) =>
			pct === 0 ? `Hi ${name}. Pick one small thing to start.`
			: pct < 50 ? `Nice start, ${name}. Your tree is stretching.`
			: pct < 100 ? `Look at you, ${name}. The leaves are showing up.`
			: `Today bloomed. Rest now, ${name}.`,
		miss: "A quiet day. Your tree rests with you.",
		deadline: (n) =>
			n === 0 ? "Nothing pressing this week." : `${n} thing${n > 1 ? "s" : ""} ahead. You've got time.`,
	},
	whimsy: {
		greet: (name, pct) =>
			pct === 0 ? `Yawn... ${name}, your tree just woke up.`
			: pct < 50 ? `${name}! A leaf grew. (It saw you.)`
			: pct < 100 ? `${name}, a bee just visited. Cool, right?`
			: `Full bloom! Your tree did a tiny dance.`,
		miss: "Tree took a nap. It dreamed about you.",
		deadline: (n) => (n === 0 ? "The week is wide open." : `${n} tiny dragon${n > 1 ? "s" : ""} on the horizon.`),
	},
	matter: {
		greet: (_name, pct) => `${pct}% of today's tasks complete.`,
		miss: "Day skipped. No streak penalty.",
		deadline: (n) => `${n} upcoming deadline${n === 1 ? "" : "s"}.`,
	},
};

export function getTreeGreeting(tone: Tone, name: string, todayCare: number, treeStage: number) {
	const stage = Math.max(0, Math.min(6, Math.floor(treeStage)));
	const pct = Math.max(0, Math.min(100, Math.round(todayCare)));

	if (tone === "matter") {
		return `Tree stage ${stage + 1} of 7. Today care: ${pct}%.`;
	}

	if (stage === 0) {
		return pct === 0 ?
				`Seed waiting. Pick one small thing to start.`
			:	`Seed secured. Today gave it a strong start.`;
	}

	if (stage < 3) {
		return pct === 0 ? `The sprout is resting. One small task can help.` : `${name}, the sprout is settling in.`;
	}

	if (stage < 6) {
		return pct === 0 ? `The tree is steady. It can wait for care.` : `${name}, today's care moved the tree along.`;
	}

	return pct === 0 ?
			`The tree is grown. A little care keeps it steady.`
		:	`Today cared for the tree. ${name}, it is standing steady.`;
}

export const CATEGORIES: Record<string, CategoryConfig> = {
	school: { label: "School", color: "#5e86ba", icon: "✎" },
	deadlines: { label: "Deadlines", color: "#bc6c25", icon: "⏳" },
	routines: { label: "Routines", color: "#235c2e", icon: "↻" },
	selfcare: { label: "Self-care", color: "#edacc0", icon: "♡" },
};

const CUSTOM_CATEGORY_COLORS = ["#5e86ba", "#bc6c25", "#235c2e", "#8f5ea8", "#3d8a7a", "#a85050"];

function customCategoryColor(category: string) {
	let hash = 0;
	for (const char of category) hash = (hash + char.charCodeAt(0)) % CUSTOM_CATEGORY_COLORS.length;
	return CUSTOM_CATEGORY_COLORS[hash];
}

export function normalizeCategoryName(input: string) {
	return input.trim().replace(/\s+/g, " ").slice(0, 32);
}

export function getCategoryConfig(category: Category): CategoryConfig {
	const known = CATEGORIES[category];
	if (known) return known;
	const label = normalizeCategoryName(category) || "Category";
	return {
		label,
		color: customCategoryColor(label.toLowerCase()),
		icon: label.slice(0, 1).toUpperCase(),
	};
}
