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
- `--url` - Control plane URL to update

**Examples:**
```bash
# Interactive login (default PKCE flow)
occ login

# Service account login with client credentials
occ login --client-credentials --client-id <client-id> --client-secret <client-secret>

# Login to a specific control plane URL
occ login --url https://api.openchoreo.example.com
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

### delete

Delete OpenChoreo resources by file names.

**Usage:**
```bash
occ delete -f <file> [flags]
```

**Flags:**
- `-f, --file` - Path to the YAML file containing resources to delete
- `-w, --wait` - Wait for the deletion to complete

**Examples:**
```bash
# Delete resources from a file
occ delete -f resources.yaml

# Delete and wait for completion
occ delete -f resources.yaml --wait
```

---

### config

Manage configuration contexts that store default values (e.g., namespace, project, component) for occ commands.

**Usage:**
```bash
occ config <subcommand> [flags]
```

#### config get-contexts

List all available configuration contexts.

**Usage:**
```bash
occ config get-contexts
```

**Examples:**
```bash
# Show all configuration contexts
occ config get-contexts
```

#### config set-context

Create or update a configuration context.

**Usage:**
```bash
occ config set-context <context-name> [flags]
```

**Flags:**
- `--namespace` - Namespace name stored in this configuration context
- `--project` - Project name stored in this configuration context
- `--component` - Component name stored in this configuration context
- `--dataplane` - Data plane reference stored in this configuration context
- `--environment` - Environment name stored in this configuration context
- `--mode` - Context mode: `api-server` (default) or `file-system`
- `--root-directory-path` - Root directory path for file-system mode (defaults to current directory)

**Examples:**
```bash
# Set a configuration context named acme-corp-context
occ config set-context acme-corp-context --namespace acme-corp \
  --project online-store --environment dev

# Set a file-system mode context
occ config set-context local-dev --mode file-system --root-directory-path /path/to/resources
```

#### config use-context

Switch to a specified configuration context.

**Usage:**
```bash
occ config use-context <context-name>
```

**Examples:**
```bash
# Switch to the configuration context named acme-corp-context
occ config use-context acme-corp-context
```

#### config current-context

Display the currently active configuration context.

**Usage:**
```bash
occ config current-context
```

**Examples:**
```bash
# Display the currently active configuration context
occ config current-context
```

#### config set-control-plane

Configure OpenChoreo API server connection.

**Usage:**
```bash
occ config set-control-plane [flags]
```

**Flags:**
- `--name` - Name of the control plane configuration
- `--url` - OpenChoreo API server endpoint URL

**Examples:**
```bash
# Set remote control plane endpoint
occ config set-control-plane --name production --url https://api.openchoreo.example.com

# Set local control plane (for development)
occ config set-control-plane --name local --url http://localhost:8080
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

#### component scaffold

Scaffold a Component YAML from ComponentType and Traits.

**Usage:**
```bash
occ component scaffold [flags]
```

**Flags:**
- `--name` - Component name
- `--type` - Component type in format `workloadType/componentTypeName` (e.g., `deployment/web-app`)
- `--traits` - Comma-separated list of trait names to include
- `--workflow` - ComponentWorkflow name to include in the scaffold
- `--namespace` - Namespace name (can be omitted if set in context)
- `--project` - Project name (can be omitted if set in context)
- `-o, --output-file` - Write output to specified file instead of stdout
- `--skip-comments` - Skip section headers and field description comments for minimal output
- `--skip-optional` - Skip fields with defaults

**Examples:**
```bash
# Scaffold a basic component
occ component scaffold --name my-app --type deployment/web-app

# Scaffold with traits
occ component scaffold --name my-app --type deployment/web-app --traits storage,ingress

# Scaffold with workflow
occ component scaffold --name my-app --type deployment/web-app --workflow docker-build

# Output to file
occ component scaffold --name my-app --type deployment/web-app -o my-app.yaml

# Minimal output without comments
occ component scaffold --name my-app --type deployment/web-app --skip-comments --skip-optional
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
occ component deploy api-service --set componentTypeEnvOverrides.replicas=3
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

---

### buildplane

Manage build planes in OpenChoreo.

**Usage:**
```bash
occ buildplane <subcommand> [flags]
```

**Aliases:** `bp`, `buildplanes`

#### buildplane list

List all build planes in a namespace.

**Usage:**
```bash
occ buildplane list [flags]
```

**Flags:**
- `--namespace` - Namespace name

**Examples:**
```bash
# List all build planes in a namespace
occ buildplane list --namespace acme-corp
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

