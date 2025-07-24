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

## Getting Started

### What are the prerequisites for OpenChoreo?
- **Kubernetes Cluster**: Version 1.24 or later
- **kubectl**: Configured to access your cluster
- **Helm**: Version 3.8 or later (for installation)
- **Container Registry**: For storing application images

### How do I install OpenChoreo?
```bash
# Add the OpenChoreo Helm repository
helm repo add openchoreo https://charts.openchoreo.dev
helm repo update

# Install OpenChoreo in the openchoreo-system namespace
helm install openchoreo openchoreo/openchoreo \
  --namespace openchoreo-system \
  --create-namespace
```

### Can I try OpenChoreo locally?
Yes! Use k3d or kind to create a local Kubernetes cluster:
```bash
# Create local cluster with k3d
k3d cluster create openchoreo-local

# Install OpenChoreo
helm install openchoreo openchoreo/openchoreo \
  --namespace openchoreo-system \
  --create-namespace
```

### What's the simplest way to deploy my first application?
1. Create a component definition:
```yaml
apiVersion: choreo.dev/v1
kind: Component
metadata:
  name: hello-world
spec:
  type: service
  runtime: nodejs
  source:
    git:
      repository: https://github.com/your-org/hello-world
  endpoints:
    - name: web
      port: 3000
```

2. Apply it to your cluster:
```bash
kubectl apply -f hello-world.yaml
```

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

## Security

### How does OpenChoreo secure applications by default?
- **Network Isolation**: Default-deny network policies
- **mTLS Communication**: Automatic encryption between services
- **RBAC Integration**: Kubernetes-native access control
- **Pod Security Standards**: Enforced security contexts

### Can I use my own certificates?
Yes, OpenChoreo supports:
- **Custom CA certificates** for your organization
- **External certificate managers** like cert-manager
- **Integration with HSMs** for key management
- **Automatic certificate rotation**

### How does OpenChoreo handle secrets management?
OpenChoreo integrates with:
- **Kubernetes Secrets** as the default option
- **External Secrets Operator** for external secret stores
- **HashiCorp Vault** for enterprise secret management
- **Cloud provider secret services** (AWS Secrets Manager, etc.)

## Troubleshooting

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
Yes, OpenChoreo supports:
- **Multi-cluster management** from a single control plane
- **Cross-cluster networking** with service mesh
- **Disaster recovery** across regions
- **Workload distribution** based on policies

## Integration & Extensibility

### What monitoring tools does OpenChoreo integrate with?
Out-of-the-box integrations:
- **Prometheus** for metrics collection
- **Grafana** for visualization
- **Jaeger** for distributed tracing
- **OpenSearch** for log aggregation

### Can I use my existing service mesh?
OpenChoreo integrates with:
- **Istio** (recommended)
- **Linkerd** (community support)
- **Consul Connect** (experimental)

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
- **Chat**: Real-time help on Slack/Discord
- **Issues**: Bug reports on GitHub Issues

### Is there commercial support available?
- **Community Support**: Free through public channels
- **Professional Services**: Available from certified partners
- **Enterprise Support**: Contact us for SLA-backed support
- **Training**: Workshops and certification programs

### How can I contribute to OpenChoreo?
- **Code Contributions**: Submit pull requests on GitHub
- **Documentation**: Improve guides and tutorials
- **Community Support**: Help answer questions
- **Bug Reports**: File issues with detailed information

## Migration & Adoption

### Can I migrate from my existing platform to OpenChoreo?
OpenChoreo provides:
- **Migration guides** for common platforms
- **Import tools** for existing configurations
- **Gradual adoption** strategies
- **Professional services** for complex migrations

### How do I convince my team to adopt OpenChoreo?
Start with:
- **Proof of concept** with a simple application
- **Cost-benefit analysis** of current vs. OpenChoreo approach
- **Security improvements** demonstration
- **Developer productivity** measurements

### What's the typical adoption timeline?
- **Week 1-2**: Platform setup and team training
- **Week 3-4**: First application deployment
- **Month 2-3**: Team onboarding and process refinement
- **Month 4-6**: Production workload migration

---

**Can't find your question?** 

- Search our [documentation](/)
- Ask in [GitHub Discussions](https://github.com/openchoreo/openchoreo/discussions)
- Join our [community chat](https://slack.openchoreo.dev)
- Contact [support](mailto:support@openchoreo.dev)