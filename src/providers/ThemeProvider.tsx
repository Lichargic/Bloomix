/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Season, Tone, TreeShape } from "../lib/theme";

const SEASONS = new Set<Season>(["spring", "summer", "autumn", "winter"]);
const TONES = new Set<Tone>(["soft", "whimsy", "matter"]);
const TREESHAPES = new Set<TreeShape>(["shape-1", "shape-2"]);

function readSeason(): Season {
	try {
		const v = localStorage.getItem("theme:season");
		if (v && SEASONS.has(v as Season)) return v as Season;
	} catch {
		/* storage unavailable */
	}
	return "spring";
}

function readTone(): Tone {
	try {
		const v = localStorage.getItem("theme:tone");
		if (v && TONES.has(v as Tone)) return v as Tone;
	} catch {
		/* storage unavailable */
	}
	return "soft";
}

function readTreeShape(): TreeShape {
	try {
		const v = localStorage.getItem("theme:treeShape");
		if (v && TREESHAPES.has(v as TreeShape)) return v as TreeShape;
	} catch {
		/* storage unavailable */
	}
	return "shape-1";
}

function readBool(key: string, fallback: boolean): boolean {
	try {
		const v = localStorage.getItem(key);
		if (v !== null) return v === "true";
	} catch {
		/* storage unavailable */
	}
	return fallback;
}

interface ThemeContextValue {
	season: Season;
	setSeason: (s: Season) => void;
	tone: Tone;
	setTone: (t: Tone) => void;
	treeShape: TreeShape;
	setTreeShape: (s: TreeShape) => void;
	showCategories: boolean;
	setShowCategories: (v: boolean) => void;
	showWeather: boolean;
	setShowWeather: (v: boolean) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
	season: "spring",
	setSeason: () => {},
	tone: "soft",
	setTone: () => {},
	treeShape: "shape-1",
	setTreeShape: () => {},
	showCategories: true,
	setShowCategories: () => {},
	showWeather: true,
	setShowWeather: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
	const [season, setSeasonState] = useState<Season>(readSeason);
	const [tone, setToneState] = useState<Tone>(readTone);
	const [treeShape, setTreeShapeState] = useState<TreeShape>(readTreeShape);
	const [showCategories, setShowCategoriesState] = useState(() => readBool("theme:showCategories", true));
	const [showWeather, setShowWeatherState] = useState(() => readBool("theme:showWeather", true));

	useEffect(() => {
		document.body.setAttribute("data-season", season);
	}, [season]);

	const setSeason = useCallback((s: Season) => {
		try {
			localStorage.setItem("theme:season", s);
		} catch {
			/* storage unavailable */
		}
		setSeasonState(s);
	}, []);

	const setTone = useCallback((t: Tone) => {
		try {
			localStorage.setItem("theme:tone", t);
		} catch {
			/* storage unavailable */
		}
		setToneState(t);
	}, []);

	const setTreeShape = useCallback((s: TreeShape) => {
		try {
			localStorage.setItem("theme:treeShape", s);
		} catch {
			/* storage unavailable */
		}
		setTreeShapeState(s);
	}, []);

	const setShowCategories = useCallback((v: boolean) => {
		try {
			localStorage.setItem("theme:showCategories", String(v));
		} catch {
			/* storage unavailable */
		}
		setShowCategoriesState(v);
	}, []);

	const setShowWeather = useCallback((v: boolean) => {
		try {
			localStorage.setItem("theme:showWeather", String(v));
		} catch {
			/* storage unavailable */
		}
		setShowWeatherState(v);
	}, []);

	const value = useMemo(
		() => ({
			season,
			setSeason,
			tone,
			setTone,
			treeShape,
			setTreeShape,
			showCategories,
			setShowCategories,
			showWeather,
			setShowWeather,
		}),
		[
			season,
			setSeason,
			tone,
			setTone,
			treeShape,
			setTreeShape,
			showCategories,
			setShowCategories,
			showWeather,
			setShowWeather,
		],
	);

	return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
