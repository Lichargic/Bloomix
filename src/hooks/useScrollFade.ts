import { useCallback, useLayoutEffect, useState } from "react";

type Direction = "vertical" | "horizontal";

export function useScrollFade<T extends HTMLElement>(direction: Direction = "vertical") {
	const [node, setNode] = useState<T | null>(null);

	const ref = useCallback((el: T | null) => {
		setNode(el);
	}, []);

	useLayoutEffect(() => {
		// 1. We capture 'node' into a local constant 'el'
		const el = node;
		if (!el) return;

		const wrapperClass = direction === "vertical" ? "scroll-fade-v" : "scroll-fade-h";
		const host = el.parentElement?.classList.contains(wrapperClass) ? el.parentElement : el;

		const targets = host === el ? [el] : [el, host];
		let raf = 0;

		function toggleClass(name: string, enabled: boolean) {
			for (const target of targets) {
				target.classList.toggle(name, enabled);
			}
		}

		function clearClasses() {
			for (const target of targets) {
				target.classList.remove(
					"can-scroll-up",
					"can-scroll-down",
					"can-scroll-left",
					"can-scroll-right",
					"is-scrollable-v",
					"is-scrollable-h",
				);
			}
		}

		// 2. We pass 'el' as an argument to update to satisfy TypeScript's null check
		function update(element: T) {
			if (direction === "vertical") {
				const canScroll = element.scrollHeight > element.clientHeight + 1;
				const canScrollUp = canScroll && element.scrollTop > 1;
				const canScrollDown = canScroll && element.scrollTop + element.clientHeight < element.scrollHeight - 1;

				toggleClass("is-scrollable-v", canScroll);
				toggleClass("can-scroll-up", canScrollUp);
				toggleClass("can-scroll-down", canScrollDown);

				toggleClass("is-scrollable-h", false);
				toggleClass("can-scroll-left", false);
				toggleClass("can-scroll-right", false);
			} else {
				const canScroll = element.scrollWidth > element.clientWidth + 1;
				const canScrollLeft = canScroll && element.scrollLeft > 1;
				const canScrollRight = canScroll && element.scrollLeft + element.clientWidth < element.scrollWidth - 1;

				toggleClass("is-scrollable-h", canScroll);
				toggleClass("can-scroll-left", canScrollLeft);
				toggleClass("can-scroll-right", canScrollRight);

				toggleClass("is-scrollable-v", false);
				toggleClass("can-scroll-up", false);
				toggleClass("can-scroll-down", false);
			}
		}

		function scheduleUpdate() {
			cancelAnimationFrame(raf);
			// 3. Since we are inside the 'if (!el) return' block,
			// we can safely pass 'el' here.
			raf = requestAnimationFrame(() => update(el!));
		}

		scheduleUpdate();

		el.addEventListener("scroll", scheduleUpdate, { passive: true });
		window.addEventListener("load", scheduleUpdate);

		const ro = new ResizeObserver(scheduleUpdate);
		ro.observe(el);

		for (const child of Array.from(el.children)) {
			if (child instanceof HTMLElement) ro.observe(child);
		}

		const mo = new MutationObserver((mutations) => {
			for (const mutation of mutations) {
				for (const mNode of Array.from(mutation.addedNodes)) {
					if (mNode instanceof HTMLElement) ro.observe(mNode);
				}
			}
			scheduleUpdate();
		});

		mo.observe(el, {
			childList: true,
			subtree: true,
			characterData: true,
			attributes: true,
		});

		return () => {
			cancelAnimationFrame(raf);
			el.removeEventListener("scroll", scheduleUpdate);
			window.removeEventListener("load", scheduleUpdate);
			ro.disconnect();
			mo.disconnect();
			clearClasses();
		};
	}, [direction, node]);

	return ref;
}
