# CLI Reference

The `occ` (OpenChoreo CLI) is a command-line interface tool for interacting with OpenChoreo. It provides commands to manage namespaces, projects, components, deployments, and other OpenChoreo resources.

## Global Options

All commands support the following global options through context configuration:

- `--namespace` - Namespace name
- `--project` - Project name
- `--component` - Component name
- `--environment` - Environment name
- `--dataplane` - Data plane name

These can be set in a configuration context to avoid repeating them in every command. See the [config](#config) command for details.

## Commands

### login

Login to OpenChoreo CLI.

**Usage:**

```bash
occ login [flags]
```

**Flags:**

- `--client-credentials` - Use OAuth2 client credentials flow for authentication
- `--client-id` - OAuth2 client ID for service account authentication
- `--client-secret` - OAuth2 client secret for service account authentication
- `--credential` - Name to save the credential as in config

**Examples:**

```bash
# Interactive login (default PKCE flow)
occ login

# Service account login with client credentials
occ login --client-credentials --client-id <client-id> --client-secret <client-secret>
```

---

### logout

Logout from OpenChoreo CLI.

**Usage:**

```bash
occ logout
```

**Examples:**

```bash
occ logout
```

---

### version

Print version information for both the CLI client and the OpenChoreo server.

**Usage:**

```bash
occ version
```

**Examples:**

```bash
occ version
```

---

### apply

Apply a configuration file to create or update OpenChoreo resources.

**Usage:**

```bash
occ apply -f <file>
```

**Flags:**

- `-f, --file` - Path to the YAML file containing resource definitions

**Examples:**

```bash
# Apply a namespace configuration
occ apply -f namespace.yaml

# Apply a component configuration
occ apply -f my-component.yaml
```

---

### config

Manage CLI configuration including contexts, control planes, and credentials.

**Usage:**

```bash
occ config <subcommand> [flags]
```

The CLI stores its configuration in `~/.occ/config.yaml`. The configuration is made up of three concepts:

- **Control planes**: API server endpoints that the CLI connects to (see [`config controlplane`](#config-controlplane))
- **Credentials**: Authentication tokens for connecting to control planes (see [`config credentials`](#config-credentials))
- **Contexts**: Named sets of defaults (namespace, project, etc.) that reference a control plane and credentials (see [`config context`](#config-context))

A typical setup flow is: add a control plane, add credentials, then create a context that ties them together.

**Configuration file structure:**

```yaml
currentContext: my-context
controlplanes:
  - name: production
    url: https://api.openchoreo.example.com
credentials:
  - name: my-creds
    clientId: <client-id>
    clientSecret: <client-secret>
    token: <access-token>
    refreshToken: <refresh-token>
    authMethod: pkce # or "client_credentials"
contexts:
  - name: my-context
    controlplane: production
    credentials: my-creds
    namespace: acme-corp
    project: online-store
    component: product-catalog
    mode: api-server # or "file-system"
    rootDirectoryPath: /path/to/resources # for file-system mode
```

**Modes:**

The CLI supports two modes:

1. **API Server Mode** (`api-server`): Connects to an OpenChoreo API server to manage resources remotely. This is the default mode.
2. **File System Mode** (`file-system`): Works with resources stored as YAML files in a directory structure. Useful for GitOps workflows and local development.

#### config controlplane

Manage control plane configurations that define OpenChoreo API server endpoints. A control plane must be configured before it can be referenced in a context.

##### config controlplane add

Add a new control plane configuration.

**Usage:**

```bash
occ config controlplane add <name> [flags]
```

**Flags:**

- `--url` - OpenChoreo API server endpoint URL (required)

**Examples:**

```bash
# Add a remote control plane
occ config controlplane add production --url https://api.openchoreo.example.com

# Add a local control plane (for development)
occ config controlplane add local --url http://api.openchoreo.localhost:8080
```

##### config controlplane list

List all control plane configurations.

**Usage:**

```bash
occ config controlplane list
```

**Examples:**

```bash
# Show all control planes
occ config controlplane list
```

##### config controlplane update

Update a control plane configuration.

**Usage:**

```bash
occ config controlplane update <name> [flags]
```

**Flags:**

- `--url` - OpenChoreo API server endpoint URL

**Examples:**

```bash
# Update control plane URL
occ config controlplane update production --url https://new-api.openchoreo.example.com
```

##### config controlplane delete

Delete a control plane configuration.

**Usage:**

```bash
occ config controlplane delete <name>
```

**Examples:**

```bash
# Delete a control plane
occ config controlplane delete old-prod
```

#### config credentials

Manage authentication credentials for connecting to control planes. Credentials must be configured before they can be referenced in a context.

##### config credentials add

Add new authentication credentials.

**Usage:**

```bash
occ config credentials add <name>
```

**Examples:**

```bash
# Add new credentials (prompts for login)
occ config credentials add my-creds
```

##### config credentials list

List all saved credentials.

**Usage:**

```bash
occ config credentials list
```

**Examples:**

```bash
# Show all credentials
occ config credentials list
```

##### config credentials delete

Delete saved credentials.

**Usage:**

```bash
occ config credentials delete <name>
```

**Examples:**

```bash
# Delete credentials
occ config credentials delete old-creds
```

#### config context

Manage configuration contexts that store default values (e.g., namespace, project, component) for occ commands. A context references a [control plane](#config-controlplane) and [credentials](#config-credentials), which must be configured first.

##### config context add

Create a new configuration context.

**Usage:**

```bash
occ config context add <context-name> [flags]
```

**Flags:**

- `--controlplane` - Control plane name (required, see [`config controlplane add`](#config-controlplane-add))
- `--credentials` - Credentials name (required, see [`config credentials add`](#config-credentials-add))
- `--namespace` - Namespace name stored in this configuration context
- `--project` - Project name stored in this configuration context
- `--component` - Component name stored in this configuration context

**Examples:**

```bash
# Create a new context with control plane and credentials
occ config context add acme-corp-context --controlplane production \
  --credentials my-creds --namespace acme-corp --project online-store

# Create a minimal context
occ config context add dev-context --controlplane local --credentials dev-creds
```

##### config context list

List all available configuration contexts.

**Usage:**

```bash
occ config context list
```

**Examples:**

```bash
# Show all configuration contexts
occ config context list
```

##### config context update

Update an existing configuration context.

**Usage:**

```bash
occ config context update <context-name> [flags]
```

**Flags:**

- `--namespace` - Namespace name stored in this configuration context
- `--project` - Project name stored in this configuration context
- `--component` - Component name stored in this configuration context
- `--controlplane` - Control plane name
- `--credentials` - Credentials name

**Examples:**

```bash
# Update namespace and project
occ config context update acme-corp-context --namespace acme-corp --project online-store

# Update control plane
occ config context update acme-corp-context --controlplane production
```

##### config context use

Switch to a specified configuration context.

**Usage:**

```bash
occ config context use <context-name>
```

**Examples:**

```bash
# Switch to the configuration context named acme-corp-context
occ config context use acme-corp-context
```

##### config context describe

Display details of the currently active configuration context.

**Usage:**

```bash
occ config context describe
```

**Examples:**

```bash
# Display the currently active configuration context
occ config context describe
```

##### config context delete

Delete a configuration context.

**Usage:**

```bash
occ config context delete <context-name>
```

**Examples:**

```bash
# Delete a context
occ config context delete old-context
```

---

## Resource Management Commands

### namespace

Manage namespaces in OpenChoreo.

**Usage:**

```bash
occ namespace <subcommand> [flags]
```

**Aliases:** `ns`, `namespaces`

#### namespace list

List all namespaces.

**Usage:**

```bash
occ namespace list
```

**Examples:**

```bash
# List all namespaces
occ namespace list
```

#### namespace get

Get details of a specific namespace.

**Usage:**

```bash
occ namespace get [NAMESPACE_NAME]
```

**Examples:**

```bash
# Get a specific namespace
occ namespace get acme-corp
```

#### namespace delete

Delete a namespace.

**Usage:**

```bash
occ namespace delete [NAMESPACE_NAME]
```

**Examples:**

```bash
# Delete a namespace
occ namespace delete acme-corp
```

---

### project

Manage projects in OpenChoreo.

**Usage:**

```bash
occ project <subcommand> [flags]
```

**Aliases:** `proj`, `projects`

#### project list

List all projects in a namespace.

**Usage:**

```bash
occ project list [flags]
```

**Flags:**

- `--namespace` - Namespace name

**Examples:**

```bash
# List all projects in a namespace
occ project list --namespace acme-corp
```

#### project get

Get details of a specific project.

**Usage:**

```bash
occ project get [PROJECT_NAME] [flags]
```

**Flags:**

- `--namespace` - Namespace name

**Examples:**

```bash
# Get a specific project
occ project get online-store --namespace acme-corp
```

#### project delete

Delete a project.

**Usage:**

```bash
occ project delete [PROJECT_NAME] [flags]
```

**Flags:**

- `--namespace` - Namespace name

**Examples:**

```bash
# Delete a project
occ project delete online-store --namespace acme-corp
```

---

### component

Manage components in OpenChoreo.

**Usage:**

```bash
occ component <subcommand> [flags]
```

**Aliases:** `comp`, `components`

#### component list

List all components in a project.

**Usage:**

```bash
occ component list [flags]
```

**Flags:**

- `--namespace` - Namespace name
- `--project` - Project name

**Examples:**

```bash
# List all components in a project
occ component list --namespace acme-corp --project online-store
```

#### component get

Get details of a specific component.

**Usage:**

```bash
occ component get [COMPONENT_NAME] [flags]
```

**Flags:**

- `--namespace` - Namespace name

**Examples:**

```bash
# Get a specific component
occ component get product-catalog --namespace acme-corp
```

#### component delete

Delete a component.

**Usage:**

```bash
occ component delete [COMPONENT_NAME] [flags]
```

**Flags:**

- `--namespace` - Namespace name

**Examples:**

```bash
# Delete a component
occ component delete product-catalog --namespace acme-corp
```

#### component scaffold

Scaffold a Component YAML from ComponentType and Traits.

Use `--componenttype`/`--traits`/`--workflow` for namespace-scoped resources, or `--clustercomponenttype`/`--clustertraits`/`--clusterworkflow` for cluster-scoped resources. Each pair is mutually exclusive.

**Usage:**

```bash
occ component scaffold COMPONENT_NAME [flags]
```

**Flags:**

- `--componenttype` - Namespace-scoped component type in format `workloadType/componentTypeName` (e.g., `deployment/web-app`)
- `--clustercomponenttype` - Cluster-scoped component type in format `workloadType/componentTypeName`
- `--traits` - Comma-separated list of namespace-scoped Trait names to include
- `--clustertraits` - Comma-separated list of cluster-scoped ClusterTrait names to include
- `--workflow` - Namespace-scoped Workflow name
- `--clusterworkflow` - Cluster-scoped ClusterWorkflow name
- `--namespace` - Namespace name (can be omitted if set in context)
- `--project` - Project name (can be omitted if set in context)
- `-o, --output-file` - Write output to specified file instead of stdout
- `--skip-comments` - Skip section headers and field description comments for minimal output
- `--skip-optional` - Skip optional fields without defaults (show only required fields)

**Examples:**

```bash
# Scaffold using a cluster-scoped ClusterComponentType
occ component scaffold my-app --clustercomponenttype deployment/web-app

# Scaffold using a namespace-scoped ComponentType
occ component scaffold my-app --componenttype deployment/web-app

# Scaffold with cluster-scoped traits
occ component scaffold my-app --clustercomponenttype deployment/web-app --clustertraits storage,ingress

# Scaffold with cluster-scoped workflow
occ component scaffold my-app --clustercomponenttype deployment/web-app --clusterworkflow docker-build

# Output to file
occ component scaffold my-app --clustercomponenttype deployment/web-app -o my-app.yaml

# Minimal output without comments
occ component scaffold my-app --clustercomponenttype deployment/web-app --skip-comments --skip-optional
```

#### component deploy

Deploy or promote a component to an environment.

**Usage:**

```bash
occ component deploy [COMPONENT_NAME] [flags]
```

**Flags:**

- `--namespace` - Namespace name
- `--project` - Project name
- `--release` - Specific component release to deploy
- `--to` - Target environment to promote to
- `--set` - Override values (can be used multiple times)
- `-o, --output` - Output format

**Examples:**

```bash
# Deploy latest release to root environment
occ component deploy api-service --namespace acme-corp --project online-store

# Deploy specific release
occ component deploy api-service --release api-service-20260126-143022-1

# Promote to next environment
occ component deploy api-service --to staging

# Deploy with overrides
occ component deploy api-service --set spec.componentTypeEnvironmentConfigs.replicas=3
```

#### component logs

Retrieve and display logs for a component from a specific environment.

**Usage:**

```bash
occ component logs COMPONENT_NAME [flags]
```

**Flags:**

- `--namespace` - Namespace name
- `--project` - Project name
- `--env` - Environment where the component is deployed (e.g., dev, staging, production). If not specified, uses the lowest environment from the deployment pipeline
- `-f, --follow` - Follow the logs in real-time (streams new logs as they appear)
- `--since` - Only return logs newer than a relative duration (e.g., 5m, 1h, 24h). Default: 1h
- `--tail` - Number of lines to show from the end of logs (0 means no limit)

**Examples:**

```bash
# Get logs for a component (auto-detects lowest environment)
occ component logs my-app --namespace acme-corp --project online-store

# Get logs from a specific environment
occ component logs my-app --env dev

# Get logs from the last 30 minutes
occ component logs my-app --env dev --since 30m

# Follow logs in real-time
occ component logs my-app --env dev -f

# Follow logs with custom since duration
occ component logs my-app --env dev -f --since 5m

# Get the last 100 lines of logs
occ component logs my-app --env dev --tail 100
```

#### component workflow

Manage workflows for a specific component.

##### component workflow run

Run a component's workflow.

**Usage:**

```bash
occ component workflow run [COMPONENT_NAME] [flags]
```

**Flags:**

- `--namespace` - Namespace name
- `--project` - Project name
- `--set` - Build parameters (can be used multiple times)

**Examples:**

```bash
# Run a component workflow
occ component workflow run api-service --namespace acme-corp --project online-store

# Run with parameters
occ component workflow run api-service --set spec.workflow.parameters.source.org=openchoreo
```

##### component workflow logs

Get logs for a component's workflow.

**Usage:**

```bash
occ component workflow logs [COMPONENT_NAME] [flags]
```

**Flags:**

- `--namespace` - Namespace name
- `-f, --follow` - Follow the logs in real-time
- `--since` - Only return logs newer than a relative duration (e.g., 5m, 1h, 24h)
- `--workflowrun` - Workflow run name (defaults to latest run)

**Examples:**

```bash
# Get workflow logs for a component
occ component workflow logs api-service --namespace acme-corp

# Follow workflow logs
occ component workflow logs api-service -f
```

#### component workflowrun

Manage workflow runs for a specific component.

##### component workflowrun list

List workflow runs for a component.

**Usage:**

```bash
occ component workflowrun list [COMPONENT_NAME] [flags]
```

**Flags:**

- `--namespace` - Namespace name

**Examples:**

```bash
# List all workflow runs for a component
occ component workflowrun list api-service --namespace acme-corp
```

##### component workflowrun logs

Get logs for a component's workflow run.

**Usage:**

```bash
occ component workflowrun logs [COMPONENT_NAME] [flags]
```

**Flags:**

- `--namespace` - Namespace name
- `-f, --follow` - Follow the logs in real-time
- `--since` - Only return logs newer than a relative duration (e.g., 5m, 1h, 24h)
- `--workflowrun` - Workflow run name (defaults to latest run)

**Examples:**

```bash
# Get workflow run logs for a component
occ component workflowrun logs api-service --namespace acme-corp

# Follow workflow run logs
occ component workflowrun logs api-service -f
```

---

### environment

Manage environments in OpenChoreo.

**Usage:**

```bash
occ environment <subcommand> [flags]
```

**Aliases:** `env`, `environments`, `envs`

#### environment list

List all environments in a namespace.

**Usage:**

```bash
occ environment list [flags]
```

**Flags:**

- `--namespace` - Namespace name

**Examples:**

```bash
# List all environments in a namespace
occ environment list --namespace acme-corp
```

#### environment get

Get details of a specific environment.

**Usage:**

```bash
occ environment get [ENVIRONMENT_NAME] [flags]
```

**Flags:**

- `--namespace` - Namespace name

**Examples:**

```bash
# Get a specific environment
occ environment get dev --namespace acme-corp
```

#### environment delete

Delete an environment.

**Usage:**

```bash
occ environment delete [ENVIRONMENT_NAME] [flags]
```

**Flags:**

- `--namespace` - Namespace name

**Examples:**

```bash
# Delete an environment
occ environment delete dev --namespace acme-corp
```

---

### dataplane

Manage data planes in OpenChoreo.

**Usage:**

```bash
occ dataplane <subcommand> [flags]
```

**Aliases:** `dp`, `dataplanes`

#### dataplane list

List all data planes in a namespace.

**Usage:**

```bash
occ dataplane list [flags]
```

**Flags:**

- `--namespace` - Namespace name

**Examples:**

```bash
# List all data planes in a namespace
occ dataplane list --namespace acme-corp
```

#### dataplane get

Get details of a specific data plane.

**Usage:**

```bash
occ dataplane get [DATAPLANE_NAME] [flags]
```

**Flags:**

- `--namespace` - Namespace name

**Examples:**

```bash
# Get a specific data plane
occ dataplane get us-west-1 --namespace acme-corp
```

#### dataplane delete

Delete a data plane.

**Usage:**

```bash
occ dataplane delete [DATAPLANE_NAME] [flags]
```

**Flags:**

- `--namespace` - Namespace name

**Examples:**

```bash
# Delete a data plane
occ dataplane delete us-west-1 --namespace acme-corp
```

---

### workflowplane

Manage workflow planes in OpenChoreo.

**Usage:**

```bash
occ workflowplane <subcommand> [flags]
```

**Aliases:** `wp`, `workflowplanes`

#### workflowplane list

List all workflow planes in a namespace.

**Usage:**

```bash
occ workflowplane list [flags]
```

**Flags:**

- `--namespace` - Namespace name

**Examples:**

```bash
# List all workflow planes in a namespace
occ workflowplane list --namespace acme-corp
```

#### workflowplane get

Get details of a specific workflow plane.

**Usage:**

```bash
occ workflowplane get [WORKFLOWPLANE_NAME] [flags]
```

**Flags:**

- `--namespace` - Namespace name

**Examples:**

```bash
# Get a specific workflow plane
occ workflowplane get default --namespace acme-corp
```

#### workflowplane delete

Delete a workflow plane.

**Usage:**

```bash
occ workflowplane delete [WORKFLOWPLANE_NAME] [flags]
```

**Flags:**

- `--namespace` - Namespace name

**Examples:**

```bash
# Delete a workflow plane
occ workflowplane delete default --namespace acme-corp
```

---

### observabilityplane

Manage observability planes in OpenChoreo.

**Usage:**

```bash
occ observabilityplane <subcommand> [flags]
```

**Aliases:** `op`, `observabilityplanes`

#### observabilityplane list

List all observability planes in a namespace.

**Usage:**

```bash
occ observabilityplane list [flags]
```

**Flags:**

- `--namespace` - Namespace name

**Examples:**

```bash
# List all observability planes in a namespace
occ observabilityplane list --namespace acme-corp
```

#### observabilityplane get

Get details of a specific observability plane.

**Usage:**

```bash
occ observabilityplane get [OBSERVABILITYPLANE_NAME] [flags]
```

**Flags:**

- `--namespace` - Namespace name

**Examples:**

```bash
# Get a specific observability plane
occ observabilityplane get default --namespace acme-corp
```

#### observabilityplane delete

Delete an observability plane.

**Usage:**

```bash
occ observabilityplane delete [OBSERVABILITYPLANE_NAME] [flags]
```

**Flags:**

- `--namespace` - Namespace name

**Examples:**

```bash
# Delete an observability plane
occ observabilityplane delete default --namespace acme-corp
```

---

### deploymentpipeline

Manage deployment pipelines in OpenChoreo.

**Usage:**

```bash
occ deploymentpipeline <subcommand> [flags]
```

**Aliases:** `deppipe`, `deploymentpipelines`

#### deploymentpipeline list

List all deployment pipelines in a namespace.

**Usage:**

```bash
occ deploymentpipeline list [flags]
```

**Flags:**

- `--namespace` - Namespace name

**Examples:**

```bash
# List all deployment pipelines in a namespace
occ deploymentpipeline list --namespace acme-corp
```

#### deploymentpipeline get

Get details of a specific deployment pipeline.

**Usage:**

```bash
occ deploymentpipeline get [DEPLOYMENT_PIPELINE_NAME] [flags]
```

**Flags:**

- `--namespace` - Namespace name

**Examples:**

```bash
# Get a specific deployment pipeline
occ deploymentpipeline get default-pipeline --namespace acme-corp
```

#### deploymentpipeline delete

Delete a deployment pipeline.

**Usage:**

```bash
occ deploymentpipeline delete [DEPLOYMENT_PIPELINE_NAME] [flags]
```

**Flags:**

- `--namespace` - Namespace name

**Examples:**

```bash
# Delete a deployment pipeline
occ deploymentpipeline delete default-pipeline --namespace acme-corp
```

---

### componenttype

Manage component types in OpenChoreo.

**Usage:**

```bash
occ componenttype <subcommand> [flags]
```

**Aliases:** `ct`, `componenttypes`

#### componenttype list

List all component types available in a namespace.

**Usage:**

```bash
occ componenttype list [flags]
```

**Flags:**

- `--namespace` - Namespace name

**Examples:**

```bash
# List all component types in a namespace
occ componenttype list --namespace acme-corp
```

#### componenttype get

Get details of a specific component type.

**Usage:**

```bash
occ componenttype get [COMPONENT_TYPE_NAME] [flags]
```

**Flags:**

- `--namespace` - Namespace name

**Examples:**

```bash
# Get a specific component type
occ componenttype get web-app --namespace acme-corp
```

#### componenttype delete

Delete a component type.

**Usage:**

```bash
occ componenttype delete [COMPONENT_TYPE_NAME] [flags]
```

**Flags:**

- `--namespace` - Namespace name

**Examples:**

```bash
# Delete a component type
occ componenttype delete web-app --namespace acme-corp
```

---

### clustercomponenttype

Manage cluster-scoped component types in OpenChoreo.

**Usage:**

```bash
occ clustercomponenttype <subcommand> [flags]
```

**Aliases:** `cct`, `clustercomponenttypes`

#### clustercomponenttype list

List all cluster component types.

**Usage:**

```bash
occ clustercomponenttype list
```

**Examples:**

```bash
# List all cluster component types
occ clustercomponenttype list
```

#### clustercomponenttype get

Get details of a specific cluster component type.

**Usage:**

```bash
occ clustercomponenttype get [CLUSTER_COMPONENT_TYPE_NAME]
```

**Examples:**

```bash
# Get a specific cluster component type
occ clustercomponenttype get web-app
```

#### clustercomponenttype delete

Delete a cluster component type.

**Usage:**

```bash
occ clustercomponenttype delete [CLUSTER_COMPONENT_TYPE_NAME]
```

**Examples:**

```bash
# Delete a cluster component type
occ clustercomponenttype delete web-app
```

---

### trait

Manage traits in OpenChoreo.

**Usage:**

```bash
occ trait <subcommand> [flags]
```

**Aliases:** `traits`

#### trait list

List all traits available in a namespace.

**Usage:**

```bash
occ trait list [flags]
```

**Flags:**

- `--namespace` - Namespace name

**Examples:**

```bash
# List all traits in a namespace
occ trait list --namespace acme-corp
```

#### trait get

Get details of a specific trait.

**Usage:**

```bash
occ trait get [TRAIT_NAME] [flags]
```

**Flags:**

- `--namespace` - Namespace name

**Examples:**

```bash
# Get a specific trait
occ trait get ingress --namespace acme-corp
```

#### trait delete

Delete a trait.

**Usage:**

```bash
occ trait delete [TRAIT_NAME] [flags]
```

**Flags:**

- `--namespace` - Namespace name

**Examples:**

```bash
# Delete a trait
occ trait delete ingress --namespace acme-corp
```

---

### clustertrait

Manage cluster-scoped traits in OpenChoreo.

**Usage:**

```bash
occ clustertrait <subcommand> [flags]
```

**Aliases:** `clustertraits`

#### clustertrait list

List all cluster traits.

**Usage:**

```bash
occ clustertrait list
```

**Examples:**

```bash
# List all cluster traits
occ clustertrait list
```

#### clustertrait get

Get details of a specific cluster trait.

**Usage:**

```bash
occ clustertrait get [CLUSTER_TRAIT_NAME]
```

**Examples:**

```bash
# Get a specific cluster trait
occ clustertrait get ingress
```

#### clustertrait delete

Delete a cluster trait.

**Usage:**

```bash
occ clustertrait delete [CLUSTER_TRAIT_NAME]
```

**Examples:**

```bash
# Delete a cluster trait
occ clustertrait delete ingress
```

---

### clusterworkflow

Manage cluster-scoped workflows in OpenChoreo.

**Usage:**

```bash
occ clusterworkflow <subcommand> [flags]
```

**Aliases:** `clusterworkflows`

#### clusterworkflow list

List all cluster workflows.

**Usage:**

```bash
occ clusterworkflow list
```

**Examples:**

```bash
# List all cluster workflows
occ clusterworkflow list
```

#### clusterworkflow get

Get details of a specific cluster workflow.

**Usage:**

```bash
occ clusterworkflow get [CLUSTER_WORKFLOW_NAME]
```

**Examples:**

```bash
# Get a specific cluster workflow
occ clusterworkflow get build-go
```

#### clusterworkflow delete

Delete a cluster workflow.

**Usage:**

```bash
occ clusterworkflow delete [CLUSTER_WORKFLOW_NAME]
```

**Examples:**

```bash
# Delete a cluster workflow
occ clusterworkflow delete build-go
```

#### clusterworkflow run

Run a cluster workflow with optional parameters. Requires `--namespace` to specify where the workflow run will be created.

**Usage:**

```bash
occ clusterworkflow run CLUSTER_WORKFLOW_NAME [flags]
```

**Flags:**

- `--namespace` - Namespace where the workflow run will be created (required)
- `--set` - Workflow parameters (can be used multiple times)

**Examples:**

```bash
# Run a cluster workflow
occ clusterworkflow run dockerfile-builder --namespace acme-corp

# Run with parameters
occ clusterworkflow run dockerfile-builder --namespace acme-corp \
  --set spec.workflow.parameters.repository.url=https://github.com/example/repo
```

#### clusterworkflow logs

Get logs for a cluster workflow.

**Usage:**

```bash
occ clusterworkflow logs CLUSTER_WORKFLOW_NAME [flags]
```

**Flags:**

- `--namespace` - Namespace where the workflow run exists (required)
- `-f, --follow` - Follow the logs in real-time
- `--since` - Only return logs newer than a relative duration (e.g., 5m, 1h, 24h)
- `--workflowrun` - Workflow run name (defaults to latest run)

**Examples:**

```bash
# Get logs for a cluster workflow
occ clusterworkflow logs dockerfile-builder --namespace acme-corp

# Follow logs in real-time
occ clusterworkflow logs dockerfile-builder --namespace acme-corp -f

# Get logs for a specific workflow run
occ clusterworkflow logs dockerfile-builder --namespace acme-corp --workflowrun build-run-1
```

---

### clusterdataplane

Manage cluster-scoped data planes in OpenChoreo.

**Usage:**

```bash
occ clusterdataplane <subcommand>
```

**Aliases:** `clusterdataplanes`, `cdp`

#### clusterdataplane list

List all cluster data planes.

**Usage:**

```bash
occ clusterdataplane list
```

**Examples:**

```bash
# List all cluster data planes
occ clusterdataplane list
```

#### clusterdataplane get

Get details of a specific cluster data plane.

**Usage:**

```bash
occ clusterdataplane get [CLUSTER_DATA_PLANE_NAME]
```

**Examples:**

```bash
# Get a specific cluster data plane
occ clusterdataplane get default
```

#### clusterdataplane delete

Delete a cluster data plane.

**Usage:**

```bash
occ clusterdataplane delete [CLUSTER_DATA_PLANE_NAME]
```

**Examples:**

```bash
# Delete a cluster data plane
occ clusterdataplane delete default
```

---

### clusterobservabilityplane

Manage cluster-scoped observability planes in OpenChoreo.

**Usage:**

```bash
occ clusterobservabilityplane <subcommand>
```

**Aliases:** `clusterobservabilityplanes`, `cop`

#### clusterobservabilityplane list

List all cluster observability planes.

**Usage:**

```bash
occ clusterobservabilityplane list
```

**Examples:**

```bash
# List all cluster observability planes
occ clusterobservabilityplane list
```

#### clusterobservabilityplane get

Get details of a specific cluster observability plane.

**Usage:**

```bash
occ clusterobservabilityplane get [CLUSTER_OBSERVABILITY_PLANE_NAME]
```

**Examples:**

```bash
# Get a specific cluster observability plane
occ clusterobservabilityplane get default
```

#### clusterobservabilityplane delete

Delete a cluster observability plane.

**Usage:**

```bash
occ clusterobservabilityplane delete [CLUSTER_OBSERVABILITY_PLANE_NAME]
```

**Examples:**

```bash
# Delete a cluster observability plane
occ clusterobservabilityplane delete default
```

---

### clusterworkflowplane

Manage cluster-scoped workflow planes in OpenChoreo.

**Usage:**

```bash
occ clusterworkflowplane <subcommand>
```

**Aliases:** `clusterworkflowplanes`, `cwp`

#### clusterworkflowplane list

List all cluster workflow planes.

**Usage:**

```bash
occ clusterworkflowplane list
```

**Examples:**

```bash
# List all cluster workflow planes
occ clusterworkflowplane list
```

#### clusterworkflowplane get

Get details of a specific cluster workflow plane.

**Usage:**

```bash
occ clusterworkflowplane get [CLUSTER_WORKFLOW_PLANE_NAME]
```

**Examples:**

```bash
# Get a specific cluster workflow plane
occ clusterworkflowplane get default
```

#### clusterworkflowplane delete

Delete a cluster workflow plane.

**Usage:**

```bash
occ clusterworkflowplane delete [CLUSTER_WORKFLOW_PLANE_NAME]
```

**Examples:**

```bash
# Delete a cluster workflow plane
occ clusterworkflowplane delete default
```

---

### workflow

Manage workflows in OpenChoreo.

**Usage:**

```bash
occ workflow <subcommand> [flags]
```

**Aliases:** `wf`, `workflows`

#### workflow list

List all workflows available in a namespace.

**Usage:**

```bash
occ workflow list [flags]
```

**Flags:**

- `--namespace` - Namespace name

**Examples:**

```bash
# List all workflows in a namespace
occ workflow list --namespace acme-corp
```

#### workflow get

Get details of a specific workflow.

**Usage:**

```bash
occ workflow get [WORKFLOW_NAME] [flags]
```

**Flags:**

- `--namespace` - Namespace name

**Examples:**

```bash
# Get a specific workflow
occ workflow get database-migration --namespace acme-corp
```

#### workflow run

Run a workflow with optional parameters.

**Usage:**

```bash
occ workflow run WORKFLOW_NAME [flags]
```

**Flags:**

- `--namespace` - Namespace name
- `--set` - Workflow parameters (can be used multiple times)

**Examples:**

```bash
# Run a workflow
occ workflow run database-migration --namespace acme-corp

# Run with parameters
occ workflow run github-stats-report --namespace acme-corp --set spec.workflow.parameters.source.org=openchoreo --set spec.workflow.parameters.output.format=json
```

#### workflow logs

Get logs for a workflow.

**Usage:**

```bash
occ workflow logs WORKFLOW_NAME [flags]
```

**Flags:**

- `--namespace` - Namespace name
- `-f, --follow` - Follow the logs in real-time
- `--since` - Only return logs newer than a relative duration (e.g., 5m, 1h, 24h)
- `--workflowrun` - Workflow run name (defaults to latest run)

**Examples:**

```bash
# Get logs for a workflow
occ workflow logs database-migration --namespace acme-corp

# Follow logs in real-time
occ workflow logs database-migration --namespace acme-corp -f

# Get logs for a specific workflow run
occ workflow logs database-migration --workflowrun migration-run-1
```

#### workflow delete

Delete a workflow.

**Usage:**

```bash
occ workflow delete [WORKFLOW_NAME] [flags]
```

**Flags:**

- `--namespace` - Namespace name

**Examples:**

```bash
# Delete a workflow
occ workflow delete database-migration --namespace acme-corp
```

---

### workflowrun

Manage workflow runs in OpenChoreo.

**Usage:**

```bash
occ workflowrun <subcommand> [flags]
```

**Aliases:** `wr`, `workflowruns`

#### workflowrun list

List all workflow runs in a namespace.

**Usage:**

```bash
occ workflowrun list [flags]
```

**Flags:**

- `--namespace` - Namespace name

**Examples:**

```bash
# List all workflow runs in a namespace
occ workflowrun list --namespace acme-corp
```

#### workflowrun get

Get details of a specific workflow run.

**Usage:**

```bash
occ workflowrun get [WORKFLOW_RUN_NAME] [flags]
```

**Flags:**

- `--namespace` - Namespace name

**Examples:**

```bash
# Get a specific workflow run
occ workflowrun get migration-run-1 --namespace acme-corp
```

#### workflowrun logs

Get logs for a workflow run.

**Usage:**

```bash
occ workflowrun logs [WORKFLOW_RUN_NAME] [flags]
```

**Flags:**

- `--namespace` - Namespace name
- `-f, --follow` - Follow the logs in real-time
- `--since` - Only return logs newer than a relative duration (e.g., 5m, 1h, 24h)

**Examples:**

```bash
# Get logs for a workflow run
occ workflowrun logs migration-run-1 --namespace acme-corp

# Follow logs in real-time
occ workflowrun logs migration-run-1 --namespace acme-corp -f
```

---

### secretreference

Manage secret references in OpenChoreo.

**Usage:**

```bash
occ secretreference <subcommand> [flags]
```

**Aliases:** `sr`, `secretreferences`, `secretref`

#### secretreference list

List all secret references in a namespace.

**Usage:**

```bash
occ secretreference list [flags]
```

**Flags:**

- `--namespace` - Namespace name

**Examples:**

```bash
# List all secret references in a namespace
occ secretreference list --namespace acme-corp
```

#### secretreference get

Get details of a specific secret reference.

**Usage:**

```bash
occ secretreference get [SECRET_REFERENCE_NAME] [flags]
```

**Flags:**

- `--namespace` - Namespace name

**Examples:**

```bash
# Get a specific secret reference
occ secretreference get db-credentials --namespace acme-corp
```

#### secretreference delete

Delete a secret reference.

**Usage:**

```bash
occ secretreference delete [SECRET_REFERENCE_NAME] [flags]
```

**Flags:**

- `--namespace` - Namespace name

**Examples:**

```bash
# Delete a secret reference
occ secretreference delete db-credentials --namespace acme-corp
```

---

### workload

Manage workloads in OpenChoreo.

**Usage:**

```bash
occ workload <subcommand> [flags]
```

**Aliases:** `wl`, `workloads`

#### workload create

Create a workload from a descriptor file.

**Usage:**

```bash
occ workload create [flags]
```

**Flags:**

- `--name` - Name of the workload
- `--namespace` - Namespace name
- `--project` - Project name
- `--component` - Component name
- `--image` - Docker image name (e.g., `product-catalog:latest`)
- `--descriptor` - Path to the workload descriptor file
- `-o, --output` - Output format (`yaml`)
- `--dry-run` - Preview changes without writing files
- `--mode` - Operational mode: `api-server` (default) or `file-system`
- `--root-dir` - Root directory path for file-system mode (defaults to current directory)

**Examples:**

```bash
# Create a workload from a descriptor
occ workload create --name my-workload --namespace acme-corp --project online-store \
  --component product-catalog --descriptor workload.yaml

# Create a workload from an image
occ workload create --name my-workload --namespace acme-corp --project online-store \
  --component product-catalog --image product-catalog:latest

# Dry run to preview
occ workload create --name my-workload --namespace acme-corp --project online-store \
  --component product-catalog --descriptor workload.yaml --dry-run
```

#### workload list

List all workloads in a namespace.

**Usage:**

```bash
occ workload list [flags]
```

**Flags:**

- `--namespace` - Namespace name

**Examples:**

```bash
# List all workloads in a namespace
occ workload list --namespace acme-corp
```

#### workload get

Get details of a specific workload.

**Usage:**

```bash
occ workload get [WORKLOAD_NAME] [flags]
```

**Flags:**

- `--namespace` - Namespace name

**Examples:**

```bash
# Get a specific workload
occ workload get my-workload --namespace acme-corp
```

#### workload delete

Delete a workload.

**Usage:**

```bash
occ workload delete [WORKLOAD_NAME] [flags]
```

**Flags:**

- `--namespace` - Namespace name

**Examples:**

```bash
# Delete a workload
occ workload delete my-workload --namespace acme-corp
```

---

### componentrelease

:::note
This command only works in file-system mode. Set your context mode to `file-system` before using this command.
:::

Manage component releases in OpenChoreo.

**Usage:**

```bash
occ componentrelease <subcommand> [flags]
```

**Aliases:** `componentreleases`, `cr`

#### componentrelease generate

Generate ComponentRelease resources from Component, Workload, ComponentType, and Trait definitions.

**Usage:**

```bash
occ componentrelease generate [flags]
```

**Flags:**

- `--all` - Process all resources
- `--project` - Project name
- `--component` - Component name (requires `--project`)
- `--output-path` - Custom output directory path
- `--dry-run` - Preview changes without writing files

**Examples:**

```bash
# Generate releases for all components
occ componentrelease generate --all

# Generate releases for all components in a specific project
occ componentrelease generate --project demo-project

# Generate release for a specific component (requires --project)
occ componentrelease generate --project demo-project --component greeter-service

# Dry run (preview without writing)
occ componentrelease generate --all --dry-run

# Custom output path
occ componentrelease generate --all --output-path /custom/path
```

#### componentrelease list

List all component releases for a specific component.

**Usage:**

```bash
occ componentrelease list [flags]
```

**Flags:**

- `--namespace` - Namespace name
- `--project` - Project name
- `--component` - Component name

**Examples:**

```bash
# List all component releases for a component
occ componentrelease list --namespace acme-corp --project online-store --component product-catalog
```

#### componentrelease get

Get details of a specific component release.

**Usage:**

```bash
occ componentrelease get [COMPONENT_RELEASE_NAME] [flags]
```

**Flags:**

- `--namespace` - Namespace name

**Examples:**

```bash
# Get a specific component release
occ componentrelease get product-catalog-20260126-143022-1 --namespace acme-corp
```

#### componentrelease delete

Delete a component release.

**Usage:**

```bash
occ componentrelease delete [COMPONENT_RELEASE_NAME] [flags]
```

**Flags:**

- `--namespace` - Namespace name

**Examples:**

```bash
# Delete a component release
occ componentrelease delete product-catalog-20260126-143022-1 --namespace acme-corp
```

---

### releasebinding

:::note
This command only works in file-system mode. Set your context mode to `file-system` before using this command.
:::

Manage release bindings in OpenChoreo.

**Usage:**

```bash
occ releasebinding <subcommand> [flags]
```

**Aliases:** `releasebindings`, `rb`

#### releasebinding generate

Generate ReleaseBinding resources that bind component releases to environments.

**Usage:**

```bash
occ releasebinding generate [flags]
```

**Flags:**

- `-e, --target-env` - Target environment for the release binding (required)
- `--use-pipeline` - Deployment pipeline name for environment validation (required)
- `--all` - Process all resources
- `--project` - Project name
- `--component` - Component name (requires `--project`)
- `--component-release` - Explicit component release name (only valid with `--project` and `--component`)
- `--output-path` - Custom output directory path
- `--dry-run` - Preview changes without writing files

**Examples:**

```bash
# Generate bindings for all components in development environment
occ releasebinding generate --target-env development --use-pipeline default-pipeline --all

# Generate bindings for all components in a specific project
occ releasebinding generate --target-env staging --use-pipeline default-pipeline \
  --project demo-project

# Generate binding for a specific component
occ releasebinding generate --target-env production --use-pipeline default-pipeline \
  --project demo-project --component greeter-service

# Generate binding with explicit component release
occ releasebinding generate --target-env production --use-pipeline default-pipeline \
  --project demo-project --component greeter-service \
  --component-release greeter-service-20251222-3

# Dry run (preview without writing)
occ releasebinding generate --target-env development --use-pipeline default-pipeline \
  --all --dry-run

# Custom output path
occ releasebinding generate --target-env development --use-pipeline default-pipeline \
  --all --output-path /custom/path
```

#### releasebinding list

List all release bindings for a specific component.

**Usage:**

```bash
occ releasebinding list [flags]
```

**Flags:**

- `--namespace` - Namespace name
- `--project` - Project name
- `--component` - Component name

**Examples:**

```bash
# List all release bindings for a component
occ releasebinding list --namespace acme-corp --project online-store --component product-catalog
```

#### releasebinding get

Get details of a specific release binding.

**Usage:**

```bash
occ releasebinding get [RELEASE_BINDING_NAME] [flags]
```

**Flags:**

- `--namespace` - Namespace name

**Examples:**

```bash
# Get a specific release binding
occ releasebinding get product-catalog-dev-binding --namespace acme-corp
```

#### releasebinding delete

Delete a release binding.

**Usage:**

```bash
occ releasebinding delete [RELEASE_BINDING_NAME] [flags]
```

**Flags:**

- `--namespace` - Namespace name

**Examples:**

```bash
# Delete a release binding
occ releasebinding delete product-catalog-dev-binding --namespace acme-corp
```

---

### observabilityalertsnotificationchannel

Manage observability alerts notification channels in OpenChoreo.

**Usage:**

```bash
occ observabilityalertsnotificationchannel <subcommand> [flags]
```

**Aliases:** `oanc`, `obsnotificationchannel`, `observabilityalertsnotificationchannels`

#### observabilityalertsnotificationchannel list

List all observability alerts notification channels in a namespace.

**Usage:**

```bash
occ observabilityalertsnotificationchannel list [flags]
```

**Flags:**

- `--namespace` - Namespace name

**Examples:**

```bash
# List all notification channels in a namespace
occ observabilityalertsnotificationchannel list --namespace acme-corp
```

#### observabilityalertsnotificationchannel get

Get details of a specific notification channel.

**Usage:**

```bash
occ observabilityalertsnotificationchannel get [CHANNEL_NAME] [flags]
```

**Flags:**

- `--namespace` - Namespace name

**Examples:**

```bash
# Get a specific notification channel
occ observabilityalertsnotificationchannel get slack-alerts --namespace acme-corp
```

#### observabilityalertsnotificationchannel delete

Delete a notification channel.

**Usage:**

```bash
occ observabilityalertsnotificationchannel delete [CHANNEL_NAME] [flags]
```

**Flags:**

- `--namespace` - Namespace name

**Examples:**

```bash
# Delete a notification channel
occ observabilityalertsnotificationchannel delete slack-alerts --namespace acme-corp
```

---

### clusterauthzrole

Manage authorization cluster roles in OpenChoreo.

**Usage:**

```bash
occ clusterauthzrole <subcommand> [flags]
```

**Aliases:** `clusterauthzroles`, `car`

#### clusterauthzrole list

List all authorization cluster roles.

**Usage:**

```bash
occ clusterauthzrole list
```

**Examples:**

```bash
# List all authz cluster roles
occ clusterauthzrole list
```

#### clusterauthzrole get

Get details of a specific authorization cluster role.

**Usage:**

```bash
occ clusterauthzrole get [NAME]
```

**Examples:**

```bash
# Get a specific authz cluster role
occ clusterauthzrole get platform-admin
```

#### clusterauthzrole delete

Delete an authorization cluster role.

**Usage:**

```bash
occ clusterauthzrole delete [NAME]
```

**Examples:**

```bash
# Delete an authz cluster role
occ clusterauthzrole delete platform-admin
```

---

### clusterauthzrolebinding

Manage authorization cluster role bindings in OpenChoreo.

**Usage:**

```bash
occ clusterauthzrolebinding <subcommand> [flags]
```

**Aliases:** `clusterauthzrolebindings`, `carb`

#### clusterauthzrolebinding list

List all authorization cluster role bindings.

**Usage:**

```bash
occ clusterauthzrolebinding list
```

**Examples:**

```bash
# List all authz cluster role bindings
occ clusterauthzrolebinding list
```

#### clusterauthzrolebinding get

Get details of a specific authorization cluster role binding.

**Usage:**

```bash
occ clusterauthzrolebinding get [NAME]
```

**Examples:**

```bash
# Get a specific authz cluster role binding
occ clusterauthzrolebinding get admin-binding
```

#### clusterauthzrolebinding delete

Delete an authorization cluster role binding.

**Usage:**

```bash
occ clusterauthzrolebinding delete [NAME]
```

**Examples:**

```bash
# Delete an authz cluster role binding
occ clusterauthzrolebinding delete admin-binding
```

---

### authzrole

Manage authorization roles in OpenChoreo.

**Usage:**

```bash
occ authzrole <subcommand> [flags]
```

**Aliases:** `authzroles`, `ar`

#### authzrole list

List all authorization roles in a namespace.

**Usage:**

```bash
occ authzrole list [flags]
```

**Flags:**

- `--namespace` - Namespace name

**Examples:**

```bash
# List all authz roles in a namespace
occ authzrole list --namespace acme-corp
```

#### authzrole get

Get details of a specific authorization role.

**Usage:**

```bash
occ authzrole get [NAME] [flags]
```

**Flags:**

- `--namespace` - Namespace name

**Examples:**

```bash
# Get a specific authz role
occ authzrole get developer --namespace acme-corp
```

#### authzrole delete

Delete an authorization role.

**Usage:**

```bash
occ authzrole delete [NAME] [flags]
```

**Flags:**

- `--namespace` - Namespace name

**Examples:**

```bash
# Delete an authz role
occ authzrole delete developer --namespace acme-corp
```

---

### authzrolebinding

Manage authorization role bindings in OpenChoreo.

**Usage:**

```bash
occ authzrolebinding <subcommand> [flags]
```

**Aliases:** `authzrolebindings`, `arb`

#### authzrolebinding list

List all authorization role bindings in a namespace.

**Usage:**

```bash
occ authzrolebinding list [flags]
```

**Flags:**

- `--namespace` - Namespace name

**Examples:**

```bash
# List all authz role bindings in a namespace
occ authzrolebinding list --namespace acme-corp
```

#### authzrolebinding get

Get details of a specific authorization role binding.

**Usage:**

```bash
occ authzrolebinding get [NAME] [flags]
```

**Flags:**

- `--namespace` - Namespace name

**Examples:**

```bash
# Get a specific authz role binding
occ authzrolebinding get dev-binding --namespace acme-corp
```

#### authzrolebinding delete

Delete an authorization role binding.

**Usage:**

```bash
occ authzrolebinding delete [NAME] [flags]
```

**Flags:**

- `--namespace` - Namespace name

**Examples:**

```bash
# Delete an authz role binding
occ authzrolebinding delete dev-binding --namespace acme-corp
```
