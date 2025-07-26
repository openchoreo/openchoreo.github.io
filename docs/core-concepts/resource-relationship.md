---
layout: docs
title: Resource Relationships
---

# Logical Entity Relationships in OpenChoreo

This document explains how all OpenChoreo resources work together to form a comprehensive Internal Developer Platform, covering the complete journey from organizational infrastructure setup to application runtime execution.

## 1. Organizational & Infrastructure Foundation

The foundation of OpenChoreo starts with organizational infrastructure that platform engineers establish.

```
Organization (Root Tenant)
├── DataPlane (Runtime Infrastructure)
├── BuildPlane (CI/CD Infrastructure)
├── Environment (Runtime Context: dev/staging/prod)
├── DeploymentPipeline (Environment Promotion Rules)
└── ConfigurationGroup (Shared Configuration & Secrets)
```

**Logical Flow**: Platform engineers establish the foundational infrastructure that developers will use. Each organization gets its own isolated resources, providing multi-tenancy and clear boundaries between different teams or business units.

### Key Components:
- **Organization**: The root tenant that provides namespace isolation
- **DataPlane**: Kubernetes clusters where applications run
- **BuildPlane**: Dedicated infrastructure for CI/CD operations
- **Environment**: Runtime contexts (development, staging, production)
- **DeploymentPipeline**: Rules governing how applications move between environments
- **ConfigurationGroup**: Centralized configuration and secrets management

## 2. Application Development Hierarchy

Developers organize their work within the organizational structure using a clear hierarchy.

```
Organization
└── Project (Application Boundary / Bounded Context)
    ├── Component (Deployable Units)
    │   ├── Has integrated build specifications
    │   ├── References WorkloadClass templates
    │   └── References EndpointClass policies
    └── Workload (Runtime Contract Definition)
```

**Logical Flow**: Developers organize their applications into projects, then define components within those projects.

### Key Concepts:
- **Project**: Represents a bounded context or application boundary
- **Component**: Deployable units with integrated build specifications
- **Workload**: Defines the runtime contract and execution requirements

## 3. Component Type Specialization

Components declare their type, which determines behavior, templates, and deployment patterns.

```
Component
├── Service (Backend APIs & Microservices)
├── WebApplication (Frontend & Full-stack Apps)
├── ScheduledTask (Cron Jobs & Batch Processing)
└── API (API Proxies & Gateways)
```

**Logical Flow**: Each component declares its type, which determines how it behaves, what templates it uses, and how it's deployed. This specialization enables type-specific optimizations and policies.

### Component Types:
- **Service**: Backend APIs, microservices, and business logic components
- **WebApplication**: Frontend applications, SPAs, and full-stack web apps
- **ScheduledTask**: Cron jobs, batch processing, and scheduled workloads
- **API**: API proxies, gateways, and traffic management components

## 4. Template & Deployment Pattern

OpenChoreo uses a template-binding pattern that separates platform standards from environment-specific configurations.

### Platform Templates (Created by Platform Engineers)
```
├── ServiceClass (Service Deployment Templates)
├── WebApplicationClass (WebApp Deployment Templates)
├── ScheduledTaskClass (Task Deployment Templates)
└── APIClass (API Management Policies)
```

### Environment-Specific Instances (Created per Environment)
```
├── ServiceBinding (Service in specific environment)
├── WebApplicationBinding (WebApp in specific environment)
├── ScheduledTaskBinding (Task in specific environment)
└── APIBinding (API in specific environment)
```

**Logical Flow**: Platform engineers create reusable templates that encode organizational standards and policies. For each environment, specific bindings are created that reference these templates but customize them for that environment's specific needs.

### Benefits:
- **Consistency**: Templates ensure consistent deployment patterns
- **Customization**: Bindings allow environment-specific overrides
- **Governance**: Platform teams control standards through templates
- **Flexibility**: Development teams can customize through bindings

## 5. Build-to-Runtime Pipeline

The complete software delivery pipeline from source code to running application.

```
Source Code
    ↓
Component (with build specification)
    ↓
Build (executes on BuildPlane)
    ↓
DeployableArtifact (versioned container + config)
    ↓
ServiceBinding/WebAppBinding/etc. (references artifact)
    ↓
Deployment (environment-specific runtime)
    ↓
Release (actual Kubernetes resources)
```

