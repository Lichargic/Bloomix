import { useMemo, useReducer } from "react";
import { useAuth } from "../providers/AuthProvider";
import { useProfile } from "../hooks/useProfile";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { useTheme } from "../providers/ThemeProvider";
import { useDailyTasks, useTendedDays } from "../hooks/useDailyTasks";
import { getTreeGreeting } from "../lib/theme";
import { getTreeCycleProgress, getTreeStageFromTendedDays } from "../lib/growth";
import { TreeStage } from "../components/Tree";
import { Checklist } from "../components/Checklist";
import { Topbar } from "../components/Topbar";

export function Today() {
	useDocumentTitle("Today");
	const { user } = useAuth();
	const { data: profile } = useProfile();
	const { season, tone, showCategories, showWeather } = useTheme();
	const { tasks, today } = useDailyTasks();
	const { data: tendedDaysFromHistory = 0 } = useTendedDays();

	const completed = tasks.filter((t) => t.completed_at !== null).length;
	const pct = Math.round((completed / Math.max(tasks.length, 1)) * 100);
	const tendedDays = Math.max(tendedDaysFromHistory, completed > 0 ? 1 : 0);
	const treeStage = getTreeStageFromTendedDays(tendedDays);
	const treeGrowth = getTreeCycleProgress(tendedDays);

	// Visual stage and growth only increase within a session — completing then
	// unchecking the first task of the day should not revert the tree animation.
	const [peakStage, bumpStage]   = useReducer((s: number, n: number) => Math.max(s, n), treeStage);
	const [peakGrowth, bumpGrowth] = useReducer((g: number, n: number) => Math.max(g, n), treeGrowth);
	if (treeStage  > peakStage)  bumpStage(treeStage);
	if (treeGrowth > peakGrowth) bumpGrowth(treeGrowth);

	const greeting = useMemo(() => {
		const name = profile?.display_name ?? user?.email ?? "friend";
		return getTreeGreeting(tone, name, pct, treeStage);
	}, [tone, pct, treeStage, profile?.display_name, user?.email]);

	const dayCount =
		profile?.created_at ?
			Math.max(
				1,
				Math.round(
					(new Date(today).getTime() - new Date(profile.created_at.slice(0, 10)).getTime()) / 86_400_000,
				) + 1,
			)
		:	1;

	return (
		<div className="app-shell">
			<Topbar />
			<main id="main-content" className="canvas fade-in">
				<h1 className="sr-only">Today</h1>
				<div className="today-grid">
					<section className="tree-region" aria-label="Bloomix tree progress">
						<TreeStage
							season={season}
							growth={peakGrowth}
							treeStage={peakStage}
							tendedDays={tendedDays}
							todayCare={pct}
							greeting={greeting}
							weather={showWeather ? "default" : "none"}
							day={dayCount}
						/>
					</section>
					<Checklist showCategories={showCategories} date={today} />
				</div>
			</main>
		</div>
	);
}
