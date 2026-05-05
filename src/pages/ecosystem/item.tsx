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

function stripFrontmatter(markdown: string): string {
  const lines = markdown.split('\n');
  if (lines[0]?.trim() !== '---') return markdown;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === '---') {
      return lines.slice(i + 1).join('\n').replace(/^\n+/, '');
    }
  }
  return markdown;
}

function parseReadme(markdown: string): { intro: string; sections: Section[] } {
  const lines = stripFrontmatter(markdown).split('\n');
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

const DOC_FILENAMES: Record<string, string> = {
  skill: 'SKILL.md',
};

function toRawDocUrl(sourceUrl: string, group: string): string | null {
  if (!sourceUrl || !sourceUrl.includes('github.com') || !sourceUrl.includes('/tree/')) {
    return null;
  }
  const filename = DOC_FILENAMES[group] ?? 'README.md';
  return (
    sourceUrl
      .replace('https://github.com/', 'https://raw.githubusercontent.com/')
      .replace('/tree/', '/') +
    '/' +
    filename
  );
}

interface SkillFrontmatter {
  name?: string;
  description?: string;
  version?: string;
}

function getSkillRefs(sourceUrl: string): { repo: string; name: string } | null {
  const match = sourceUrl.match(
    /github\.com\/([^/]+\/[^/]+)\/tree\/[^/]+\/skills\/([^/?#]+)/,
  );
  if (!match) return null;
  return { repo: match[1], name: match[2] };
}

function parseSkillFrontmatter(markdown: string): SkillFrontmatter | null {
  const lines = markdown.split('\n');
  if (lines[0]?.trim() !== '---') return null;
  let endIdx = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === '---') {
      endIdx = i;
      break;
    }
  }
  if (endIdx === -1) return null;
  const fm = lines.slice(1, endIdx);
  const result: SkillFrontmatter = {};

  const stripQuotes = (s: string) => s.replace(/^["']|["']$/g, '');

  for (let i = 0; i < fm.length; i++) {
    const line = fm[i];
    const topMatch = line.match(/^([a-zA-Z_][a-zA-Z0-9_]*):\s*(.*)$/);
    if (topMatch) {
      const key = topMatch[1];
      const rawValue = topMatch[2].trim();
      if (key === 'description') {
        if (rawValue === '|' || rawValue === '>') {
          const collected: string[] = [];
          for (let j = i + 1; j < fm.length; j++) {
            const next = fm[j];
            if (next === '' || /^\s/.test(next)) {
              collected.push(next.replace(/^\s+/, ''));
            } else {
              break;
            }
          }
          result.description = (rawValue === '>'
            ? collected.join(' ')
            : collected.join('\n')
          ).trim();
        } else if (rawValue) {
          result.description = stripQuotes(rawValue);
        }
      } else if (key === 'name' && rawValue) {
        result.name = stripQuotes(rawValue);
      }
    }
    const versionMatch = line.match(/^\s+version:\s*["']?([^"']+?)["']?\s*$/);
    if (versionMatch) {
      result.version = versionMatch[1].trim();
    }
  }

  return result;
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

function resolveUrl(src: string, rawBaseUrl: string): string {
  if (!src) return src;
  if (
    /^(https?:)?\/\//i.test(src) ||
    src.startsWith('mailto:') ||
    src.startsWith('#') ||
    src.startsWith('data:')
  ) {
    return src;
  }
  if (!rawBaseUrl) return src;
  try {
    return new URL(src, rawBaseUrl).toString();
  } catch {
    return src;
  }
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
      const resolvedSrc = src ? resolveUrl(src, rawBaseUrl) : undefined;
      return (
        <img
          src={resolvedSrc}
          alt={alt ?? ''}
          className={styles.mdImage}
          loading="lazy"
        />
      );
    },
    a({ href, children }: { href?: string; children?: ReactNode }) {
      const resolvedHref = href ? resolveUrl(href, rawBaseUrl) : undefined;
      const isExternal = Boolean(resolvedHref && /^https?:\/\//i.test(resolvedHref));
      return (
        <a
          href={resolvedHref}
          {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        >
          {children}
        </a>
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

  const rawUrl = plugin?.sourceUrl ? toRawDocUrl(plugin.sourceUrl, plugin.group) : null;

  useEffect(() => {
    setReadmeRaw(null);
    setReadmeError(false);
    setActiveTab(0);
    setLogoFailed(false);
    if (!rawUrl) {
      setReadmeLoading(false);
      return;
    }
    const controller = new AbortController();
    setReadmeLoading(true);
    fetch(rawUrl, { signal: controller.signal })
      .then((r) => (r.ok ? r.text() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((text) => {
        setReadmeRaw(text);
        setReadmeLoading(false);
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setReadmeError(true);
        setReadmeLoading(false);
      });
    return () => controller.abort();
  }, [rawUrl]);

  const isSkill = plugin?.group === 'skill';

  const parsed = useMemo(
    () =>
      readmeRaw && !isSkill ? parseReadme(readmeRaw) : { intro: '', sections: [] },
    [readmeRaw, isSkill],
  );

  const skillInfo = useMemo(
    () => (readmeRaw && isSkill ? parseSkillFrontmatter(readmeRaw) : null),
    [readmeRaw, isSkill],
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

            {/* Skill: About (frontmatter description) + Installation. SKILL.md body is agent-facing and skipped. */}
            {!readmeLoading && readmeRaw && isSkill && (
              <>
                {skillInfo?.description && (
                  <div className={styles.contentCard}>
                    <h2 className={styles.singleSectionTitle}>About</h2>
                    <div className={styles.markdownContent}>
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={mdComponents as any}
                      >
                        {skillInfo.description}
                      </ReactMarkdown>
                    </div>
                  </div>
                )}
                {(() => {
                  const refs = plugin.sourceUrl ? getSkillRefs(plugin.sourceUrl) : null;
                  const skillName = skillInfo?.name ?? refs?.name;
                  const repo = refs?.repo;
                  if (!skillName || !repo) return null;
                  const installMd = [
                    '```sh',
                    `npx skills add ${repo} --skill ${skillName} --global`,
                    '```',
                  ].join('\n');
                  return (
                    <div className={styles.contentCard}>
                      <h2 className={styles.singleSectionTitle}>Installation</h2>
                      <div className={styles.markdownContent}>
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={mdComponents as any}
                        >
                          {installMd}
                        </ReactMarkdown>
                      </div>
                    </div>
                  );
                })()}
              </>
            )}

            {/* README sections */}
            {!readmeLoading && readmeRaw && !isSkill && (
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
                        <nav
                          className={styles.tabList}
                          role="tablist"
                          aria-label="Section tabs"
                        >
                          {parsed.sections.map((section, idx) => {
                            const isActive = idx === activeTab;
                            return (
                              <button
                                key={section.id}
                                id={`section-tab-${section.id}`}
                                role="tab"
                                type="button"
                                aria-selected={isActive}
                                aria-controls={`section-panel-${section.id}`}
                                tabIndex={isActive ? 0 : -1}
                                className={
                                  isActive
                                    ? `${styles.tab} ${styles.tabActive}`
                                    : styles.tab
                                }
                                onClick={() => setActiveTab(idx)}
                              >
                                {section.title}
                              </button>
                            );
                          })}
                        </nav>
                      </div>
                    )}

                    {/* Content card */}
                    {activeSection && (
                      <div
                        className={styles.contentCard}
                        {...(hasTabs
                          ? {
                              role: 'tabpanel',
                              id: `section-panel-${activeSection.id}`,
                              'aria-labelledby': `section-tab-${activeSection.id}`,
                              tabIndex: 0,
                            }
                          : {})}
                      >
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
