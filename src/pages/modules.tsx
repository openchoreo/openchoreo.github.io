import React, { useState } from 'react';
import type { ReactNode } from 'react';
import Layout from '@theme/Layout';

import { PluginCard } from '@site/src/components/PluginCard/PluginCard';
import styles from './marketplace.module.css';

import pluginsData from '@site/src/data/marketplace-plugins.json';
import SectionHeader from '../components/common/SectionHeader';

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

const categories = [
  'All',
  'Default',
  'AI',
  'API Gateway',
  'CI',
  'GitOps',
  'Observability',
];

export default function Marketplace(): ReactNode {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const filteredPlugins = plugins
    .filter((plugin) => {
      const s = searchQuery.toLowerCase();
      const matchesSearch =
        plugin.name.toLowerCase().includes(s) ||
        plugin.description.toLowerCase().includes(s) ||
        plugin.tags.some((t) => t.toLowerCase().includes(s));

      const matchesCategory =
        selectedCategory === 'All' ||
        plugin.category === selectedCategory ||
        (selectedCategory === 'Default' && plugin.default);

      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <Layout
      title="OpenChoreo Modules Catalog"
      description="Browse and install modules for your Internal Developer Platform."
    >
      <div className={styles.root}>
        <main className="container margin-vert--xl">

          {/* HERO */}
          <section className="margin-bottom--lg cTopSection">

 <SectionHeader title="OpenChoreo Modules Catalog">
          <p>
           Extend your Internal Developer Platform with <br/>ready-made modules from the
              community and partners.
          </p>
        </SectionHeader>

          <div className={styles.buttonGroup}>
              <button
                className={styles.cButton}
                onClick={() => {
                  document.getElementById('modules-catalog')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Browse modules
              </button>
              <a
                href="/docs/platform-engineer-guide/modules/building-a-module"
                className={styles.cOutlineButton}
              >
                Build a module
              </a>
            </div>
          </section>

          <div className={styles.cTopSection}></div>

          {/* FILTERS */}
          <section id="modules-catalog" className="margin-bottom--md">
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
                    placeholder="Search modules..."
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
            {filteredPlugins.length === 1 ? 'module' : 'modules'} found
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
