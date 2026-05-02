/**
 * FumaDocs Clerk-style TOC — curved track with clip-path indicator
 * ─────────────────────────────────────────────────────────────────
 * Ported from fumadocs/packages/base-ui/src/components/toc/clerk.tsx
 *
 * Architecture:
 * 1. Per-item gray track decorations (vertical lines + curve SVGs) injected into each <a>
 * 2. Full-path colored SVG overlaid on the container, clipped with clip-path to reveal active section
 */

const PAGE_TITLE_ID = '_top';

// Line x-positions per depth (matches FumaDocs getLineOffset)
const LINE_X = [8, 16, 24];

function buildHeadingSelector(minH: number, maxH: number): string {
	const levels = Array.from({ length: maxH - minH + 1 }, (_, i) => `h${minH + i}[id]`);
	return [`h1#${PAGE_TITLE_ID}`, ...levels].join(',');
}

function getLineX(depth: number): number {
	return LINE_X[Math.min(depth, LINE_X.length - 1)] ?? 8;
}

export class StarlightTOC extends HTMLElement {
	private _current: HTMLAnchorElement | null = this.querySelector<HTMLAnchorElement>('a[aria-current="true"]');
	private minH = parseInt(this.dataset.minH ?? '2', 10);
	private maxH = parseInt(this.dataset.maxH ?? '3', 10);
	private tocSelector = buildHeadingSelector(this.minH, this.maxH);

	private tocLinks: HTMLAnchorElement[] = [];

	// Computed layout data
	private positions: [top: number, bottom: number, x: number][] = [];
	private pathD = '';

	// DOM element for the active indicator
	private thumbWrapper: HTMLDivElement | null = null;
	private thumbSvg: SVGSVGElement | null = null;

	// Snake movement state
	private prevTop = 0;
	private prevBottom = 0;
	private stretchTimer: ReturnType<typeof setTimeout> | null = null;

	protected set current(link: HTMLAnchorElement) {
		if (link === this._current) return;
		this._current?.removeAttribute('aria-current');
		link.setAttribute('aria-current', 'true');
		this._current = link;
		this.updateThumb();
	}

	connectedCallback() {
		this.tocLinks = [...this.querySelectorAll<HTMLAnchorElement>('a')];
		if (!this.tocLinks.length) return;
		if (window.innerWidth >= 1280) requestAnimationFrame(() => this.mount());
		this.initIntersectionObserver();
	}

	private getDepth(link: HTMLAnchorElement): number {
		return Math.min(parseInt(link.dataset.depth ?? '0', 10), LINE_X.length - 1);
	}

	// ── Mount ──────────────────────────────────────────────

	private mount() {
		const container = this.querySelector<HTMLElement>('.toc-list');
		if (!container) return;

		this.injectTrackDecorations();
		this.computeAndBuild(container);
		this.updateThumb(true); // snap on first render, no snake

		const ro = new ResizeObserver(() => {
			this.computeAndBuild(container);
			this.updateThumb(true);
		});
		ro.observe(container);
	}

	// ── Per-item gray track decorations ────────────────────

	private injectTrackDecorations() {
		const NS = 'http://www.w3.org/2000/svg';

		for (let i = 0; i < this.tocLinks.length; i++) {
			const link = this.tocLinks[i]!;
			// Attach to the <a>, NOT the <li> — the <li> wraps nested children too
			link.style.position = 'relative';

			const depth = this.getDepth(link);
			const x = getLineX(depth);
			const prevX = i > 0 ? getLineX(this.getDepth(this.tocLinks[i - 1]!)) : x;
			const nextX = i < this.tocLinks.length - 1 ? getLineX(this.getDepth(this.tocLinks[i + 1]!)) : x;

			// Vertical line segment
			const line = document.createElement('div');
			line.classList.add('toc-track-line');
			line.style.insetInlineStart = `${x}px`;
			if (x !== prevX) line.style.top = '6px';
			if (x !== nextX) line.style.bottom = '6px';
			link.prepend(line);

			// Curve SVG when depth changes from previous item
			if (i > 0 && x !== prevX) {
				const minX = Math.min(x, prevX);
				const w = Math.abs(x - prevX) + 1;

				const svg = document.createElementNS(NS, 'svg');
				svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
				svg.setAttribute('viewBox', `${minX} 0 ${w} 12`);
				svg.classList.add('toc-curve-svg');
				svg.style.width = `${w}px`;
				svg.style.height = '12px';
				svg.style.insetInlineStart = `${minX}px`;
				svg.setAttribute('aria-hidden', 'true');

				const path = document.createElementNS(NS, 'path');
				path.setAttribute('d', `M ${prevX} 0 C ${prevX} 8 ${x} 4 ${x} 12`);
				path.classList.add('toc-curve-path');
				svg.appendChild(path);
				link.prepend(svg);
			}
		}
	}

	// ── Compute positions + build thumb overlay ────────────

