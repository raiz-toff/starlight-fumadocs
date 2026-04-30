const PAGE_TITLE_ID = '_top';

export class StarlightTOC extends HTMLElement {
	private _current = this.querySelector<HTMLAnchorElement>('a[aria-current="true"]');
	private minH = parseInt(this.dataset.minH || '2', 10);
	private maxH = parseInt(this.dataset.maxH || '3', 10);

	private tocHeadingSelector =
		`h1#${PAGE_TITLE_ID},` +
		`:where(${[...Array.from({ length: 1 + this.maxH - this.minH }).map((_, index) => `h${this.minH + index}`)].join()})[id]`;

	// Glide-specific properties
	private svg: SVGSVGElement | null = null;
	private trackPath: SVGPathElement | null = null;
	private snakePath: SVGPathElement | null = null;
	private tocLinks: HTMLAnchorElement[] = [];
	private points: Array<{ x: number, y: number, h: number, hidden?: boolean }> = [];
	private activeIndex = -1;
	private depthOffsets = [8, 24, 40];
	private isAtBottom = false;
	private dot: SVGCircleElement | null = null;
	private currentStart = 0;
	private currentEnd = 0;
	private targetStart = 0;
	private targetEnd = 0;
	private lastScrollY = typeof window !== 'undefined' ? window.scrollY : 0;
	private physicsRaf: number | null = null;

	// ─── Worm physics additions ───────────────────────────────────────────────
	/**
	 *  1 = scrolling down  (end   is the head → moves fast)
	 * -1 = scrolling up    (start is the head → moves fast)
	 *  0 = settled / idle
	 */
	private scrollDirection = 0;

	/**
	 * Maximum impulse stretch in path-length pixels we'll push
	 * the leading edge ahead of its resting target per scroll event.
	 */
	private readonly MAX_IMPULSE = 28;

	/**
	 * Spring constants.
	 *   HEAD_K  – leading edge snaps quickly (the "lunge")
	 *   TAIL_K  – trailing edge drags slowly (the "body following")
	 *   IDLE_K  – equal pull when the worm has settled
	 */
	private readonly HEAD_K = 0.22;
	private readonly TAIL_K = 0.05;
	private readonly IDLE_K = 0.14;
	// ─────────────────────────────────────────────────────────────────────────

	protected set current(link: HTMLAnchorElement) {
		if (link === this._current) return;
		if (this._current) this._current.removeAttribute('aria-current');
		link.setAttribute('aria-current', 'true');
		this._current = link;

		const index = this.tocLinks.indexOf(link);
		if (index !== -1 && !this.isAtBottom) {
			this.activeIndex = index;
			this.repositionSnake(index, true);
		}
	}

	private onIdle = (cb: IdleRequestCallback) =>
		(window.requestIdleCallback || ((cb) => setTimeout(cb, 1)))(cb);

	constructor() {
		super();
		this.onIdle(() => this.init());
	}

