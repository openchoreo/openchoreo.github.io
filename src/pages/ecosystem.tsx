import React, { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import Layout from '@theme/Layout';

import { PluginCard } from '@site/src/components/PluginCard/PluginCard';
import pluginsData from '@site/src/data/marketplace-plugins.json';
import styles from './ecosystem.module.css';

interface Plugin {
  id: string;
  group: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  logoUrl?: string;
  author: string;
  sourceUrl?: string;
  default?: boolean;
  released?: boolean;
}

const plugins: Plugin[] = pluginsData as Plugin[];

const GROUPS: { value: string; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'module', label: 'Modules' },
  { value: 'integration', label: 'Integrations' },
  { value: 'agent', label: 'Agents' },
  { value: 'skill', label: 'Skills' },
  { value: 'component-type', label: 'Component Types' },
  { value: 'workflow', label: 'Workflows' },
];

const PAGE_SIZE = 12;

export default function Ecosystem(): ReactNode {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<'name-asc' | 'name-desc'>('name-asc');
  const [currentPage, setCurrentPage] = useState(1);

  const matchesSearch = (p: Plugin, q: string) => {
    if (!q) return true;
    const s = q.toLowerCase();
    return (
      p.name.toLowerCase().includes(s) ||
      p.description.toLowerCase().includes(s) ||
      p.tags.some((t) => t.toLowerCase().includes(s))
    );
  };

  const matchesGroup = (p: Plugin) =>
    selectedGroup === 'all' || p.group === selectedGroup;

  const matchesCategory = (p: Plugin) =>
    selectedCategories.size === 0 || selectedCategories.has(p.category);

  const filteredPlugins = useMemo(() => {
    const result = plugins
      .filter((p) => matchesSearch(p, searchQuery))
      .filter(matchesGroup)
      .filter(matchesCategory);

    result.sort((a, b) => {
      if (a.released !== b.released) return a.released ? -1 : 1;
      return sortBy === 'name-asc'
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name);
    });

    return result;
  }, [searchQuery, selectedGroup, selectedCategories, sortBy]);

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    plugins
      .filter((p) => matchesSearch(p, searchQuery))
      .filter(matchesGroup)
      .forEach((p) => {
        counts.set(p.category, (counts.get(p.category) ?? 0) + 1);
      });
    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [searchQuery, selectedGroup]);

  const totalPages = Math.max(1, Math.ceil(filteredPlugins.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paginated = filteredPlugins.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );
  const startItem = filteredPlugins.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const endItem = Math.min(safePage * PAGE_SIZE, filteredPlugins.length);

  const toggleCategory = (name: string) => {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
    setCurrentPage(1);
  };

  const onGroupSelect = (g: string) => {
    setSelectedGroup(g);
    setCurrentPage(1);
  };

  const onSearchChange = (v: string) => {
    setSearchQuery(v);
    setCurrentPage(1);
  };

  return (
    <Layout
      title="OpenChoreo Ecosystem"
      description="Discover modules, integrations, agents, skills, component types, and workflows to extend OpenChoreo"
    >
      <div className={styles.root}>
        {/* HERO */}
        <section className={styles.hero}>
          <div className={styles.container}>
            <h1 className={styles.heroTitle}>OpenChoreo Ecosystem</h1>
            <p className={styles.heroSubtitle}>
              Discover modules, integrations, agents, skills, component types, and workflows to extend OpenChoreo
            </p>
            <div className={styles.searchWrap}>
              <svg
                className={styles.searchIcon}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                />
              </svg>
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Search the Ecosystem (e.g., AI, gateway, observability)"
                aria-label="Search the Ecosystem"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
              />
            </div>
          </div>
        </section>

        {/* MAIN */}
        <main className={styles.main}>
          <div className={styles.container}>
            <div className={styles.layout}>
              {/* SIDEBAR */}
              <aside className={styles.sidebar}>
                <div className={styles.sidebarCard}>
                  <h3 className={styles.sidebarHeading}>Categories</h3>
                  <div className={styles.categoryList}>
                    {categoryCounts.length === 0 && (
                      <p className={styles.emptyHint}>No matching categories</p>
                    )}
                    {categoryCounts.map(({ name, count }) => (
                      <label key={name} className={styles.categoryItem}>
                        <span className={styles.categoryItemLeft}>
                          <input
                            type="checkbox"
                            className={styles.checkbox}
                            checked={selectedCategories.has(name)}
                            onChange={() => toggleCategory(name)}
                          />
                          <span className={styles.categoryName}>{name}</span>
                        </span>
                        <span className={styles.categoryCount}>{count}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </aside>

              {/* CONTENT */}
              <div className={styles.content}>
                {/* GROUP TABS */}
                <div className={styles.groupTabs}>
                  {GROUPS.map((g) => (
                    <button
                      key={g.value}
                      onClick={() => onGroupSelect(g.value)}
                      className={
                        selectedGroup === g.value
                          ? `${styles.groupTab} ${styles.groupTabActive}`
                          : styles.groupTab
                      }
                    >
                      {g.label}
                    </button>
                  ))}
                </div>

                {/* TOOLBAR */}
                <div className={styles.toolbar}>
                  <span className={styles.resultCount}>
                    Showing {filteredPlugins.length}{' '}
                    {filteredPlugins.length === 1 ? 'item' : 'items'}
                  </span>
                  <div className={styles.sortWrap}>
                    <label className={styles.sortLabel} htmlFor="sort-select">
                      Sort by:
                    </label>
                    <select
                      id="sort-select"
                      className={styles.sortSelect}
                      value={sortBy}
                      onChange={(e) =>
                        setSortBy(e.target.value as 'name-asc' | 'name-desc')
                      }
                    >
                      <option value="name-asc">Name (A → Z)</option>
                      <option value="name-desc">Name (Z → A)</option>
                    </select>
                  </div>
                </div>

                {/* GRID */}
                {paginated.length === 0 ? (
                  <div className={styles.emptyState}>
                    <p>No items match your filters.</p>
                  </div>
                ) : (
                  <div className={styles.grid}>
                    {paginated.map((plugin) => (
                      <PluginCard key={plugin.id} plugin={plugin} />
                    ))}
                  </div>
                )}

                {/* PAGINATION */}
                {totalPages > 1 && (
                  <div className={styles.pagination}>
                    <p className={styles.paginationInfo}>
                      Showing <strong>{startItem}</strong> to{' '}
                      <strong>{endItem}</strong> of{' '}
                      <strong>{filteredPlugins.length}</strong> items
                    </p>
                    <div className={styles.paginationControls}>
                      <button
                        className={styles.pageButton}
                        disabled={safePage === 1}
                        onClick={() => setCurrentPage(safePage - 1)}
                      >
                        Previous
                      </button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                        (n) => (
                          <button
                            key={n}
                            onClick={() => setCurrentPage(n)}
                            className={
                              n === safePage
                                ? `${styles.pageNumber} ${styles.pageNumberActive}`
                                : styles.pageNumber
                            }
                          >
                            {n}
                          </button>
                        ),
                      )}
                      <button
                        className={styles.pageButton}
                        disabled={safePage === totalPages}
                        onClick={() => setCurrentPage(safePage + 1)}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </Layout>
  );
}
