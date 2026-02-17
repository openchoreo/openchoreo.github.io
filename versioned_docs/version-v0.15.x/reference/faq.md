---
title: Frequently Asked Questions (FAQ)
---

# Frequently Asked Questions (FAQ)

## General Questions

### What is OpenChoreo?
OpenChoreo is an open-source Internal Developer Platform (IDP) that simplifies cloud-native application development by providing developer-friendly abstractions over complex Kubernetes and cloud-native technologies.

### How is OpenChoreo different from other platforms?
OpenChoreo focuses on:
- **Developer Experience**: Simple abstractions without losing Kubernetes power
- **Security by Default**: Built-in security with cell-based architecture
- **CNCF Integration**: Orchestrates best-in-class cloud-native tools
- **Open Source**: Community-driven development with no vendor lock-in

### What are the main benefits of using OpenChoreo?
- **Faster Time to Market**: Deploy applications in minutes instead of days
- **Reduced Complexity**: Focus on business logic instead of infrastructure
- **Production Ready**: Enterprise-grade capabilities from day one
- **Consistent Environments**: Identical configurations across all stages

---

## Getting Started

### What are the prerequisites for OpenChoreo?
- **Kubernetes Cluster**: Version 1.24 or later
- **kubectl**: Configured to access your cluster
- **Helm**: Version 3.8 or later (for installation)
- **Container Registry**: For storing application images

### How do I install OpenChoreo?
Choose your path:
- **Quick Try**: [Run Locally](../getting-started/try-it-out/on-k3d-locally.mdx) or [On Your Environment](../getting-started/try-it-out/on-your-environment.mdx)
- **Production**: See the [Operations Guide](../operations/deployment-topology.mdx) for production configuration

### Can I try OpenChoreo locally?
Yes! The [local setup guide](../getting-started/try-it-out/on-k3d-locally.mdx) lets you try OpenChoreo on your laptop with k3d.

### What's the simplest way to deploy my first application?
Follow [Deploying your first component](../getting-started/deploy-first-component.mdx)

---

## Architecture & Concepts

### What is a "Cell" in OpenChoreo?
A Cell is OpenChoreo's security boundary that:
- Isolates applications using Kubernetes namespaces
- Enforces network policies with Cilium
- Provides encrypted communication with mTLS
- Implements identity-based access controls
- Usually this is a Project in OpenChoreo

### How does OpenChoreo handle multi-environment deployments?
OpenChoreo uses Environment abstractions that:
- Define deployment targets (dev, staging, prod)
- Apply environment-specific configurations
- Enforce resource quotas and policies
- Enable promotion workflows between environments

### What's the difference between a Project and a Component?
- **Project**: A logical grouping of related components (e.g., an e-commerce platform)
- **Component**: An individual deployable unit (e.g., user-service, payment-api)

### How does OpenChoreo integrate with existing CI/CD pipelines?
OpenChoreo provides:
- **CLI tools** for integration with any CI system
- **GitHub Actions** for seamless GitHub workflows
- **Webhooks** for custom integrations
- **API endpoints** for programmatic access

---

## Performance & Deployment

### What are the resource requirements for OpenChoreo?
**Control Plane (minimum)**:
- **CPU**: 2 cores
- **Memory**: 4 GB RAM (8 GB recommended with observability plane)
- **Storage**: 20 GB

### Can OpenChoreo work with multiple clusters?
Yes, you can setup the following patterns
- **All in one cluster**: Where all the planes are in a single cluster
- **Combined clusters**: Where a combination of planes are together spread across multiple clusters
   e.g. control plane separate and others together, observability plane separate and others together
- **Totally seperated clusters**: Where each plane has it's own cluster. Note that this is not usually for a local setup.

---

## Licensing & Support

### What license does OpenChoreo use?
OpenChoreo is licensed under the **Apache 2.0 License**, ensuring:
- **Free commercial use**
- **No vendor lock-in**
- **Community contributions welcome**
- **Enterprise-friendly terms**

### Where can I get help?
- **Documentation**: Comprehensive guides at [openchoreo.dev](../overview/what-is-openchoreo.mdx)
- **Community Forum**: GitHub Discussions for questions
- **Chat**: Real-time help on Discord
- **Issues**: Bug reports on GitHub Issues

### Is there commercial support available?
Not yet

### How can I contribute to OpenChoreo?
- **Code Contributions**: Submit pull requests on GitHub
- **Documentation**: Improve guides and tutorials
- **Community Support**: Help answer questions
- **Bug Reports**: File issues with detailed information

---

**Can't find your question?**

- Search our [documentation](../overview/what-is-openchoreo.mdx)
- Ask in [GitHub Discussions](https://github.com/openchoreo/openchoreo/discussions)
- Join our [Discord channel](https://discord.com/invite/asqDFC8suT)
