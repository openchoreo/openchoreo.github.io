---
layout: docs
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
Refer to [Install guidelines](../getting-started/install-in-your-cluster.md)

### Can I try OpenChoreo locally?
Yes! Use k3d or kind or rancher desktop to create a local kubernetes environment and then follow the [installation guide](../getting-started/install-in-your-cluster.md)

### What's the simplest way to deploy my first application?
Follow [Deploying your first component](../getting-started/deploy-your-first-component.md)

---

## Architecture & Concepts

### What is a "Cell" in OpenChoreo?
A Cell is OpenChoreo's security boundary that:
- Isolates applications using Kubernetes namespaces
- Enforces network policies with Cilium
- Provides encrypted communication with mTLS
- Implements identity-based access controls

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

## Troubleshooting (samples)

### My component is stuck in "Pending" state. What should I check?
1. **Resource availability**: Check if your cluster has sufficient CPU/memory
2. **Image pull issues**: Verify container registry access and image names
3. **Network policies**: Ensure required network access is allowed
4. **RBAC permissions**: Check if service accounts have necessary permissions

```bash
# Check component status
kubectl get components
kubectl describe component <component-name>

# Check underlying resources
kubectl get pods -l choreo.dev/component=<component-name>
kubectl logs -l choreo.dev/component=<component-name>
```

### How do I debug networking issues between components?
1. **Check network policies**:
```bash
kubectl get networkpolicies
kubectl describe networkpolicy <policy-name>
```

2. **Verify service discovery**:
```bash
kubectl get services
kubectl get endpoints
```

3. **Test connectivity**:
```bash
kubectl exec -it <pod-name> -- nslookup <service-name>
kubectl exec -it <pod-name> -- curl <service-name>:<port>
```

### My deployment failed. How do I get more information?
Check the controller logs:
```bash
# OpenChoreo controller logs
kubectl logs -n openchoreo-system deployment/openchoreo-controller

# Component-specific events
kubectl get events --field-selector involvedObject.name=<component-name>
```

### How do I roll back a failed deployment?
```bash
# Check deployment history
kubectl rollout history deployment <deployment-name>

# Roll back to previous version
kubectl rollout undo deployment <deployment-name>

# Roll back to specific revision
kubectl rollout undo deployment <deployment-name> --to-revision=2
```
--- 

## Performance & Scaling

### What are the resource requirements for OpenChoreo?
**Control Plane (minimum)**:
- **CPU**: 2 cores
- **Memory**: 4 GB RAM
- **Storage**: 20 GB

**Per Application (typical)**:
- **CPU**: 100m-500m per component
- **Memory**: 128Mi-512Mi per component
- **Storage**: Depends on application needs

### How does OpenChoreo handle scaling?
- **Horizontal Pod Autoscaler**: Automatic scaling based on CPU/memory
- **Vertical Pod Autoscaler**: Right-sizing of resource requests
- **Cluster Autoscaler**: Node scaling based on resource demands
- **Custom metrics**: Scale based on application-specific metrics

### Can OpenChoreo work with multiple clusters?
Yes, you can setup the following patterns
- **All in one cluster**: Where all the planes are in a single cluster
- **Combined clusters**: Where a combination of planes are together spread across multiple clusters 
   e.g. control plane separate and others together, observability plane separate and others together
- **Totally seperated clsuters**: Where each plan has it's own cluster. Note that this is not usually for a local setup. 

--- 

## Integration & Extensibility

### What monitoring tools does OpenChoreo integrate with?
Out-of-the-box integrations:
- **Prometheus** for metrics collection
- **OpenSearch** for log aggregation

### How do I extend OpenChoreo with custom functionality?
- **Custom Resource Definitions** for new abstractions
- **Admission Controllers** for validation and mutation
- **Operators** for custom reconciliation logic
- **Plugins** via the extensibility framework

### Does OpenChoreo support GitOps?
Yes, full GitOps support with:
- **ArgoCD integration** for declarative deployments
- **Flux integration** for Git-based workflows
- **Multi-repository** support
- **Progressive delivery** patterns

--- 

## Licensing & Support

### What license does OpenChoreo use?
OpenChoreo is licensed under the **Apache 2.0 License**, ensuring:
- **Free commercial use**
- **No vendor lock-in**
- **Community contributions welcome**
- **Enterprise-friendly terms**

### Where can I get help?
- **Documentation**: Comprehensive guides at [docs.openchoreo.dev](/)
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

- Search our [documentation](/)
- Ask in [GitHub Discussions](https://github.com/openchoreo/openchoreo/discussions)
- Join our [Discord channel](https://discord.com/invite/asqDFC8suT)
