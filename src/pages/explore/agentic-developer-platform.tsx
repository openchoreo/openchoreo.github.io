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
} from 'lucide-react';

import styles from './agentic-developer-platform.module.css';

// Brand marks below use the official logos from each tool's brand assets
// (Claude, OpenAI, Cursor, Google Gemini, OpenCode, GitHub Copilot).

type BrandMarkProps = {
  size?: number;
  strokeWidth?: number;
  'aria-hidden'?: React.AriaAttributes['aria-hidden'];
};

function ClaudeMark(props: BrandMarkProps) {
  const size = props.size ?? 16;

  return (
    <svg
      viewBox='0 0 24 24'
      width={size}
      height={size}
      fill='currentColor'
      aria-hidden='true'
    >
      <path d='m4.7144 15.9555 4.7174-2.6471.079-.2307-.079-.1275h-.2307l-.7893-.0486-2.6956-.0729-2.3375-.0971-2.2646-.1214-.5707-.1215-.5343-.7042.0546-.3522.4797-.3218.686.0608 1.5179.1032 2.2767.1578 1.6514.0972 2.4468.255h.3886l.0546-.1579-.1336-.0971-.1032-.0972L6.973 9.8356l-2.55-1.6879-1.3356-.9714-.7225-.4918-.3643-.4614-.1578-1.0078.6557-.7225.8803.0607.2246.0607.8925.686 1.9064 1.4754 2.4893 1.8336.3643.3035.1457-.1032.0182-.0728-.164-.2733-1.3539-2.4467-1.445-2.4893-.6435-1.032-.17-.6194c-.0607-.255-.1032-.4674-.1032-.7285L6.287.1335 6.6997 0l.9957.1336.419.3642.6192 1.4147 1.0018 2.2282 1.5543 3.0296.4553.8985.2429.8318.091.255h.1579v-.1457l.1275-1.706.2368-2.0947.2307-2.6957.0789-.7589.3764-.9107.7468-.4918.5828.2793.4797.686-.0668.4433-.2853 1.8517-.5586 2.9021-.3643 1.9429h.2125l.2429-.2429.9835-1.3053 1.6514-2.0643.7286-.8196.85-.9046.5464-.4311h1.0321l.759 1.1293-.34 1.1657-1.0625 1.3478-.8804 1.1414-1.2628 1.7-.7893 1.36.0729.1093.1882-.0183 2.8535-.607 1.5421-.2794 1.8396-.3157.8318.3886.091.3946-.3278.8075-1.967.4857-2.3072.4614-3.4364.8136-.0425.0304.0486.0607 1.5482.1457.6618.0364h1.621l3.0175.2247.7892.522.4736.6376-.079.4857-1.2142.6193-1.6393-.3886-3.825-.9107-1.3113-.3279h-.1822v.1093l1.0929 1.0686 2.0035 1.8092 2.5075 2.3314.1275.5768-.3218.4554-.34-.0486-2.2039-1.6575-.85-.7468-1.9246-1.621h-.1275v.17l.4432.6496 2.3436 3.5214.1214 1.0807-.17.3521-.6071.2125-.6679-.1214-1.3721-1.9246L14.38 17.959l-1.1414-1.9428-.1397.079-.674 7.2552-.3156.3703-.7286.2793-.6071-.4614-.3218-.7468.3218-1.4753.3886-1.9246.3157-1.53.2853-1.9004.17-.6314-.0121-.0425-.1397.0182-1.4328 1.9672-2.1796 2.9446-1.7243 1.8456-.4128.164-.7164-.3704.0667-.6618.4008-.5889 2.386-3.0357 1.4389-1.882.929-1.0868-.0062-.1579h-.0546l-6.3385 4.1164-1.1293.1457-.4857-.4554.0608-.7467.2307-.2429 1.9064-1.3114Z' />
    </svg>
  );
}

function OpenAIMark(props: BrandMarkProps) {
  const size = props.size ?? 16;

  return (
    <svg
      viewBox='0 0 24 24'
      width={size}
      height={size}
      fill='currentColor'
      aria-hidden='true'
    >
      <path d='M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z' />
    </svg>
  );
}

function CursorMark(props: BrandMarkProps) {
  const size = props.size ?? 16;

  return (
    <svg
      viewBox='0 0 24 24'
      width={size}
      height={size}
      fill='currentColor'
      aria-hidden='true'
    >
      <path d='M11.503.131 1.891 5.678a.84.84 0 0 0-.42.726v11.188c0 .3.162.575.42.724l9.609 5.55a1 1 0 0 0 .998 0l9.61-5.55a.84.84 0 0 0 .42-.724V6.404a.84.84 0 0 0-.42-.726L12.497.131a1.01 1.01 0 0 0-.996 0M2.657 6.338h18.55c.263 0 .43.287.297.515L12.23 22.918c-.062.107-.229.064-.229-.06V12.335a.59.59 0 0 0-.295-.51l-9.11-5.257c-.109-.063-.064-.23.061-.23' />
    </svg>
  );
}

