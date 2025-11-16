---
title: APIClass API Reference
---

# APIClass

An `APIClass` defines a reusable API template in OpenChoreo. It represents a standardized API specification that can be referenced by multiple services, deployments, or pipelines. This enables consistent API behavior and easier lifecycle management across the platform.

## API Version

`openchoreo.dev/v1alpha1`

## Resource Definition

### Metadata

`APIClass` resources are cluster-scoped, meaning they exist at the cluster level rather than within a namespace.

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: APIClass
metadata:
  name: <api-class-name>
