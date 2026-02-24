---
title: API Gateway
description: Configure and manage the API Gateway in OpenChoreo using the Kubernetes Gateway API compliant modular architecture.
sidebar_position: 7
---

# API Gateway

OpenChoreo follows a modular architecture for its API Gateway layer, allowing platform engineers to plug in any [Kubernetes Gateway API](https://gateway-api.sigs.k8s.io/) compliant gateway implementation.

## Overview

Instead of locking you into a single gateway vendor, OpenChoreo decouples the gateway from the platform. As long as a gateway implements the Kubernetes Gateway API standard, it can be used with OpenChoreo. This means you can choose the gateway that best fits your infrastructure, team expertise, and operational requirements.

The default gateway bundled with OpenChoreo is **[kgateway](https://kgateway.dev/)**, a high-performance, Kubernetes-native gateway built on Envoy Proxy.

## How It Works

OpenChoreo provisions and manages gateway resources using the Kubernetes Gateway API (`Gateway`, `HTTPRoute`, `GatewayClass`) as the common abstraction layer. Platform engineers install a Gateway API compliant gateway implementation into the data plane, and OpenChoreo's routing layer targets it automatically.

```
Component (exposed service)
         ↓
   HTTPRoute (Gateway API resource)
         ↓
   Gateway (Gateway API resource)
         ↓
   Gateway Implementation (kgateway or any compliant gateway)
         ↓
   Inbound Traffic
```

## Default Gateway: kgateway

kgateway is enabled by default when installing the OpenChoreo data plane. It provides:

- **High performance**: Built on Envoy Proxy with low-latency request handling
- **Kubernetes-native**: Fully managed via Kubernetes Gateway API resources
- **Extensible**: Supports traffic policies, header manipulation, and advanced routing rules

No additional configuration is required to use kgateway - it is pre-configured as part of the standard data plane installation.

## Using a Different Gateway

OpenChoreo modular architecture supports swapping in any Kubernetes Gateway API compliant gateway. This includes gateways like Traefik, Cilium Gateway, Kong, Istio, Nginx Gateway Fabric, and others.

To explore the full list of supported and community tested gateway modules, visit the [OpenChoreo Modules page](/modules).
