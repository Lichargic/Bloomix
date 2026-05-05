import { useEffect, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { SEASONS } from "../lib/theme";
import { getOptimizedImageUrl } from "../lib/imageSources";
import { useAuth } from "../providers/AuthProvider";
import { useTheme } from "../providers/ThemeProvider";
import { useBackgroundMusic } from "../providers/AudioProvider";
import { useProfile } from "../hooks/useProfile";
import { useSignOut } from "../hooks/useSignOut";
import { startMusicOnInteraction } from "../lib/audio";

const NAV_ITEMS = [
	{ to: "/today", label: "Today" },
	{ to: "/calendar", label: "Calendar" },
	{ to: "/bag", label: "Bag" },
	{ to: "/garden", label: "Garden" },
];

export function Topbar() {
	const navigate = useNavigate();
	const { user } = useAuth();
	const { data: profile } = useProfile();
	const { season } = useTheme();
	const signOut = useSignOut();

	const { muted, toggleMute } = useBackgroundMusic();
	const [menuOpen, setMenuOpen] = useState(false);

	const menuRef = useRef<HTMLDivElement>(null);
	const userBtnRef = useRef<HTMLButtonElement>(null);
	const wasOpen = useRef(false);

	const displayName = profile?.display_name ?? user?.email ?? "guest";
	const s = SEASONS[season];

	useEffect(() => {
		document.addEventListener("click", startMusicOnInteraction, { once: true, capture: true });
		document.addEventListener("keydown", startMusicOnInteraction, { once: true, capture: true });
		return () => {
			document.removeEventListener("click", startMusicOnInteraction, { capture: true });
			document.removeEventListener("keydown", startMusicOnInteraction, { capture: true });
		};
	}, []);

	// Close on outside click or Escape
	useEffect(() => {
		if (!menuOpen) return;
		function onDoc(e: MouseEvent) {
			if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
		}
		function onKey(e: KeyboardEvent) {
			if (e.key === "Escape") {
				setMenuOpen(false);
				return;
			}

			if (e.key !== "Tab" || !menuRef.current) return;
			const focusable = Array.from(
				menuRef.current.querySelectorAll<HTMLElement>(
					'button:not([disabled]), input:not([disabled]), [href], select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
				),
			).filter((el) => !el.hasAttribute("hidden"));
			if (focusable.length === 0) return;

			const first = focusable[0];
			const last = focusable[focusable.length - 1];
			if (e.shiftKey && document.activeElement === first) {
				e.preventDefault();
				last.focus();
			} else if (!e.shiftKey && document.activeElement === last) {
				e.preventDefault();
				first.focus();
			}
		}
		document.addEventListener("mousedown", onDoc);
		document.addEventListener("keydown", onKey);
		return () => {
			document.removeEventListener("mousedown", onDoc);
			document.removeEventListener("keydown", onKey);
		};
	}, [menuOpen]);

	// Focus management
	useEffect(() => {
		if (menuOpen) {
			wasOpen.current = true;
			const first = menuRef.current?.querySelector<HTMLElement>("button, input");
			first?.focus();
		} else if (wasOpen.current) {
			wasOpen.current = false;
			userBtnRef.current?.focus();
		}
	}, [menuOpen]);

	async function handleSignOut() {
		setMenuOpen(false);
		await signOut();
	}

	return (
		<>
			<header className="topbar" data-screen-label="Topbar">
				<div className="brand" aria-label="Bloomix">
					<img
						src={getOptimizedImageUrl(s.logo)}
						alt=""
						className="brand-mark pixelated"
						width={64}
						height={64}
					/>
					<span className="brand-word">Bloomix</span>
				</div>

				<nav className="nav" aria-label="Primary">
					{NAV_ITEMS.map((item) => (
						<NavLink key={item.to} to={item.to} className={({ isActive }) => (isActive ? "active" : "")}>
							{item.label}
						</NavLink>
					))}
				</nav>

				<button
					className={`music-btn${!muted ? " is-playing" : ""}`}
					onClick={toggleMute}
					aria-label={muted ? "Unmute music" : "Mute music"}
					aria-pressed={!muted}>
					{muted ?
						<svg
							viewBox="0 0 20 20"
							fill="none"
							stroke="currentColor"
							strokeWidth="1.5"
							strokeLinecap="round"
							strokeLinejoin="round"
							aria-hidden="true">
							<path d="M3 7h3l4-3v12l-4-3H3z" />
							<line x1="15" y1="8" x2="19" y2="12" />
							<line x1="19" y1="8" x2="15" y2="12" />
						</svg>
					:	<svg
							viewBox="0 0 20 20"
							fill="none"
							stroke="currentColor"
							strokeWidth="1.5"
							strokeLinecap="round"
							strokeLinejoin="round"
							aria-hidden="true">
							<path d="M3 7h3l4-3v12l-4-3H3z" />
							<path d="M14 7a4 4 0 0 1 0 6" />
							<path d="M16.5 4.5a8 8 0 0 1 0 11" />
						</svg>
					}
				</button>

				<div className="user" ref={menuRef}>
					<button
						ref={userBtnRef}
						className={`user-btn ${menuOpen ? "open" : ""}`}
						onClick={() => setMenuOpen((v) => !v)}
						aria-haspopup="menu"
						aria-expanded={menuOpen}>
						<span className="avatar" aria-hidden="true">
							{displayName.charAt(0).toUpperCase()}
						</span>
						<span className="user-name">{displayName}</span>
						<svg className="user-caret" viewBox="0 0 12 8" aria-hidden="true">
							<polyline points="1,1 6,6 11,1" fill="none" stroke="currentColor" strokeWidth="1.5" />
						</svg>
					</button>

					{menuOpen && (
						<div className="user-menu" role="menu">
							<div className="menu-head">
								<div className="menu-name-row">
									<span className="menu-avatar">{displayName.charAt(0).toUpperCase()}</span>
									<span>
										<b>{displayName}</b>
										<em>{user?.email ?? "Signed in"}</em>
									</span>
								</div>
							</div>

							<div className="menu-sec menu-sec-foot">
								<button
									role="menuitem"
									className="menu-link"
									onClick={() => {
										setMenuOpen(false);
										navigate("/settings");
									}}>
									Settings
								</button>
								<button role="menuitem" className="menu-link danger" onClick={handleSignOut}>
									Sign out
								</button>
							</div>
						</div>
					)}
				</div>
			</header>
		</>
	);
}
