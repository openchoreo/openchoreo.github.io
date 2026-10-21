import React, { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import { useHistory, useLocation } from '@docusaurus/router';
import { usePluginData } from '@docusaurus/useGlobalData';
import BlogListPageStructuredData from '@theme/BlogListPage/StructuredData';
import BlogSidebarMobile from '@theme/BlogSidebar/Mobile';
import type { Props as BlogListPageProps } from '@theme/BlogListPage';
import styles from './styles.module.css';
import externalArticles from '@site/src/data/externalArticles';
import type { ExternalArticle } from '@site/src/data/externalArticles';

// The post list is paginated with real static routes: /blog/ is page 1 and
// plugins/docusaurus-plugin-blog-pagination adds /blog/page/2/, /blog/page/3/,
// ... Each page is server-rendered and linked with <a href>, so crawlers reach
// every post. (Client-side pagination buttons are never followed by search
// engines.) Every route receives all posts; this component slices the
// combined post + external-article list by page.

// ─── Types ───────────────────────────────────────────────────────────────────

type CategoryValue = 'all' | 'announcements' | 'technology' | 'community';
type PostCategory = Exclude<CategoryValue, 'all'>;

const CATEGORIES: {
  value: CategoryValue;
  label: string;
  sectionTitle: string;
  searchPlaceholder: string;
}[] = [
  { value: 'all',           label: 'All',           sectionTitle: 'Latest posts',  searchPlaceholder: 'Search all articles...' },
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
  // Only on /blog/ (the blog plugin's route).
  metadata?: BlogListPageProps['metadata'];
  // On every page; the pagination plugin passes the same post list.
  sidebar?: BlogListPageProps['sidebar'];
  // Only on /blog/page/N/ (the pagination plugin's routes).
  page?: number;
  items: readonly { content: BlogPostContent }[];
}

interface PaginationData {
  postsPerPage: number;
  totalPages: number;
  blogDescription: string;
}

// One row in the post list: an on-site post or an external article.
interface ListItem {
  key: string;
  href: string;
  external: boolean;
  title: string;
  description: string;
  date: string;
  coverImage?: string;
  category?: PostCategory;
  authors: string[];
  readingTime?: number;
  source?: string;
  featured: boolean;
  pinned: boolean;
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

function getCategoryLabel(category?: PostCategory): string | undefined {
  return category ? CATEGORIES.find((c) => c.value === category)?.label : undefined;
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

function toListItem(content: BlogPostContent): ListItem {
  const { metadata, frontMatter } = content;
  return {
    key: metadata.permalink,
    href: metadata.permalink,
    external: false,
    title: metadata.title,
    description: metadata.description,
    date: metadata.date,
    coverImage: getCoverImage(content),
    category: getPostCategory(frontMatter),
    authors: metadata.authors.map((a) => a.name).filter((n): n is string => !!n),
    readingTime: metadata.readingTime,
    featured: !!frontMatter.featured,
    pinned: !!frontMatter.pinned,
  };
}

function externalToListItem(article: ExternalArticle): ListItem {
  return {
    key: article.url,
    href: article.url,
    external: true,
    title: article.title,
    description: article.description,
    date: article.date,
    coverImage: article.image,
    category: article.category,
    authors: [],
    source: article.source,
    featured: false,
    pinned: false,
  };
}

function byDateDesc(a: ListItem, b: ListItem): number {
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

// ─── Shared pieces ────────────────────────────────────────────────────────────
// Each item has exactly one link, on its title, so the anchor text is the title
// alone. handleItemClick makes the rest of the card or row clickable too, without
// an overlay, so its text stays selectable.

function handleItemClick(e: React.MouseEvent<HTMLElement>) {
  // Real links handle their own clicks.
  if ((e.target as HTMLElement).closest('a')) return;
  // Don't navigate when the click ends a text selection.
  if (window.getSelection()?.toString()) return;
  // Follow the title link itself, so routing, trailing slashes and new-tab
  // behaviour match a click on the title.
  const link = e.currentTarget.querySelector<HTMLAnchorElement>('a');
  if (!link) return;
  if (e.metaKey || e.ctrlKey) {
    window.open(link.href, '_blank', 'noopener,noreferrer');
  } else {
    link.click();
  }
}

function TitleLink({ item }: { item: ListItem }) {
  if (item.external) {
    return (
      <a href={item.href} className={styles.titleLink} target="_blank" rel="noopener noreferrer">
        {item.title}
        <ExternalLinkIcon />
      </a>
    );
  }
  return (
    <Link to={item.href} className={styles.titleLink}>
      {item.title}
    </Link>
  );
}

// WebP thumbnails are generated next to each raster cover image after a
// production build (plugins/docusaurus-plugin-blog-thumbnails). They don't exist
// in `npm start`, so the dev server uses the original image.
const THUMBNAIL_WIDTHS = [480, 960];

function thumbnailSrcSet(src: string): string | undefined {
  // Only site-hosted images have generated thumbnails.
  if (process.env.NODE_ENV !== 'production' || !src.startsWith('/')) return undefined;
  if (!/\.(png|jpe?g|webp)$/i.test(src)) return undefined;
  return THUMBNAIL_WIDTHS.map((w) => `${src}.w${w}.webp ${w}w`).join(', ');
}

function CoverImage({
  src,
  className,
  sizes,
  eager,
}: {
  src?: string;
  className: string;
  sizes: string;
  eager?: boolean;
}) {
  if (!src) return <div className={styles.imagePlaceholder} />;
  const srcSet = thumbnailSrcSet(src);
  return (
    <img
      src={src}
      srcSet={srcSet}
      sizes={srcSet ? sizes : undefined}
      alt=""
      className={className}
      loading={eager ? 'eager' : 'lazy'}
    />
  );
}

function PostMeta({ item }: { item: ListItem }) {
  const parts = [
    item.external ? item.source : item.authors.join(', ') || undefined,
    formatDate(item.date),
    item.readingTime ? `${Math.max(1, Math.ceil(item.readingTime))} min read` : undefined,
  ].filter(Boolean);
  return <p className={styles.postMeta}>{parts.join(' · ')}</p>;
}

// ─── PinnedBanner ─────────────────────────────────────────────────────────────

function PinnedBanner({ item }: { item: ListItem }) {
  const categoryLabel = getCategoryLabel(item.category);
  return (
    <article className={styles.pinnedBanner} onClick={handleItemClick}>
      <div className={styles.pinnedBannerImageWrapper}>
        <CoverImage
          src={item.coverImage}
          className={styles.pinnedBannerImage}
          sizes="(max-width: 768px) 100vw, 460px"
          eager
        />
      </div>
      <div className={styles.pinnedBannerBody}>
        <h2 className={styles.pinnedBannerTitle}>
          <TitleLink item={item} />
        </h2>
        {item.description && <p className={styles.pinnedBannerDescription}>{item.description}</p>}
        <div className={styles.postRowFooter}>
          <PostMeta item={item} />
          {categoryLabel && <span className={styles.categoryBadge}>{categoryLabel}</span>}
        </div>
      </div>
    </article>
  );
}

// ─── FeaturedCard ─────────────────────────────────────────────────────────────

function FeaturedCard({ item }: { item: ListItem }) {
  return (
    <article className={styles.card} onClick={handleItemClick}>
      <div className={styles.cardImageWrapper}>
        <CoverImage
          src={item.coverImage}
          className={styles.cardImage}
          sizes="(max-width: 640px) 100vw, (max-width: 996px) 45vw, 290px"
        />
      </div>
      <div className={styles.cardBody}>
        <h3 className={styles.cardTitle}>
          <TitleLink item={item} />
        </h3>
        {item.description && <p className={styles.cardDescription}>{item.description}</p>}
        <PostMeta item={item} />
      </div>
    </article>
  );
}

// ─── PostRow (post list) ──────────────────────────────────────────────────────

function PostRow({ item }: { item: ListItem }) {
  const categoryLabel = getCategoryLabel(item.category);
  return (
    <li className={styles.postRow} onClick={handleItemClick}>
      <div className={styles.postRowBody}>
        <h3 className={styles.postRowTitle}>
          <TitleLink item={item} />
        </h3>
        {item.description && <p className={styles.postRowDescription}>{item.description}</p>}
        <div className={styles.postRowFooter}>
          <PostMeta item={item} />
          {categoryLabel && <span className={styles.categoryBadge}>{categoryLabel}</span>}
          {item.external && <span className={styles.sourceBadge}>External</span>}
        </div>
      </div>
      <div className={styles.postRowImageWrapper}>
        <CoverImage
          src={item.coverImage}
          className={styles.postRowImage}
          sizes="(max-width: 996px) 200px, 280px"
        />
      </div>
    </li>
  );
}

// ─── PageNav ──────────────────────────────────────────────────────────────────

function pagePath(page: number): string {
  return page === 1 ? '/blog/' : `/blog/page/${page}/`;
}

function PageNav({ page, totalPages }: { page: number; totalPages: number }) {
  if (totalPages <= 1) return null;
  return (
    <nav className={styles.pageNav} aria-label="Blog pages">
      {page > 1 ? (
        <Link to={pagePath(page - 1)} className={styles.pageNavStep} rel="prev">
          ← Newer posts
        </Link>
      ) : (
        <span />
      )}
      <ol className={styles.pageNavNumbers}>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
          <li key={n}>
            {n === page ? (
              <span
                className={`${styles.pageNavNumber} ${styles.pageNavNumberActive}`}
                aria-current="page"
              >
                {n}
              </span>
            ) : (
              <Link to={pagePath(n)} className={styles.pageNavNumber}>
                {n}
              </Link>
            )}
          </li>
        ))}
      </ol>
      {page < totalPages ? (
        <Link to={pagePath(page + 1)} className={styles.pageNavStep} rel="next">
          Older posts →
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}

// ─── BlogListPage ─────────────────────────────────────────────────────────────

export default function BlogListPage(props: Props): ReactNode {
  const { items } = props;
  const page = props.page ?? 1;
  const { postsPerPage, totalPages, blogDescription } = usePluginData(
    'docusaurus-plugin-blog-pagination',
  ) as PaginationData;
  const history = useHistory();
  const location = useLocation();
  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);

  const rawCategory = params.get('category');
  const activeCategory: CategoryValue = CATEGORIES.some((c) => c.value === rawCategory)
    ? (rawCategory as CategoryValue)
    : 'all';

  const setActiveCategory = (category: CategoryValue) => {
    const next = new URLSearchParams();
    if (category !== 'all') next.set('category', category);
    history.push({ search: next.toString() ? `?${next}` : '' });
  };

  const [searchQuery, setSearchQuery] = useState('');

  const posts = useMemo(() => items.map(({ content }) => toListItem(content)), [items]);
  const pinnedPost = useMemo(() => posts.find((p) => p.pinned) ?? null, [posts]);
  const featuredPosts = useMemo(
    () => posts.filter((p) => p.featured && !p.pinned).sort(byDateDesc),
    [posts],
  );
  const allItems = useMemo(() => [...posts, ...externalArticles.map(externalToListItem)], [posts]);

  const q = searchQuery.trim().toLowerCase();
  const isFiltering = activeCategory !== 'all' || q !== '';

  // The unfiltered, paginated stream: everything except the pinned post.
  const streamItems = useMemo(
    () => allItems.filter((item) => !item.pinned).sort(byDateDesc),
    [allItems],
  );

  // The plugin created the routes from its own count; never ship pages that
  // disagree with what this component renders.
  const computedTotalPages = Math.max(1, Math.ceil(streamItems.length / postsPerPage));
  if (computedTotalPages !== totalPages) {
    throw new Error(
      `[BlogListPage] Expected ${totalPages} blog pages from docusaurus-plugin-blog-pagination ` +
        `but the list has ${streamItems.length} items (${computedTotalPages} pages). ` +
        'Check the external article count in plugins/docusaurus-plugin-blog-pagination.',
    );
  }

  // Filtering searches every post and article, unpaginated.
  const listItems = useMemo((): ListItem[] => {
    if (!isFiltering) {
      return streamItems.slice((page - 1) * postsPerPage, page * postsPerPage);
    }
    return allItems
      .filter((item) => activeCategory === 'all' || item.category === activeCategory)
      .filter((item) => !q || item.title.toLowerCase().includes(q))
      .sort(byDateDesc);
  }, [isFiltering, streamItems, allItems, activeCategory, q, page, postsPerPage]);

  const activeCategoryData = CATEGORIES.find((c) => c.value === activeCategory)!;
  const isFirstPage = page === 1;

  return (
    <Layout
      title={
        isFirstPage
          ? 'Platform Engineering and IDP Blog'
          : `Platform Engineering and IDP Blog, page ${page}`
      }
      description={
        isFirstPage ? blogDescription : `${blogDescription} Page ${page} of ${totalPages}.`
      }
    >
      {props.metadata && (
        <BlogListPageStructuredData {...(props as unknown as BlogListPageProps)} />
      )}
      {/* The post list in the mobile navbar menu, as on the post pages. It
          renders nothing in the page, so the desktop layout has no sidebar. */}
      {props.sidebar && props.sidebar.items.length > 0 && (
        <BlogSidebarMobile sidebar={props.sidebar} />
      )}
      {/* Same outer container and vertical spacing as BlogLayout on the post
          pages; the list itself is centred at a readable width. */}
      <div className="container margin-vert--lg">
        <main className={styles.content}>
            <header className={styles.pageHeader}>
              <h1 className={styles.pageTitle}>OpenChoreo Blog</h1>
              <p className={styles.pageDescription}>{blogDescription}</p>
            </header>

            {/* Pinned post and featured articles are editorial picks, shown only on
                the first page in the unfiltered view. */}
            {isFirstPage && !isFiltering && pinnedPost && <PinnedBanner item={pinnedPost} />}

            {isFirstPage && !isFiltering && featuredPosts.length > 0 && (
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Featured articles</h2>
                <div className={styles.grid}>
                  {featuredPosts.map((item) => (
                    <FeaturedCard key={item.key} item={item} />
                  ))}
                </div>
              </section>
            )}

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>
                {activeCategoryData.sectionTitle}
                {!isFirstPage && !isFiltering && (
                  <span className={styles.sectionTitlePage}>
                    {' '}
                    · page {page} of {totalPages}
                  </span>
                )}
              </h2>

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

              {listItems.length === 0 ? (
                <p className={styles.emptyState}>No posts match your filters.</p>
              ) : (
                <ul className={styles.postList}>
                  {listItems.map((item) => (
                    <PostRow key={item.key} item={item} />
                  ))}
                </ul>
              )}

              {!isFiltering && <PageNav page={page} totalPages={totalPages} />}
            </section>
        </main>
      </div>
    </Layout>
  );
}
