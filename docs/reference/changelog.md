---
layout: docs
title: Changelog & Release Notes
---

# Changelog & Release Notes

This document tracks all notable changes, new features, breaking changes, and important updates across OpenChoreo releases.

## Release Format

OpenChoreo follows [Semantic Versioning](https://semver.org/):
- **Major versions** (1.0.0): Breaking changes and major new features
- **Minor versions** (1.1.0): New features and enhancements (backward compatible)  
- **Patch versions** (1.0.1): Bug fixes and security updates

## Current Release

### [v1.0.3] - 2024-12-15

#### 🔒 Security Fixes
- **CVE-2024-XXXX**: Fixed container escape vulnerability in component runtime
- **Authentication**: Resolved token refresh issue causing session timeouts
- **Network Policies**: Corrected default-deny rule bypass in specific scenarios

#### 🐛 Bug Fixes
- **Component Controller**: Fixed reconciliation loop causing high CPU usage
- **CLI**: Resolved authentication token persistence across commands
- **Web Console**: Fixed component status display showing stale information
- **Metrics**: Corrected Prometheus metrics collection for failed deployments

#### 📚 Documentation
- Added troubleshooting guide for common networking issues
- Updated installation instructions for air-gapped environments
- Improved API reference documentation with examples

---

## Previous Releases

### [v1.0.2] - 2024-11-28

#### 🚀 Features
- **Multi-cluster Support**: Beta support for managing workloads across multiple clusters
- **Enhanced CLI**: Added `choreo logs` command for streaming application logs
- **Policy Templates**: Pre-built security and compliance policy templates

#### 🔧 Improvements
- **Performance**: 40% faster component deployment times
- **Resource Usage**: Reduced control plane memory footprint by 25%
- **Observability**: Enhanced metrics collection with custom resource tracking

#### 🐛 Bug Fixes
- Fixed component deletion not cleaning up all associated resources
- Resolved race condition in environment provisioning
- Corrected RBAC permissions for read-only users

#### ⚠️ Known Issues
- Large deployments (>100 components) may experience slower reconciliation
- Web console may show cached data during high-traffic periods

### [v1.0.1] - 2024-11-10

#### 🔒 Security Updates
- **mTLS**: Automatic certificate rotation now enabled by default
- **RBAC**: Tightened default permissions for component controllers
- **Secrets**: Enhanced secret encryption at rest

#### 🐛 Critical Bug Fixes
- **Data Corruption**: Fixed issue where component updates could corrupt existing configurations
- **Network Isolation**: Resolved cell boundary bypass in specific Kubernetes versions
- **Resource Leaks**: Fixed memory leaks in long-running controllers

#### 🔧 Improvements
- Better error messages for common configuration mistakes
- Improved startup time for OpenChoreo controllers
- Enhanced monitoring dashboard with SLI/SLO tracking

### [v1.0.0] - 2024-10-25 🎉

**Initial General Availability Release**

#### 🚀 Core Features
- **Component-based Architecture**: Deploy applications using simple YAML definitions
- **Multi-environment Support**: Seamless promotion across dev/staging/production
- **Security by Default**: Cell-based isolation with automatic mTLS
- **CNCF Integration**: Built-in support for Prometheus, Cilium, Envoy, and more

#### 🏗️ Platform Capabilities
- **Kubernetes Native**: Custom Resource Definitions extending Kubernetes API
- **GitOps Ready**: Full integration with ArgoCD and Flux
- **CLI Tools**: Comprehensive command-line interface for all operations
- **Web Console**: User-friendly web interface for visual management

#### 🔐 Security Features
- **Zero-trust Networking**: Default-deny network policies
- **Identity-based Access**: Kubernetes RBAC integration
- **Compliance**: SOC2 and PCI DSS compliance frameworks
- **Audit Logging**: Complete audit trail for all platform operations

---

## Breaking Changes

### v1.0.0 → v1.1.0 (Planned)

#### API Changes
```yaml
# DEPRECATED: v1.0.x format
apiVersion: choreo.dev/v1
kind: Component
spec:
  endpoints:
    - port: 8080
      path: /api

# NEW: v1.1.x format (backward compatible)
apiVersion: choreo.dev/v1
kind: Component
spec:
  endpoints:
    - name: api
      port: 8080
      path: /api
      protocol: HTTP
```

#### Configuration Changes
- **Environment Variables**: `CHOREO_NAMESPACE` renamed to `CHOREO_SYSTEM_NAMESPACE`
- **Helm Values**: `controller.replicas` moved to `controlPlane.controller.replicas`
- **RBAC**: Additional permissions required for new multi-cluster features

#### Migration Guide
1. **Update component definitions** to use named endpoints
2. **Modify environment variables** in deployment scripts
3. **Upgrade Helm values** using the provided migration script:
```bash
# Download migration script
curl -sSL https://install.openchoreo.dev/migrate-v1.1.sh | bash

# Run migration
./migrate-v1.1.sh --config values.yaml
```

---

## Deprecated Features

### Scheduled for Removal

#### v1.2.0 (March 2025)
- **Legacy API**: `choreo.dev/v1alpha1` API version
- **Old CLI Commands**: `choreo component create` (use `choreo create component`)
- **Environment Variables**: `CHOREO_LEGACY_MODE` support

#### v1.3.0 (June 2025)
- **Legacy Networking**: Non-Cilium network policy support
- **Old Webhook Format**: Custom validation webhook v1beta1

### Migration Deadlines
- **v1alpha1 API**: Migrate to `v1` before v1.2.0 release
- **Legacy CLI**: Update scripts to use new command structure
- **Custom Webhooks**: Update to v1 admission review format

---

## Security Advisories

### [CVE-2024-XXXX] - High Severity
**Published**: 2024-12-01  
**Affected Versions**: v1.0.0 - v1.0.2  
**Fixed In**: v1.0.3

**Description**: Container escape vulnerability allowing privilege escalation in component runtime.

**Impact**: Malicious components could gain cluster-admin privileges.

**Mitigation**: 
- Upgrade to v1.0.3 immediately
- Apply temporary network policies restricting component access
- Audit existing component configurations

### [CVE-2024-YYYY] - Medium Severity
**Published**: 2024-11-15  
**Affected Versions**: v1.0.0 - v1.0.1  
**Fixed In**: v1.0.2

**Description**: Authentication bypass in web console under specific conditions.

**Impact**: Unauthorized users could access read-only cluster information.

**Mitigation**:
- Upgrade to v1.0.2 or later
- Verify web console access logs for suspicious activity
- Implement additional network security controls

---

## Compatibility Matrix

### Kubernetes Versions
| OpenChoreo Version | Kubernetes Versions | Status |
|-------------------|-------------------|---------|
| v1.0.x | 1.24 - 1.29 | ✅ Fully Supported |
| v1.1.x (planned) | 1.25 - 1.30 | ✅ Fully Supported |
| v1.2.x (planned) | 1.26 - 1.31 | ✅ Fully Supported |

### Cloud Provider Support
| Provider | v1.0.x | v1.1.x | Notes |
|----------|---------|---------|--------|
| **AWS EKS** | ✅ | ✅ | Includes EKS Fargate support |
| **Google GKE** | ✅ | ✅ | Autopilot and Standard modes |
| **Azure AKS** | ✅ | ✅ | Including AKS Edge Essentials |
| **DigitalOcean** | ✅ | ✅ | DOKS fully supported |
| **Self-managed** | ✅ | ✅ | Any CNCF-compliant cluster |

### Integration Versions
| Component | Minimum Version | Recommended | Notes |
|-----------|----------------|-------------|--------|
| **Cilium** | 1.12.0 | 1.14.x | Required for networking |
| **Prometheus** | 2.40.0 | 2.45.x | Metrics collection |
| **ArgoCD** | 2.6.0 | 2.9.x | GitOps workflows |
| **Istio** | 1.17.0 | 1.20.x | Service mesh (optional) |

---

## Upcoming Releases

### v1.1.0 "Developer Experience" - Q1 2025

#### 🎯 Planned Features
- **Visual Project Builder**: Drag-and-drop application creation
- **Enhanced CLI**: Improved debugging and local development
- **Template Marketplace**: Community-contributed templates
- **IDE Integrations**: VS Code and IntelliJ plugins

#### 🔧 Improvements
- **Performance**: 60% faster build times with caching
- **User Experience**: Simplified onboarding workflow
- **Documentation**: Interactive tutorials and examples

### v1.2.0 "Enterprise Ready" - Q2 2025

#### 🏢 Enterprise Features
- **Multi-tenancy**: Complete organization isolation
- **Advanced RBAC**: Fine-grained permission management
- **Compliance Dashboard**: SOC2, PCI DSS reporting
- **Cost Management**: Resource usage optimization

#### 🌐 Multi-cloud Support
- **Provider Abstraction**: Deploy across AWS, GCP, Azure
- **Cross-cloud Networking**: Secure multi-cloud connectivity
- **Disaster Recovery**: Automated backup and restore

---

## Release Schedule

OpenChoreo follows a predictable release schedule:

### Regular Releases
- **Major Releases**: Annually (October)
- **Minor Releases**: Quarterly (January, April, July, October)
- **Patch Releases**: Monthly or as needed for critical issues

### Security Updates
- **Critical vulnerabilities**: Within 48 hours
- **High severity**: Within 1 week  
- **Medium/Low severity**: Next scheduled patch release

### Support Lifecycle
- **Current version**: Full support with new features
- **Previous major**: 18 months of security updates
- **Legacy versions**: 6 months of critical security fixes only

---

## Getting Updates

### Notification Channels
- **GitHub Releases**: Watch the repository for automatic notifications
- **Mailing List**: Subscribe to [releases@openchoreo.dev](mailto:releases@openchoreo.dev)
- **RSS Feed**: Subscribe to our [release feed](https://github.com/openchoreo/openchoreo/releases.atom)
- **Community Chat**: Join our [Slack workspace](https://slack.openchoreo.dev)

### Upgrade Process
1. **Review changelog** for breaking changes and new features
2. **Test in development** environment first
3. **Backup configurations** before upgrading
4. **Follow migration guides** for major version upgrades
5. **Monitor applications** after upgrade completion

### Rollback Procedures
All releases include rollback instructions and automated rollback scripts for emergency situations.

---

**Questions about releases?** Contact us at [releases@openchoreo.dev](mailto:releases@openchoreo.dev) or join our [community discussions](https://github.com/openchoreo/openchoreo/discussions).