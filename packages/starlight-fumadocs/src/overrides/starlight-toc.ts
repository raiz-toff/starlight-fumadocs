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
	private minH = 2;
	private maxH = 3;
	private tocSelector = '';

	private tocLinks: HTMLAnchorElement[] = [];

	// Computed layout data
	private positions: [top: number, bottom: number, x: number][] = [];
	private pathD = '';
	private headingIdToLinkIdx = new Map<string, number>();

	// Active indicator state
	private activeRange: [number, number] = [-1, -1];
	private currentStart = 0;
	private currentEnd = 0;
	private targetStart = 0;
	private targetEnd = 0;
	private animationFrame: number | null = null;
	private lastTickTime = 0;
	private _cachedPathLength = 0;
	private readonly boundTick = (timestamp: number) => this.tick(timestamp);

	// DOM elements
	private thumbWrapper: HTMLDivElement | null = null;
	private thumbSvg: SVGSVGElement | null = null;
	private thumbPath: SVGPathElement | null = null;
	private thumbDot: SVGCircleElement | null = null;

	// Observers & Listeners
	private resizeObserver: ResizeObserver | null = null;
	private intersectionObserver: IntersectionObserver | null = null;
	private boundScrollHandler: (() => void) | null = null;
	private mq: MediaQueryList | null = null;
	private mqHandler: ((e: MediaQueryListEvent) => void) | null = null;

	disconnectedCallback() {
		this.resizeObserver?.disconnect();
		this.intersectionObserver?.disconnect();
		if (this.mq && this.mqHandler) {
			this.mq.removeEventListener('change', this.mqHandler);
		}
		if (this.boundScrollHandler) {
			window.removeEventListener('scroll', this.boundScrollHandler);
		}
		if (this.animationFrame !== null) {
			cancelAnimationFrame(this.animationFrame);
			this.animationFrame = null;
		}
	}

	private updateActiveRange(startIdx: number, endIdx: number) {
		if (this.activeRange[0] === startIdx && this.activeRange[1] === endIdx) return;
		
		this.activeRange = [startIdx, endIdx];
		
		// Update aria-current
		this.tocLinks.forEach((link, idx) => {
			if (idx >= startIdx && idx <= endIdx) {
				link.setAttribute('aria-current', 'true');
			} else {
				link.removeAttribute('aria-current');
			}
		});

		this.calculateTargets();
	}

	private calculateTargets() {
		if (this.activeRange[0] === -1 || !this.thumbPath) return;

		const startIdx = this.activeRange[0];
		const endIdx = this.activeRange[1];
		
		const startPos = this.positions[startIdx]!;
		const endPos = this.positions[endIdx]!;

		// Find distance along path for these points
		this.targetStart = this.getDistanceAtPoint(startPos[2], startPos[0]);
		this.targetEnd = this.getDistanceAtPoint(endPos[2], endPos[1]);

		if (!this.animationFrame) {
			this.lastTickTime = 0;
			this.animationFrame = requestAnimationFrame(this.boundTick);
		}
	}

	private getDistanceAtPoint(x: number, y: number): number {
		if (!this.thumbPath) return 0;
		const totalLength = this._cachedPathLength || this.thumbPath.getTotalLength();
		let precision = 32;
		let bestLen = 0;
		let minDist = Infinity;

		for (let i = 0; i <= precision; i++) {
			const len = (i / precision) * totalLength;
			const pt = this.thumbPath.getPointAtLength(len);
			const dist = Math.hypot(pt.x - x, pt.y - y);
			if (dist < minDist) {
				minDist = dist;
				bestLen = len;
			}
		}
		
		// Refine
		let start = Math.max(0, bestLen - totalLength / precision);
		let end = Math.min(totalLength, bestLen + totalLength / precision);
		for (let i = 0; i < 5; i++) {
			const step = (end - start) / 10;
			for (let j = 0; j <= 10; j++) {
				const len = start + j * step;
				const pt = this.thumbPath.getPointAtLength(len);
				const dist = Math.hypot(pt.x - x, pt.y - y);
				if (dist < minDist) {
					minDist = dist;
					bestLen = len;
				}
			}
			start = Math.max(0, bestLen - step);
			end = Math.min(totalLength, bestLen + step);
		}

		return bestLen;
	}

	private tick(timestamp: number) {
		const dt = Math.min(timestamp - (this.lastTickTime || timestamp), 50);
		this.lastTickTime = timestamp;
		
		const K = 1 - Math.exp(-dt / 80); // ~80ms time constant
		
		const diffStart = this.targetStart - this.currentStart;
		const diffEnd = this.targetEnd - this.currentEnd;

		this.currentStart += diffStart * K;
		this.currentEnd += diffEnd * K;

		if (Math.abs(diffStart) < 0.1 && Math.abs(diffEnd) < 0.1) {
			this.currentStart = this.targetStart;
			this.currentEnd = this.targetEnd;
			this.draw();
			this.animationFrame = null;
			return;
		}

		this.draw();
		this.animationFrame = requestAnimationFrame(this.boundTick);
	}

	private lastScrollY = typeof window !== 'undefined' ? window.scrollY : 0;
	private scrollDirection: 'up' | 'down' = 'down';

	private draw() {
		if (!this.thumbPath) return;
		const totalLength = this._cachedPathLength || this.thumbPath.getTotalLength();
		const dashLen = Math.max(0.1, this.currentEnd - this.currentStart);
		
		this.thumbPath.style.strokeDasharray = `${dashLen} ${totalLength}`;
		this.thumbPath.style.strokeDashoffset = `${-this.currentStart}`;

		if (this.thumbDot) {
			// Attach dot to start or end based on direction
			const dotPos = this.scrollDirection === 'up' ? this.currentStart : this.currentEnd;
			const pt = this.thumbPath.getPointAtLength(dotPos);
			this.thumbDot.setAttribute('cx', `${pt.x}`);
			this.thumbDot.setAttribute('cy', `${pt.y}`);
			this.thumbDot.style.opacity = dashLen > 1 ? '1' : '0';
		}
	}

	connectedCallback() {
		this.minH = parseInt(this.dataset.minH ?? '2', 10);
		this.maxH = parseInt(this.dataset.maxH ?? '3', 10);
		this.tocSelector = buildHeadingSelector(this.minH, this.maxH);

		this.tocLinks = [...this.querySelectorAll<HTMLAnchorElement>('a')];
		if (!this.tocLinks.length) return;

		// Build ID -> Index map synchronously and unconditionally
		this.tocLinks.forEach((link, idx) => {
			const id = link.getAttribute('href')?.slice(1);
			if (id) this.headingIdToLinkIdx.set(id, idx);
		});
		
		this.mq = window.matchMedia('(min-width: 1280px)');
		this.mqHandler = (e: MediaQueryListEvent) => {
			if (e.matches && !this.thumbWrapper) {
				requestAnimationFrame(() => this.mount());
			}
		};
		this.mq.addEventListener('change', this.mqHandler);

		if (this.mq.matches) {
			requestAnimationFrame(() => this.mount());
		}

		this.initIntersectionObserver();

		// Track scroll direction and boundary snapping
		this.boundScrollHandler = () => {
			const currentY = window.scrollY;
			const newDirection = currentY < this.lastScrollY ? 'up' : 'down';
			const directionChanged = newDirection !== this.scrollDirection;
			
			this.scrollDirection = newDirection;
			this.lastScrollY = currentY;

			// Snap to top/bottom boundaries
			const scrollHeight = document.documentElement.scrollHeight;
			const clientHeight = document.documentElement.clientHeight;
			const isAtTop = currentY < 50;
			const isAtBottom = currentY + clientHeight > scrollHeight - 50;

			if (isAtTop) {
				this.updateActiveRange(0, 0);
			} else if (isAtBottom) {
				const lastIdx = this.tocLinks.length - 1;
				this.updateActiveRange(lastIdx, lastIdx);
			}

			if (directionChanged && !this.animationFrame) {
				this.draw(); 
			}
		};
		window.addEventListener('scroll', this.boundScrollHandler, { passive: true });
	}

	private getDepth(link: HTMLAnchorElement): number {
		const d = parseInt(link.dataset.depth ?? '0', 10);
		return Math.min(isNaN(d) ? 0 : d, LINE_X.length - 1);
	}

	// ── Mount ──────────────────────────────────────────────

	private mount() {
		if (this.thumbWrapper) return; // Idempotency guard

		const container = this.querySelector<HTMLElement>('.toc-list');
		if (!container) return;

		this.injectTrackDecorations();
		this.computeAndBuild(container);
		
		// Initial sync
		if (this.activeRange[0] !== -1) {
			this.calculateTargets();
			this.currentStart = this.targetStart;
			this.currentEnd = this.targetEnd;
			this.draw();
		}

		this.resizeObserver = new ResizeObserver(() => {
			this.computeAndBuild(container);
			this.calculateTargets();
		});
		this.resizeObserver.observe(container);
	}

	// ── Per-item gray track decorations ────────────────────

	private injectTrackDecorations() {
		const NS = 'http://www.w3.org/2000/svg';

		for (let i = 0; i < this.tocLinks.length; i++) {
			const link = this.tocLinks[i]!;
			link.style.position = 'relative';

			const depth = this.getDepth(link);
			const x = getLineX(depth);
			const prevX = i > 0 ? getLineX(this.getDepth(this.tocLinks[i - 1]!)) : x;
			const nextX = i < this.tocLinks.length - 1 ? getLineX(this.getDepth(this.tocLinks[i + 1]!)) : x;

			const line = document.createElement('div');
			line.classList.add('toc-track-line');
			line.style.insetInlineStart = `${x}px`;
			if (x !== prevX) line.style.top = '6px';
			if (x !== nextX) line.style.bottom = '6px';
			link.prepend(line);

			if (i > 0 && x !== prevX) {
				const minX = Math.min(x, prevX);
				const w = Math.abs(x - prevX) + 1;

				const svg = document.createElementNS(NS, 'svg');
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

		// Batch all DOM reads first to avoid layout thrashing
		const rects = this.tocLinks.map(link => ({
			rect: link.getBoundingClientRect(),
			styles: getComputedStyle(link),
			depth: this.getDepth(link),
		}));

		this.positions = rects.map(({ rect, styles, depth }) => {
			const x = getLineX(depth) + 0.5;
			const pt = parseFloat(styles.paddingTop);
			const pb = parseFloat(styles.paddingBottom);
			const top = rect.top - containerRect.top + pt;
			const bottom = rect.top - containerRect.top + rect.height - pb;
			return [top, bottom, x];
		});

		if (!this.positions.length) return;

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
			this.thumbSvg = svg;
			
			const path = document.createElementNS(NS, 'path');
			path.classList.add('toc-thumb-path');
			svg.appendChild(path);
			this.thumbPath = path;

			const dot = document.createElementNS(NS, 'circle');
			dot.classList.add('toc-thumb-dot');
			dot.setAttribute('r', '2.5');
			svg.appendChild(dot);
			this.thumbDot = dot;

			this.thumbWrapper.append(svg);
			container.prepend(this.thumbWrapper);
		}

		this.thumbWrapper.style.width = `${w}px`;
		this.thumbWrapper.style.height = `${h}px`;
		this.thumbSvg!.setAttribute('viewBox', `0 0 ${w} ${h}`);
		this.thumbPath!.setAttribute('d', this.pathD);

		// Cache path length synchronously for immediate accuracy
		if (this.thumbPath) {
			this._cachedPathLength = this.thumbPath.getTotalLength();
		}
	}

	// ── Intersection Observer ──────────────────────────────

	private initIntersectionObserver() {
		const headings = document.querySelectorAll<HTMLElement>(this.tocSelector);
		if (!headings.length) return;
		
		const visible = new Set<string>();
		
		const pickActive = () => {
			if (!visible.size) return;
			
			let firstIdx = -1;
			let lastIdx = -1;

			headings.forEach((heading) => {
				if (visible.has(heading.id)) {
					const idx = this.headingIdToLinkIdx.get(heading.id);
					if (idx !== undefined) {
						if (firstIdx === -1 || idx < firstIdx) firstIdx = idx;
						if (idx > lastIdx) lastIdx = idx;
					}
				}
			});

			if (firstIdx !== -1) {
				this.updateActiveRange(firstIdx, lastIdx);
			}
		};

		this.intersectionObserver = new IntersectionObserver(entries => {
			for (const entry of entries) {
				const id = (entry.target as HTMLElement).id;
				if (entry.isIntersecting) visible.add(id);
				else visible.delete(id);
			}
			pickActive();
		}, { 
			// More generous rootMargin to capture sections entering/exiting
			rootMargin: '-10% 0px -40% 0px', 
			threshold: 0 
		});

		headings.forEach(h => this.intersectionObserver!.observe(h));
	}
}
customElements.define('starlight-toc', StarlightTOC);
