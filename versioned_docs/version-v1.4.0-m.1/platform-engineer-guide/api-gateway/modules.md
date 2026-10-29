---
title: Modular Architecture
description: Explore the available API Gateway modules in OpenChoreo and how to configure them for your data plane.
sidebar_position: 1
---

# API Gateway Modules

OpenChoreo supports any [Kubernetes Gateway API](https://gateway-api.sigs.k8s.io/) compliant gateway implementation as a pluggable module for its API Gateway layer. This page covers the available modules and how to configure them.

## Default Module: kgateway

The default gateway bundled with OpenChoreo is **[kgateway](https://kgateway.dev/)**, a high-performance, Kubernetes-native gateway built on Envoy Proxy.

kgateway is enabled by default when installing the OpenChoreo data plane. It provides:

- **High performance**: Built on Envoy Proxy with low-latency request handling
- **Kubernetes-native**: Fully managed via Kubernetes Gateway API resources
- **Extensible**: Supports traffic policies, header manipulation, and advanced routing rules

No additional configuration is required to use kgateway - it is pre-configured as part of the standard data plane installation.

## Using a Different Gateway Module

OpenChoreo's modular architecture supports swapping in any Kubernetes Gateway API compliant gateway. This includes gateways like Traefik, Cilium Gateway, Kong, Istio, Nginx Gateway Fabric, and others.

To explore the full list of supported and community tested gateway modules, visit the [OpenChoreo Modules page](/modules).
