---
layout: docs
title: Navigating OpenChoreo
---

# Navigating OpenChoreo

OpenChoreo serves two primary personas, each with distinct responsibilities and workflows. **Platform Engineers** focus on setting up and maintaining the underlying infrastructure, security policies, and developer experience standards that enable self-service capabilities. They establish organizational boundaries, configure multi-cluster deployments, define golden path templates, and ensure compliance and operational excellence across the platform.

**Developers** interact with OpenChoreo's high-level abstractions to build, deploy, and operate applications without needing deep infrastructure knowledge. They create projects and components, configure service dependencies, manage application lifecycles, and leverage the platform's automated build, deployment, and observability capabilities to focus on delivering business value.

These complementary roles work together to create an Internal Developer Platform that balances developer productivity with operational control, security, and scalability.

## How Platform Engineers Set Up the Platform

Platform engineers are responsible for establishing the foundational infrastructure and policies that enable developer self-service:

### Infrastructure Setup
- **Install OpenChoreo Control Plane**: Deploy the core platform components using Helm charts
- **Configure Data Planes, Build Planes and Observability Plane**: Set up Kubernetes clusters with Cilium networking and required operators and tools using Helm charts
- **Establish Environments**: Define development, staging, and production environments with appropriate policies

### Platform Configuration
- **Organization Structure**: Create organizations and define access policies for different teams
- **Security Policies**: Configure Cilium network policies, mTLS certificates, and RBAC rules
- **Observability Stack**: Set up monitoring, logging, and tracing infrastructure (Prometheus and OpenSearch)
- **CI/CD Pipelines**: Configure Argo Workflows for automated build and deployment processes

### Golden Path Definition
- **Component Templates**: Create standardized templates for common application patterns
- **Deployment Policies**: Define promotion workflows
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
- **Commit and Push**: Connect application code into components
- **Build and Deploy**: Automatic build and deployment based on template definitions
- **Environment promotion**: Applications move through environments based on defined workflows
- **Monitoring Access**: Built-in observability provides insights into application performance

### Self-Service Operations
- **Configuration Management**: Update environment variables and secrets through the platform
- **Scaling**: Adjust resource allocation and replica counts as needed in templates
- **Troubleshooting**: Access logs, metrics, and traces through unified interfaces

The detailed workflows below explain how platform engineers and developers can accomplish these tasks using OpenChoreo's abstractions and tools.

## Workflows and Processes

OpenChoreo enables distinct workflows for platform engineers and developers, each optimized for their specific responsibilities and goals. Platform engineers focus on infrastructure setup and governance, while developers focus on application development and deployment.

### Platform Engineering Workflows

Platform engineers use OpenChoreo to build and maintain Internal Developer Platforms that abstract infrastructure complexity while providing security, compliance, and operational control.

#### Platform Setup and Configuration

##### 1. Multi-Tenant Platform Initialization

**Objective**: Establish organizational boundaries and multi-tenancy

**Workflow Steps**:
1. **Create Organization** - Define cluster-scoped tenant boundaries
   ```yaml
   apiVersion: choreo.dev/v1alpha1
   kind: Organization
   metadata:
     name: acme-corp
   ```

2. **Configure DataPlanes** - Set up target Kubernetes clusters
   - Define cluster connection details and credentials
   - Configure container registries and authentication
   - Set up gateway configuration for ingress traffic
   - Integrate observability endpoints

3. **Configure BuildPlanes** - Set up dedicated build infrastructure
   - Provision separate clusters for CI/CD operations  
   - Configure Argo Workflows integration
   - Set up build monitoring and logging
   - Isolate build workloads from runtime environments

**Outcomes**: Secure, multi-tenant platform foundation with separated build and runtime infrastructure

##### 2. Environment and Pipeline Configuration

**Objective**: Define runtime contexts and promotion workflows

**Workflow Steps**:
1. **Create Environments** - Define deployment targets
   ```yaml
   apiVersion: choreo.dev/v1alpha1
   kind: Environment
   spec:
     dataPlaneRef: "production-cluster"
     isProduction: true
     gateway:
       dnsPrefix: "prod"
       enableJWTAuth: true
   ```

2. **Configure DeploymentPipelines** - Define promotion paths
   - Set up environment transition rules (dev → staging → prod)
   - Configure approval workflows and quality gates
   - Define automated testing integration points
   - Set up rollback mechanisms

