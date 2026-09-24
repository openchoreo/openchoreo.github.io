import React, { useEffect, useRef, useState } from "react";
import styles from "./styles.module.css";

const PODS_PER_NODE = 80; // 100 per node at about 80% utilisation

// fluent-bit collectors scale with log volume (pods x log rate), not a flat per-node amount.
// Model: nodes x idle-floor + totPods x rate x per-line. Constants from the bench10 ramp
// regression (~0.04 MiB & ~0.03m per line/s/pod); idle floor from op-baseline (~6 MiB/node).
const LOG_RATE = 3; // log lines/s/pod, realistic average
const FB_NODE_MEM = 0.006;
const FB_NODE_CPU = 0.0025;
const FB_MEM_PER_LINE = 0.00004;
const FB_CPU_PER_LINE = 0.00003;
const METRICS_MEM_PER_POD = 0.0025; // GiB per pod, remote-write metrics agent
const WP_BASE_CPU = 0.3;
const WP_BASE_MEM = 0.5;

// control-plane per-component sizing (bench10 measured @ 3000 components, with headroom)
const CP_PORTAL_MEM = 0.4; // Backstage per replica (request 256Mi, measured ~277 MiB)
const CP_API_MEM = 0.1;
const CP_GW_MEM = 0.1;
const CP_BASE_CPU = 1.0; // controllers + gateway + portal + api at rest
// event-forwarder: linear in catalog size, 1 replica. Fitted across both bench10 ramps
// (stock 17.9 + 0.0252/comp, 10-worker 18.8 + 0.0306/comp).
const CP_EF_BASE_MEM = 18 / 1024;
const CP_EF_MEM_PER_COMP = 0.03 / 1024;

// Observability stacks, assembled from the community observability modules.
// Self-hosted stacks carry an in-cluster datastore; provider-backed ones install only an
// adapter plus a collector that pushes to the managed service, so the in-cluster footprint
// collapses and the cost moves to the vendor bill.
//
// Provenance: the OpenSearch row is measured (bench10: 3 master + 2 data, 4 GiB heap,
// 100 GiB PVC); the OpenObserve row is derived from the vendor's capacity planner; the
// provider-backed rows are sized from their modules' chart requests (see the AWS row
// comment, which applies to all three).
type Stack = {
  id: string;
  label: string;
  modules: string;
  baseLabel: string;
  baseMem: number;
  baseCpu: number;
  memPerKPod: number;
  cpuPerKPod: number;
  selfHosted: boolean;
};