**Logical Flow**: This represents the complete software delivery pipeline from source code to running application, with clear separation between build and runtime concerns. Each step is versioned and traceable.

### Pipeline Stages:
1. **Source Code**: Developer commits trigger the pipeline
2. **Component**: Defines how to build the application
3. **Build**: Executes the build process on dedicated infrastructure
4. **DeployableArtifact**: Immutable, versioned container image with configuration
5. **Bindings**: Environment-specific instances referencing the artifact
6. **Deployment**: Runtime deployment in target environment
7. **Release**: Actual Kubernetes resources running the application

## 6. Network & Service Exposure

OpenChoreo automatically manages network configuration and service exposure.

```
Component
    ↓
Workload (defines endpoints and connections)
    ↓
Service/WebApplication/API (component-specific configuration)
    ↓
Endpoint (network-accessible interface)
    ↓
Automatic NetworkPolicy Generation (Cilium)
```

**Logical Flow**: Components declare their network interfaces and dependencies. OpenChoreo automatically generates the necessary network policies and routing configurations using Cilium for zero-trust networking.

### Network Features:
- **Declarative Endpoints**: Components declare what they expose
- **Automatic Policy Generation**: Network policies created automatically
- **Zero-Trust Security**: Default-deny with explicit allow rules
- **Service Discovery**: Automatic service registration and discovery

## 7. Multi-Environment Deployment

One component definition deploys consistently across multiple environments.

```
Single Component
    ↓
Multiple Environment Bindings
├── ServiceBinding (dev) → Deployment (dev cluster)
├── ServiceBinding (staging) → Deployment (staging cluster)
└── ServiceBinding (prod) → Deployment (prod cluster)

Each Deployment
├── References same DeployableArtifact
├── Uses same ServiceClass template
├── Applies environment-specific overrides
└── Deploys to environment-specific DataPlane
```

**Logical Flow**: One component definition can be deployed consistently across multiple environments with environment-specific customizations. This ensures consistency while allowing necessary environment differences.

### Multi-Environment Benefits:
- **Consistency**: Same artifact across all environments
- **Customization**: Environment-specific resource limits, replicas, configurations
- **Isolation**: Each environment deploys to its own DataPlane
- **Traceability**: Clear lineage from source to each environment

## 8. Configuration & Secret Management

Centralized, environment-aware configuration management with secure secret handling.

```
ConfigurationGroup
├── Environment Groups (non-prod, prod)
├── Configuration Keys (database.url, api.key)
└── Values per Environment
    ├── Plain text (for non-sensitive config)
    └── Vault references (for secrets)

Referenced by:
├── Workload (environment variables)
├── ServiceBinding (overrides)
└── Deployment (runtime config)
```

**Logical Flow**: Configuration is centrally managed but environment-aware, with secure handling of secrets through Vault integration. This provides a single source of truth for configuration while maintaining environment isolation.

### Configuration Features:
- **Environment Groups**: Logical grouping of environments (e.g., non-prod, prod)
- **Key-Value Management**: Centralized configuration parameter management
- **Vault Integration**: Secure secret management with external secret stores
- **Reference Pattern**: Multiple resources can reference the same configuration

## 9. Promotion & GitOps Workflow

Automated promotion workflows with proper governance and approval gates.

```
Git Repository
    ↓
GitCommitRequest (automated Git operations)
    ↓
DeploymentPipeline (defines promotion rules)
├── Environment A → Environment B (with approval gates)
├── Environment B → Environment C (with testing)
└── Rollback capabilities

Applied to:
└── ServiceBinding updates (new image versions, config changes)
```

**Logical Flow**: Changes flow through environments according to defined promotion rules, with proper approvals and testing gates. This ensures quality and compliance while maintaining development velocity.

### GitOps Features:
- **Automated Git Operations**: Platform manages Git commits for environment changes
- **Approval Gates**: Required approvals before promotion to sensitive environments
- **Testing Integration**: Automated testing as part of promotion pipeline
- **Rollback Support**: Quick rollback capabilities for failed deployments

## 10. Runtime Execution Model

At runtime, projects become cells with controlled communication boundaries.

