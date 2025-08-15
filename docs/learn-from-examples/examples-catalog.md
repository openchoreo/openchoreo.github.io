---
layout: docs
title: Learn from Examples
---

# Learn from Examples

OpenChoreo empowers developers to build cloud-native applications through practical, real-world examples. This section provides comprehensive tutorials that demonstrate OpenChoreo's capabilities across different use cases and complexity levels.

## Categories
We have categorized the samples based on what you might want to do: 
- **[Platform Configuration](#platform-configuration)** - Define and customize foundational platform elements such as organizations, environments, and deployment pipelines according to your organization needs.
- **[Application Deployment](#application-deployment)** - Deploy different types of applications (services, APIs, web apps, tasks) using various programming languages and deployment strategies.

---

## Platform Configuration
When you set up OpenChoreo, certain default resources are automatically created to help you get started quickly:
- A default organization
- A default data plane and build plane
- Three default environments (Dev, Staging, Prod)
- A default deployment pipeline connecting these environments
- A default project to organize applications

OpenChoreo provides abstractions to define:
- **Organizations** – Manage access and group related projects at cluster scope.
- **Environments** – Set up Dev, Staging, and Prod runtime contexts.
- **DataPlanes** – Define Kubernetes clusters for application deployments.
- **BuildPlanes** – Define dedicated Kubernetes clusters for CI/CD operations.
- **DeploymentPipelines** – Automate application rollouts with promotion workflows.

For more details on these concepts, refer to the [Concepts](/docs/concepts/platform-abstractions) documentation.

These default configurations provide a quick starting point. Once you have done some exploration you can start creating the necessary artifacts to match the needs of your organization. You can:

- [Create new environments](https://github.com/openchoreo/openchoreo/tree/main/samples/platform-config/new-environments) in your organization
- [Create a new deployment pipeline](https://github.com/openchoreo/openchoreo/tree/main/samples/platform-config/new-deployment-pipeline) that will link these environments

---

## Application Deployment
These samples help you deploy different types of applications using OpenChoreo. All samples refer to the default setup.

### Component Types

OpenChoreo supports different component types with the modern **Component** resource:

- **[Services](https://github.com/openchoreo/openchoreo/tree/main/samples/from-source/services)** – Backend services & APIs built from source code
  - [Go Service with Docker](https://github.com/openchoreo/openchoreo/tree/main/samples/from-source/services/go-docker-greeter/) - REST API service with Docker build
  - [Go Service with Buildpacks](https://github.com/openchoreo/openchoreo/tree/main/samples/from-source/services/go-google-buildpack-reading-list/) - Service using Cloud Native Buildpacks
  - [Ballerina Service](https://github.com/openchoreo/openchoreo/tree/main/samples/from-source/services/ballerina-buildpack-patient-management/) - Ballerina language service

- **[Web Applications](https://github.com/openchoreo/openchoreo/tree/main/samples/from-source/web-apps/)** – Frontend or full-stack applications
  - [React SPA](https://github.com/openchoreo/openchoreo/tree/main/samples/from-source/web-apps/react-starter/) - Single-page application built from source

- **[Pre-built Applications](https://github.com/openchoreo/openchoreo/tree/main/samples/from-image/)** – Applications deployed from existing container images
  - [Go Greeter Service](https://github.com/openchoreo/openchoreo/tree/main/samples/from-image/go-greeter-service/) - Service deployed from pre-built image
  - [React Web App](https://github.com/openchoreo/openchoreo/tree/main/samples/from-image/react-starter-web-app/) - Web application from pre-built image
  - [GitHub Issue Reporter](https://github.com/openchoreo/openchoreo/tree/main/samples/from-image/issue-reporter-schedule-task/) - Scheduled task with configuration management

- **[Managed APIs](https://github.com/openchoreo/openchoreo/tree/main/samples/apim-samples)** - Exposing services as Managed APIs
  - [Securing a Managed API](https://github.com/openchoreo/openchoreo/tree/main/samples/apim-samples/authentication) - Using a JWT token to secure a Managed API
  - [Circuit Breaker Pattern](https://github.com/openchoreo/openchoreo/tree/main/samples/apim-samples/circuit-breaker) - Using the Circuit Breaker pattern to avoid cascading failures in Managed APIs
  - [Cross-Origin Resource Sharing(CORS)](https://github.com/openchoreo/openchoreo/tree/main/samples/apim-samples/cors) - Illustrates how to allow Cross-origin requests to a Managed API
  - [Rate Limiting](https://github.com/openchoreo/openchoreo/tree/main/samples/apim-samples/rate-limiting) - Configuring rate limiting in a Managed API

### Complete Application Examples

- **[GCP Microservices Demo](https://github.com/openchoreo/openchoreo/tree/main/samples/gcp-microservices-demo/)** – Complete multi-service application demonstrating:
  - Project organization with multiple components
  - Service interactions and dependencies
  - Coordinated deployment patterns
  - Configuration management across services

### Supported Languages (via BuildPacks)
OpenChoreo abstracts the build and deployment process using BuildPacks and Build resources, enabling developers to deploy applications written in:
- **Ballerina** - [Patient Management Service](https://github.com/openchoreo/openchoreo/tree/main/samples/from-source/services/ballerina-buildpack-patient-management/)
- **Go** - [Greeter Service](https://github.com/openchoreo/openchoreo/tree/main/samples/from-source/services/go-docker-greeter/) and [Reading List](https://github.com/openchoreo/openchoreo/tree/main/samples/from-source/services/go-google-buildpack-reading-list/)
- **Node.js/React** - [React Starter](https://github.com/openchoreo/openchoreo/tree/main/samples/from-source/web-apps/react-starter/)
- **Python** - (Additional samples can be added)
- **Ruby** - (Additional samples can be added)
- (More languages can be added as extensions.)

### Key Features Demonstrated

- **[Build Integration](https://github.com/openchoreo/openchoreo/tree/main/samples/from-source/)** – Component with integrated Build for CI/CD workflows
- **[Configuration Management](https://github.com/openchoreo/openchoreo/tree/main/samples/from-image/issue-reporter-schedule-task/)** – Environment-specific configuration with ConfigurationGroups
- **[Security Policies](https://github.com/openchoreo/openchoreo/tree/main/samples/apim-samples/authentication)** – JWT authentication and API security
- **[Class/Binding Pattern](https://github.com/openchoreo/openchoreo/tree/main/samples/from-source/services/)** – ServiceClass templates with environment-specific ServiceBindings
- **[API Management](https://github.com/openchoreo/openchoreo/tree/main/samples/apim-samples/)** - Managed APIs with security and rate limiting

### Getting Started

1. **Deploy Platform Configuration**:
   ```bash
   kubectl apply -f platform-config/new-environments/
   kubectl apply -f platform-config/new-deployment-pipeline/
   ```

2. **Deploy a Simple Service**:
   ```bash
   kubectl apply -f from-source/services/go-docker-greeter/
   ```

3. **Deploy Complete Application**:
   ```bash
   kubectl apply -f gcp-microservices-demo/
   ```

> [!Note] 
> In case you need to try these application samples with custom platform configuration, remember to use the new resource names you created while following the "Platform Configuration" section above.

---

## Featured Examples

### Go Greeting Service from Source
Learn OpenChoreo fundamentals by deploying a simple Go REST service built from source code. This example demonstrates the complete CI/CD workflow from source code to running service.

**Features:**
- Source-to-deployment workflow
- Docker-based build process
- REST API with greeting endpoints
- Gateway integration and testing

**Try it:** [Go Docker Greeter](https://github.com/openchoreo/openchoreo/tree/main/samples/from-source/services/go-docker-greeter)

### Secure Reading List Service with JWT
Deploy a production-ready service with JWT authentication using OpenChoreo's API management capabilities. This example shows how to secure your APIs and manage authentication.

**Features:**
- JWT-based API security
- APIClass resource configuration
- OAuth2 client credentials flow
- Authenticated and unauthenticated access testing

**Try it:** [Secure Service with JWT](https://github.com/openchoreo/openchoreo/tree/main/samples/apim-samples/authentication)

### Google Cloud Microservices Demo
Build a complete e-commerce platform using Google's reference microservices architecture. This comprehensive example demonstrates service-to-service communication, distributed systems patterns, and complex application deployment.

**Features:**
- 11 interconnected microservices
- Frontend web application
- Redis cache integration
- Production-ready container images
- Service mesh communication patterns

**Try it:** [GCP Microservices Demo](https://github.com/openchoreo/openchoreo/tree/main/samples/gcp-microservices-demo)

### Multi-Environment Deployment Pipeline
Set up sophisticated deployment pipelines across development, QA, pre-production, and production environments with automated promotion workflows.

**Features:**
- Four-stage deployment pipeline
- Environment-to-environment promotion
- Automated rollout workflows
- Production-ready governance

**Try it:** [New Deployment Pipeline](https://github.com/openchoreo/openchoreo/tree/main/samples/platform-config/new-deployment-pipeline)

---

## Community Examples

The OpenChoreo community can contribute additional examples covering:
- Industry-specific use cases
- Integration with third-party services
- Custom component types
- Advanced deployment patterns

---

## Getting Help

- **Documentation**: Each example includes instruction documentation
- **Community Forums**: Ask questions and share your implementations on Discord
- **GitHub Issues**: Report bugs or request new examples

Ready to start building? Choose an example that matches your use case, then follow along to see OpenChoreo in action!
