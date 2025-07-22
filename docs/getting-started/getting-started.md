---
layout: docs
title: Getting Started
---

# Getting Started with OpenChoreo

Welcome to OpenChoreo! This guide will help you get up and running with OpenChoreo quickly.

## What is OpenChoreo?

OpenChoreo is a complete, open-source Internal Developer Platform (IDP) designed to streamline developer workflows, simplify complexity, and deliver secure, scalable developer portals without building everything from scratch.

## Prerequisites

Before you begin, ensure you have:

- A Kubernetes cluster (local or cloud)
- `kubectl` configured to access your cluster
- Helm 3.x installed
- Docker (for local development)

## Quick Start Options

Choose the option that best fits your needs:

### Option 1: Quick Local Setup
Perfect for trying out OpenChoreo locally with minimal setup.

```bash
# Coming soon - single command setup
```

### Option 2: Full Kubernetes Installation
Ideal for understanding the full platform architecture.

```bash
# Add OpenChoreo Helm repository
helm repo add openchoreo https://openchoreo.github.io/helm-charts
helm repo update

# Install OpenChoreo
helm install openchoreo openchoreo/openchoreo --namespace openchoreo-system --create-namespace
```

## Next Steps

1. **[Installation Guide](/docs/guides/install/)** - Detailed installation instructions
2. **[Basic Configuration](/docs/install/configuration/basic/)** - Configure OpenChoreo for your environment
3. **[Your First Project](/docs/getting-started/first-project/)** - Create and deploy your first application

## Need Help?

- **Documentation**: Browse our [comprehensive guides](/docs/guides/)
- **Community**: Join our [Discord community](https://discord.com/invite/asqDFC8suT)
- **Issues**: Report problems on [GitHub Issues](https://github.com/openchoreo/openchoreo/issues)

---

Ready to dive deeper? Continue with our detailed guides or explore the platform architecture.