	private init = (): void => {
		this.tocLinks = [...this.querySelectorAll('a')];
		if (this.tocLinks.length === 0) return;

		if (window.innerWidth >= 1280) {
			this.initGlide();
		}

		const isHeading = (el: Element): el is HTMLHeadingElement =>
			el.matches(this.tocHeadingSelector);

		const getElementHeading = (el: Element | null): HTMLHeadingElement | null => {
			if (!el) return null;
			const origin = el;
			while (el) {
				if (el.matches('.sl-markdown-content, main > *')) {
					return document.getElementById(PAGE_TITLE_ID) as HTMLHeadingElement;
				}
				if (isHeading(el)) return el;
				const childHeading = el.querySelector<HTMLHeadingElement>(this.tocHeadingSelector);
				if (childHeading) return childHeading;
				el = el.previousElementSibling;
				while (el?.lastElementChild) {
					el = el.lastElementChild;
				}
				const h = getElementHeading(el);
				if (h) return h;
			}
			return getElementHeading(origin.parentElement);
		};

		const setCurrent: IntersectionObserverCallback = (entries) => {
			for (const { isIntersecting, target } of entries) {
				if (!isIntersecting) continue;
				const heading = getElementHeading(target);
				if (!heading) continue;
				const link = this.tocLinks.find(
					(link) => link.hash === '#' + encodeURIComponent(heading.id)
				);
				if (link) {
					this.current = link;
					break;
				}
			}
		};

		// ─── Scroll handler ──────────────────────────────────────────────────
		const onScroll = () => {
			const currentScrollY = window.scrollY;
			const delta = currentScrollY - this.lastScrollY;
			this.lastScrollY = currentScrollY;

			if (delta !== 0 && this.activeIndex !== -1) {
				const newDir = delta > 0 ? 1 : -1;
				this.scrollDirection = newDir;

				/**
				 * IMPULSE: immediately push the leading edge ahead of its
				 * resting target.  The physics loop then pulls it back,
				 * creating the "lunge → contract" worm feel.
				 *
				 * We cap the impulse so rapid scrolling doesn't look broken.
				 */
				const impulse = Math.min(Math.abs(delta) * 0.7, this.MAX_IMPULSE);
				if (newDir === 1) {
					// Head = end edge; push it forward (down the path)
					this.currentEnd = Math.min(
						this.currentEnd + impulse,
						this.targetEnd + this.MAX_IMPULSE
					);
				} else {
					// Head = start edge; push it backward (up the path)
					this.currentStart = Math.max(
						this.currentStart - impulse,
						this.targetStart - this.MAX_IMPULSE
					);
				}

				if (!this.physicsRaf) {
					this.physicsRaf = requestAnimationFrame(this.physicsLoop);
				}
			}

			// ── Bottom-of-page edge case ─────────────────────────────────
			const atBottom =
				window.innerHeight + window.scrollY >=
				document.documentElement.scrollHeight - 50;

			if (atBottom && !this.isAtBottom) {
				this.isAtBottom = true;
				const lastIndex = this.tocLinks.length - 1;
				const lastLink = this.tocLinks[lastIndex];
				if (lastLink) {
					this.activeIndex = lastIndex;
					this.repositionSnake(lastIndex, true);
				}
			} else if (!atBottom && this.isAtBottom) {
				this.isAtBottom = false;
				if (this._current) {
					const index = this.tocLinks.indexOf(this._current);
					if (index !== -1) {
						this.activeIndex = index;
						this.repositionSnake(index, true);
					}
				}
			}
		};
		// ────────────────────────────────────────────────────────────────────

		const toObserve = document.querySelectorAll(
			[
				`main :where(${this.tocHeadingSelector})`,
				`main :where(${this.tocHeadingSelector}, .sl-heading-wrapper) ~ *:not(:has(${this.tocHeadingSelector}))`,
				`main .sl-markdown-content > *:not(:has(${this.tocHeadingSelector}))`,
				`main > *:not(:has(${this.tocHeadingSelector}))`,
			].join()
		);

		let observer: IntersectionObserver | undefined;
		const observe = () => {
			if (observer) return;
			observer = new IntersectionObserver(setCurrent, { rootMargin: this.getRootMargin() });
			toObserve.forEach((h) => observer!.observe(h));
		};
		observe();

		window.addEventListener('scroll', onScroll, { passive: true });
		requestAnimationFrame(onScroll);

		let timeout: number;
		window.addEventListener('resize', () => {
			if (observer) {
				observer.disconnect();
				observer = undefined;
			}
			window.clearTimeout(timeout);
			timeout = window.setTimeout(() => {
				this.onIdle(observe);
				if (window.innerWidth >= 1280) {
					if (!this.svg) this.initGlide();
					this.redraw();
				} else if (this.svg) {
					this.svg.remove();
					this.svg = null;
				}
			}, 200);
		});
	};

	private initGlide() {
		const sidebar = this.querySelector('nav ul');
		if (!sidebar || sidebar.querySelector('.toc-svg-track')) return;

		this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
		this.svg.classList.add('toc-svg-track');
		this.svg.setAttribute('aria-hidden', 'true');

		this.trackPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
		this.trackPath.classList.add('toc-path-track');

		this.snakePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
		this.snakePath.classList.add('toc-path-snake');

		this.dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
		this.dot.classList.add('toc-dot');
		this.dot.setAttribute('r', '3');

		this.svg.append(this.trackPath, this.snakePath, this.dot);
		sidebar.insertBefore(this.svg, sidebar.firstChild);

		requestAnimationFrame(() => this.redraw());
	}

