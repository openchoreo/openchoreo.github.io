import React, { useState } from "react";
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

const ENV_PROMPT: Record<Env, { single: string; multi: string }> = {
  "k3d": {
    single: "Install OpenChoreo locally on k3d.",
    multi: "Install OpenChoreo locally on k3d using a multi-cluster topology.",
  },
  "rancher-desktop": {
    single: "Install OpenChoreo on Rancher Desktop.",
    multi: "Install OpenChoreo on Rancher Desktop using a multi-cluster topology.",
  },
  "gke": {
    single: "Install OpenChoreo on GKE.",
    multi: "Install OpenChoreo on GKE using a multi-cluster topology.",
  },
  "eks": {
    single: "Install OpenChoreo on EKS.",
    multi: "Install OpenChoreo on EKS using a multi-cluster topology.",
  },
  "aks": {
    single: "Install OpenChoreo on AKS.",
    multi: "Install OpenChoreo on AKS using a multi-cluster topology.",
  },
  "self-managed": {
    single: "Install OpenChoreo on my Kubernetes cluster.",
    multi: "Install OpenChoreo on my Kubernetes cluster using a multi-cluster topology.",
  },
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

function buildPrompt(
  env: Env,
  topology: Topology,
  workflow: boolean,
  obs: boolean,
  version: string,
): string {
  const target = ENV_PROMPT[env][topology];

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

  return `${target} Use version ${version}. ${planes}`;
}

interface Props {
  currentVersion?: string;
}

export default function AgentSetupBuilder({ currentVersion }: Props) {
  const version = currentVersion ? resolveVersion(currentVersion) : "next";

  const [env, setEnv] = useState<Env>("k3d");
  const [topology, setTopology] = useState<Topology>("single");
  const [workflow, setWorkflow] = useState(true);
  const [obs, setObs] = useState(true);
  const [copied, setCopied] = useState(false);

  const prompt = buildPrompt(env, topology, workflow, obs, version);

  function handleCopy() {
    navigator.clipboard.writeText(prompt).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }

  const planeEnabled = { control: true, data: true, workflow, observability: obs };

  return (
    <div className={styles.builder}>

      <div className={styles.section}>
        <span className={styles.sectionLabel}>Environment</span>
        <div className={styles.pills}>
          {ENVS.map(({ id, label }) => (
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

      <div className={styles.section}>
        <span className={styles.sectionLabel}>Cluster topology</span>
        <div className={styles.topoGrid}>
          {(["single", "multi"] as Topology[]).map((t) => (
            <button
              key={t}
              type="button"
              className={`${styles.topoCard} ${topology === t ? styles.topoCardActive : ""}`}
              onClick={() => setTopology(t)}
            >
              <span className={styles.topoRadio}>
                <span className={topology === t ? styles.topoRadioDot : ""} />
              </span>
              <span className={styles.topoText}>
                <span className={styles.topoTitle}>
                  {t === "single" ? "Single cluster" : "Multi-cluster"}
                </span>
                <span className={styles.topoDesc}>
                  {t === "single"
                    ? "All planes on one cluster"
                    : "One cluster per plane"}
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>

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

      <div className={styles.outputSection}>
        <div className={styles.outputHeader}>
          <span className={styles.outputLabel}>Paste into your agent</span>
          <button
            type="button"
            className={`${styles.copyBtn} ${copied ? styles.copyBtnDone : ""}`}
            onClick={handleCopy}
          >
            {copied ? (
              <>
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <path d="M2 7L5 10L11 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Copied
              </>
            ) : (
              <>
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <rect x="4.5" y="1.5" width="7" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
                  <path d="M8.5 1.5V1C8.5 0.724 8.276 0.5 8 0.5H2C1.448 0.5 1 0.948 1 1.5V9C1 9.552 1.448 10 2 10H3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
                Copy
              </>
            )}
          </button>
        </div>
        <div className={styles.outputText}>{prompt}</div>
      </div>

    </div>
  );
}
