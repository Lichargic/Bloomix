import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SEASONS, CATEGORIES, getTreeStages } from "../lib/theme";
import type { Category, TreeShape } from "../lib/theme";
import { chooseRandomSeason } from "../lib/growth";
import { useCreateProfile } from "../hooks/useProfile";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { useTheme } from "../providers/ThemeProvider";
import { OptimizedImage } from "../components/OptimizedImage";

type SeedChoice = TreeShape | "shape-3";

const SEED_OPTIONS: {
	value: SeedChoice;
	label: string;
	body: string;
	available: boolean;
}[] = [
	{ value: "shape-1", label: "Oak", body: "Classic, full canopy.", available: true },
	{ value: "shape-2", label: "Birch", body: "Tall and light.", available: true },
	{ value: "shape-3", label: "Coming soon", body: "Still growing.", available: false },
];

export function Onboarding() {
	useDocumentTitle("Welcome");
	const navigate = useNavigate();
	const { setSeason, setTreeShape } = useTheme();
	const createProfile = useCreateProfile();

	const [step, setStep] = useState(0);
	const [name, setName] = useState("");
	const [shape, setShape] = useState<TreeShape>("shape-1");
	const [cats, setCats] = useState<Category[]>(["routines", "selfcare"]);

	const step2SubmitRef = useRef<HTMLButtonElement>(null);

	// Focus submit when categories are valid (step 2 keyboard fix)
	useEffect(() => {
		if (step === 2 && cats.length > 0) step2SubmitRef.current?.focus();
	}, [cats.length, step]);

	function toggleCat(k: Category) {
		setCats((prev) => (prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k]));
	}

	async function handleFinish(e: React.FormEvent) {
		e.preventDefault();
		if (cats.length === 0) return;
		const seed = chooseRandomSeason();
		await createProfile.mutateAsync({
			display_name: name.trim() || "friend",
			season: seed,
			tree_shape: shape,
			categories: cats,
		});
		setSeason(seed);
		setTreeShape(shape);
		navigate("/today", { replace: true });
	}

	if (step === 0) {
		return (
			<div className="welcome" data-screen-label="01 Welcome">
				<main id="main-content" className="welcome-card fade-in">
					<OptimizedImage
						src={SEASONS.winter.logo}
						alt=""
						className="logo"
						width={300}
						height={300}
						loading="eager"
					/>
					<h1 className="bloomix-mark">Bloomix</h1>
					<p className="tagline">
						A calm productivity app for the students and the stressed.
						<br />
						Rewards effort, not perfection.
					</p>
					<div className="step-dots">
						<span className="active" />
						<span />
						<span />
					</div>
					<form
						onSubmit={(e) => {
							e.preventDefault();
							if (name.trim()) setStep(1);
						}}>
						<input
							className="name-input"
							placeholder="what should we call you?"
							value={name}
							onChange={(e) => setName(e.target.value)}
							autoFocus
						/>
						<button type="submit" className="cta" disabled={!name.trim()}>
							get started ›
						</button>
					</form>
				</main>
			</div>
		);
	}

	if (step === 1) {
		const previewSrc = getTreeStages("spring", shape)[6];
		return (
			<div className="welcome" data-screen-label="02 Choose seed">
				<main id="main-content" className="welcome-card welcome-card-wide fade-in">
					<form
						onSubmit={(e) => {
							e.preventDefault();
							setStep(2);
						}}>
						<h1 className="step-h step-h-large">Choose your seed</h1>
						<p className="tagline">Pick your tree. Your first season is chosen for you.</p>
						<div className="step-dots">
							<span />
							<span className="active" />
							<span />
						</div>
						<div className="seed-stage">
							<div className="seed-hero-preview">
								<OptimizedImage
									src={previewSrc}
									alt={`${shape} preview`}
									width={260}
									height={260}
									loading="eager"
								/>
							</div>

							<div className="seed-choice-list" role="radiogroup" aria-label="Seed shape">
								{SEED_OPTIONS.map((option) => {
									const selected = option.available && shape === option.value;
									return (
										<button
											type="button"
											role="radio"
											key={option.value}
											aria-checked={selected}
											aria-disabled={!option.available}
											disabled={!option.available}
											className={`seed-choice-row ${selected ? "selected" : ""} ${!option.available ? "locked" : ""}`}
											onClick={() => {
												if (option.available) setShape(option.value as TreeShape);
											}}>
											<span className="seed-choice-mark" aria-hidden="true">
												{option.value.replace("shape-", "")}
											</span>
											<span className="seed-choice-copy">
												<span className="seed-name">{option.label}</span>
												<span className="seed-mood">{option.body}</span>
											</span>
										</button>
									);
								})}
							</div>
						</div>
						<div className="welcome-foot">
							<button type="button" className="cta-ghost" onClick={() => setStep(0)}>
								‹ back
							</button>
							<button type="submit" className="cta">
								continue ›
							</button>
						</div>
					</form>
				</main>
			</div>
		);
	}

	return (
		<div className="welcome" data-screen-label="03 What matters">
			<main id="main-content" className="welcome-card welcome-card-medium fade-in">
				<form onSubmit={handleFinish}>
					<h1 className="step-h step-h-compact">What matters?</h1>
					<p className="tagline">Pick what you'd like to track. You can change these anytime.</p>
					<div className="step-dots">
						<span />
						<span />
						<span className="active" />
					</div>
					<div className="cat-pick-grid">
						{(Object.entries(CATEGORIES) as [Category, (typeof CATEGORIES)[Category]][]).map(([k, v]) => (
							<button
								type="button"
								key={k}
								className={`cat-pick ${cats.includes(k) ? "selected" : ""}`}
								onClick={() => toggleCat(k)}
								style={{ "--chip": v.color } as React.CSSProperties}>
								<span className="cat-pick-icon">{v.icon}</span>
								<span className="cat-pick-label">{v.label}</span>
								<span className="cat-pick-check">{cats.includes(k) ? "✓" : "+"}</span>
							</button>
						))}
					</div>
					<div className="welcome-foot">
						<button type="button" className="cta-ghost" onClick={() => setStep(1)}>
							‹ back
						</button>
						<button
							type="submit"
							ref={step2SubmitRef}
							className="cta"
							disabled={cats.length === 0 || createProfile.isPending}>
							{createProfile.isPending ? "planting…" : "plant my seed ›"}
						</button>
					</div>
				</form>
			</main>
		</div>
	);
}