	private getLinkDepth(link: HTMLAnchorElement) {
		const sidebar = this.querySelector('nav ul');
		let depth = 0, el = link.parentElement;
		while (el && el !== sidebar) {
			if (el.tagName === 'UL') depth++;
			el = el.parentElement;
		}
		return Math.min(depth, this.depthOffsets.length - 1);
	}

	private buildPoints(): Array<{ x: number, y: number, h: number, hidden?: boolean }> {
		const sidebar = this.querySelector('nav ul');
		if (!sidebar) return [];
		const ulRect = sidebar.getBoundingClientRect();

		return this.tocLinks.map(link => {
			const r = link.getBoundingClientRect();
			const depth = this.getLinkDepth(link);
			const x = this.depthOffsets[depth] ?? 0;
			if (!r.height || r.width === 0) {
				return { x, y: 0, h: 0, hidden: true };
			}
			return {
				x,
				y: r.top - ulRect.top + r.height / 2 + sidebar.scrollTop,
				h: r.height,
			};
		});
	}

	private pointsToPath(pts: Array<{ x: number, y: number, hidden?: boolean }>) {
		const validPts = pts.filter(p => !p.hidden);
		if (validPts.length < 2) return '';

		const first = validPts[0]!;
		const rootStyles = getComputedStyle(document.documentElement);
		const globalRadius = parseInt(rootStyles.getPropertyValue('--fuma-radius')) || 8;
		const CURVE_SIZE = globalRadius * 2;
		let d = `M ${first.x} ${first.y}`;

		for (let i = 1; i < validPts.length; i++) {
			const p0 = validPts[i - 1]!;
			const p1 = validPts[i]!;
			if (p0.x === p1.x) {
				d += ` L ${p1.x} ${p1.y}`;
			} else {
				const midY = (p0.y + p1.y) / 2;
				const offset = Math.min(Math.abs(p1.y - p0.y) / 3, CURVE_SIZE);
				d += ` L ${p0.x} ${midY - offset}`;
				d += ` C ${p0.x} ${midY}, ${p1.x} ${midY}, ${p1.x} ${midY + offset}`;
				d += ` L ${p1.x} ${p1.y}`;
			}
		}
		return d;
	}

	private getPathLengthAtPoint(pathEl: SVGPathElement, tx: number, ty: number) {
		const total = pathEl.getTotalLength();
		let lo = 0, hi = total;
		for (let i = 0; i < 10; i++) {
			const mid = (lo + hi) / 2;
			const ptLo = pathEl.getPointAtLength(lo + (mid - lo) / 2);
			const ptHi = pathEl.getPointAtLength(mid + (hi - mid) / 2);
			if (Math.hypot(ptLo.x - tx, ptLo.y - ty) < Math.hypot(ptHi.x - tx, ptHi.y - ty))
				hi = mid;
			else lo = mid;
		}
		return (lo + hi) / 2;
	}

	private redraw() {
		if (!this.trackPath || !this.snakePath) return;
		this.points = this.buildPoints();
		const d = this.pointsToPath(this.points);
		if (!d) return;
		this.trackPath.setAttribute('d', d);
		this.snakePath.setAttribute('d', d);

		if (this.dot) {
			this.dot.style.offsetPath = `path("${d}")`;
		}

		if (this.activeIndex !== -1) {
			this.repositionSnake(this.activeIndex, false);
		}
	}

	private repositionSnake(index: number, animate = true) {
		if (!this.snakePath || !this.trackPath) return;
		const pt = this.points[index];
		if (!pt || pt.hidden) return;

		const total = this.trackPath.getTotalLength();
		const centerLen = this.getPathLengthAtPoint(this.trackPath, pt.x, pt.y);
		const halfH = pt.h / 2 + 4;

		this.targetStart = Math.max(0, centerLen - halfH);
		this.targetEnd   = Math.min(total, centerLen + halfH);

		if (!animate) {
			this.currentStart = this.targetStart;
			this.currentEnd   = this.targetEnd;
			this.updateSnakePath();
			return;
		}

		if (!this.physicsRaf) {
			this.physicsRaf = requestAnimationFrame(this.physicsLoop);
		}
	}

