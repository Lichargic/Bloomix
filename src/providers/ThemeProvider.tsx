/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Season, Tone, TreeShape } from "../lib/theme";

function readEnum<T extends string>(key: string, valid: Set<T>, fallback: T): T {
	try {
		const v = localStorage.getItem(key);
		if (v && valid.has(v as T)) return v as T;
	} catch {
		/* storage unavailable */
	}
	return fallback;
}

const readSeason    = () => readEnum<Season>   ("theme:season",    new Set(["spring", "summer", "autumn", "winter"]), "spring")
const readTone      = () => readEnum<Tone>     ("theme:tone",      new Set(["soft", "whimsy", "matter"]),            "soft")
const readTreeShape = () => readEnum<TreeShape>("theme:treeShape", new Set(["shape-1", "shape-2"]),                  "shape-1")

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
		const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
		if (link) {
			link.href = `/assets/logos/${season}.png`;
			link.type = "image/png";
		}
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