3. **Set up ConfigurationGroups** - Manage environment-specific configuration
   - Configure Vault integration for secrets management
   - Set up environment groups to reduce duplication
   - Define configuration inheritance and overrides
   - Implement configuration approval workflows

**Outcomes**: Structured environment progression with automated promotion, quality gates, and secure configuration management

#### Platform Governance and Operations

##### 3. Security and Compliance Management

**Objective**: Implement zero-trust networking and compliance controls

**Workflow Steps**:
1. **Network Policy Management**
   - Define organization-wide security baselines
   - Configure Cilium and eBPF integration
   - Set up automatic policy generation from component declarations
   - Implement traffic flow controls (northbound/southbound/eastbound/westbound)

2. **Secret and Configuration Governance**
   - Configure Vault CSI integration
   - Set up secret rotation and lifecycle management
   - Implement configuration change approval workflows
   - Define audit logging and compliance reporting

3. **Multi-Cluster Security**
   - Configure cross-cluster mTLS communication
   - Set up cluster-specific security policies
   - Implement tenant isolation controls
   - Define disaster recovery and backup procedures

**Outcomes**: Secure, compliant platform with zero-trust networking and automated policy enforcement

##### 4. Template and Standards Management

**Objective**: Provide standardized deployment patterns and golden paths

**Workflow Steps**:
1. **Create Component Classes** - Define reusable deployment templates
   ```yaml
   apiVersion: choreo.dev/v1alpha1
   kind: ServiceClass
   spec:
     deploymentTemplate:
       # Standard deployment configuration
     serviceTemplate:
       # Standard service configuration
   ```

2. **Golden Path Definition**
   - Create ServiceClass, WebApplicationClass, ScheduledTaskClass, APIClass templates
   - Define standard resource limits, security policies, and configurations
   - Set up monitoring and observability integration
   - Provide documentation and best practices

3. **Platform Evolution**
   - Monitor usage patterns and developer feedback
   - Update templates based on operational learnings
   - Implement new component types for emerging needs
   - Manage V1 → V2 resource migrations

**Outcomes**: Standardized, secure deployment patterns that reduce developer cognitive load while maintaining platform consistency

#### Platform Monitoring and Optimization

##### 5. Observability and Performance Management

**Objective**: Maintain platform health and optimize resource utilization

**Workflow Steps**:
1. **Observer API Integration**
   - Configure centralized logging across all clusters
   - Set up build log collection and analysis
   - Implement real-time monitoring dashboards
   - Define alerting and incident response procedures

2. **Resource Optimization**
   - Monitor resource utilization across DataPlanes and BuildPlanes
   - Optimize cluster autoscaling and resource allocation
   - Implement cost management and allocation
   - Perform capacity planning and scaling decisions

3. **Platform Health Management**
   - Monitor controller performance and reconciliation loops
   - Track API server performance and latency
   - Implement backup and disaster recovery procedures
   - Manage platform upgrades and maintenance windows

**Outcomes**: Highly observable, optimized platform with proactive monitoring and efficient resource utilization

### Developer Workflows

Developers use OpenChoreo's abstractions to focus on application logic while the platform handles infrastructure concerns automatically.

#### Application Development and Deployment

##### 1. Project and Component Setup

**Objective**: Define applications and their deployable components

**Workflow Steps**:
1. **Create Project** - Define application boundary
   ```yaml
   apiVersion: choreo.dev/v1alpha1
   kind: Project
   metadata:
     name: payment-service
     namespace: acme-corp
   spec:
     deploymentPipelineRef: "standard-pipeline"
   ```

2. **Define ComponentV2** - Create deployable units
   ```yaml
   apiVersion: choreo.dev/v1alpha1
   kind: ComponentV2
   spec:
     componentOwner:
       projectRef: "payment-service"
     componentType: "Service"
     buildSpecInComponent:
       repository: "https://github.com/acme/payments"
       buildTemplate: "docker-build"
   ```

3. **Configure Workload Specifications**
   - Define container requirements and resource limits
   - Specify endpoints and connection dependencies
   - Configure environment variables and secrets
   - Set up health checks and readiness probes

**Outcomes**: Well-defined application structure with clear component boundaries and build integration

##### 2. Build and Artifact Management

**Objective**: Transform source code into deployable artifacts

**Workflow Steps**:
1. **Build Execution** - Automatic BuildV2 creation from ComponentV2
   - ComponentV2 specifications trigger BuildV2 resource creation
   - Argo Workflows execute builds on dedicated BuildPlanes
   - Support for Docker and Buildpack build strategies
   - Build status tracking and logging through Observer API