	// ─── Worm physics loop ────────────────────────────────────────────────────
	private physicsLoop = () => {
		/**
		 * Asymmetric spring constants driven by scroll direction:
		 *
		 *  Scrolling DOWN  → end   is the head (HEAD_K), start is the tail (TAIL_K)
		 *  Scrolling UP    → start is the head (HEAD_K), end   is the tail (TAIL_K)
		 *  Settled / idle  → both edges pull with IDLE_K
		 *
		 * This makes the leading edge lunge to the target quickly while the
		 * trailing edge drags behind, exactly like a worm/snake crawling.
		 */
		let startK: number;
		let endK: number;

		if (this.scrollDirection > 0) {
			// Moving down: end = head (fast lunge), start = tail (slow drag)
			endK   = this.HEAD_K;
			startK = this.TAIL_K;
		} else if (this.scrollDirection < 0) {
			// Moving up: start = head (fast lunge), end = tail (slow drag)
			startK = this.HEAD_K;
			endK   = this.TAIL_K;
		} else {
			// Settled: symmetric gentle pull
			startK = endK = this.IDLE_K;
		}

		this.currentStart += (this.targetStart - this.currentStart) * startK;
		this.currentEnd   += (this.targetEnd   - this.currentEnd)   * endK;

		// ── Length constraints ─────────────────────────────────────────────
		// Enforce a minimum so the dot never disappears,
		// but allow generous stretching — don't cap the max during motion.
		const MIN_LEN = 8;
		const len = this.currentEnd - this.currentStart;

		if (len < MIN_LEN) {
			const mid = (this.currentStart + this.currentEnd) / 2;
			this.currentStart = mid - MIN_LEN / 2;
			this.currentEnd   = mid + MIN_LEN / 2;
		}
		// ──────────────────────────────────────────────────────────────────

		this.updateSnakePath();

		const diff =
			Math.abs(this.currentStart - this.targetStart) +
			Math.abs(this.currentEnd   - this.targetEnd);

		if (diff > 0.05) {
			this.physicsRaf = requestAnimationFrame(this.physicsLoop);
		} else {
			// Snap exactly to target and reset
			this.currentStart = this.targetStart;
			this.currentEnd   = this.targetEnd;
			this.updateSnakePath();
			this.physicsRaf    = null;
			this.scrollDirection = 0; // ← clear direction; next scroll sets it fresh
		}
	};
	// ─────────────────────────────────────────────────────────────────────────

	private updateSnakePath() {
		if (!this.snakePath || !this.trackPath) return;
		const total  = this.trackPath.getTotalLength();
		const segLen = Math.max(2, this.currentEnd - this.currentStart);

		this.snakePath.style.transition = 'none';
		this.snakePath.setAttribute('stroke-dasharray',  `${segLen} ${total}`);
		this.snakePath.setAttribute('stroke-dashoffset', `${-this.currentStart}`);
		this.snakePath.style.opacity = '1';

		if (this.dot) {
			this.dot.style.transition = 'none';
			const center          = (this.currentStart + this.currentEnd) / 2;
			const distancePercent = (center / total) * 100;
			this.dot.style.offsetDistance = `${distancePercent}%`;
			this.dot.style.opacity = '1';
		}
	}

	private getRootMargin(): `-${number}px 0% ${number}px` {
		const navBarHeight    = document.querySelector('header')?.getBoundingClientRect().height ?? 0;
		const mobileTocHeight = this.querySelector('summary')?.getBoundingClientRect().height  ?? 0;
		const top    = navBarHeight + mobileTocHeight + 32;
		const bottom = top + 53;
		const height = document.documentElement.clientHeight;
		return `-${top}px 0% ${bottom - height}px`;
	}
}

customElements.define('starlight-toc', StarlightTOC);