	private computeAndBuild(container: HTMLElement) {
		const containerRect = container.getBoundingClientRect();

		// 1. Compute positions for each link
		this.positions = [];
		for (const link of this.tocLinks) {
			const styles = getComputedStyle(link);
			const rect = link.getBoundingClientRect();
			const x = getLineX(this.getDepth(link)) + 0.5;
			const pt = parseFloat(styles.paddingTop);
			const pb = parseFloat(styles.paddingBottom);
			const top = rect.top - containerRect.top + pt;
			const bottom = rect.top - containerRect.top + rect.height - pb;
			this.positions.push([top, bottom, x]);
		}

		if (!this.positions.length) return;

		// 2. Build the full SVG path with cubic bezier curves between depth changes
		//    (Same formula as FumaDocs clerk.tsx line 61-67)
		let d = '';
		for (let i = 0; i < this.positions.length; i++) {
			const [top, bottom, x] = this.positions[i]!;
			if (i === 0) {
				d += `M${x} ${top} L${x} ${bottom}`;
			} else {
				const [, upperBottom, upperX] = this.positions[i - 1]!;
				d += ` C ${upperX} ${top - 4} ${x} ${upperBottom + 4} ${x} ${top} L${x} ${bottom}`;
			}
		}
		this.pathD = d;

		// 3. Create/update the thumb overlay
		this.ensureThumb(container);
	}

	private ensureThumb(container: HTMLElement) {
		const lastPos = this.positions[this.positions.length - 1];
		if (!lastPos) return;
		const w = Math.max(...this.positions.map(p => p[2])) + 8;
		const h = lastPos[1];
		const NS = 'http://www.w3.org/2000/svg';

		if (!this.thumbWrapper) {
			this.thumbWrapper = document.createElement('div');
			this.thumbWrapper.classList.add('toc-thumb-track');

			const svg = document.createElementNS(NS, 'svg');
			svg.classList.add('toc-thumb-svg');
			const path = document.createElementNS(NS, 'path');
			path.classList.add('toc-thumb-path');
			svg.appendChild(path);
			this.thumbSvg = svg;

			this.thumbWrapper.append(svg);
			container.prepend(this.thumbWrapper);
		}

		// Update dimensions
		this.thumbWrapper.style.width = `${w}px`;
		this.thumbWrapper.style.height = `${h}px`;

		const svg = this.thumbSvg!;
		svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
		svg.style.width = `${w}px`;
		svg.style.height = `${h}px`;
		svg.querySelector('path')!.setAttribute('d', this.pathD);
	}

	// ── Snake movement ─────────────────────────────────────
	//
	// Phase 1: The leading edge (head) moves to target immediately.
	//          The trailing edge (tail) stays where it was → the snake "stretches."
	// Phase 2: After ~100ms, the trailing edge catches up → the snake "contracts."
	//
	// Both phases use CSS transition for smooth interpolation.
	// No rAF loops, no physics, no jitter.

	private setClip(top: number, bottom: number) {
		if (!this.thumbSvg) return;
		this.thumbSvg.style.clipPath = `polygon(0 ${top}px, 100% ${top}px, 100% ${bottom}px, 0 ${bottom}px)`;
	}

	private updateThumb(snap = false) {
		if (!this._current || !this.thumbSvg) return;

		const idx = this.tocLinks.indexOf(this._current);
		if (idx === -1 || !this.positions[idx]) return;

		const [top, bottom] = this.positions[idx];

		// Cancel any pending phase-2 contraction
		if (this.stretchTimer) {
			clearTimeout(this.stretchTimer);
			this.stretchTimer = null;
		}

		// First render or resize — snap immediately, no animation
		if (snap || (this.prevTop === 0 && this.prevBottom === 0)) {
			this.setClip(top, bottom);
			this.prevTop = top;
			this.prevBottom = bottom;
			return;
		}

		const movingDown = top > this.prevTop;

		// Phase 1: Stretch — head leads, tail stays
		if (movingDown) {
			this.setClip(this.prevTop, bottom); // bottom (head) jumps, top (tail) stays
		} else {
			this.setClip(top, this.prevBottom); // top (head) jumps, bottom (tail) stays
		}

		// Phase 2: Contract — tail catches up after a delay
		this.stretchTimer = setTimeout(() => {
			this.setClip(top, bottom);
			this.stretchTimer = null;
		}, 100);

		this.prevTop = top;
		this.prevBottom = bottom;
	}

	// ── Intersection Observer ──────────────────────────────

	private initIntersectionObserver() {
		const headings = document.querySelectorAll<HTMLElement>(this.tocSelector);
		if (!headings.length) return;
		const linkByHref = new Map(this.tocLinks.map(a => [a.getAttribute('href'), a]));
		const visible = new Set<string>();
		const pickActive = () => {
			if (!visible.size) return;
			for (const heading of headings) {
				if (visible.has(heading.id)) {
					const link = linkByHref.get(`#${heading.id}`);
					if (link) { this.current = link; return; }
				}
			}
		};
		const io = new IntersectionObserver(entries => {
			for (const entry of entries) {
				const id = (entry.target as HTMLElement).id;
				if (entry.isIntersecting) visible.add(id);
				else visible.delete(id);
			}
			pickActive();
		}, { rootMargin: '-5% 0px -70% 0px', threshold: 0 });
		headings.forEach(h => io.observe(h));
	}
}
customElements.define('starlight-toc', StarlightTOC);
