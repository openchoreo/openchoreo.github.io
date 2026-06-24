import React, { useState } from "react";
import CodeBlock from "@theme/CodeBlock";
import styles from "./styles.module.css";

type Env =
  | "k3d"
  | "rancher-desktop"
  | "gke"
  | "eks"
  | "aks"
  | "self-managed";

type Topology = "single" | "multi";

const ENVS: { id: Env; label: string }[] = [
  { id: "k3d", label: "Local k3d" },
  { id: "rancher-desktop", label: "Rancher Desktop" },
  { id: "gke", label: "GKE" },
  { id: "eks", label: "EKS" },
  { id: "aks", label: "AKS" },
  { id: "self-managed", label: "Self-managed" },
];

const ENV_PROMPT: Record<Env, string> = {
  "k3d": "Install OpenChoreo locally on k3d.",
  "rancher-desktop": "Install OpenChoreo on Rancher Desktop.",
  "gke": "Install OpenChoreo on GKE.",
  "eks": "Install OpenChoreo on EKS.",
  "aks": "Install OpenChoreo on AKS.",
  "self-managed": "Install OpenChoreo on my Kubernetes cluster.",
};

const PLANES = [
  { id: "control", label: "Control Plane", desc: "API, console, and controllers", required: true },
  { id: "data", label: "Data Plane", desc: "Runs your workloads", required: true },
  { id: "workflow", label: "Workflow Plane", desc: "Build from source with CI", required: false },
  { id: "observability", label: "Observability Plane", desc: "Logs, metrics, and traces", required: false },
];

function resolveVersion(helmChart: string): string {
  const match = helmChart.match(/^(\d+)\.(\d+)\.\d+$/);
  return match ? `v${match[1]}.${match[2]}.x` : "next";
}

function buildPrompt(env: Env, topology: Topology, workflow: boolean, obs: boolean, version: string): string {
  const topologyClause = topology === "single"
    ? "Everything on a single cluster."
    : "Use a multi-cluster topology.";

  let planes: string;
  if (workflow && obs) {
    planes = "Install all four planes.";
  } else if (workflow && !obs) {
    planes = "Install the control, data, and workflow planes. Skip the observability plane.";
  } else if (!workflow && obs) {
    planes = "Install the control, data, and observability planes. Skip the workflow plane.";
  } else {
    planes = "Install only the control and data planes.";
  }
  return `${ENV_PROMPT[env]} ${topologyClause} Use version ${version}. ${planes}`;
}

interface Props {
  currentVersion?: string;
  fixedEnv?: Env;
}

export default function AgentSetupBuilder({ currentVersion, fixedEnv }: Props) {
  const version = currentVersion ? resolveVersion(currentVersion) : "next";
  const visibleEnvs = fixedEnv ? ENVS : ENVS.filter((e) => e.id !== "k3d");

  const [env, setEnv] = useState<Env>(fixedEnv ?? "rancher-desktop");
  const [topology, setTopology] = useState<Topology>("single");
  const [workflow, setWorkflow] = useState(true);
  const [obs, setObs] = useState(true);

  const prompt = buildPrompt(fixedEnv ?? env, fixedEnv ? "single" : topology, workflow, obs, version);
  const planeEnabled = { control: true, data: true, workflow, observability: obs };

  return (
    <div className={styles.builder}>

      {!fixedEnv && (
        <div className={styles.selectorRow}>
          <div className={styles.section}>
            <span className={styles.sectionLabel}>Environment</span>
            <div className={styles.pills}>
              {visibleEnvs.map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  className={`${styles.pill} ${env === id ? styles.pillActive : ""}`}
                  onClick={() => setEnv(id)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className={`${styles.section} ${styles.sectionShrink}`}>
            <span className={styles.sectionLabel}>Topology</span>
            <div className={styles.pills}>
              {(["single", "multi"] as Topology[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`${styles.pill} ${topology === t ? styles.pillActive : ""}`}
                  onClick={() => setTopology(t)}
                >
                  {t === "single" ? "Single-cluster" : "Multi-cluster"}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className={styles.section}>
        <span className={styles.sectionLabel}>Planes</span>
        <div className={styles.planesGrid}>
          {PLANES.map((p) => {
            const isOn = planeEnabled[p.id as keyof typeof planeEnabled];
            return (
              <button
                key={p.id}
                type="button"
                disabled={p.required}
                className={`${styles.planeCard} ${isOn ? styles.planeCardOn : ""} ${p.required ? styles.planeCardRequired : ""}`}
                onClick={() => {
                  if (p.id === "workflow") setWorkflow((v) => !v);
                  if (p.id === "observability") setObs((v) => !v);
                }}
              >
                <span className={`${styles.planeCheck} ${isOn ? styles.planeCheckOn : ""}`}>
                  {isOn && (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4L3.5 6.5L9 1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </span>
                <span className={styles.planeName}>{p.label}</span>
                <span className={styles.planeDesc}>{p.desc}</span>
                {p.required && <span className={styles.planeReqBadge}>required</span>}
              </button>
            );
          })}
        </div>
      </div>

      <div className={styles.section}>
        <span className={styles.sectionLabel}>Prompt</span>
        <CodeBlock>{prompt}</CodeBlock>
      </div>

    </div>
  );
}