#### workflow start

Start a new workflow run with optional parameters.

**Usage:**
```bash
occ workflow start WORKFLOW_NAME [flags]
```

**Flags:**
- `--namespace` - Namespace name
- `--set` - Workflow parameters (can be used multiple times)

**Examples:**
```bash
# Start a workflow
occ workflow start database-migration --namespace acme-corp

# Start with parameters
occ workflow start migration --namespace acme --set version=v2 --set dry_run=false
```

---

### componentworkflow

Manage component workflows in OpenChoreo.

**Usage:**
```bash
occ componentworkflow <subcommand> [flags]
```

**Aliases:** `cw`, `componentworkflows`

#### componentworkflow list

List all component workflow templates available in a namespace.

**Usage:**
```bash
occ componentworkflow list [flags]
```

**Flags:**
- `--namespace` - Namespace name

**Examples:**
```bash
# List all component workflows in a namespace
occ componentworkflow list --namespace acme-corp
```

#### componentworkflow start

Start a new component workflow run (build) with repository parameters.

**Usage:**
```bash
occ componentworkflow start [flags]
```

**Flags:**
- `--namespace` - Namespace name
- `--project` - Project name
- `--component` - Component name
- `--commit` - Git commit SHA
- `--set` - Build parameters (can be used multiple times)

**Examples:**
```bash
# Start component workflow with commit
occ componentworkflow start --namespace acme --project shop --component api --commit abc123

# Start with specific branch
occ componentworkflow start --namespace acme --project shop --component api
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

---

### componentworkflowrun

Manage component workflow runs in OpenChoreo.

**Usage:**
```bash
occ componentworkflowrun <subcommand> [flags]
```

**Aliases:** `cwr`, `componentworkflowruns`

#### componentworkflowrun list

List all component workflow runs for a specific component.

**Usage:**
```bash
occ componentworkflowrun list [flags]
```

**Flags:**
- `--namespace` - Namespace name
- `--project` - Project name
- `--component` - Component name

**Examples:**
```bash
# List all component workflow runs for a component
occ componentworkflowrun list --namespace acme-corp --project online-store --component product-catalog
```

---

### secretreference

Manage secret references in OpenChoreo.

**Usage:**
```bash
occ secretreference <subcommand> [flags]
```

**Aliases:** `sr`, `secretreferences`, `secret-ref`

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

---

### workload

Manage workloads in OpenChoreo.

**Usage:**
```bash
occ workload <subcommand> [flags]
```

**Aliases:** `wl`, `workloads`

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

**Aliases:** `component-release`

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

**Aliases:** `release-binding`

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

---

## Configuration

The CLI stores its configuration in `~/.occ/config.yaml`. This file contains:

- **Control planes**: API server endpoints and connection details
- **Credentials**: Authentication tokens and client credentials
- **Contexts**: Named sets of default values for commands

### Configuration File Structure

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
    authMethod: pkce  # or "client_credentials"
contexts:
  - name: my-context
    controlplane: production
    credentials: my-creds
    namespace: acme-corp
    project: online-store
    component: product-catalog
    environment: development
    mode: api-server  # or "file-system"
    rootDirectoryPath: /path/to/resources  # for file-system mode
```

### Modes

The CLI supports two modes:

1. **API Server Mode** (`api-server`): Connects to an OpenChoreo API server to manage resources remotely. This is the default mode.

2. **File System Mode** (`file-system`): Works with resources stored as YAML files in a directory structure. Useful for GitOps workflows and local development.
