# CLI Reference

The `occ` (OpenChoreo CLI) is a command-line interface tool for interacting with OpenChoreo. It provides commands to manage organizations, projects, components, deployments, and other OpenChoreo resources.

## Global Options

All commands support the following global options through context configuration:

- `--organization` - Organization name
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
# Apply a single resource file
occ apply -f organization.yaml

# Apply a component configuration
occ apply -f my-component.yaml
```

---

### create

Create OpenChoreo resources like projects, components, and workloads.

**Usage:**
```bash
occ create <resource-type> [flags]
```

#### create workload

Create a workload from a workload descriptor file.

**Usage:**
```bash
occ create workload [flags]
```

**Flags:**
- `--name` - Name of the workload
- `--organization` - Organization name
- `--project` - Project name
- `--component` - Component name
- `--descriptor` - Path to the workload descriptor file
- `--image` - Docker image URL
- `-o, --output` - Output file path for the generated workload resource

**Examples:**
```bash
# Create workload from descriptor
occ create workload --descriptor workload.yaml --organization acme-corp \
  --project online-store --component product-catalog --image myimage:latest

# Create workload and save to file
occ create workload --descriptor workload.yaml --organization acme-corp \
  --project online-store --component product-catalog --image myimage:latest \
  --output workload-cr.yaml
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

### scaffold

Generate scaffolded resource YAML files from existing CRDs.

**Usage:**
```bash
occ scaffold <resource-type> [flags]
```

#### scaffold component

Scaffold a Component YAML from ComponentType and Traits.

**Usage:**
```bash
occ scaffold component [flags]
```

**Flags:**
- `--name` - Component name
- `--type` - Component type in format `workloadType/componentTypeName` (e.g., `deployment/web-app`)
- `--traits` - Comma-separated list of trait names to include
- `--workflow` - ComponentWorkflow name to include in the scaffold
- `--organization` - Organization name (can be omitted if set in context)
- `--project` - Project name (can be omitted if set in context)
- `-o, --output-file` - Write output to specified file instead of stdout
- `--skip-comments` - Skip section headers and field description comments for minimal output
- `--skip-optional` - Skip optional fields without defaults

**Examples:**
```bash
# Scaffold a basic component
occ scaffold component --name my-app --type deployment/web-app

# Scaffold with traits
occ scaffold component --name my-app --type deployment/web-app --traits storage,ingress

# Scaffold with workflow
occ scaffold component --name my-app --type deployment/web-app --workflow docker-build

# Output to file
occ scaffold component --name my-app --type deployment/web-app -o my-app.yaml

# Minimal output without comments
occ scaffold component --name my-app --type deployment/web-app --skip-comments --skip-optional
```

---

### config

Manage configuration contexts that store default values (e.g., organization, project, component) for occ commands.

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
- `--organization` - Organization name stored in this configuration context
- `--project` - Project name stored in this configuration context
- `--component` - Component name stored in this configuration context
- `--dataplane` - Data plane reference stored in this configuration context
- `--environment` - Environment name stored in this configuration context
- `--mode` - Context mode: `api-server` (default) or `file-system`
- `--root-directory-path` - Root directory path for file-system mode (defaults to current directory)

**Examples:**
```bash
# Set a configuration context named acme-corp-context
occ config set-context acme-corp-context --organization acme-corp \
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

### component-release

:::note
This command only works in file-system mode. Set your context mode to `file-system` before using this command.
:::

**Usage:**
```bash
occ component-release <subcommand> [flags]
```

#### component-release generate

Generate ComponentRelease resources from Component, Workload, ComponentType, and Trait definitions.

**Usage:**
```bash
occ component-release generate [flags]
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
occ component-release generate --all

# Generate releases for all components in a specific project
occ component-release generate --project demo-project

# Generate release for a specific component (requires --project and --output-path)
occ component-release generate --project demo-project --component greeter-service \
  --output-path ./releases

# Dry run (preview without writing)
occ component-release generate --all --dry-run

# Custom output path
occ component-release generate --all --output-path /custom/path
```

---

### release-binding

:::note
This command only works in file-system mode. Set your context mode to `file-system` before using this command.
:::

**Usage:**
```bash
occ release-binding <subcommand> [flags]
```

#### release-binding generate

Generate ReleaseBinding resources that bind component releases to environments.

**Usage:**
```bash
occ release-binding generate [flags]
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
occ release-binding generate --target-env development --use-pipeline default-pipeline --all

# Generate bindings for all components in a specific project
occ release-binding generate --target-env staging --use-pipeline default-pipeline \
  --project demo-project

# Generate binding for a specific component
occ release-binding generate --target-env production --use-pipeline default-pipeline \
  --project demo-project --component greeter-service

# Generate binding with explicit component release
occ release-binding generate --target-env production --use-pipeline default-pipeline \
  --project demo-project --component greeter-service \
  --component-release greeter-service-20251222-3

# Dry run (preview without writing)
occ release-binding generate --target-env development --use-pipeline default-pipeline \
  --all --dry-run

# Custom output path
occ release-binding generate --target-env development --use-pipeline default-pipeline \
  --all --output-path /custom/path
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
    organization: acme-corp
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