const STACKS: Stack[] = [
  {
    id: "opensearch",
    label: "OpenSearch",
    modules: "OpenSearch logs and tracing, Prometheus metrics",
    baseLabel: "OpenSearch and Prometheus",
    baseMem: 19, // measured idle floor
    baseCpu: 3, // within the measured idle range
    memPerKPod: 0.25, // derived from stress-rate measurement, rescaled to 3 lines/s/pod
    cpuPerKPod: 0.2, // judgment; bench CPU showed no clean growth under backpressure
    selfHosted: true,
  },
  {
    id: "openobserve",
    label: "OpenObserve",
    modules: "OpenObserve logs and tracing, Prometheus metrics",
    baseLabel: "OpenObserve and Prometheus",
    // Growth from "Capacity planning for OpenObserve 1.0" (vendor sheet, 2025-12-16),
    // HA/distributed, light-analytics profile (queriers = 3x ingesters): 32 provisioned
    // variable cores per TB/day (ingest at 9 MB/s/core with 4x spike headroom), memory
    // at the planner's 8 GB/core shape, mapped through the model's 3 lines/s/pod at
    // 200 B (1000 pods ~ 52 GB/day). The floor is NOT from the sheet: the planner
    // targets TB/day and its fixed-service shape (2-core compactor, 8 GB/core nodes)
    // does not describe small installs, so the floor here is the fixed services scaled
    // to sub-100 GB/day plus Prometheus (2 x 500m/2Gi) for metrics. Metadata RDS is
    // external, like the managed PostgreSQL excluded elsewhere in this model.
    baseMem: 10,
    baseCpu: 3,
    memPerKPod: 13,
    cpuPerKPod: 1.6,
    selfHosted: true,
  },
  {
    id: "aws",
    label: "AWS",
    modules: "CloudWatch logs and metrics, X-Ray tracing",
    baseLabel: "CloudWatch and X-Ray adapters",
    // Applies to all three provider-backed rows (their module charts are near-identical):
    // chart requests at HA (x2) for the three query adapters (~50m/128Mi each) plus the
    // tracing OTel collector (~100m/200Mi), plus the plane chart's core (observer,
    // controller, agent: ~0.5 vCPU / 1 GiB of requests at x2). Growth is zero because the
    // query path is load-insensitive (bench: warm query latency flat across the whole
    // ramp) and telemetry shipping is the cloud provider's node agent, billed off-cluster.
    baseMem: 2,
    baseCpu: 1,
    memPerKPod: 0,
    cpuPerKPod: 0,
    selfHosted: false,
  },
  {
    id: "azure",
    label: "Azure",
    modules: "Log Analytics, Azure Monitor, Application Insights",
    baseLabel: "Azure Monitor adapters",
    // Same basis as the AWS row above.
    baseMem: 2,
    baseCpu: 1,
    memPerKPod: 0,
    cpuPerKPod: 0,
    selfHosted: false,
  },
  {
    id: "gcp",
    label: "Google Cloud",
    modules: "Cloud Logging, Cloud Monitoring, Cloud Trace",
    baseLabel: "Google Cloud adapters",
    // Same basis as the AWS row above.
    baseMem: 2,
    baseCpu: 1,
    memPerKPod: 0,
    cpuPerKPod: 0,
    selfHosted: false,
  },
];

const nf = (n: number) =>
  n.toLocaleString(undefined, { maximumFractionDigits: 1 });
const num = (v: string, d: number, mn: number) => Math.max(mn, Number(v) || d);
const pct = (v: number, t: number) => (t > 0 ? Math.round((100 * v) / t) : 0);
const shown = (v: number) => v >= 0.05;

type Part = { label: string; mem: number; cpu: number };
const fmtPart = (pt: Part) => {
  const a: string[] = [];
  if (shown(pt.cpu)) a.push(`${nf(pt.cpu)} vCPU`);
  if (shown(pt.mem)) a.push(`${nf(pt.mem)} GiB`);
  return a.join(", ") || "-";
};

const MAX_ENVS = 6;
// components span two orders of magnitude, so the slider is log-scaled and snapped to
// round numbers; a linear track would bury the 25-200 range most installs sit in.
const COMP_MIN = 25;
const COMP_MAX = 1000;
const snapComp = (v: number) =>
  v < 100
    ? Math.round(v / 5) * 5
    : v < 500
      ? Math.round(v / 10) * 10
      : Math.round(v / 25) * 25;
const compFromPos = (pos: number) =>
  snapComp(COMP_MIN * Math.pow(COMP_MAX / COMP_MIN, pos / 100));
const posFromComp = (c: number) =>
  (100 * Math.log(c / COMP_MIN)) / Math.log(COMP_MAX / COMP_MIN);

