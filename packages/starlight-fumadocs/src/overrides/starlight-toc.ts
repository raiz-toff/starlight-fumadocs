/**
 * Desktop "clerk-style" TOC — thin custom element around the shared
 * TocIndicator engine (see ./toc-indicator.ts). Mounts at ≥1280px and feeds
 * it the active heading range from an IntersectionObserver.
 */
import { TocIndicator } from './toc-indicator.ts';

const PAGE_TITLE_ID = '_top';

function buildHeadingSelector(minH: number, maxH: number): string {
	const levels = Array.from({ length: maxH - minH + 1 }, (_, i) => `h${minH + i}[id]`);
	return [`h1#${PAGE_TITLE_ID}`, ...levels].join(',');
}

export class StarlightTOC extends HTMLElement {
	private minH = 2;
	private maxH = 3;
	private tocSelector = '';
	private tocLinks: HTMLAnchorElement[] = [];
	private headingIdToLinkIdx = new Map<string, number>();
	private indicator: TocIndicator | null = null;

	private intersectionObserver: IntersectionObserver | null = null;
	private boundScrollHandler: (() => void) | null = null;
	private mq: MediaQueryList | null = null;
	private mqHandler: ((e: MediaQueryListEvent) => void) | null = null;

	connectedCallback() {
		this.minH = parseInt(this.dataset.minH ?? '2', 10);
		this.maxH = parseInt(this.dataset.maxH ?? '3', 10);
		this.tocSelector = buildHeadingSelector(this.minH, this.maxH);

		const container = this.querySelector<HTMLElement>('.toc-list');
		this.tocLinks = [...this.querySelectorAll<HTMLAnchorElement>('.toc-list a')];
		if (!container || !this.tocLinks.length) return;

		this.tocLinks.forEach((link, idx) => {
			const id = link.getAttribute('href')?.slice(1);
			if (id) this.headingIdToLinkIdx.set(decodeURIComponent(id), idx);
		});

		this.indicator = new TocIndicator(container, this.tocLinks);

		this.mq = window.matchMedia('(min-width: 1280px)');
		this.mqHandler = (e: MediaQueryListEvent) => {
			if (e.matches && !this.indicator!.mounted) {
				requestAnimationFrame(() => this.indicator!.mount());
			}
		};
		this.mq.addEventListener('change', this.mqHandler);
		if (this.mq.matches) requestAnimationFrame(() => this.indicator!.mount());

		this.initIntersectionObserver();
		this.initScrollBoundaries();
	}

	disconnectedCallback() {
		this.intersectionObserver?.disconnect();
		this.indicator?.destroy();
		if (this.mq && this.mqHandler) this.mq.removeEventListener('change', this.mqHandler);
		if (this.boundScrollHandler) window.removeEventListener('scroll', this.boundScrollHandler);
	}

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
			if (firstIdx !== -1) this.indicator?.updateActiveRange(firstIdx, lastIdx);
		};

		this.intersectionObserver = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					const id = (entry.target as HTMLElement).id;
					if (entry.isIntersecting) visible.add(id);
					else visible.delete(id);
				}
				pickActive();
			},
			{ rootMargin: '-10% 0px -40% 0px', threshold: 0 }
		);

		headings.forEach((h) => this.intersectionObserver!.observe(h));
	}

	private initScrollBoundaries() {
		this.boundScrollHandler = () => {
			const currentY = window.scrollY;
			const scrollHeight = document.documentElement.scrollHeight;
			const clientHeight = document.documentElement.clientHeight;
			if (currentY < 50) {
				this.indicator?.updateActiveRange(0, 0);
			} else if (currentY + clientHeight > scrollHeight - 50) {
				const lastIdx = this.tocLinks.length - 1;
				this.indicator?.updateActiveRange(lastIdx, lastIdx);
			}
		};
		window.addEventListener('scroll', this.boundScrollHandler, { passive: true });
	}
}

customElements.define('starlight-toc', StarlightTOC);
