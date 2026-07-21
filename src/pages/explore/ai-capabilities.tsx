import type { ReactNode } from 'react';
import React, { useState } from 'react';
import useBaseUrl from '@docusaurus/useBaseUrl';
import Layout from '@theme/Layout';
import Button from '@site/src/components/common/Button';
import BrowserShell from '@site/src/components/common/BrowserShell';
import ExpandableImage from '@site/src/components/common/ExpandableImage';
import Link from '@docusaurus/Link';
import {
  Bot,
  Route,
  BrainCircuit,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Terminal,
  TextCursor,
  Code2,
} from 'lucide-react';

import styles from './ai-capabilities.module.css';

function GithubMark(props: {
  size?: number;
  strokeWidth?: number;
  'aria-hidden'?: React.AriaAttributes['aria-hidden'];
}) {
  const size = props.size ?? 16;

  return (
    <svg
      viewBox='0 0 16 16'
      width={size}
      height={size}
      fill='currentColor'
      aria-hidden='true'
    >
      <path d='M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z' />
    </svg>
  );
}

function GeminiMark(props: {
  size?: number;
  strokeWidth?: number;
  'aria-hidden'?: React.AriaAttributes['aria-hidden'];
}) {
  const size = props.size ?? 16;

  return (
    <svg viewBox='0 0 24 24' width={size} height={size} aria-hidden='true'>
      <defs>
        <linearGradient
          id='geminiSparkleGradient'
          x1='0%'
          y1='0%'
          x2='100%'
          y2='100%'
        >
          <stop offset='0%' stopColor='#4285F4' />
          <stop offset='50%' stopColor='#9B72CB' />
          <stop offset='100%' stopColor='#D96570' />
        </linearGradient>
      </defs>
      <path
        fill='url(#geminiSparkleGradient)'
        d='M12 0c0 6.075 1.925 8 8 8v8c-6.075 0-8 1.925-8 8 0-6.075-1.925-8-8-8V8c6.075 0 8-1.925 8-8z'
      />
    </svg>
  );
}

type ToolIconComponent = React.ComponentType<{
  size?: number;
  strokeWidth?: number;
  'aria-hidden'?: React.AriaAttributes['aria-hidden'];
}>;

const proofPoints = [
  {
    icon: Bot,
    title: 'Agents as platform users',
    description:
      'AI agents are first-class platform users, able to act on or assist with developer workflows and platform engineering operations, not just source code.',
  },
  {
    icon: Route,
    title: 'Golden paths for agents',
    description:
      'Agents operate under the same access-controlled guardrails as humans, not separate unpredictable paths.',
  },
  {
    icon: BrainCircuit,
    title: 'Native agents, extensible by design',
    description:
      'Built-in SRE and FinOps agents run inside the platform, and serve as the blueprint for building your own.',
  },
];

type AgentTab = {
  id: string;
  name: string;
  text: string;
  image: string;
  alt: string;
};

const agentTabs: AgentTab[] = [
  {
    id: 'sre',
    name: 'SRE (Site Reliability Engineering) agent',
    text: 'Integrates with observability and alerting workflows to analyze logs, metrics, and traces, generate likely root-cause reports, and take remediation actions with human approval.',
    image:
      '/img/explore/backstage-powered-developer-portal/ai-root-cause-analysis.png',
    alt: 'SRE Agent root cause analysis report showing incident overview, likely root causes, and quick fixes in the OpenChoreo portal.',
  },
  {
    id: 'finops',
    name: 'FinOps agent',
    text: 'Works with budget alerts to generate cost insights and provides recommendations on how to optimize costs.',
    image: '/img/explore/ai-capabilities/finops-agent.png',
    alt: 'FinOps Agent resource metrics, overprovisioning analysis, and rightsizing recommendation in the OpenChoreo portal.',
  },
];

type ToolIntegration = {
  name: string;
  icon: ToolIconComponent | null;
  color?: string;
};

const toolIntegrations: ToolIntegration[] = [
  { name: 'Claude Code', icon: Sparkles, color: '#D97757' },
  { name: 'Codex CLI', icon: Terminal, color: '#10A37F' },
  { name: 'Cursor', icon: TextCursor, color: '#26251E' },
  { name: 'Gemini CLI', icon: GeminiMark },
  { name: 'OpenCode CLI', icon: Code2 },
  { name: 'GitHub Copilot', icon: GithubMark },
];

