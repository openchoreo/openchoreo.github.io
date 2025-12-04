import React, { useState } from 'react';
import type { ReactNode } from 'react';
import Layout from '@theme/Layout';

import { PluginCard } from '@site/src/components/PluginCard/PluginCard';
import styles from './marketplace.module.css';

import pluginsData from '@site/src/data/marketplace-plugins.json';

interface Plugin {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  icon: string;
  logoUrl?: string;
  author: string;
  stars: number;
  repo?: string; // NEW
}

const plugins: Plugin[] = pluginsData as Plugin[];

const categories = [
  'All',
  'Core',
  'CI/CD',
  'Infrastructure',
  'Monitoring',
  'Documentation',
  'Security',
  'API'
];

export default function Marketplace(): ReactNode {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredPlugins = plugins.filter((plugin) => {
    const s = searchQuery.toLowerCase();
    const matchesSearch =
      plugin.name.toLowerCase().includes(s) ||
      plugin.description.toLowerCase().includes(s) ||
      plugin.tags.some((t) => t.toLowerCase().includes(s));

    const matchesCategory =
      selectedCategory === 'All' || plugin.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <Layout
      title="OpenChoreo Modules Marketplace"
      description="Browse and install modules for your Internal Developer Platform."
    >
      <div className={styles.root}>
        <main className="container margin-vert--xl">

          {/* HERO */}
          <section className="margin-bottom--lg">
            <h1 className="margin-bottom--sm">
              OpenChoreo Modules Marketplace
            </h1>
            <p className={`margin-bottom--md ${styles.subtitle}`}>
              Extend your Internal Developer Platform with ready-made modules from the
              community and partners.
            </p>
            <div className={styles.buttonGroup}>
              <button className="button button--primary button--lg">
                Browse modules
              </button>
              <button className="button button--secondary button--lg">
                Build a module
              </button>
            </div>
          </section>

          {/* FILTERS */}
          <section className="margin-bottom--md">
            <div className={`row ${styles.filtersRow}`}>
              <div className="col col--8">
                <div className={styles.categories}>
                  {categories.map((c) => (
                    <button
                      key={c}
                      onClick={() => setSelectedCategory(c)}
                      className={
                        selectedCategory === c
                          ? 'button button--primary button--sm'
                          : 'button button--secondary button--outline button--sm'
                      }
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div className="col col--4">
                <div className={styles.search}>
                  <span className={styles.searchIcon}>🔍</span>
                  <input
                    type="text"
                    placeholder="Search plugins..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={styles.searchInput}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* COUNT */}
          <p className={`margin-bottom--sm ${styles.resultCount}`}>
            {filteredPlugins.length}{' '}
            {filteredPlugins.length === 1 ? 'plugin' : 'plugins'} found
          </p>

          {/* GRID */}
          <section className="row">
            {filteredPlugins.map((plugin) => (
              <div key={plugin.id} className="col col--4 margin-bottom--md">
                <PluginCard plugin={plugin} />
              </div>
            ))}
          </section>

        </main>
      </div>
    </Layout>
  );
}
