import type { ReactNode } from "react";
import React from "react";
import useBaseUrl from "@docusaurus/useBaseUrl";
import Layout from "@theme/Layout";
import Button from "@site/src/components/common/Button";
import BrowserShell from "@site/src/components/common/BrowserShell";
import TerminalShell from "@site/src/components/common/TerminalShell";

import styles from "./observability.module.css";

type StorySection = {
  eyebrow: string;
  title: string;
  description: ReactNode;
  image: string;
  alt: string;
  terminal?: boolean;
  plain?: boolean;
};

const proofPoints = [
  {
    title: "Platform-native observability",
    description:
      "Logs, metrics, traces, alerts, and incidents are available where teams manage applications, mapped to platform concepts such as components and projects.",
  },
  {
    title: "Self-service, access control and AI",
    description:
      "Developers can investigate issues with AI for the projects and components they manage, while platform teams enforce RBAC and standardize observability backends.",
  },
  {
    title: "Cost-effective with data sovereignty",
    description:
      "OpenChoreo keeps observability within your infrastructure, reducing reliance on external tools, lowering costs, and giving you full ownership of your telemetry data.",
  },
];

const sections: StorySection[] = [
  {
    eyebrow: "Self-Service",
    title: "Developer Self-Service Without Tool Sprawl",
    description: (
      <>
        <p>
          OpenChoreo gives developers direct access to runtime signals in the
          same place they build and deploy applications. Instead of switching
          between logging tools, metrics dashboards, tracing systems, and
          cluster views, application teams can investigate issues without
          switching context.
        </p>
        <ul className={styles.bulletList}>
          <li>Historical build workflow and runtime logs</li>
          <li>Historical CPU, memory and network usage metrics</li>
          <li>Distributed OpenTelemetry traces</li>
          <li>Alerts for log and metrics-based triggers</li>
          <li>Enhanced network observability with eBPF (with Cilium)</li>
        </ul>
      </>
    ),
    image: "/img/explore/observability/observability-self-service.png",
    alt: "Self-service logs and metrics for an OpenChoreo component.",
  },
  {
    eyebrow: "Integrated Data Model",
    title: "Observability That Understands the Runtime Topology",
    description: (
      <>
        <p>
          OpenChoreo maps telemetry data to the platform model your teams
          already use. Logs, metrics, traces, alerts, and incidents are tied to
          domain-based components, projects, and environments rather than raw
          infrastructure data.
        </p>
        <p>
          This alignment makes it easier to understand what is failing and why.
          Teams can correlate telemetry signals across services, navigate
          dependencies, and reason about system behavior using application-level
          concepts instead of figuring out tool-specific dashboards and queries.
        </p>
      </>
    ),
    image: "/img/explore/observability/observe-runtime-topology.gif",
    alt: "Observability mapped to platform concepts such as components and projects.",
  },
  {
    eyebrow: "AI, MCP and Skills",
    title: "Natural Language for Observability",
    description: (
      <>
        <p>
          OpenChoreo structures observability data in a way that AI agents can
          efficiently query and reason about through the observability MCP and
          API. Because telemetry is tied to platform concepts and runtime
          topology, you can query telemetry data using natural language.
        </p>
      </>
    ),
    image: "/img/explore/observability/natural-language-queries.png",
    alt: "Natural language queries for observability data in OpenChoreo.",
    terminal: true,
  },
  {
    eyebrow: "Open Standards",
    title: "Best of Open Source, Built Into Your Platform",
    description: (
      <>
        <p>
          OpenChoreo integrates proven open source observability technologies
          into a unified platform experience. Teams get the flexibility and
          extensibility of open ecosystems without having to stitch together and
          operate multiple tools themselves.
        </p>
        <p className={styles.ecosystemLink}>
          <a
            href="/ecosystem/?category=Observability"
            target="_blank"
            rel="noopener noreferrer"
          >
            Explore other observability modules in the OpenChoreo Ecosystem{" "}
            <span aria-hidden="true">↗</span>
          </a>
        </p>
      </>
    ),
    image: "/img/explore/observability/observability-stack.png",
    alt: "Open source observability technologies integrated into OpenChoreo.",
    plain: true,
  },
];