export default function AICapabilities(): ReactNode {
  const [activeAgentId, setActiveAgentId] = useState(agentTabs[0].id);
  const activeAgent =
    agentTabs.find((agent) => agent.id === activeAgentId) ?? agentTabs[0];
  const activeAgentImageSrc = useBaseUrl(activeAgent.image);

  return (
    <Layout
      title='Agentic Developer Platform for Kubernetes'
      description='Explore how OpenChoreo lets AI agents operate your platform, not just your code, through MCP servers and built-in platform agents.'
    >
      <main className={styles.page}>
        {/* Hero */}
        <section className={styles.hero}>
          <div className='container'>
            <div className={styles.heroInner}>
              <div className={styles.heroCopy}>
                <div className={styles.eyebrow}>Explore</div>
                <h1 className={styles.heroTitle}>
                  Agentic Developer Platform for Kubernetes
                </h1>
                <p className={styles.heroLead}>
                  Agents shouldn't have to reason in raw Kubernetes primitives
                  or stitch together disconnected tools. OpenChoreo exposes the
                  same abstractions, golden paths, and guardrails to AI agents
                  that it gives to developers so agents can deliver, operate,
                  and optimize software as first-class platform users.
                </p>
                <div className={styles.heroActions}>
                  <Button
                    to={useBaseUrl('/docs/getting-started/quick-start-guide/')}
                    className={styles.filledButton}
                  >
                    Install OpenChoreo
                  </Button>
                  <Button to={useBaseUrl('/docs/ai/overview/')}>
                    Read the docs
                  </Button>
                </div>
              </div>

              <BrowserShell className={styles.heroVisualFrame}>
                <ExpandableImage
                  src={useBaseUrl(
                    '/img/explore/ai-capabilities/ai-capabilities.gif',
                  )}
                  alt='Diagram of external agents and the OpenChoreo CLI connecting through MCP servers to the control, observability, data, and workflow planes, with built-in platform agents collaborating on top.'
                  className={styles.heroVisual}
                  fillContainer
                  gutterBottom={false}
                />
              </BrowserShell>
            </div>

            {/* Key Messages */}
            <div className={styles.proofGrid}>
              {proofPoints.map((point) => {
                const Icon = point.icon;

                return (
                  <article key={point.title} className={styles.proofCard}>
                    <div className={styles.proofCardHeader}>
                      <div className={styles.proofIconBadge}>
                        <Icon size={16} strokeWidth={1.75} aria-hidden='true' />
                      </div>
                      <h2>{point.title}</h2>
                    </div>
                    <p>{point.description}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className={styles.storyBlock}>
          <div className='container'>
            {/* 1. A Platform Built for Agents to Operate On */}
            <div className={styles.storySection}>
              <div className={styles.storyCopy}>
                <div className={styles.sectionEyebrowRow}>
                  <div className={styles.sectionNumber}>01</div>
                  <div className={styles.sectionEyebrow}>MCP Servers</div>
                </div>
                <h2 className={styles.sectionTitle}>
                  A Platform Built for Agents to Operate On
                </h2>
                <p className={styles.sectionDescription}>
                  OpenChoreo exposes MCP servers for both the Control Plane and
                  the Observability Plane, giving agents access to live platform
                  context; components, environments, deployment state, logs,
                  metrics, traces instead of just source code, disconnected
                  tools and YAML.
                </p>
              </div>

              <div className={styles.storyMedia}>
                <ExpandableImage
                  src={useBaseUrl(
                    '/img/explore/ai-capabilities/ai-overview.svg',
                  )}
                  alt='OpenChoreo MCP server configuration in an AI assistant.'
                  className={styles.sectionImage}
                  fillContainer
                  gutterBottom={false}
                />
              </div>
            </div>

            {/* 2. Bring Your Own Agents */}
            <div
              className={`${styles.storySection} ${styles.storySectionReverse}`}
            >
              <div className={styles.storyCopy}>
                <div className={styles.sectionEyebrowRow}>
                  <div className={styles.sectionNumber}>02</div>
                  <div className={styles.sectionEyebrow}>
                    Ecosystem Integrations
                  </div>
                </div>
                <h2 className={styles.sectionTitle}>Bring Your Own Agents</h2>
                <p className={styles.sectionDescription}>
                  Use the AI tools and agents you already use with OpenChoreo.
                </p>

                <div className={styles.toolTileGrid}>
                  {toolIntegrations.map((tool) => {
                    const Icon = tool.icon;

                    return (
                      <div key={tool.name} className={styles.toolTile}>
                        <div
                          className={styles.toolTileIcon}
                          style={tool.color ? { color: tool.color } : undefined}
                        >
                          {Icon ? (
                            <Icon
                              size={16}
                              strokeWidth={1.75}
                              aria-hidden='true'
                            />
                          ) : (
                            <span className={styles.toolTileIconFallback} />
                          )}
                        </div>
                        <span className={styles.toolTileName}>{tool.name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className={styles.storyMedia}>
                <BrowserShell className={styles.mediaFrame}>
                  <ExpandableImage
                    src={useBaseUrl(
                      '/img/explore/ai-capabilities/work-with-agents.png',
                    )}
                    alt='A coding agent connected to OpenChoreo through client credential authentication.'
                    className={styles.sectionImage}
                    fillContainer
                    gutterBottom={false}
                  />
                </BrowserShell>
              </div>
            </div>

            {/* 3. Agents That Run Inside the Platform */}
            <div className={styles.storySection}>
              <div className={styles.storyCopy}>
                <div className={styles.sectionEyebrowRow}>
                  <div className={styles.sectionNumber}>03</div>
                  <div className={styles.sectionEyebrow}>
                    Platform AI Agents
                  </div>
                </div>
                <h2 className={styles.sectionTitle}>
                  Agents That Run Inside the Platform
                </h2>

                <div className={styles.agentTabs} role='tablist'>
                  {agentTabs.map((agent) => {
                    const isActive = agent.id === activeAgentId;

                    return (
                      <button
                        key={agent.id}
                        type='button'
                        role='tab'
                        aria-selected={isActive}
                        onClick={() => setActiveAgentId(agent.id)}
                        className={`${styles.agentTab} ${
                          isActive ? styles.agentTabActive : ''
                        }`}
                      >
                        <span className={styles.agentTabHeader}>
                          <span className={styles.agentTabHeaderLeft}>
                            <span className={styles.agentTabIndicator} />
                            <span className={styles.agentTabName}>
                              {agent.name}
                            </span>
                          </span>
                          <span className={styles.agentTabChevron}>
                            {isActive ? (
                              <ChevronDown size={18} aria-hidden='true' />
                            ) : (
                              <ChevronRight size={18} aria-hidden='true' />
                            )}
                          </span>
                        </span>
                        {isActive && (
                          <p className={styles.agentTabText}>{agent.text}</p>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className={styles.storyMedia}>
                <BrowserShell className={styles.mediaFrame}>
                  <ExpandableImage
                    src={activeAgentImageSrc}
                    alt={activeAgent.alt}
                    className={styles.sectionImage}
                    fillContainer
                    gutterBottom={false}
                  />
                </BrowserShell>
              </div>
            </div>

            {/* 4. Talk to Your Platform, Not Just Your Code */}
            <div
              className={`${styles.storySection} ${styles.storySectionReverse}`}
            >
              <div className={styles.storyCopy}>
                <div className={styles.sectionEyebrowRow}>
                  <div className={styles.sectionNumber}>04</div>
                  <div className={styles.sectionEyebrow}>
                    Natural-Language Interface
                  </div>
                </div>
                <h2 className={styles.sectionTitle}>
                  Talk to Your Platform, Not Just Your Code
                </h2>
                <ul className={styles.sectionList}>
                  <li>Discover resources and dependencies</li>
                  <li>Build, deploy, and promote components</li>
                  <li>Diagnose failures across services</li>
                  <li>Investigate build and workflow issues</li>
                  <li>Optimize resource usage</li>
                  <li>Debug using logs, metrics, and traces</li>
                  <li>
                    Assist with migration from existing Kubernetes and GitOps
                    setups
                  </li>
                </ul>
              </div>

              <div className={styles.storyMedia}>
                <BrowserShell className={styles.mediaFrame}>
                  <ExpandableImage
                    src={useBaseUrl(
                      '/img/explore/ai-capabilities/natural-language-interface.png',
                    )}
                    alt='Portal Assistant chat panel diagnosing a failing request in the OpenChoreo portal.'
                    className={styles.sectionImage}
                    fillContainer
                    gutterBottom={false}
                  />
                </BrowserShell>
              </div>
            </div>

            {/* 5. Agentic Skills from the OpenChoreo Ecosystem */}
            <div className={styles.storySection}>
              <div className={styles.storyCopy}>
                <div className={styles.sectionEyebrowRow}>
                  <div className={styles.sectionNumber}>05</div>
                  <div className={styles.sectionEyebrow}>Agentic Skills</div>
                </div>
                <h2 className={styles.sectionTitle}>
                  Agentic Skills from the OpenChoreo Ecosystem
                </h2>
                <p className={styles.sectionDescription}>
                  A growing ecosystem of reusable agentic skills packages common
                  platform and developer tasks, ready to drop into your AI
                  workflows.
                </p>
                <div className={styles.heroActions}>
                  <Button
                    to={useBaseUrl('/ecosystem/')}
                    className={styles.filledButton}
                  >
                    Explore the Ecosystem
                  </Button>
                </div>
              </div>

              <div className={styles.storyMedia}>
                <div className={styles.skillsPanel}>
                  <div className={styles.skillsGroup}>
                    <div className={styles.skillsGroupLabel}>
                      For Developers
                    </div>
                    <div className={styles.skillsGroupPills}>
                      <span className={styles.skillPill}>Developer</span>
                      <span className={styles.skillPill}>
                        Developer (GitOps)
                      </span>
                    </div>
                  </div>

                  <div className={styles.skillsGroup}>
                    <div className={styles.skillsGroupLabel}>
                      For Platform Engineers
                    </div>
                    <div className={styles.skillsGroupPills}>
                      <span className={styles.skillPill}>
                        Platform Engineer
                      </span>
                      <span className={styles.skillPill}>
                        Platform Engineer (GitOps)
                      </span>
                      <span className={styles.skillPill}>Setup</span>
                      <span className={styles.skillPill}>Import</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA: Foundation for an Agentic Developer Platform */}
        <section className={styles.ctaSection}>
          <div className='container'>
            <div className={styles.ctaInner}>
              <div className={styles.ctaCopy}>
                <h2 className={styles.ctaTitle}>
                  Foundation for an Agentic Developer Platform
                </h2>
                <p className={styles.ctaText}>
                  OpenChoreo does not force AI to reason with Kubernetes
                  primitives and disconnected tools. It exposes higher-level
                  platform constructs for delivery and operations that agents
                  can understand and act on efficiently.
                </p>
                <p className={styles.ctaText}>
                  This unified context, combined with strong RBAC, enables AI
                  agents to safely perform and assist with real delivery and
                  operational tasks at scale.
                </p>
              </div>

              <div className={styles.quickActionsPanel}>
                <div className={styles.quickActionsLabel}>Quick Actions</div>

                <Link
                  to={useBaseUrl('https://demo.openchoreo.wso2.com/')}
                  className={`${styles.quickActionRow} ${styles.quickActionPrimary}`}
                >
                  <span>Try It Out</span>
                  <span className={styles.quickActionArrow}>&rarr;</span>
                </Link>

                <Link
                  to={useBaseUrl('/docs/getting-started/quick-start-guide/')}
                  className={styles.quickActionRow}
                >
                  <span>Install OpenChoreo</span>
                  <span className={styles.quickActionArrow}>&rarr;</span>
                </Link>

                <Link
                  to={useBaseUrl('/docs/ai/mcp-prompt-scenarios/')}
                  className={styles.quickActionRow}
                >
                  <span>Explore Prompt Scenarios</span>
                  <span className={styles.quickActionArrow}>&rarr;</span>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