function Slider({
  label,
  value,
  display,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  display?: string;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className={styles.slider}>
      <div className={styles.sliderTop}>
        <label>{label}</label>
        <span className={styles.sliderVal}>{display ?? value}</span>
      </div>
      <input
        type="range"
        aria-label={label}
        min={min}
        max={max}
        step={step ?? 1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

function NumRow({
  label,
  value,
  onChange,
  min,
  step,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  min: number;
  step?: number;
}) {
  return (
    <label className={styles.numRow}>
      <span>{label}</span>
      <input
        type="number"
        min={min}
        step={step}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function usePopover() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return { open, toggle: () => setOpen((v) => !v), ref };
}

function PopPanel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className={styles.popPanel} role="dialog" aria-label={title}>
      <div className={styles.popTitle}>{title}</div>
      {children}
    </div>
  );
}

function Advanced({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const pop = usePopover();
  return (
    <div className={styles.pop} ref={pop.ref}>
      <button
        type="button"
        className={styles.popBtn}
        aria-expanded={pop.open}
        onClick={pop.toggle}
      >
        {title}
      </button>
      {pop.open && <PopPanel title={title}>{children}</PopPanel>}
    </div>
  );
}

function Breakdown({ name, parts }: { name: string; parts: Part[] }) {
  const pop = usePopover();
  return (
    <div className={styles.pop} ref={pop.ref}>
      <button
        type="button"
        className={styles.pexp}
        aria-expanded={pop.open}
        aria-label={`Break down ${name}`}
        onClick={pop.toggle}
      >
        <svg
          className={`${styles.chev} ${pop.open ? styles.chevOpen : ""}`}
          viewBox="0 0 16 16"
          width="12"
          height="12"
          aria-hidden="true"
        >
          <path
            d="M6 4l4 4-4 4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {pop.open && (
        <PopPanel title={name}>
          {parts.map((pt) => (
            <div key={pt.label} className={styles.keyRow}>
              <span>{pt.label}</span>
              <span>{fmtPart(pt)}</span>
            </div>
          ))}
        </PopPanel>
      )}
    </div>
  );
}

type Plane = {
  name: string;
  on: boolean;
  locked?: boolean;
  onToggle?: (v: boolean) => void;
  cpuP: number;
  memP: number;
  cpuW: number;
  memW: number;
  parts: Part[];
  mid: React.ReactNode;
};

function PlaneRow({
  plane,
  hot,
  onHover,
}: {
  plane: Plane;
  hot: boolean;
  onHover: () => void;
}) {
  const { name, on, locked, onToggle, mid } = plane;
  const cpu = plane.cpuP + plane.cpuW;
  const mem = plane.memP + plane.memW;
  const parts = plane.parts.filter((pt) => shown(pt.mem) || shown(pt.cpu));
  return (
    <div
      className={`${styles.prow} ${on ? "" : styles.rowOff} ${hot ? styles.rowHot : ""}`}
      onMouseEnter={onHover}
    >
      <label
        className={`${styles.check} ${locked ? styles.checkLocked : ""}`}
        title={locked ? "Always installed" : undefined}
      >
        <input
          type="checkbox"
          checked={on}
          disabled={locked}
          onChange={(e) => onToggle?.(e.target.checked)}
        />
        {name}
      </label>
      <div className={styles.pmid}>
        {on ? mid : <span className={styles.pnote}>not installed</span>}
      </div>
      <span className={styles.pnum}>
        {on ? (
          <>
            {nf(cpu)} <span className={styles.unit}>vCPU</span>
          </>
        ) : (
          "-"
        )}
      </span>
      <span className={styles.pnum}>
        {on ? (
          <>
            {nf(mem)} <span className={styles.unit}>GiB</span>
          </>
        ) : (
          "-"
        )}
      </span>
      {on && parts.length ? <Breakdown name={name} parts={parts} /> : <span />}
    </div>
  );
}

export default function SizingCalculator() {
  const [comp, setComp] = useState(50);
  const [env, setEnv] = useState(2);
  const [avgBuilds, setAvgBuilds] = useState("2");
  const [maxBuilds, setMaxBuilds] = useState("5");
  const [podCpuIn, setPodCpu] = useState("0.1");
  const [podMemIn, setPodMem] = useState("0.25");
  const [replicasIn, setReplicas] = useState("2");
  const [buildCpuIn, setBuildCpu] = useState("1");
  const [buildMemIn, setBuildMem] = useState("2");
  const [wpOn, setWpOn] = useState(true);
  const [opOn, setOpOn] = useState(true);
  const [stackId, setStackId] = useState(STACKS[0].id);
  const [hoverPlane, setHoverPlane] = useState<number | null>(null);

  // clearing the hover keeps the footer from narrating a plane that was just removed
  const togglePlane = (set: (v: boolean) => void) => (v: boolean) => {
    setHoverPlane(null);
    set(v);
  };

  const mc = Math.max(0, Number(maxBuilds) || 0);
  const avg = Math.min(Math.max(0, Number(avgBuilds) || 0), mc);
  const podCpu = num(podCpuIn, 0.1, 0.01);
  const podMem = num(podMemIn, 0.25, 0.01);
  const replicas = num(replicasIn, 2, 1);
  const buildCpu = num(buildCpuIn, 1, 0.1);
  const buildMem = num(buildMemIn, 2, 0.1);

  // One data plane hosting every environment; deployments are components times environments.
  const totDep = comp * env;
  const totPods = totDep * replicas;
  const totNodes = Math.ceil(totPods / PODS_PER_NODE);

  const workCpu = totPods * podCpu;
  const workMem = totPods * podMem;
  const dpAgentCpu = 0.3; // cluster-agent + gateway at rest
  const dpAgentMem = 0.8;
  const dpCollMem =
    totNodes * FB_NODE_MEM + totPods * LOG_RATE * FB_MEM_PER_LINE;
  const dpCollCpu =
    totNodes * FB_NODE_CPU + totPods * LOG_RATE * FB_CPU_PER_LINE;
  const dpMetricMem = METRICS_MEM_PER_POD * totPods;

  // Controllers x2 provisioned at leader size (standby must handle failover). CPU rises
  // with components as openchoreo-api catalog-syncs (bench10: ~0.5 core/replica under sync).
  const ctrlMem = (2 * (40 + 0.05 * totDep)) / 1024;
  const efMem = CP_EF_BASE_MEM + CP_EF_MEM_PER_COMP * comp;
  const cpMem =
    ctrlMem + 2 * CP_API_MEM + 2 * CP_PORTAL_MEM + CP_GW_MEM + efMem;
  const cpCpu = CP_BASE_CPU + 0.5 * (comp / 1000);

  // steady-state sizes to average concurrent builds; node autoscaling absorbs bursts
  const wpCpu = WP_BASE_CPU + avg * buildCpu;
  const wpMem = WP_BASE_MEM + avg * buildMem;

  // Backend floor + gentle growth with telemetry (proxied by total pods). For self-hosted
  // stacks the floor is the datastore's heap; for provider-backed ones it is just adapters.
  const stack = STACKS.find((s) => s.id === stackId) ?? STACKS[0];
  const opMem = stack.baseMem + stack.memPerKPod * (totPods / 1000);
  const opCpu = stack.baseCpu + stack.cpuPerKPod * (totPods / 1000);

  const planes: Plane[] = [
    {
      name: "Control plane",
      on: true,
      locked: true,
      cpuP: cpCpu,
      memP: cpMem,
      cpuW: 0,
      memW: 0,
      parts: [
        { label: "Developer portal", mem: 2 * CP_PORTAL_MEM, cpu: 0 },
        { label: "Controllers", mem: ctrlMem, cpu: 0 },
        { label: "API and gateway", mem: 2 * CP_API_MEM + CP_GW_MEM, cpu: 0 },
        { label: "Catalog event forwarder", mem: efMem, cpu: 0 },
        { label: "Services at rest", mem: 0, cpu: CP_BASE_CPU },
        { label: "API catalog sync", mem: 0, cpu: 0.5 * (comp / 1000) },
      ],
      mid: (
        <span className={styles.pnote}>
          {nf(totDep)} deployments, near-fixed cost
        </span>
      ),
    },
    {
      name: "Data plane",
      on: true,
      locked: true,
      cpuP: dpAgentCpu + dpCollCpu,
      memP: dpAgentMem + dpCollMem + dpMetricMem,
      cpuW: workCpu,
      memW: workMem,
      parts: [
        { label: "Workload pods", mem: workMem, cpu: workCpu },
        {
          label: "Cluster agents and gateway",
          mem: dpAgentMem,
          cpu: dpAgentCpu,
        },
        { label: "Log collectors", mem: dpCollMem, cpu: dpCollCpu },
        { label: "Metrics agent", mem: dpMetricMem, cpu: 0 },
      ],
      mid: (
        <span className={styles.pnote}>
          {nf(totPods)} pods, about {totNodes} nodes
        </span>
      ),
    },
    {
      name: "Workflow plane",
      on: wpOn,
      onToggle: togglePlane(setWpOn),
      cpuP: WP_BASE_CPU,
      memP: WP_BASE_MEM,
      cpuW: avg * buildCpu,
      memW: avg * buildMem,
      parts: [
        { label: "Build pods", mem: avg * buildMem, cpu: avg * buildCpu },
        { label: "Controller and agent", mem: WP_BASE_MEM, cpu: WP_BASE_CPU },
      ],
      mid: (
        <div className={styles.rowFields}>
          <label className={styles.rowField}>
            Max builds
            <input
              type="number"
              min={0}
              max={50}
              value={maxBuilds}
              onChange={(e) => {
                const v = e.target.value;
                if (v === "") {
                  setMaxBuilds("");
                  return;
                }
                const m = Math.min(50, Math.max(0, Number(v) || 0));
                setMaxBuilds(String(m));
                if ((Number(avgBuilds) || 0) > m) setAvgBuilds(String(m));
              }}
            />
          </label>
          <label className={styles.rowField}>
            Average
            <input
              type="number"
              min={0}
              max={mc}
              value={avgBuilds}
              onChange={(e) => {
                const v = e.target.value;
                if (v === "") {
                  setAvgBuilds("");
                  return;
                }
                setAvgBuilds(String(Math.min(Math.max(0, Number(v) || 0), mc)));
              }}
            />
          </label>
        </div>
      ),
    },
    {
      name: "Observability plane",
      on: opOn,
      onToggle: togglePlane(setOpOn),
      cpuP: opCpu,
      memP: opMem,
      cpuW: 0,
      memW: 0,
      parts: [
        { label: stack.baseLabel, mem: stack.baseMem, cpu: stack.baseCpu },
        {
          label: "Telemetry growth",
          mem: stack.memPerKPod * (totPods / 1000),
          cpu: stack.cpuPerKPod * (totPods / 1000),
        },
      ],
      mid: (
        <select
          className={styles.select}
          value={stackId}
          aria-label="Observability stack"
          onChange={(e) => setStackId(e.target.value)}
        >
          {STACKS.map((st) => (
            <option key={st.id} value={st.id}>
              {st.label} ({st.selfHosted ? "self-hosted" : "provider-backed"})
            </option>
          ))}
        </select>
      ),
    },
  ];

  const active = (get: (p: Plane) => number) =>
    planes.reduce((sum, p) => sum + (p.on ? get(p) : 0), 0);
  const totCpu = active((p) => p.cpuP + p.cpuW);
  const totMem = active((p) => p.memP + p.memW);
  const workloadCpu = active((p) => p.cpuW);
  const workloadMem = active((p) => p.memW);

  const bar = (
    getP: (p: Plane) => number,
    getW: (p: Plane) => number,
    tot: number,
  ) => {
    const segs = (get: (p: Plane) => number, cls: string) =>
      planes.map((p, i) =>
        p.on && get(p) > 0 ? (
          <div
            key={`${cls}${i}`}
            className={`${styles.seg} ${cls} ${hoverPlane === i ? styles.segOn : ""}`}
            style={{ width: `${(100 * get(p)) / tot}%` }}
            onMouseEnter={() => setHoverPlane(i)}
          />
        ) : null,
      );
    return (
      <div
        className={`${styles.bar} ${hoverPlane !== null ? styles.barDim : ""}`}
        onMouseLeave={() => setHoverPlane(null)}
      >
        {segs(getP, styles.segSys)}
        {segs(getW, styles.segWork)}
      </div>
    );
  };

  const hovered = hoverPlane !== null ? planes[hoverPlane] : null;

  return (
    <div className={styles.calc}>
      <div className={styles.panel}>
        <div className={styles.controls}>
          <div className={styles.ctrlGrid}>
            <Slider
              label="Components"
              value={posFromComp(comp)}
              display={nf(comp)}
              min={0}
              max={100}
              step={0.1}
              onChange={(pos) => setComp(compFromPos(pos))}
            />
            <Slider
              label="Environments"
              value={env}
              min={1}
              max={MAX_ENVS}
              onChange={setEnv}
            />
          </div>

          <div className={styles.ctrlFoot}>
            <span>
              {nf(totDep)} deployments, {nf(totPods)} pods, about {totNodes}{" "}
              nodes
            </span>
            <Advanced title="Pod profiles">
              <div className={styles.popSection}>Workload pod</div>
              <NumRow
                label="CPU (vCPU)"
                value={podCpuIn}
                min={0.01}
                step={0.05}
                onChange={setPodCpu}
              />
              <NumRow
                label="Memory (GiB)"
                value={podMemIn}
                min={0.01}
                step={0.05}
                onChange={setPodMem}
              />
              <NumRow
                label="Replicas per deployment"
                value={replicasIn}
                min={1}
                onChange={setReplicas}
              />
              <div className={styles.popSection}>Build pod</div>
              <NumRow
                label="CPU (vCPU)"
                value={buildCpuIn}
                min={0.1}
                step={0.5}
                onChange={setBuildCpu}
              />
              <NumRow
                label="Memory (GiB)"
                value={buildMemIn}
                min={0.1}
                step={0.5}
                onChange={setBuildMem}
              />
            </Advanced>
          </div>
        </div>

        <div className={styles.table} onMouseLeave={() => setHoverPlane(null)}>
          <div className={styles.thead}>
            <span>Plane</span>
            <span aria-hidden="true" />
            <span>CPU</span>
            <span>Memory</span>
            <span aria-hidden="true" />
          </div>
          {planes.map((p, i) => (
            <PlaneRow
              key={p.name}
              plane={p}
              hot={hoverPlane === i}
              onHover={() => setHoverPlane(p.on ? i : null)}
            />
          ))}
        </div>

        <div className={styles.share} onMouseLeave={() => setHoverPlane(null)}>
          <p className={styles.summary}>
            You will need roughly <b>{nf(totCpu)} vCPU</b> and{" "}
            <b>{nf(totMem)} GiB</b> in total, with about <b>{totNodes}</b>{" "}
            {totNodes === 1 ? "node" : "nodes"} carrying the data plane.
          </p>
          <div className={styles.shareGrid}>
            <div>
              <div className={styles.shareTop}>
                <span className={styles.shareLabel}>CPU</span>
                <span className={styles.shareVal}>
                  {nf(totCpu)} <span>vCPU</span>
                </span>
              </div>
              {bar(
                (p) => p.cpuP,
                (p) => p.cpuW,
                totCpu,
              )}
            </div>
            <div>
              <div className={styles.shareTop}>
                <span className={styles.shareLabel}>Memory</span>
                <span className={styles.shareVal}>
                  {nf(totMem)} <span>GiB</span>
                </span>
              </div>
              {bar(
                (p) => p.memP,
                (p) => p.memW,
                totMem,
              )}
            </div>
          </div>
          <div className={styles.shareFoot}>
            <span className={styles.legend}>
              <span className={`${styles.dot} ${styles.segWork}`} />
              your workloads
              <span className={`${styles.dot} ${styles.segSys}`} />
              platform
            </span>
            <span className={styles.shareNote}>
              {hovered
                ? `${hovered.name}: ${pct(hovered.cpuP + hovered.cpuW, totCpu)}% of CPU, ${pct(hovered.memP + hovered.memW, totMem)}% of memory`
                : `Your workloads: ${pct(workloadCpu, totCpu)}% of CPU, ${pct(workloadMem, totMem)}% of memory`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
