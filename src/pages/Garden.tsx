import { useState } from "react";
import { Link } from "react-router-dom";
import { Topbar } from "../components/Topbar";
import { SEASONS, getTreeStages } from "../lib/theme";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { OptimizedImage } from "../components/OptimizedImage";
import { GARDEN_EMPTY_STATE, getGardenStats } from "../lib/pageModels/gardenModel";
import { useGardenActivityStats, useGardenArchive } from "../hooks/useGardenArchive";
import { getTreeCycleProgress } from "../lib/growth";

export function Garden() {
	useDocumentTitle("Garden");

	const [selectedId, setSelectedId] = useState<string | null>(null);

	const {
		data: archives = [],
		isLoading: isArchivesLoading,
		isError: isArchivesError,
		error: archivesError,
	} = useGardenArchive();

	const featuredTree = (selectedId ? archives.find((a) => a.id === selectedId) : undefined) ?? archives[0] ?? null;
	const featuredSeason = featuredTree ? SEASONS[featuredTree.season] : null;
	const featuredTreeImg = featuredTree ? getTreeStages(featuredTree.season, featuredTree.tree_shape)[6] : null;
	const latestArchiveEnd = archives[0]?.cycle_ended_on ?? null;

	const {
		data: activityStats = { days: 0, tasks: 0 },
		isLoading: isActivityLoading,
		isError: isActivityError,
		error: activityError,
	} = useGardenActivityStats(latestArchiveEnd);

	const archiveStats = getGardenStats(archives);
	const activeGrowth = getTreeCycleProgress(activityStats.days);
	const activeBlooms = [20, 35, 55, 70, 85].filter((mark) => activeGrowth >= mark).length;

	const stats = {
		trees: archiveStats.trees,
		days: archiveStats.days + activityStats.days,
		blooms: archiveStats.blooms + activeBlooms,
		tasks: archiveStats.tasks + activityStats.tasks,
	};

	const isGardenLoading = isArchivesLoading || isActivityLoading;
	const gardenError =
		isArchivesError ? archivesError
		: isActivityError ? activityError
		: null;

	return (
		<div className="app-shell">
			<Topbar />
			<main id="main-content" className="canvas fade-in" data-screen-label="Garden">
				<section className="garden-archive-layout" aria-label="Garden archive">
					<div className="garden-archive-card">
						{isGardenLoading ?
							<div className="garden-archive-loading">Loading your garden…</div>
						: gardenError ?
							<div className="garden-archive-empty">
								<div className="garden-archive-tree-frame garden-archive-tree-frame-empty">
									<span aria-hidden="true">!</span>
								</div>

								<div className="garden-archive-empty-copy">
									<span className="garden-archive-kicker">Garden archive</span>
									<h2>Unable to load garden</h2>
									<p>
										{gardenError instanceof Error ?
											gardenError.message
										:	"Please try again in a moment."}
									</p>
								</div>
							</div>
						: featuredTree && featuredSeason && featuredTreeImg ?
							<>
								<div className="garden-archive-tree-frame">
									<OptimizedImage
										src={featuredTreeImg}
										alt={`${featuredSeason.label} archived tree`}
										className="garden-archive-tree"
										width={520}
										height={520}
										loading="eager"
									/>
								</div>

								<div className="garden-archive-meta">
									<span className="garden-archive-kicker">Archived tree</span>
									<h2>{featuredSeason.label} tree</h2>
									<p>
										Archived on{" "}
										{new Date(featuredTree.archived_at).toLocaleDateString(undefined, {
											month: "long",
											day: "numeric",
											year: "numeric",
										})}
									</p>
								</div>
							</>
						:	<div className="garden-archive-empty">
								<div className="garden-archive-tree-frame garden-archive-tree-frame-empty">
									<span aria-hidden="true">✿</span>
								</div>

								<div className="garden-archive-empty-copy">
									<span className="garden-archive-kicker">Garden archive</span>
									<h2>{GARDEN_EMPTY_STATE.title}</h2>
									<p>{GARDEN_EMPTY_STATE.body}</p>
									<Link className="garden-archive-action" to="/today">
										{GARDEN_EMPTY_STATE.actionLabel}
									</Link>
								</div>
							</div>
						}
					</div>

					{archives.length > 1 && (
						<div className="garden-archive-thumbnail-strip" aria-label="Archived trees">
							{archives.map((archive) => {
								const thumbImg = getTreeStages(archive.season, archive.tree_shape)[6];
								const season = SEASONS[archive.season];
								const isActive = archive.id === (selectedId ?? archives[0]?.id);
								return (
									<button
										key={archive.id}
										aria-pressed={isActive}
										aria-label={`${season.label} tree, archived ${new Date(archive.archived_at).toLocaleDateString()}`}
										className={`garden-archive-thumbnail${isActive ? " garden-archive-thumbnail--active" : ""}`}
										onClick={() => setSelectedId(archive.id)}
									>
										<img src={thumbImg} alt="" width={64} height={64} />
										<span>{season.label}</span>
									</button>
								);
							})}
						</div>
					)}

					<aside className="garden-archive-stats" aria-label="Garden summary">
						<div className="garden-archive-stat-card">
							<b>{stats.tasks}</b>
							<span>tasks done</span>
						</div>
						<div className="garden-archive-stat-card">
							<b>{stats.days}</b>
							<span>days tended</span>
						</div>
						<div className="garden-archive-stat-card">
							<b>{stats.blooms}</b>
							<span>blooms</span>
						</div>
						<div className="garden-archive-stat-card">
							<b>{stats.trees}</b>
							<span>trees grown</span>
						</div>
					</aside>
				</section>
			</main>
		</div>
	);
}