function GeminiMark(props: BrandMarkProps) {
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
        d='M11.04 19.32Q12 21.51 12 24q0-2.49.93-4.68.96-2.19 2.58-3.81t3.81-2.55Q21.51 12 24 12q-2.49 0-4.68-.93a12.3 12.3 0 0 1-3.81-2.58 12.3 12.3 0 0 1-2.58-3.81Q12 2.49 12 0q0 2.49-.96 4.68-.93 2.19-2.55 3.81a12.3 12.3 0 0 1-3.81 2.58Q2.49 12 0 12q2.49 0 4.68.96 2.19.93 3.81 2.55t2.55 3.81'
      />
    </svg>
  );
}

function OpenCodeMark(props: BrandMarkProps) {
  const size = props.size ?? 16;

  return (
    <svg
      viewBox='0 0 512 512'
      width={size}
      height={size}
      fill='currentColor'
      aria-hidden='true'
    >
      <path
        fillRule='evenodd'
        clipRule='evenodd'
        d='M384 416H128V96H384V416ZM320 160H192V352H320V160Z'
      />
      <path opacity='0.4' d='M320 224V352H192V224H320Z' />
    </svg>
  );
}

function CopilotMark(props: BrandMarkProps) {
  const size = props.size ?? 16;

  return (
    <svg
      viewBox='0 0 24 24'
      width={size}
      height={size}
      fill='currentColor'
      aria-hidden='true'
    >
      <path d='M23.922 16.997C23.061 18.492 18.063 22.02 12 22.02 5.937 22.02.939 18.492.078 16.997A.641.641 0 0 1 0 16.741v-2.869a.883.883 0 0 1 .053-.22c.372-.935 1.347-2.292 2.605-2.656.167-.429.414-1.055.644-1.517a10.098 10.098 0 0 1-.052-1.086c0-1.331.282-2.499 1.132-3.368.397-.406.89-.717 1.474-.952C7.255 2.937 9.248 1.98 11.978 1.98c2.731 0 4.767.957 6.166 2.093.584.235 1.077.546 1.474.952.85.869 1.132 2.037 1.132 3.368 0 .368-.014.733-.052 1.086.23.462.477 1.088.644 1.517 1.258.364 2.233 1.721 2.605 2.656a.841.841 0 0 1 .053.22v2.869a.641.641 0 0 1-.078.256Zm-11.75-5.992h-.344a4.359 4.359 0 0 1-.355.508c-.77.947-1.918 1.492-3.508 1.492-1.725 0-2.989-.359-3.782-1.259a2.137 2.137 0 0 1-.085-.104L4 11.746v6.585c1.435.779 4.514 2.179 8 2.179 3.486 0 6.565-1.4 8-2.179v-6.585l-.098-.104s-.033.045-.085.104c-.793.9-2.057 1.259-3.782 1.259-1.59 0-2.738-.545-3.508-1.492a4.359 4.359 0 0 1-.355-.508Zm2.328 3.25c.549 0 1 .451 1 1v2c0 .549-.451 1-1 1-.549 0-1-.451-1-1v-2c0-.549.451-1 1-1Zm-5 0c.549 0 1 .451 1 1v2c0 .549-.451 1-1 1-.549 0-1-.451-1-1v-2c0-.549.451-1 1-1Zm3.313-6.185c.136 1.057.403 1.913.878 2.497.442.544 1.134.938 2.344.938 1.573 0 2.292-.337 2.657-.751.384-.435.558-1.15.558-2.361 0-1.14-.243-1.847-.705-2.319-.477-.488-1.319-.862-2.824-1.025-1.487-.161-2.192.138-2.533.529-.269.307-.437.808-.438 1.578v.021c0 .265.021.562.063.893Zm-1.626 0c.042-.331.063-.628.063-.894v-.02c-.001-.77-.169-1.271-.438-1.578-.341-.391-1.046-.69-2.533-.529-1.505.163-2.347.537-2.824 1.025-.462.472-.705 1.179-.705 2.319 0 1.211.175 1.926.558 2.361.365.414 1.084.751 2.657.751 1.21 0 1.902-.394 2.344-.938.475-.584.742-1.44.878-2.497Z' />
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
  { name: 'Claude Code', icon: ClaudeMark, color: '#D97757' },
  { name: 'Codex CLI', icon: OpenAIMark },
  { name: 'Cursor', icon: CursorMark },
  { name: 'Gemini CLI', icon: GeminiMark },
  { name: 'OpenCode CLI', icon: OpenCodeMark },
  { name: 'GitHub Copilot', icon: CopilotMark },
];

export default function AgenticDeveloperPlatform(): ReactNode {
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
