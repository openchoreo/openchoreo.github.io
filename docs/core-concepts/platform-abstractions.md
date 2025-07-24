---
layout: docs
title: Platform Abstractions
---

# Platform Abstractions

## Organizations (logical groupings)

Organizations provide logical groupings of users, projects, and resources within OpenChoreo, enabling multi-tenancy and access control at scale.

## Data Planes (Kubernetes clusters)

Data Planes represent Kubernetes clusters that host deployment environments, providing the compute infrastructure where applications run.

## Environments (dev, staging, prod contexts)

Environments define runtime contexts such as development, staging, and production, each with their own configurations and policies.

## Deployment Pipelines (promotion workflows)

Deployment Pipelines orchestrate the promotion of applications through different environments, automating testing, approval, and deployment workflows.