```
Project → Cell (Runtime Boundary)
├── Contains all project components
├── Enforces domain boundaries
├── Manages traffic flow patterns:
│   ├── Northbound Ingress (Internet → Cell)
│   ├── Southbound Egress (Cell → Internet)
│   ├── Westbound Ingress (Organization → Cell)
│   └── Eastbound Egress (Cell → Other Cells)
└── Zero-trust networking with Cilium
```

**Logical Flow**: At runtime, projects become cells with controlled communication boundaries and automatic security policy enforcement. This provides strong isolation while enabling necessary communication patterns.

### Cell Features:
- **Domain Boundaries**: Clear separation between different application domains
- **Traffic Control**: Directional traffic management with automatic policy enforcement
- **Zero-Trust Networking**: Default-deny with explicit allow rules
- **Automatic Security**: Network policies generated based on declared dependencies

---

## Key Patterns

### Separation of Concerns

**Platform Engineers**: Manage infrastructure, templates, policies, standards, deployment and runtime management
- Set up DataPlanes and BuildPlanes
- Create ServiceClass and APIClass templates
- Define organizational policies and standards
- Manage infrastructure-level configuration
- Manage deployment pipelines and promotion workflows
- Manage environment-specific configurations

**Developers**: Focus on applications, components, and business logic
- Define Component resources with application logic
- Configure application-specific parameters
- Manage source code and build specifications
- Handle application-level configuration

### Template Inheritance

**Classes define organizational standards and policies**
- ServiceClass templates define how services should be deployed
- APIClass templates define API management policies
- Templates encode organizational best practices and compliance requirements

**Bindings instantiate templates for specific environments**
- ServiceBinding applies ServiceClass template to specific environment
- Bindings can override template defaults with environment-specific values
- Each environment gets its own binding instance

**Deployments represent actual running instances**
- Deployment resources represent actual runtime instances
- Inherit configuration from both templates and bindings
- Apply environment-specific overrides and configurations

### Environment Progression

**Single Definition → Multiple Environments**
- One Component definition deploys to multiple environments
- Same DeployableArtifact used across all environments
- Consistent application behavior across environment boundaries

**Consistent Templates → Environment-Specific Overrides**
- Templates provide consistent baseline configuration
- Bindings apply environment-specific customizations
- Overrides handle differences in resource requirements, scaling, etc.

**Controlled Promotion → Automated Testing & Approval**
- DeploymentPipeline defines promotion rules and gates
- Automated testing validates changes before promotion
- Approval workflows ensure proper governance

### Configuration Hierarchy

**Global Configuration → Environment Groups → Specific Environments**
- ConfigurationGroup defines configuration at multiple levels
- Environment groups (e.g., non-prod, prod) provide logical grouping
- Specific environments can override group defaults

**Template Defaults → Binding Overrides → Runtime Values**
- Templates provide default configuration values
- Bindings can override template defaults for specific environments
- Runtime deployments use the final resolved configuration

**Plain Configuration + Secure Secrets (Vault)**
- Non-sensitive configuration stored as plain text
- Sensitive configuration referenced from external secret stores
- Vault integration provides secure secret management

---

## Conclusion

This logical model enables OpenChoreo to provide a comprehensive Internal Developer Platform that scales from simple single-service applications to complex multi-service systems across multiple environments and clusters, while maintaining clear boundaries between platform and application concerns.

The platform achieves this through:

1. **Clear Separation of Concerns**: Platform engineers, developers, and operators each have well-defined responsibilities
2. **Template-Based Standardization**: Reusable templates ensure consistency while allowing customization
3. **Environment-Aware Deployment**: Single definitions deploy consistently across multiple environments
4. **Integrated Build Pipeline**: Seamless integration from source code to running applications
5. **Automated Network Security**: Zero-trust networking with automatic policy generation
6. **Centralized Configuration Management**: Environment-aware configuration with secure secret handling
7. **GitOps Workflow Integration**: Automated promotion with proper governance and approval gates
8. **Runtime Cell Model**: Strong isolation boundaries with controlled communication patterns

This comprehensive approach enables organizations to build, deploy, and operate cloud-native applications at scale while maintaining security, compliance, and operational excellence.
