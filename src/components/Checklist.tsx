import { useEffect, useRef, useState, useMemo } from "react";
import { CATEGORIES, getCategoryConfig, normalizeCategoryName } from "../lib/theme";
import type { Category } from "../lib/theme";
import { useProfile, useUpdateProfile } from "../hooks/useProfile";
import {
	useDailyTasks,
	useCreateDailyTask,
	useToggleDailyTask,
	useEditDailyTask,
	useDeleteDailyTask,
} from "../hooks/useDailyTasks";
import { useScheduledTasksForDay, useToggleScheduledTask, useDeleteScheduledTask } from "../hooks/useScheduledTasks";
import { formatCalendarEventTime } from "../lib/pageModels/calendarModel";
import { sortByCompletionThenAlpha } from "../lib/sort";
import { useScrollFade } from "../hooks/useScrollFade";
import { resolveTimezone } from "../lib/scheduledDates";
import { ScheduledTaskModal } from "./ScheduledTaskModal";

interface ChecklistProps {
	showCategories: boolean;
	date: string; // YYYY-MM-DD
}

export function Checklist({ showCategories, date }: ChecklistProps) {
	const { tasks } = useDailyTasks();
	const createTask = useCreateDailyTask();
	const toggleTask = useToggleDailyTask();
	const editTask = useEditDailyTask();
	const deleteTask = useDeleteDailyTask();
	const { data: profile } = useProfile();
	const timezone = resolveTimezone(profile?.timezone);
	const updateProfile = useUpdateProfile();

	const { events } = useScheduledTasksForDay(date);
	const toggleEvent = useToggleScheduledTask();
	const deleteEvent = useDeleteScheduledTask();

	const [filter, setFilter] = useState<Category | "all">("all");
	const [addPhase, setAddPhase] = useState<"idle" | "picking" | "habit">("idle");
	const [modalOpen, setModalOpen] = useState(false);
	const [draft, setDraft] = useState("");
	const [draftCat, setDraftCat] = useState<Category>("");
	const [categoryQuery, setCategoryQuery] = useState("");
	const [categoryOpen, setCategoryOpen] = useState(false);
	const [moreOpen, setMoreOpen] = useState(false);
	const [draftTaskText, setDraftTaskTextState] = useState<Record<string, string>>({});
	const [editGoneError, setEditGoneError] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);
	const categoryComboboxRef = useRef<HTMLDivElement>(null);
	const moreMenuRef = useRef<HTMLDivElement>(null);
	const editTimers = useRef<Record<string, ReturnType<typeof window.setTimeout>>>({});
	const taskListRef = useScrollFade<HTMLUListElement>();
	const eventsListRef = useScrollFade<HTMLDivElement>();

	useEffect(() => {
		if (addPhase === "habit") inputRef.current?.focus();
	}, [addPhase]);

	// Esc dismisses the picker or composer from anywhere, not just when input is focused
	useEffect(() => {
		if (addPhase === "idle") return;
		function onKey(e: KeyboardEvent) {
			if (e.key === "Escape") {
				setAddPhase("idle");
				setDraft("");
			}
		}
		document.addEventListener("keydown", onKey);
		return () => document.removeEventListener("keydown", onKey);
	}, [addPhase]);

	useEffect(() => {
		if (!categoryOpen) return;
		function onPointerDown(e: PointerEvent) {
			const target = e.target;
			if (!(target instanceof Node)) return;
			if (categoryComboboxRef.current?.contains(target)) return;
			setCategoryOpen(false);
			setCategoryQuery(draftCat ? getCategoryConfig(draftCat).label : "");
		}
		document.addEventListener("pointerdown", onPointerDown);
		return () => document.removeEventListener("pointerdown", onPointerDown);
	}, [categoryOpen, draftCat]);

	useEffect(() => {
		if (!moreOpen) return;
		function onPointerDown(e: PointerEvent) {
			const target = e.target;
			if (!(target instanceof Node)) return;
			if (moreMenuRef.current?.contains(target)) return;
			setMoreOpen(false);
		}
		document.addEventListener("pointerdown", onPointerDown);
		return () => document.removeEventListener("pointerdown", onPointerDown);
	}, [moreOpen]);

	useEffect(() => {
		const timers = editTimers.current;
		return () => {
			Object.values(timers).forEach(window.clearTimeout);
		};
	}, []);

	const effectiveFilter = useMemo<Category | "all">(() => {
		if (!showCategories) return "all";
		if (filter !== "all" && !tasks.some((t) => t.category === filter)) return "all";
		return filter;
	}, [showCategories, filter, tasks]);

	const categoryOptions = useMemo<Category[]>(() => {
		const seen = new Set<Category>();
		const ordered: Category[] = [];
		const addCategory = (category?: Category) => {
			const normalized = normalizeCategoryName(category ?? "");
			if (!normalized || seen.has(normalized)) return;
			seen.add(normalized);
			ordered.push(normalized);
		};

		(profile?.categories?.length ? profile.categories : Object.keys(CATEGORIES)).forEach(addCategory);
		tasks.forEach((task) => addCategory(task.category));
		events.forEach((event) => addCategory(event.category));
		Object.keys(CATEGORIES).forEach(addCategory);
		addCategory(draftCat);
		return ordered;
	}, [draftCat, events, profile, tasks]);

	const categoryCounts = useMemo(() => {
		const counts = new Map<Category, number>();
		tasks.forEach((task) => counts.set(task.category, (counts.get(task.category) ?? 0) + 1));
		return counts;
	}, [tasks]);

	const activeCategoryOptions = categoryOptions.filter((category) => (categoryCounts.get(category) ?? 0) > 0);
	const selectedCategory = effectiveFilter === "all" ? null : effectiveFilter;
	const matchingCategoryOptions = categoryOptions.filter((category) =>
		getCategoryConfig(category).label.toLowerCase().includes(categoryQuery.trim().toLowerCase()),
	);
	const normalizedCategoryQuery = normalizeCategoryName(categoryQuery);
	const exactCategoryMatch = categoryOptions.some(
		(category) =>
			category.toLowerCase() === normalizedCategoryQuery.toLowerCase() ||
			getCategoryConfig(category).label.toLowerCase() === normalizedCategoryQuery.toLowerCase(),
	);

	const visibleRaw = effectiveFilter === "all" ? tasks : tasks.filter((t) => t.category === effectiveFilter);
	const visible = sortByCompletionThenAlpha(visibleRaw, (t) => t.text);
	const sortedEvents = sortByCompletionThenAlpha(events, (t) => t.title);
	const completed = tasks.filter((t) => t.completed_at !== null).length;
	const pct = Math.round((completed / Math.max(tasks.length, 1)) * 100);

	function add() {
		const text = draft.trim();
		if (!text) {
			setAddPhase("idle");
			return;
		}
		if (!draftCat) return;
		createTask.reset();
		createTask.mutate({ text, category: draftCat });
		setDraft("");
		setDraftCat("");
		setCategoryQuery("");
		inputRef.current?.focus();
	}

	function selectDraftCategory(category: Category) {
		setDraftCat(category);
		setCategoryQuery(getCategoryConfig(category).label);
		setCategoryOpen(false);
	}

	function createDraftCategory() {
		const category = normalizeCategoryName(categoryQuery);
		if (!category) return;
		selectDraftCategory(category);
		const existingCategories = profile?.categories ?? [];
		if (!existingCategories.some((c) => c.toLowerCase() === category.toLowerCase())) {
			updateProfile.mutate({ categories: [...existingCategories, category] });
		}
	}

	function startHabitComposer() {
		setDraftCat("");
		setCategoryQuery("");
		setCategoryOpen(false);
		setAddPhase("habit");
	}

	function commitTaskText(id: string, text: string) {
		const timer = editTimers.current[id];
		if (timer) {
			window.clearTimeout(timer);
			delete editTimers.current[id];
		}

		const nextText = text.trim();
		const current = tasks.find((t) => t.id === id);

		if (!current) {
			setEditGoneError(true);
			return;
		}

		if (!nextText) {
			setDraftTaskTextState((prev) => {
				const next = { ...prev };
				delete next[id];
				return next;
			});
			return;
		}

		if (nextText === current.text) return;

		editTask.reset();
		editTask.mutate(
			{ id, text: nextText },
			{
				onSuccess: () => {
					setDraftTaskTextState((prev) => {
						const next = { ...prev };
						delete next[id];
						return next;
					});
				},
			},
		);
	}

	function setDraftTaskText(id: string, text: string) {
		setDraftTaskTextState((prev) => ({ ...prev, [id]: text }));
		const existing = editTimers.current[id];
		if (existing) window.clearTimeout(existing);
		editTimers.current[id] = window.setTimeout(() => commitTaskText(id, text), 450);
	}

	const mutationError = createTask.error || toggleTask.error || editTask.error || deleteTask.error;
	const mutationBusy = createTask.isPending || toggleTask.isPending || editTask.isPending || deleteTask.isPending;

	return (
		<section className="checklist" data-screen-label="Checklist" aria-label="Today's checklist">
			{/* ── Habits header ─────────────────────────────────────── */}
			<header className="checklist-head">
				<div className="head-row">
					<h2 className="head-title">Daily habits</h2>
					<span className="head-count" aria-label={`${completed} of ${tasks.length} done`}>
						{completed} <span className="head-count-sep">/</span> {tasks.length}
					</span>
				</div>
				<span className="head-subtitle">Resets each morning</span>
				<div
					className="progress-pill"
					role="progressbar"
					aria-label={`Today progress: ${completed} of ${tasks.length} tasks complete`}
					aria-valuenow={pct}
					aria-valuemin={0}
					aria-valuemax={100}>
					<span className="progress-fill" style={{ width: `${pct}%` }} />
				</div>
			</header>

			{mutationError && (
				<p className="task-error" role="alert">
					We could not save that change. Check your connection and try again.
				</p>
			)}
			{editGoneError && (
				<p className="task-error" role="alert" onClick={() => setEditGoneError(false)}>
					That task was deleted from another session — your edit was discarded.
				</p>
			)}

			{showCategories && (
				<div className="cat-tabs" role="tablist" aria-label="Filter by category">
					<button
						role="tab"
						aria-selected={effectiveFilter === "all"}
						className={effectiveFilter === "all" ? "active" : ""}
						onClick={() => {
							setFilter("all");
							setMoreOpen(false);
						}}>
						All <span className="cat-count">{tasks.length}</span>
					</button>
					{selectedCategory && (
						<button
							role="tab"
							aria-selected="true"
							className="active"
							onClick={() => {
								setFilter("all");
								setMoreOpen(false);
							}}>
							<span
								className="tag-dot"
								style={{ background: getCategoryConfig(selectedCategory).color }}
								aria-hidden="true"
							/>
							{getCategoryConfig(selectedCategory).label}
							<span className="cat-count">{categoryCounts.get(selectedCategory) ?? 0}</span>
						</button>
					)}
					{activeCategoryOptions.length > 0 && (
						<div className="cat-more" ref={moreMenuRef}>
							<button
								type="button"
								aria-haspopup="listbox"
								aria-expanded={moreOpen}
								aria-label="More categories"
								onClick={() => setMoreOpen((open) => !open)}>
								More
								<span className="cat-count">{activeCategoryOptions.length}</span>
							</button>
							{moreOpen && (
								<div className="cat-more-menu" role="listbox" aria-label="More category filters">
									{activeCategoryOptions.map((category) => {
										const cat = getCategoryConfig(category);
										return (
											<button
												key={category}
												type="button"
												role="option"
												aria-selected={effectiveFilter === category}
												onClick={() => {
													setFilter(category);
													setMoreOpen(false);
												}}>
												<span
													className="tag-dot"
													style={{ background: cat.color }}
													aria-hidden="true"
												/>
												<span>{cat.label}</span>
												<span className="cat-count">{categoryCounts.get(category) ?? 0}</span>
											</button>
										);
									})}
								</div>
							)}
						</div>
					)}
				</div>
			)}

			<hr className="checklist-divider" aria-hidden="true" />

			{/* ── Habits list + Events + Add slot ───────────────────── */}
			<div className="checklist-lists">
				{/* Scrollable habits + events regions */}
				<div className={`checklist-scroll-regions ${events.length > 0 ? "has-events" : ""}`}>
					<div className="scroll-fade-v task-list-fade">
						<ul className="task-list" ref={taskListRef} role="list">
							{visible.length === 0 && addPhase !== "habit" && effectiveFilter !== "all" && (
								<li className="empty">
									<p>{`No ${getCategoryConfig(effectiveFilter as Category).label.toLowerCase()} today.`}</p>
								</li>
							)}
							{visible.length === 0 && addPhase !== "habit" && effectiveFilter === "all" && (
								<li className="empty-first-run">
									<span className="empty-first-run-icon" aria-hidden="true">🌱</span>
									<p className="empty-first-run-heading">Plant your first habit</p>
									<p className="empty-first-run-body">Add something small. Checking it off is what feeds the tree.</p>
								</li>
							)}
							{visible.map((t) => {
								const cat = getCategoryConfig(t.category);
								const isDone = t.completed_at !== null;
								return (
									<li key={t.id} className={`task ${isDone ? "is-done" : ""}`}>
										<button
											type="button"
											className="task-check"
											disabled={mutationBusy}
											onClick={() => {
												toggleTask.reset();
												toggleTask.mutate({ id: t.id, complete: !isDone });
											}}
											aria-label={
												isDone ? `Mark "${t.text}" as not done` : `Mark "${t.text}" as done`
											}
											aria-pressed={isDone}>
											{isDone && (
												<svg
													viewBox="0 0 24 24"
													fill="none"
													stroke="currentColor"
													strokeWidth="3"
													aria-hidden="true">
													<polyline points="5,12 10,17 19,7" />
												</svg>
											)}
										</button>
										<span className="task-main">
											<input
												className="task-text"
												value={draftTaskText[t.id] ?? t.text}
												aria-label="Task description"
												onChange={(e) => setDraftTaskText(t.id, e.target.value)}
												onBlur={(e) => commitTaskText(t.id, e.target.value)}
												onKeyDown={(e) => {
													if (e.key === "Enter") e.currentTarget.blur();
													if (e.key === "Escape") {
														const timer = editTimers.current[t.id];
														if (timer) {
															window.clearTimeout(timer);
															delete editTimers.current[t.id];
														}
														setDraftTaskTextState((prev) => {
															const next = { ...prev };
															delete next[t.id];
															return next;
														});
													}
												}}
											/>
											{showCategories && (
												<span className="task-meta-row">
													<span
														className="task-cat"
														style={{ "--cat": cat.color } as unknown as React.CSSProperties}>
														<span className="cat-dot" aria-hidden="true" />
														<span className="task-cat-label">{cat.label}</span>
													</span>
												</span>
											)}
										</span>
										<button
											type="button"
											className="task-delete"
											disabled={mutationBusy}
											onClick={() => {
												deleteTask.reset();
												deleteTask.mutate(t.id);
											}}
											aria-label={`Delete task "${t.text}"`}>
											<svg
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												strokeWidth="2.5"
												aria-hidden="true">
												<line x1="6" y1="6" x2="18" y2="18" />
												<line x1="18" y1="6" x2="6" y2="18" />
											</svg>
										</button>
									</li>
								);
							})}
						</ul>
					</div>
					{/* end task-list-fade */}

					{/* ── Events & deadlines section (only rendered when events exist) ── */}
					{events.length > 0 && (
						<>
							<header className="events-section-head">
								<div className="head-row">
									<h2 className="events-section-title">Events &amp; deadlines</h2>
									<span
										className="head-count"
										aria-label={`${events.length} event${events.length === 1 ? "" : "s"} today`}>
										{events.length}
									</span>
								</div>
								<span className="events-section-sub">One-time, tied to a date</span>
							</header>
							<div className="scroll-fade-v events-list-fade">
								<div className="deadlines events-deadlines" ref={eventsListRef}>
									{sortedEvents.map((t) => {
										const cat = getCategoryConfig(t.category as Category);
										const isDone = t.completed_at !== null;
										const timeStr = formatCalendarEventTime(t.due_at, t.all_day, timezone);
										return (
											<div key={t.id} className={`row ${isDone ? "done" : ""}`}>
												<button
													type="button"
													className="task-check"
													onClick={() => toggleEvent.mutate({ id: t.id, complete: !isDone })}
													aria-label={
														isDone ? `Mark "${t.title}" undone` : `Mark "${t.title}" done`
													}
													aria-pressed={isDone}>
													{isDone && (
														<svg
															viewBox="0 0 24 24"
															fill="none"
															stroke="currentColor"
															strokeWidth="3"
															aria-hidden="true">
															<polyline points="5,12 10,17 19,7" />
														</svg>
													)}
												</button>
												<span className="blob" style={{ background: cat.color }} />
												<span className="event-row-main">
													<span className="event-title">{t.title}</span>
													<span className="event-meta-row">
														<span className="event-time-pill">{timeStr}</span>
														{showCategories && (
															<span
																className="task-cat"
																style={{ "--cat": cat.color } as unknown as React.CSSProperties}>
																<span className="cat-dot" aria-hidden="true" />
																<span className="task-cat-label">{cat.label}</span>
															</span>
														)}
													</span>
												</span>
												<button
													type="button"
													className="task-delete"
													onClick={() => deleteEvent.mutate(t.id)}
													aria-label={`Delete "${t.title}"`}>
													<svg
														viewBox="0 0 24 24"
														fill="none"
														stroke="currentColor"
														strokeWidth="2.5"
														aria-hidden="true">
														<line x1="6" y1="6" x2="18" y2="18" />
														<line x1="18" y1="6" x2="6" y2="18" />
													</svg>
												</button>
											</div>
										);
									})}
								</div>
							</div>
							{/* end events-list-fade */}
						</>
					)}
				</div>
				{/* end .checklist-scroll-regions */}

				{/* ── Stable add slot ───────────────────────────────────── */}
				<div className="checklist-add-slot">
					{addPhase === "habit" ?
						<div className="composer-card">
							<div className="composer-title-field">
								<label className="composer-category-label" htmlFor="habit-title">
									Title
									<span className="required-mark" aria-hidden="true">
										{" "}
										*
									</span>
								</label>
								<input
									id="habit-title"
									ref={inputRef}
									className="composer-input"
									placeholder="What's the habit?"
									value={draft}
									onChange={(e) => setDraft(e.target.value)}
									onKeyDown={(e) => {
										if (e.key === "Enter") add();
										if (e.key === "Escape") {
											setAddPhase("idle");
											setDraft("");
										}
									}}
								/>
							</div>
							<div className="composer-category-field">
								<label className="composer-category-label" htmlFor="habit-category">
									Category
								</label>
								<div className="composer-combobox" ref={categoryComboboxRef}>
									<input
										id="habit-category"
										className="composer-category-input"
										role="combobox"
										aria-label="Category"
										aria-expanded={categoryOpen}
										aria-controls="habit-category-options"
										aria-autocomplete="list"
										value={categoryQuery}
										placeholder="Choose or create a category"
										onFocus={() => setCategoryOpen(true)}
										onChange={(e) => {
											setCategoryQuery(e.target.value);
											setCategoryOpen(true);
										}}
										onKeyDown={(e) => {
											if (e.key === "Escape") {
												setCategoryOpen(false);
												setCategoryQuery(draftCat ? getCategoryConfig(draftCat).label : "");
											}
											if (e.key === "Enter" && categoryOpen) {
												e.preventDefault();
												if (matchingCategoryOptions[0])
													selectDraftCategory(matchingCategoryOptions[0]);
												else createDraftCategory();
											}
										}}
									/>
									{categoryOpen && (
										<div
											id="habit-category-options"
											className="composer-category-menu open-up"
											role="listbox"
											aria-label="Category options">
											{matchingCategoryOptions.map((category) => {
												const cat = getCategoryConfig(category);
												return (
													<button
														key={category}
														type="button"
														role="option"
														aria-selected={draftCat === category}
														onMouseDown={(e) => e.preventDefault()}
														onClick={() => selectDraftCategory(category)}>
														<span
															className="composer-category-icon"
															style={{ "--cat": cat.color } as unknown as React.CSSProperties}
															aria-hidden="true">
															{cat.icon}
														</span>
														<span>{cat.label}</span>
													</button>
												);
											})}
											{normalizedCategoryQuery && !exactCategoryMatch && (
												<button
													type="button"
													role="option"
													aria-selected="false"
													onMouseDown={(e) => e.preventDefault()}
													onClick={createDraftCategory}>
													Create "{normalizedCategoryQuery}"
												</button>
											)}
										</div>
									)}
								</div>
							</div>
							<div className="composer-actions">
								<button
									type="button"
									className="composer-cancel"
									onClick={() => {
										setAddPhase("idle");
										setDraft("");
									}}>
									Cancel
								</button>
								<button
									type="button"
									className="composer-submit"
									disabled={!draft.trim() || !draftCat || createTask.isPending}
									onClick={add}>
									{createTask.isPending ? "Saving…" : "Add habit"}
								</button>
							</div>
						</div>
					: addPhase === "picking" ?
						<div className="add-type-picker" role="group" aria-label="Choose what to add">
							<button type="button" className="type-pick-btn" onClick={startHabitComposer}>
								<svg
									viewBox="0 0 20 20"
									fill="none"
									stroke="currentColor"
									strokeWidth="1.8"
									aria-hidden="true"
									width="16"
									height="16">
									<path d="M4 10a6 6 0 1 0 6-6" strokeLinecap="round" />
									<polyline points="7,1 4,4 7,7" strokeLinecap="round" strokeLinejoin="round" />
								</svg>
								Daily habit
							</button>
							<span className="type-pick-sep" aria-hidden="true" />
							<button
								type="button"
								className="type-pick-btn"
								onClick={() => {
									setModalOpen(true);
									setAddPhase("idle");
								}}>
								<svg
									viewBox="0 0 20 20"
									fill="none"
									stroke="currentColor"
									strokeWidth="1.8"
									aria-hidden="true"
									width="16"
									height="16">
									<rect x="3" y="4" width="14" height="13" rx="2" />
									<line x1="3" y1="8" x2="17" y2="8" strokeLinecap="round" />
									<line x1="7" y1="2" x2="7" y2="6" strokeLinecap="round" />
									<line x1="13" y1="2" x2="13" y2="6" strokeLinecap="round" />
								</svg>
								Event / deadline
							</button>
							<button
								type="button"
								className="type-pick-cancel"
								onClick={() => setAddPhase("idle")}
								aria-label="Cancel">
								<svg
									viewBox="0 0 20 20"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
									width="14"
									height="14"
									aria-hidden="true">
									<line x1="5" y1="5" x2="15" y2="15" />
									<line x1="15" y1="5" x2="5" y2="15" />
								</svg>
							</button>
						</div>
					:	<button
							type="button"
							className="add-task-btn"
							disabled={createTask.isPending}
							onClick={() => setAddPhase("picking")}>
							<span className="add-icon" aria-hidden="true">
								+
							</span>
							<span>Add</span>
						</button>
					}
				</div>
				{/* end .checklist-add-slot */}
			</div>
			{/* end .checklist-lists */}

			{modalOpen && <ScheduledTaskModal defaultDate={date} onClose={() => setModalOpen(false)} />}
		</section>
	);
}
