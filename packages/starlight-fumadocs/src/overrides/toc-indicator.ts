/**
 * TocIndicator — reusable "clerk-style" curved TOC indicator engine.
 * ─────────────────────────────────────────────────────────────────
 * Extracted from starlight-toc.ts so both the desktop rail and the mobile
 * popover can share the exact same track-line + animated-path + gliding-dot
 * visuals. The host owns *when* to mount/remeasure and *which* range is
 * active (via an IntersectionObserver); this class owns all the geometry
 * and animation.
 *
 * Usage:
 *   const ind = new TocIndicator(containerEl, linkEls);
 *   ind.mount();                  // when the container is visible (has layout)
 *   ind.remeasure();              // on resize / re-open
 *   ind.updateActiveRange(a, b);  // when the active heading range changes
 *   ind.destroy();
 */

const LINE_X = [8, 16, 24];

function getLineX(depth: number): number {
	return LINE_X[Math.min(depth, LINE_X.length - 1)] ?? 8;
}

export class TocIndicator {
	private positions: [top: number, bottom: number, x: number][] = [];
	private pathD = '';

	private activeRange: [number, number] = [-1, -1];
	private currentStart = 0;
	private currentEnd = 0;
	private targetStart = 0;
	private targetEnd = 0;
	private animationFrame: number | null = null;
	private lastTickTime = 0;
	private _cachedPathLength = 0;
	private readonly boundTick = (t: number) => this.tick(t);

	private thumbWrapper: HTMLDivElement | null = null;
	private thumbSvg: SVGSVGElement | null = null;
	private thumbPath: SVGPathElement | null = null;
	private thumbDot: SVGCircleElement | null = null;
	private decorationsInjected = false;

	private resizeObserver: ResizeObserver | null = null;
	private lastScrollY = typeof window !== 'undefined' ? window.scrollY : 0;
	private scrollDirection: 'up' | 'down' = 'down';
	private readonly boundScroll = () => {
		const y = window.scrollY;
		this.scrollDirection = y < this.lastScrollY ? 'up' : 'down';
		this.lastScrollY = y;
	};

	constructor(
		private container: HTMLElement,
		private links: HTMLAnchorElement[],
	) {}

	get mounted(): boolean {
		return this.thumbWrapper !== null && this.positions.length > 0;
	}

	/** Inject decorations + build the thumb. Call when the container is visible. */
	mount(): void {
		if (!this.decorationsInjected) {
			this.injectTrackDecorations();
			this.decorationsInjected = true;
		}
		this.computeAndBuild();

		if (this.activeRange[0] !== -1) {
			this.calculateTargets();
			this.currentStart = this.targetStart;
			this.currentEnd = this.targetEnd;
			this.draw();
		}

		if (!this.resizeObserver) {
			this.resizeObserver = new ResizeObserver(() => {
				this.computeAndBuild();
				this.calculateTargets();
			});
			this.resizeObserver.observe(this.container);
		}
		window.addEventListener('scroll', this.boundScroll, { passive: true });
	}

	/** Recompute geometry (call on re-open or when layout may have changed). */
	remeasure(): void {
		if (!this.decorationsInjected) return this.mount();
		this.computeAndBuild();
		if (this.activeRange[0] !== -1) {
			this.calculateTargets();
			this.currentStart = this.targetStart;
			this.currentEnd = this.targetEnd;
			this.draw();
		}
	}

	updateActiveRange(startIdx: number, endIdx: number): void {
		if (this.activeRange[0] === startIdx && this.activeRange[1] === endIdx) return;
		this.activeRange = [startIdx, endIdx];

		this.links.forEach((link, idx) => {
			if (idx >= startIdx && idx <= endIdx) link.setAttribute('aria-current', 'true');
			else link.removeAttribute('aria-current');
		});

		this.calculateTargets();
	}

	destroy(): void {
		this.resizeObserver?.disconnect();
		window.removeEventListener('scroll', this.boundScroll);
		if (this.animationFrame !== null) {
			cancelAnimationFrame(this.animationFrame);
			this.animationFrame = null;
		}
	}

	// ── geometry ──────────────────────────────────────────

	private getDepth(link: HTMLAnchorElement): number {
		const d = parseInt(link.dataset.depth ?? '0', 10);
		return Math.min(isNaN(d) ? 0 : d, LINE_X.length - 1);
	}

	private injectTrackDecorations(): void {
		const NS = 'http://www.w3.org/2000/svg';
		for (let i = 0; i < this.links.length; i++) {
			const link = this.links[i]!;
			link.style.position = 'relative';

			const depth = this.getDepth(link);
			const x = getLineX(depth);
			const prevX = i > 0 ? getLineX(this.getDepth(this.links[i - 1]!)) : x;
			const nextX = i < this.links.length - 1 ? getLineX(this.getDepth(this.links[i + 1]!)) : x;

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

	private computeAndBuild(): void {
		const containerRect = this.container.getBoundingClientRect();
		const rects = this.links.map((link) => ({
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
		this.ensureThumb();
	}

	private ensureThumb(): void {
		const lastPos = this.positions[this.positions.length - 1];
		if (!lastPos) return;
		const w = Math.max(...this.positions.map((p) => p[2])) + 8;
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
			this.container.prepend(this.thumbWrapper);
		}

		this.thumbWrapper.style.width = `${w}px`;
		this.thumbWrapper.style.height = `${h}px`;
		this.thumbSvg!.setAttribute('viewBox', `0 0 ${w} ${h}`);
		this.thumbPath!.setAttribute('d', this.pathD);
		this._cachedPathLength = this.thumbPath!.getTotalLength();
	}

	private calculateTargets(): void {
		if (this.activeRange[0] === -1 || !this.thumbPath) return;
		const startPos = this.positions[this.activeRange[0]];
		const endPos = this.positions[this.activeRange[1]];
		if (!startPos || !endPos) return;

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
		const precision = 32;
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

	private tick(timestamp: number): void {
		const dt = Math.min(timestamp - (this.lastTickTime || timestamp), 50);
		this.lastTickTime = timestamp;
		const K = 1 - Math.exp(-dt / 80);
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

	private draw(): void {
		if (!this.thumbPath) return;
		const totalLength = this._cachedPathLength || this.thumbPath.getTotalLength();
		const dashLen = Math.max(0.1, this.currentEnd - this.currentStart);
		this.thumbPath.style.strokeDasharray = `${dashLen} ${totalLength}`;
		this.thumbPath.style.strokeDashoffset = `${-this.currentStart}`;

		if (this.thumbDot) {
			const dotPos = this.scrollDirection === 'up' ? this.currentStart : this.currentEnd;
			const pt = this.thumbPath.getPointAtLength(dotPos);
			this.thumbDot.setAttribute('cx', `${pt.x}`);
			this.thumbDot.setAttribute('cy', `${pt.y}`);
			this.thumbDot.style.opacity = dashLen > 1 ? '1' : '0';
		}
	}
}
