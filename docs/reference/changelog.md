---
layout: docs
title: Changelog & Release Notes
---

# Changelog & Release Notes

This document tracks all notable changes, new features, breaking changes, and important updates across OpenChoreo releases.

## Current Release

### [v0.2.0] - 2025-06-06

**[📋 View Full Release Notes](https://github.com/openchoreo/openchoreo/releases/tag/v0.2.0)**

---

## Previous Releases

---

## Breaking Changes (sample)

### v0.2.0 → v0.3.0 (Planned)

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

---

## Deprecated Features(sample)

### Scheduled for Removal

#### v1.2.0 (March 2025)
- **Legacy API**: `choreo.dev/v1alpha1` API version
- **Old CLI Commands**: `choreo component create` (use `choreo create component`)
- **Environment Variables**: `CHOREO_LEGACY_MODE` support

---
## Upcoming Releases and Release Schedule

Track our development progress and upcoming features on our [GitHub Project Board](https://github.com/orgs/openchoreo/projects/1). See also our [Roadmap](/docs/overview/roadmap/) for detailed version planning.
