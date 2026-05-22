import React, { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import { useHistory, useLocation } from '@docusaurus/router';
import Pagination from '@site/src/components/common/Pagination';
import styles from './styles.module.css';
import externalArticles from '@site/src/data/externalArticles';
import type { ExternalArticle } from '@site/src/data/externalArticles';

const PAGE_SIZE = 9;

// ─── Types ───────────────────────────────────────────────────────────────────

type CategoryValue = 'all' | 'announcements' | 'technology' | 'community';
type PostCategory = Exclude<CategoryValue, 'all'>;

const CATEGORIES: {
  value: CategoryValue;
  label: string;
  sectionTitle: string;
  searchPlaceholder: string;
}[] = [
  { value: 'all',           label: 'All',           sectionTitle: 'All',           searchPlaceholder: 'Search all articles...' },
  { value: 'announcements', label: 'Announcements', sectionTitle: 'Announcements', searchPlaceholder: 'Search announcements...' },
  { value: 'technology',    label: 'Technology',    sectionTitle: 'Technology',    searchPlaceholder: 'Search technology articles...' },
  { value: 'community',     label: 'Community',     sectionTitle: 'Community',     searchPlaceholder: 'Search community articles...' },
];

interface BlogAuthor {
  name?: string;
  imageURL?: string;
  key?: string;
}

interface BlogPostMetadata {
  permalink: string;
  title: string;
  description: string;
  date: string;
  readingTime?: number;
  authors: readonly BlogAuthor[];
}

interface BlogPostContent {
  frontMatter: Record<string, unknown>;
  metadata: BlogPostMetadata;
  assets?: { image?: string };
}

interface Props {
  items: readonly { content: BlogPostContent }[];
}

// Unified card data passed to BlogCard
interface CardItem {
  key: string;
  href: string;
  external: boolean;
  title: string;
  description: string;
  date: string;
  coverImage?: string;
  category?: PostCategory;
  source?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getPostCategory(fm: Record<string, unknown>): PostCategory | undefined {
  const cat = fm.category;
  if (cat === 'announcements' || cat === 'technology' || cat === 'community') return cat;
  return undefined;
}

function getCoverImage(content: BlogPostContent): string | undefined {
  return content.assets?.image ?? (content.frontMatter.image as string | undefined);
}

function formatDate(dateStr: string): string {
  // Slice to YYYY-MM-DD before splitting — metadata.date from Docusaurus is a full
  // ISO datetime string (e.g. "2025-08-26T00:00:00.000Z"). Parsing as local time
  // avoids the UTC off-by-one for users west of UTC.
  const [year, month, day] = dateStr.slice(0, 10).split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function toCardItem(content: BlogPostContent): CardItem {
  return {
    key: content.metadata.permalink,
    href: content.metadata.permalink,
    external: false,
    title: content.metadata.title,
    description: content.metadata.description,
    date: content.metadata.date,
    coverImage: getCoverImage(content),
    category: getPostCategory(content.frontMatter),
  };
}

function externalToCardItem(article: ExternalArticle): CardItem {
  return {
    key: article.url,
    href: article.url,
    external: true,
    title: article.title,
    description: article.description,
    date: article.date,
    coverImage: article.image,
    category: article.category,
    source: article.source,
  };
}

function byDateDesc(a: CardItem, b: CardItem): number {
  return new Date(b.date).getTime() - new Date(a.date).getTime();
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function SearchIcon() {
  return (
    <svg
      className={styles.searchIcon}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function ExternalLinkIcon() {
  return (
    <svg
      className={styles.externalIcon}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

// ─── PinnedBanner ─────────────────────────────────────────────────────────────

function PinnedBanner({ content }: { content: BlogPostContent }) {
  const { metadata, frontMatter } = content;
  const category = getPostCategory(frontMatter);
  const coverImage = getCoverImage(content);
  const categoryLabel = CATEGORIES.find((c) => c.value === category)?.label;

  return (
    <Link to={metadata.permalink} className={styles.pinnedBanner} onDragStart={(e) => e.preventDefault()}>
      <div className={styles.pinnedBannerImageWrapper}>
        {coverImage ? (
          <img
            src={coverImage}
            alt={metadata.title}
            className={styles.pinnedBannerImage}
            loading="eager"
          />
        ) : (
          <div className={styles.imagePlaceholder} />
        )}
      </div>
      <div className={styles.pinnedBannerBody}>
        <span className={styles.cardDate}>{formatDate(metadata.date)}</span>
        <h2 className={styles.pinnedBannerTitle}>{metadata.title}</h2>
        {metadata.description && (
          <p className={styles.pinnedBannerDescription}>{metadata.description}</p>
        )}
        {categoryLabel && (
          <div className={styles.pinnedBannerFooter}>
            <span className={styles.categoryBadge}>{categoryLabel}</span>
          </div>
        )}
      </div>
    </Link>
  );
}

// ─── BlogCard ─────────────────────────────────────────────────────────────────

function CardContents({ item, categoryLabel }: { item: CardItem; categoryLabel?: string }) {
  return (
    <>
      <div className={styles.cardImageWrapper}>
        {item.coverImage ? (
          <img src={item.coverImage} alt={item.title} className={styles.cardImage} loading="lazy" />
        ) : (
          <div className={styles.imagePlaceholder} />
        )}
      </div>
      <div className={styles.cardBody}>
        <span className={styles.cardDate}>{formatDate(item.date)}</span>
        <h2 className={styles.cardTitle}>{item.title}</h2>
        {item.description && (
          <p className={styles.cardDescription}>{item.description}</p>
        )}
        <div className={styles.cardFooter}>
          <div className={styles.cardFooterBadges}>
            {categoryLabel && <span className={styles.categoryBadge}>{categoryLabel}</span>}
            {item.external && item.source && (
              <span className={styles.sourceBadge}>{item.source}</span>
            )}
          </div>
          {item.external && (
            <span className={styles.externalSource}>
              External Link
              <ExternalLinkIcon />
            </span>
          )}
        </div>
      </div>
    </>
  );
}

function BlogCard({ item }: { item: CardItem }) {
  const categoryLabel = item.category
    ? CATEGORIES.find((c) => c.value === item.category)?.label
    : undefined;

  if (item.external) {
    return (
      <a
        href={item.href}
        className={styles.card}
        target="_blank"
        rel="noopener noreferrer"
        onDragStart={(e) => e.preventDefault()}
      >
        <CardContents item={item} categoryLabel={categoryLabel} />
      </a>
    );
  }

  return (
    <Link to={item.href} className={styles.card} onDragStart={(e) => e.preventDefault()}>
      <CardContents item={item} categoryLabel={categoryLabel} />
    </Link>
  );
}

// ─── BlogListPage ─────────────────────────────────────────────────────────────

export default function BlogListPage({ items }: Props): ReactNode {
  const history = useHistory();
  const location = useLocation();
  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);

  const rawCategory = params.get('category');
  const activeCategory: CategoryValue =
    CATEGORIES.some((c) => c.value === rawCategory) ? (rawCategory as CategoryValue) : 'all';
  const currentPage = Math.max(1, Number(params.get('page')) || 1);

  const setActiveCategory = (category: CategoryValue) => {
    const next = new URLSearchParams();
    if (category !== 'all') next.set('category', category);
    history.push({ search: next.toString() ? `?${next}` : '' });
  };

  const setCurrentPage = (page: number) => {
    const next = new URLSearchParams(location.search);
    if (page > 1) next.set('page', String(page));
    else next.delete('page');
    history.push({ search: next.toString() ? `?${next}` : '' });
  };

  const [searchQuery, setSearchQuery] = useState('');

  const pinnedPost = useMemo(
    () => items.find(({ content }) => !!content.frontMatter.pinned) ?? null,
    [items],
  );

  const allExternalItems = useMemo(
    () => externalArticles.map(externalToCardItem),
    [],
  );

  const filteredItems = useMemo((): CardItem[] => {
    const q = searchQuery.trim().toLowerCase();
    const matchesQuery = (title: string) => !q || title.toLowerCase().includes(q);

    if (activeCategory === 'all') {
      const internal = items
        .filter(({ content }) => !content.frontMatter.pinned)
        .map(({ content }) => toCardItem(content))
        .filter((item) => matchesQuery(item.title));
      const external = allExternalItems.filter((item) => matchesQuery(item.title));
      return [...internal, ...external].sort(byDateDesc);
    }

    const internal = items
      .filter(({ content }) => getPostCategory(content.frontMatter) === activeCategory)
      .map(({ content }) => toCardItem(content))
      .filter((item) => matchesQuery(item.title));
    const external = allExternalItems
      .filter((item) => item.category === activeCategory && matchesQuery(item.title));
    return [...internal, ...external].sort(byDateDesc);
  }, [items, allExternalItems, activeCategory, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const gridItems = filteredItems.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const activeCategoryData = CATEGORIES.find((c) => c.value === activeCategory)!;

  return (
    <Layout
      title="Blog"
      description="News, updates, and stories from the OpenChoreo open-source community."
    >
      <div className={styles.root}>
        <main className={styles.main}>
          <div className={styles.container}>
            {/* Pinned banner — full width, above categories, only in "All" view.
                Intentionally shown regardless of the search query: the pinned post
                is a persistent editorial feature, not a search result. */}
            {activeCategory === 'all' && pinnedPost && (
              <PinnedBanner content={pinnedPost.content} />
            )}

            {/* Section heading */}
            <h1 className={styles.sectionTitle}>{activeCategoryData.sectionTitle}</h1>

            {/* Category filter pills */}
            <div className={styles.groupTabs}>
              {CATEGORIES.map(({ value, label }) => (
                <button
                  key={value}
                  className={`${styles.groupTab} ${activeCategory === value ? styles.groupTabActive : ''}`}
                  onClick={() => setActiveCategory(value)}
                  aria-pressed={activeCategory === value}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Search bar */}
            <div className={styles.searchWrap}>
              <SearchIcon />
              <input
                type="search"
                className={styles.searchInput}
                placeholder={activeCategoryData.searchPlaceholder}
                aria-label={activeCategoryData.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Grid */}
            {gridItems.length === 0 ? (
              <p className={styles.emptyState}>No posts match your filters.</p>
            ) : (
              <>
                <div className={styles.grid}>
                  {gridItems.map((item) => (
                    <BlogCard key={item.key} item={item} />
                  ))}
                </div>
                <div className={styles.paginationWrap}>
                  <Pagination
                    page={safePage}
                    totalPages={totalPages}
                    totalItems={filteredItems.length}
                    pageSize={PAGE_SIZE}
                    onPageChange={setCurrentPage}
                    itemLabel="articles"
                  />
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </Layout>
  );
}
