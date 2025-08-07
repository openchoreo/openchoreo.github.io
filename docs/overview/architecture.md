---
layout: docs
title: Architecture
---

# OpenChoreo Architecture: Control, Data, Build, and Observability Planes

OpenChoreo follows a **multi-plane architecture** to clearly separate concerns in your internal developer platform. Each plane represents a distinct role and responsibility within the platform engineering setup and is modeled using custom resources (CRs) in the Control Plane.

These planes are usually deployed in separate Kubernetes clusters, although colocated setups are also supported for lightweight environments like local development.

---

## Control Plane

The **Control Plane** is the heart of the OpenChoreo platform. It manages all developer intent and orchestrates platform-wide activities such as deployment, configuration, and lifecycle management.

### Responsibilities

- Hosts key components:
    - OpenChoreo Controller Manager
    - API Server
    - GitOps tools (e.g., Argo CD)
- Manages high-level abstractions like:
    - `DataPlane`, `BuildPlane`, `Organization`, `Environment`, `Deployment Pipeline`. `Project`, `Deployment Track`, `Component`, `Build`, and `Deployment` CRs
- Translates developer intent into actionable configurations
- Maintains the global state of the platform
- Coordinates operations across data and build planes

### Deployment

- Typically deployed in a dedicated Kubernetes cluster
- Can be colocated with a Data Plane or Build Plane for smaller or local setups

---

## Data Plane

The **Data Plane** is where applications are actually deployed and run. It handles the execution of developer-defined workloads such as: Microservices, APIs, and Scheduled Jobs.

Each data plane is modeled as a `DataPlane` custom resource in the Control Plane.

### Multi-Region Support

You can register multiple Data Planes to represent different environments or regions, such as:

- `staging` (e.g., us-west-2)
- `production` (e.g., eu-central-1)

This enables teams to run and manage workloads independently across geographic boundaries.

---

## Build Plane

The **Build Plane** is dedicated to executing continuous integration (CI) workflows. It focuses on tasks such as:

- Building container images
- Running automated tests
- Publishing deployable artifacts

Powered by **Argo Workflows**, the Build Plane runs in its own Kubernetes cluster, isolated from runtime environments.

### Key Benefits

- Better **resource isolation**: build jobs don’t affect application performance
- Easier **security hardening**: build clusters can be locked down separately
- Greater **scalability**: build capacity can be scaled independently

Each Build Plane is (or will be) registered using a `BuildPlane` custom resource, which provides the Control Plane with necessary credentials and connection info for dispatching build jobs.

{: .alert .alert-info}
**💡 Tip:** While the Build Plane is usually deployed independently, it can also be colocated with other planes when resource sharing is acceptable (e.g., during development or in small-scale environments).

---

## Observability Plane

The **Observability Plane** is where observability tools for the deployment are actually deployed and run. This includes OpenSearch which is the logs collector for the deployment and also Prometheus which is used for Monitoring metrics in the deployment.

There is no custom resource definition for Observability Plane since apart from setting up the tools which is done at installation via Helm Charts there is no desired state to arrive at.

For logs collection Fluentbit is used and should be installed in the source planes.

### Deployment

- Typically deployed in a dedicated Kubernetes cluster
- Can be colocated with any of the other planes for smaller or local setups
- Uusually paired with the data plane or installed in the same region due to data movement restrictions across geographical boundaries.
- Can also be a non-kubernetes deployment. Instead of setting this up in a Kubernetes cluster you can set it up on bare metal or on a cloud and connect to this. 



---

## Summary

| Plane        | Purpose                                         | Backed By                              |
|--------------|--------------------------------------------------|----------------------------------------|
| Control Plane | Manages intent, state, and orchestration         | Kubernetes + CRDs  |
| Data Plane   | Runs application workloads                        | Kubernetes + Cilium + More             |
| Build Plane  | Executes CI pipelines and builds artifacts        | Kubernetes + Argo Workflows            |
| Observability Plane  | Collects observability data from other planes, processes these and provides on request.        | Kubernetes + OpenSearch + Prometheus            |

OpenChoreo’s plane-based architecture allows you to modularize and scale your internal developer platform with clarity and control.