export default function Observability(): ReactNode {
  return (
    <Layout
      title="Observability"
      description="Explore how OpenChoreo brings platform-native observability into the developer experience."
    >
      <main className={styles.page}>
        <section className={styles.hero}>
          <div className="container">
            <div className={styles.heroInner}>
              <div className={styles.heroCopy}>
                <div className={styles.eyebrow}>Explore</div>
                <h1 className={styles.heroTitle}>Observability</h1>
                <p className={styles.heroLead}>
                  Observability is expensive and fragmented when it is bolted
                  on. OpenChoreo makes it part of the developer platform, mapped
                  to the application model, so teams can troubleshoot faster
                  without learning every underlying tool.
                </p>
                <div className={styles.heroActions}>
                  <Button
                    to={useBaseUrl(
                      "/docs/getting-started/try-it-out/on-k3d-locally/",
                    )}
                    className={styles.filledButton}
                  >
                    Try it locally
                  </Button>
                  <Button
                    to={useBaseUrl(
                      "/docs/platform-engineer-guide/observability-alerting/",
                    )}
                  >
                    Read the docs
                  </Button>
                </div>
              </div>

              <BrowserShell className={styles.heroVisualFrame}>
                <img
                  src={useBaseUrl(
                    "/img/explore/observability/observability-with-ai.gif",
                  )}
                  alt="Observability with AI in OpenChoreo"
                  className={styles.heroVisual}
                />
              </BrowserShell>
            </div>

            <div className={styles.proofGrid}>
              {proofPoints.map((point) => (
                <article key={point.title} className={styles.proofCard}>
                  <h2>{point.title}</h2>
                  <p>{point.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.storyBlock}>
          <div className="container">
            {sections.map((section, index) => {
              const reverse = index % 2 === 1;

              return (
                <div
                  key={section.title}
                  className={`${styles.storySection} ${
                    reverse ? styles.storySectionReverse : ""
                  }`}
                >
                  <div className={styles.storyCopy}>
                    <div className={styles.sectionNumber}>
                      {String(index + 1).padStart(2, "0")}
                    </div>
                    <div className={styles.sectionEyebrow}>
                      {section.eyebrow}
                    </div>
                    <h2 className={styles.sectionTitle}>{section.title}</h2>
                    <div className={styles.sectionDescription}>
                      {section.description}
                    </div>
                  </div>

                  <div className={styles.storyMedia}>
                    {section.terminal ? (
                      <TerminalShell className={styles.terminalFrame}>
                        <div className={styles.terminalContent}>
                          <div className={styles.terminalPrompt}>
                            <span className={styles.terminalPromptSymbol}>
                              $
                            </span>
                            <span>
                              We have user reported failures in the ads-frontend
                              component, find out what went wrong
                            </span>
                          </div>
                          <div className={styles.terminalPrompt}>
                            <span className={styles.terminalPromptSymbol}>
                              $
                            </span>
                            <span>
                              How many 500 error codes has the core-api service
                              returned in the last 6 hours? Investigate the
                              reason for each failure as well
                            </span>
                          </div>
                          <div className={styles.terminalPrompt}>
                            <span className={styles.terminalPromptSymbol}>
                              $
                            </span>
                            <span>
                              What caused the request with {"{uuid}"} to fail
                              last Thursday at 3.00pm in the analytics project?
                            </span>
                          </div>
                          <div className={styles.terminalPrompt}>
                            <span className={styles.terminalPromptSymbol}>
                              $
                            </span>
                            <span>
                              What caused the memory spike and resulting OOM
                              kill for the streaming service today?
                            </span>
                          </div>
                          <div className={styles.terminalPrompt}>
                            <span className={styles.terminalPromptSymbol}>
                              $
                            </span>
                            <span>
                              Add a log-based alert trait to the
                              &apos;pdf-processor&apos; component for any logs
                              that matches the string &apos;* failed to render
                              *&apos;
                            </span>
                          </div>
                        </div>
                      </TerminalShell>
                    ) : section.plain ? (
                      <img
                        src={useBaseUrl(section.image)}
                        alt={section.alt}
                        className={styles.sectionImage}
                      />
                    ) : (
                      <BrowserShell className={styles.mediaFrame}>
                        <img
                          src={useBaseUrl(section.image)}
                          alt={section.alt}
                          className={styles.sectionImage}
                        />
                      </BrowserShell>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className={styles.ctaSection}>
          <div className="container">
            <div className={styles.ctaInner}>
              <div>
                <h2 className={styles.ctaTitle}>
                  Observability that doesn't slow you down.
                </h2>
                <p className={styles.ctaText}>
                  OpenChoreo brings observability with AI into the developer
                  platform, so teams can troubleshoot issues without switching
                  tools or translating infrastructure signals. This reduces
                  investigation time and MTTR, removes unnecessary friction on
                  platform teams, and creates a more consistent operational
                  model across your organization.
                </p>
              </div>

              <div className={styles.ctaActions}>
                <Button
                  to={useBaseUrl(
                    "/docs/getting-started/try-it-out/on-k3d-locally/",
                  )}
                  className={styles.filledButton}
                >
                  Try it locally
                </Button>
                <Button
                  to={useBaseUrl(
                    "/docs/platform-engineer-guide/observability-alerting/",
                  )}
                >
                  Read the docs
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