2. **Artifact Creation** - Generate DeployableArtifacts
   - Successful builds produce versioned container images
   - DeployableArtifacts package images with configuration
   - Artifact promotion across environments
   - Integration with container registries and security scanning

3. **Build Pipeline Integration**
   - CI/CD systems trigger builds on code changes
   - Automated testing integration with build processes
   - Build caching and optimization for faster iterations
   - Build failure notifications and debugging support

**Outcomes**: Reliable, automated build processes that produce secure, versioned artifacts ready for deployment

##### 3. Environment-Specific Deployment

**Objective**: Deploy applications across multiple environments with consistency

**Workflow Steps**:
1. **Binding Creation** - Create environment-specific instances
   ```yaml
   apiVersion: choreo.dev/v1alpha1
   kind: ServiceBinding
   spec:
     serviceClassRef: "standard-service"
     environmentRef: "development"
     workload:
       # Environment-specific overrides
   ```

2. **Deployment Generation** - Automatic deployment creation
   - ServiceBinding/WebApplicationBinding creates Deployment resources
   - Deployment resources manage actual Kubernetes objects
   - Environment-specific configuration injection
   - Network policy and security policy application

3. **Release Management** - Runtime resource management
   - Release resources manage arbitrary Kubernetes resources
   - Support for HPA, PDB, NetworkPolicy, and custom resources
   - Health status tracking and lifecycle management
   - Rollback capabilities for failed deployments

**Outcomes**: Consistent deployments across environments with environment-specific customization and automated resource management

#### Application Operations and Maintenance

##### 4. Service Integration and Networking

**Objective**: Configure service communication and external integrations

**Workflow Steps**:
1. **Endpoint Configuration** - Define service interfaces
   ```yaml
   apiVersion: choreo.dev/v1alpha1
   kind: Endpoint
   spec:
     backendRef:
       componentRef: "payment-api"
     visibility: "organization"
     protocols: ["HTTP", "gRPC"]
   ```

2. **Connection Management** - Define service dependencies
   - Configure connections to other components
   - Set up external service integrations
   - Define connection-level policies (timeouts, retries)
   - Implement service discovery and load balancing

3. **Network Security** - Automatic policy generation
   - Cilium network policies generated from Endpoints and Connections
   - Zero-trust networking with mTLS for internal communication
   - Traffic flow control (ingress/egress patterns)
   - Integration with API gateways and service meshes

**Outcomes**: Secure, well-connected services with automatic network policy enforcement and service discovery

##### 5. Configuration and Secret Management

**Objective**: Manage application configuration across environments

**Workflow Steps**:
1. **Configuration Definition** - Use ConfigurationGroups
   ```yaml
   apiVersion: choreo.dev/v1alpha1
   kind: ConfigurationGroup
   spec:
     configurations:
       - key: "database.url"
         values:
           - environmentGroupRef: "non-production"
             value: "postgresql://dev-db:5432/payments"
           - environmentGroupRef: "production"
             vaultKey: "secret/prod/database/url"
   ```

2. **Environment-Specific Overrides**
   - Define configuration values per environment group
   - Use Vault integration for sensitive data
   - Implement configuration inheritance and overrides
   - Support dynamic configuration updates

3. **Secret Lifecycle Management**
   - Vault CSI integration for secure secret injection
   - Automatic secret rotation and lifecycle management
   - Audit logging for secret access and modifications
   - Role-based access control for configuration management

**Outcomes**: Secure, environment-aware configuration management with proper secret handling and audit trails

#### Deployment and Promotion Workflows

##### 6. Progressive Delivery and Promotion

**Objective**: Safely promote applications through environment stages

**Workflow Steps**:
1. **Development Environment Deployment**
   - Developers commit code changes to Git repositories
   - CI/CD systems trigger Build creation and execution
   - Successful builds create DeployableArtifacts
   - Automatic deployment to development environment

2. **Staging Environment Promotion**
   - DeploymentPipeline governs promotion from dev → staging
   - Automated testing and validation in staging environment
   - Configuration and dependency verification

3. **Production Environment Promotion**
   - Manual or automated approval for production promotion
   - Comprehensive testing and security validation
   - Gradual rollout with canary or blue-green deployment
   - Monitoring and observability during promotion

**Outcomes**: Safe, controlled application promotion with comprehensive testing, validation, and monitoring
