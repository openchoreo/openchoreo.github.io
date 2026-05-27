import React, { JSX } from "react";
import styles from "./styles.module.css";
import SectionHeader from "../common/SectionHeader";
import Button from "@site/src/components/common/Button";

type StackLogo = {
  name: string;
  logos: string[];
  x: number;
  y: number;
  lineX?: number;
  lineY?: number;
};

const stackLogos: StackLogo[] = [
  {
    name: "Identity providers",
    logos: [
      "/img/logos/ecosystem-logo-okta.webp",
      "/img/logos/ecosystem-logo-keycloak.webp",
      "/img/logos/ecosystem-logo-ory.webp",
    ],
    x: 50,
    y: 6,
    lineX: 50,
    lineY: 13,
  },
  {
    name: "CI systems",
    logos: [
      "/img/logos/tech-logo-argo.webp",
      "/img/logos/ecosystem-logo-githubactions.webp",
      "/img/logos/ecosystem-logo-jenkins.webp",
    ],
    x: 76,
    y: 18,
  },
  {
    name: "GitOps integrations",
    logos: [
      "/img/logos/tech-logo-flux.svg",
      "/img/logos/ecosystem-logo-weave.webp",
      "/img/logos/tech-logo-argo.webp",
    ],
    x: 91,
    y: 47,
  },
  {
    name: "API gateways",
    logos: [
      "/img/logos/ecosystem-logo-wso2.webp",
      "/img/logos/tech-logo-kgateway.svg",
      "/img/logos/ecosystem-logo-apisix.webp",
    ],
    x: 76,
    y: 78,
  },
  {
    name: "AI gateways",
    logos: [
      "/img/logos/ecosystem-logo-agentgateway.webp",
      "/img/logos/ecosystem-logo-wso2.webp",
      "/img/logos/ecosystem-logo-envoy.webp",
    ],
    x: 50,
    y: 92,
  },
  {
    name: "Observability",
    logos: [
      "/img/logos/tech-logo-opensearch.webp",
      "/img/logos/tech-logo-prometheus.webp",
      "/img/logos/tech-logo-opentelemetry.svg",
    ],
    x: 24,
    y: 78,
  },
  {
    name: "Network & Security",
    logos: [
      "/img/logos/tech-logo-cilium.webp",
      "/img/logos/ecosystem-logo-istio.webp",
      "/img/logos/ecosystem-logo-linkerd.webp",
    ],
    x: 9,
    y: 47,
  },
  {
    name: "Infrastructure provisioners",
    logos: [
      "/img/logos/ecosystem-logo-crossplane.webp",
      "/img/logos/ecosystem-logo-opentofu.webp",
      "/img/logos/ecosystem-logo-pulumi.webp",
    ],
    x: 24,
    y: 18,
  },
];

export default function Ecosystem(): JSX.Element {
  return (
    <section className={styles.blade}>
      <div className={styles.inner}>
        <SectionHeader title="Built to Integrate With Your Stack">
          <p>
            OpenChoreo’s modular architecture lets you integrate, extend, and
            customize platform services without rebuilding your foundation.
          </p>

          <div className={styles.actions}>
            <Button to="/ecosystem/">Explore the Ecosystem</Button>
          </div>
        </SectionHeader>

        <div
          className={styles.graphic}
          aria-label="OpenChoreo ecosystem integrations"
        >
          <div className={styles.orbitOuter} />
          <div className={styles.orbitInner} />

          <svg
            className={styles.lines}
            viewBox="0 0 100 100"
            aria-hidden="true"
          >
            {stackLogos.map((item) => (
              <line
                key={item.name}
                x1="50"
                y1="50"
                x2={item.lineX ?? item.x}
                y2={item.lineY ?? item.y}
              />
            ))}
          </svg>

          <div className={styles.center}>
            <img src="/img/openchoreo-logo.svg" alt="OpenChoreo" />
          </div>

          {stackLogos.map((item) => (
            <div
              key={item.name}
              className={styles.node}
              style={
                {
                  "--x": `${item.x}%`,
                  "--y": `${item.y}%`,
                } as React.CSSProperties
              }
            >
              <span className={styles.logoCluster}>
                {item.logos.map((logo) => (
                  <span key={logo} className={styles.logo}>
                    <img src={logo} alt="" loading="lazy" />
                  </span>
                ))}
              </span>
              <span className={styles.label}>{item.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
