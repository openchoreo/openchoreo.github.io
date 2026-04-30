import React, { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import { useLocation } from '@docusaurus/router';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import useBaseUrl from '@docusaurus/useBaseUrl';
import pluginsData from '@site/src/data/marketplace-plugins.json';
import styles from './item.module.css';

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

const GROUP_LABELS: Record<string, string> = {
  module: 'Module',
  integration: 'Integration',
  agent: 'Agent',
  skill: 'Skill',
  'component-type': 'Component Type',
  workflow: 'Workflow',
};

const GROUP_BADGE_CLASSES: Record<string, string> = {
  module: styles.groupModule,
  integration: styles.groupIntegration,
  agent: styles.groupAgent,
  skill: styles.groupSkill,
  'component-type': styles.groupComponentType,
  workflow: styles.groupWorkflow,
};

interface Section {
  id: string;
  title: string;
  content: string;
}

const SKIP_SECTIONS = new Set(['table of contents', 'contents', 'toc']);

function parseReadme(markdown: string): { intro: string; sections: Section[] } {
  const lines = markdown.split('\n');
  const sections: Section[] = [];
  let introLines: string[] = [];
  let inIntro = true;
  let currentTitle = '';
  let currentLines: string[] = [];

  const flushSection = () => {
    if (!currentTitle) return;
    const content = currentLines.join('\n').trim();
    if (!SKIP_SECTIONS.has(currentTitle.toLowerCase())) {
      sections.push({
        id: currentTitle.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        title: currentTitle,
        content,
      });
    }
  };

  for (const line of lines) {
    if (line.startsWith('## ')) {
      if (inIntro) {
        inIntro = false;
      } else {
        flushSection();
      }
      currentTitle = line.slice(3).trim();
      currentLines = [];
    } else if (inIntro) {
      if (!line.startsWith('# ') && !line.startsWith('---')) {
        introLines.push(line);
      }
    } else {
      currentLines.push(line);
    }
  }
  flushSection();

  return { intro: introLines.join('\n').trim(), sections };
}

function toRawReadmeUrl(sourceUrl: string): string | null {
  if (!sourceUrl || !sourceUrl.includes('github.com') || !sourceUrl.includes('/tree/')) {
    return null;
  }
  return (
    sourceUrl
      .replace('https://github.com/', 'https://raw.githubusercontent.com/')
      .replace('/tree/', '/') + '/README.md'
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard API not available
    }
  };

  return (
    <button onClick={handleCopy} className={styles.copyBtn} aria-label="Copy code" title="Copy">
      {copied ? (
        <svg className={styles.copyIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className={styles.copyIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      )}
    </button>
  );
}

function resolveImageSrc(src: string, rawBaseUrl: string): string {
  if (!src || /^(https?:)?\/\//i.test(src)) return src;
  return rawBaseUrl + src.replace(/^\.\//, '');
}

function createMdComponents(rawBaseUrl: string) {
  return {
    pre({ children }: { children?: ReactNode }) {
      return <>{children}</>;
    },
    code({ className, children }: { className?: string; children?: ReactNode }) {
      const text = String(children ?? '').replace(/\n$/, '');
      const isBlock = Boolean(className) || text.includes('\n');
      if (isBlock) {
        return (
          <div className={styles.codeBlockWrap}>
            <pre className={styles.codeBlock}>
              <code className={className}>{children}</code>
            </pre>
            <CopyButton text={text} />
          </div>
        );
      }
      return <code className={styles.inlineCode}>{children}</code>;
    },
    img({ src, alt }: { src?: string; alt?: string }) {
      const resolvedSrc = src ? resolveImageSrc(src, rawBaseUrl) : undefined;
      return (
        <img
          src={resolvedSrc}
          alt={alt ?? ''}
          className={styles.mdImage}
          loading="lazy"
        />
      );
    },
  };
}

export default function EcosystemItem(): ReactNode {
  const location = useLocation();
  const id = useMemo(
    () => new URLSearchParams(location.search).get('id'),
    [location.search],
  );
  const plugin = plugins.find((p) => p.id === id);
  const defaultLogo = useBaseUrl('/img/openchoreo-logo.svg');
  const [logoFailed, setLogoFailed] = useState(false);

  const [readmeRaw, setReadmeRaw] = useState<string | null>(null);
  const [readmeLoading, setReadmeLoading] = useState(false);
  const [readmeError, setReadmeError] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  const rawUrl = plugin?.sourceUrl ? toRawReadmeUrl(plugin.sourceUrl) : null;

  useEffect(() => {
    setReadmeRaw(null);
    setReadmeError(false);
    setActiveTab(0);
    setLogoFailed(false);
    if (!rawUrl) return;
    setReadmeLoading(true);
    fetch(rawUrl)
      .then((r) => (r.ok ? r.text() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then(setReadmeRaw)
      .catch(() => setReadmeError(true))
      .finally(() => setReadmeLoading(false));
  }, [rawUrl]);

  const parsed = useMemo(
    () => (readmeRaw ? parseReadme(readmeRaw) : { intro: '', sections: [] }),
    [readmeRaw],
  );

  const logoSrc = plugin?.logoUrl && !logoFailed ? plugin.logoUrl : defaultLogo;
  const groupLabel = plugin ? (GROUP_LABELS[plugin.group] ?? plugin.group) : '';
  const groupBadgeClass = plugin
    ? (GROUP_BADGE_CLASSES[plugin.group] ?? styles.groupModule)
    : styles.groupModule;
  const isGitHub = Boolean(plugin?.sourceUrl?.includes('github.com'));

  // Base URL for resolving relative image paths in the README
  const rawBaseUrl = rawUrl ? rawUrl.slice(0, rawUrl.lastIndexOf('/') + 1) : '';
  const mdComponents = useMemo(() => createMdComponents(rawBaseUrl), [rawBaseUrl]);

  if (!plugin) {
    return (
      <Layout title="Not Found">
        <div className={styles.notFound}>
          <p>Item not found.</p>
          <Link to="/ecosystem/">← Back to Ecosystem</Link>
        </div>
      </Layout>
    );
  }

  const hasTabs = parsed.sections.length > 1;
  const activeSection = parsed.sections[activeTab] ?? null;

  return (
    <Layout title={plugin.name} description={plugin.description}>
      <div className={styles.root}>
        {/* Breadcrumb */}
        <nav className={styles.breadcrumbBar} aria-label="Breadcrumb">
          <div className={styles.container}>
            <ol className={styles.breadcrumbList}>
              <li>
                <Link to="/ecosystem/" className={styles.breadcrumbLink}>
                  Ecosystem
                </Link>
              </li>
              <li aria-hidden>
                <svg className={styles.breadcrumbChevron} fill="currentColor" viewBox="0 0 20 20">
                  <path
                    clipRule="evenodd"
                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                    fillRule="evenodd"
                  />
                </svg>
              </li>
              <li>
                <span className={styles.breadcrumbCurrent} aria-current="page">
                  {plugin.name}
                </span>
              </li>
            </ol>
          </div>
        </nav>

        <div className={styles.container}>
          <main className={styles.main}>
            <div className={styles.card}>
            {/* Item Header */}
            <section className={styles.header}>
              <div className={styles.headerLeft}>
                <div className={styles.logoWrap}>
                  <img
                    src={logoSrc}
                    alt={`${plugin.name} logo`}
                    className={styles.logo}
                    onError={() => setLogoFailed(true)}
                  />
                </div>
                <div className={styles.headerInfo}>
                  <h1 className={styles.title}>{plugin.name}</h1>
                  <div className={styles.badgeRow}>
                    <span className={`${styles.groupBadge} ${groupBadgeClass}`}>
                      {groupLabel}
                    </span>
                    <span className={styles.categoryBadge}>{plugin.category}</span>
                  </div>
                  <div className={styles.tagRow}>
                    {plugin.tags.map((tag) => (
                      <span key={tag} className={styles.tag}>
                        #{tag}
                      </span>
                    ))}
                  </div>
                  <p className={styles.description}>{plugin.description}</p>
                </div>
              </div>

              {plugin.sourceUrl && (
                <div className={styles.headerActions}>
                  <a
                    href={plugin.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.externalButton}
                  >
                    {isGitHub ? 'View on GitHub' : 'View Documentation'}
                    <svg
                      className={styles.externalIcon}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                  </a>
                </div>
              )}
            </section>

            {/* Loading state */}
            {readmeLoading && (
              <div className={styles.stateBox}>
                <p className={styles.stateText}>Loading documentation…</p>
              </div>
            )}

            {/* README sections */}
            {!readmeLoading && readmeRaw && (
              <>
                {/* Intro (content before first H2) */}
                {parsed.intro && (
                  <div className={styles.introCard}>
                    <div className={styles.markdownContent}>
                      <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents as any}>
                        {parsed.intro}
                      </ReactMarkdown>
                    </div>
                  </div>
                )}

                {parsed.sections.length > 0 && (
                  <>
                    {/* Tab bar */}
                    {hasTabs && (
                      <div className={styles.tabBar}>
                        <nav className={styles.tabList} aria-label="Section tabs">
                          {parsed.sections.map((section, idx) => (
                            <button
                              key={section.id}
                              className={
                                idx === activeTab
                                  ? `${styles.tab} ${styles.tabActive}`
                                  : styles.tab
                              }
                              onClick={() => setActiveTab(idx)}
                            >
                              {section.title}
                            </button>
                          ))}
                        </nav>
                      </div>
                    )}

                    {/* Content card */}
                    {activeSection && (
                      <div className={styles.contentCard}>
                        {!hasTabs && (
                          <h2 className={styles.singleSectionTitle}>
                            {activeSection.title}
                          </h2>
                        )}
                        <div className={styles.markdownContent}>
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={mdComponents as any}
                          >
                            {activeSection.content}
                          </ReactMarkdown>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </>
            )}

            {/* Error fetching README */}
            {!readmeLoading && readmeError && (
              <div className={styles.stateBox}>
                <p className={styles.stateText}>Could not load documentation.</p>
                {plugin.sourceUrl && (
                  <a
                    href={plugin.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.stateLink}
                  >
                    View source on GitHub →
                  </a>
                )}
              </div>
            )}

            {/* No GitHub README (docs link or no sourceUrl) */}
            {!readmeLoading && !rawUrl && !readmeError && (
              <div className={styles.stateBox}>
                <p className={styles.stateText}>
                  {plugin.sourceUrl
                    ? 'Documentation for this item is available externally.'
                    : 'No documentation available yet.'}
                </p>
                {plugin.sourceUrl && (
                  <a
                    href={plugin.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.stateLink}
                  >
                    View Documentation →
                  </a>
                )}
              </div>
            )}
            </div>{/* end .card */}
          </main>
        </div>
      </div>
    </Layout>
  );
}
