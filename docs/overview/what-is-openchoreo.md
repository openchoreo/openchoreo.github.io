---
layout: docs
title: What is OpenChoreo
---

# What is OpenChoreo?

OpenChoreo is an open-source Internal Developer Platform (IDP) that makes Kubernetes accessible to development teams. It
provides a complete platform engineering solution that transforms complex infrastructure into simple, self-service
developer experiences.

OpenChoreo brings the best ideas from [WSO2 Choreo](https://choreo.dev) (an enterprise IDP) to the open-source
community.

## Who Should Use OpenChoreo?

OpenChoreo is designed for:

- **Platform Engineering Teams** building internal developer platforms on Kubernetes
- **DevOps Teams** looking to standardize deployments and reduce operational overhead
- **Development Teams** wanting self-service deployment without infrastructure complexity
- **Organizations** seeking to accelerate cloud-native adoption while maintaining security and compliance

## The Problem

Modern cloud-native development has become unnecessarily complex:

- **Kubernetes is powerful but overwhelming**: Developers need to understand pods, services, ingress, ConfigMaps, and
  dozens of other concepts just to deploy a simple application
- **Every team reinvents the wheel**: Without standards, each team creates their own deployment patterns, leading to
  inconsistency and technical debt
- **Security is an afterthought**: Teams often sacrifice security for speed, leaving applications vulnerable
- **Platform building is expensive**: Companies spend months or years building internal platforms from scratch

## How OpenChoreo Solves It

OpenChoreo provides a layered approach with clear separation between platform engineering and development:

**For Platform Engineers:**

- Set up **Data**, **Build**, and **Observability Planes** for infrastructure separation
- Define **Organizations** for multi-tenant isolation
- Configure **Environments** on DataPlanes
- Create **Classes** (ServiceClass, WebApplicationClass) to enforce standards
- Configure **DeploymentPipelines** for promotion workflows

**For Developers:**

- Create **Projects** to organize related services (aligned with DDD bounded contexts)
- Define **Components** for applications
- Specify **Workloads** with runtime configurations
- Deploy **applications** (Services, WebApplications, ScheduledTasks) using platform Classes

The platform automatically handles the complexity of Kubernetes, including:

- [Cell-based isolation](https://github.com/wso2/reference-architecture/blob/master/reference-architecture-cell-based.md)
  with zero-trust networking
- Automatic mTLS for all service communication
- Built-in observability and distributed tracing
- CI/CD pipelines with GitOps workflows
- RBAC and access control

## What Makes OpenChoreo Different

- **Kubernetes Native**: Built as operators extending Kubernetes, not a layer on top
- **Complete Solution**: Includes build, deploy, networking, API management, and observability—not just a UI
- **Open Source**: No vendor lock-in, transparent development, community-driven
- **Separation of Concerns**: Platform engineers define standards through Classes, developers express intent through
  Claims

Built on proven CNCF projects including Cilium (eBPF networking), Buildpacks, Argo (workflows), and Envoy Gateway (API
management).

## Current Status

OpenChoreo is currently in **active development** (v1alpha1). While the core platform is functional, APIs may change as
we incorporate community feedback. We recommend starting with non-production workloads as you evaluate the platform.

See our [Roadmap](https://github.com/orgs/openchoreo/projects/4) for upcoming features and stable release timeline.

## Getting Started

Ready to try OpenChoreo? Start here:

1. **[Architecture](/docs/overview/architecture)** - Understand the multi-plane architecture
2. **[Quick Start Guide](/docs/getting-started/quick-start-guide)** - Try OpenChoreo in minutes using a Dev Container
3. **[Installation Guide](/docs/getting-started/single-cluster)** - Deploy OpenChoreo in your environment
4. **[Concepts](/docs/concepts/developer-abstractions)** - Learn the platform abstractions

## Community

OpenChoreo is an open-source project that welcomes contributions. Join our community:

- [GitHub Discussions](https://github.com/openchoreo/openchoreo/discussions) for questions and ideas
- [Discord](https://discord.com/invite/asqDFC8suT) for real-time chat
- [Contributing Guide](https://github.com/openchoreo/openchoreo/blob/main/docs/contributors/contribute.md) to get
  involved
