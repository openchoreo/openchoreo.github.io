---
layout: docs
title: Navigating OpenChoreo
---

# Navigating OpenChoreo

## How Platform Engineers Set Up the Platform

Platform engineers are responsible for establishing the foundational infrastructure and policies that enable developer self-service:

### Infrastructure Setup
- **Install OpenChoreo Control Plane**: Deploy the core platform components using Helm charts
- **Configure Data Planes**: Set up Kubernetes clusters with Cilium networking and required operators
- **Establish Environments**: Define development, staging, and production environments with appropriate policies

### Platform Configuration
- **Organization Structure**: Create organizations and define access policies for different teams
- **Security Policies**: Configure Cilium network policies, mTLS certificates, and RBAC rules
- **Observability Stack**: Set up monitoring, logging, and tracing infrastructure (Prometheus, OpenSearch, Jaeger)
- **CI/CD Pipelines**: Configure Argo Workflows for automated build and deployment processes

### Golden Path Definition
- **Component Templates**: Create standardized templates for common application patterns
- **Deployment Policies**: Define promotion workflows and approval processes
- **Resource Quotas**: Set limits and constraints for different environments and teams

## How Developers Add Applications

Developers interact with OpenChoreo through high-level abstractions that hide infrastructure complexity:

### Project Creation
- **Initialize Project**: Create a new project representing a bounded context or business domain
- **Define Components**: Specify services, workers, or scheduled tasks within the project
- **Configure Endpoints**: Set up API endpoints with appropriate visibility scopes

### Application Development
- **Source Integration**: Connect Git repositories to trigger automated builds
- **Local Development**: Use OpenChoreo CLI tools for local testing and debugging
- **Dependency Management**: Declare connections to other services or external resources

### Deployment Process
- **Commit and Push**: Standard Git workflow triggers OpenChoreo's CI/CD pipelines
- **Automated Testing**: Built-in testing phases ensure code quality before promotion
- **Environment promotion**: Applications move through environments based on defined workflows
- **Monitoring Access**: Built-in observability provides insights into application performance

### Self-Service Operations
- **Configuration Management**: Update environment variables and secrets through the platform
- **Scaling**: Adjust resource allocation and replica counts as needed
- **Troubleshooting**: Access logs, metrics, and traces through unified interfaces