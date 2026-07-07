/**
 * TocIndicator — reusable "clerk-style" curved TOC indicator engine.
 * ─────────────────────────────────────────────────────────────────
 * Ported from fumadocs/packages/base-ui/src/components/toc/clerk.tsx.
 *
 * The full track path (all items connected, bending at indentation changes)
 * is drawn once in the accent colour. The active "thumb" is that same path
 * revealed by a `clip-path` polygon spanning [--track-top, --track-bottom] —
 * the top of the first on-screen heading to the bottom of the last. Because
 * multiple headings are active at once, the thumb ELONGATES to cover however
 * much content is currently on screen, and it bends at indentation because
 * the clip simply reveals whatever slice of the curved path sits in that band.
 * A small dot rides the bottom edge of the range.
 *
 * The host decides *when* to mount/remeasure and *which* range is active.
 */

const LINE_X = [8, 16, 24];

function getLineX(depth: number): number {
	return LINE_X[Math.min(depth, LINE_X.length - 1)] ?? 8;
}

export class TocIndicator {
	private positions: [top: number, bottom: number, x: number][] = [];
	private pathD = '';
	private activeRange: [number, number] = [-1, -1];
	private decorationsInjected = false;

	private thumbWrapper: HTMLDivElement | null = null;
	private thumbSvg: SVGSVGElement | null = null;
	private thumbPath: SVGPathElement | null = null;
	private dot: HTMLDivElement | null = null;

	private resizeObserver: ResizeObserver | null = null;

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
		this.applyRange();

		if (!this.resizeObserver) {
			this.resizeObserver = new ResizeObserver(() => {
				this.computeAndBuild();
				this.applyRange();
			});
			this.resizeObserver.observe(this.container);
		}
	}

	/** Recompute geometry (call on re-open or when layout may have changed). */
	remeasure(): void {
		if (!this.decorationsInjected) return this.mount();
		this.computeAndBuild();
		this.applyRange();
	}

	updateActiveRange(startIdx: number, endIdx: number): void {
		if (this.activeRange[0] === startIdx && this.activeRange[1] === endIdx) return;
		this.activeRange = [startIdx, endIdx];

		this.links.forEach((link, idx) => {
			if (idx >= startIdx && idx <= endIdx) link.setAttribute('aria-current', 'true');
			else link.removeAttribute('aria-current');
		});

		this.applyRange();
	}

	destroy(): void {
		this.resizeObserver?.disconnect();
	}

	// ── active range → clip band ──────────────────────────

	private applyRange(): void {
		if (!this.thumbWrapper || this.activeRange[0] === -1 || !this.positions.length) return;
		const startPos = this.positions[this.activeRange[0]];
		const endPos = this.positions[this.activeRange[1]];
		if (!startPos || !endPos) return;

		const top = startPos[0];
		const bottom = endPos[1];
		this.thumbWrapper.style.setProperty('--track-top', `${top}px`);
		this.thumbWrapper.style.setProperty('--track-bottom', `${bottom}px`);

		if (this.dot) {
			this.dot.style.top = `${bottom}px`;
			this.dot.style.insetInlineStart = `${endPos[2]}px`;
			this.dot.style.opacity = bottom - top > 1 ? '1' : '0';
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
			this.thumbWrapper.append(svg);

			this.dot = document.createElement('div');
			this.dot.classList.add('toc-thumb-dot');
			this.dot.style.opacity = '0';
			this.thumbWrapper.append(this.dot);

			this.container.prepend(this.thumbWrapper);
		}

		this.thumbWrapper.style.width = `${w}px`;
		this.thumbWrapper.style.height = `${h}px`;
		this.thumbSvg!.setAttribute('viewBox', `0 0 ${w} ${h}`);
		this.thumbSvg!.style.width = `${w}px`;
		this.thumbSvg!.style.height = `${h}px`;
		this.thumbPath!.setAttribute('d', this.pathD);
	}
}
