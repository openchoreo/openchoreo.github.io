---
layout: docs
title: Getting Started with Contributing
---

# Getting Started with Contributing

Welcome to the OpenChoreo contributor community! We're excited to have you join us in building the future of Internal Developer Platforms. This guide will help you get started with contributing to OpenChoreo, whether you're fixing bugs, adding features, improving documentation, or helping with community support.

## Ways to Contribute

### 🐛 **Bug Reports & Feature Requests**
- Report bugs through [GitHub Issues](https://github.com/openchoreo/openchoreo/issues)
- Request new features via [GitHub Discussions](https://github.com/openchoreo/openchoreo/discussions)
- Participate in feature design discussions
- Help triage and reproduce existing issues

### 💻 **Code Contributions**
- Fix bugs and implement new features
- Improve performance and reliability
- Add new integrations and extensions
- Enhance testing coverage

### 📚 **Documentation**
- Improve existing documentation
- Create tutorials and examples
- Translate documentation to other languages
- Review and update technical content

### 🤝 **Community Support**
- Help answer questions in discussions
- Mentor new contributors
- Organize community events
- Share your OpenChoreo experience

## Development Environment Setup

### Prerequisites

Ensure you have the following tools installed:

```bash
# Required tools
go version        # Go 1.21 or later
kubectl version   # Kubernetes CLI
docker version    # Docker for container building
make --version    # GNU Make for build automation

# Optional but recommended
k3d version       # Local Kubernetes clusters
helm version      # Kubernetes package manager
```

### Repository Structure

OpenChoreo consists of several repositories:

```
openchoreo/
├── openchoreo/           # Main platform repository
├── openchoreo-cli/       # Command-line interface
├── openchoreo-ui/        # Web console
├── openchoreo-docs/      # Documentation site
└── openchoreo-examples/  # Example applications
```

### Setting Up the Development Environment

1. **Fork and Clone the Repository**

```bash
# Fork the repository on GitHub, then clone your fork
git clone https://github.com/YOUR_USERNAME/openchoreo.git
cd openchoreo

# Add upstream remote
git remote add upstream https://github.com/openchoreo/openchoreo.git
```

2. **Install Dependencies**

```bash
# Install Go dependencies
go mod download

# Install development tools
make install-tools
```

3. **Set Up Local Kubernetes Cluster**

```bash
# Create a local k3d cluster
k3d cluster create openchoreo-dev \
  --port "8080:80@loadbalancer" \
  --port "8443:443@loadbalancer"

# Install OpenChoreo CRDs
make install-crds
```

4. **Run Tests**

```bash
# Run unit tests
make test

# Run integration tests
make test-integration

# Run end-to-end tests
make test-e2e
```

## Making Your First Contribution

### Finding Good First Issues

Look for issues labeled with:
- `good first issue`: Perfect for newcomers
- `help wanted`: Community contributions welcome
- `documentation`: Documentation improvements needed
- `bug`: Bug fixes that need attention

### Development Workflow

1. **Create a Feature Branch**

```bash
# Update your main branch
git checkout main
git pull upstream main

# Create a new feature branch
git checkout -b feature/your-feature-name
```

2. **Make Your Changes**

```bash
# Make your code changes
# Add tests for new functionality
# Update documentation as needed

# Run tests locally
make test

# Run linting
make lint
```

3. **Commit Your Changes**

```bash
# Stage your changes
git add .

# Commit with a descriptive message
git commit -m "feat: add new component validation logic

- Add validation for component resource limits
- Include comprehensive test coverage
- Update documentation with new validation rules

Fixes #123"
```

4. **Push and Create Pull Request**

```bash
# Push to your fork
git push origin feature/your-feature-name

# Create pull request on GitHub
# Fill out the PR template completely
```

### Commit Message Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
type(scope): description

[optional body]

[optional footer]
```

**Types:**
- `feat`: New features
- `fix`: Bug fixes
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(api): add component validation endpoint
fix(cli): resolve authentication token refresh issue
docs(tutorial): add getting started guide
```

## Code Review Process

### Pull Request Requirements

Before submitting a PR, ensure:
- [ ] All tests pass locally
- [ ] Code follows project style guidelines
- [ ] Documentation is updated if needed
- [ ] Commit messages follow conventions
- [ ] PR description explains the changes
- [ ] Related issues are referenced

### Review Process

1. **Automated Checks**: CI/CD pipeline runs tests and checks
2. **Community Review**: Other contributors review your code
3. **Maintainer Review**: Core maintainers provide final approval
4. **Merge**: Changes are merged into the main branch

### Addressing Review Feedback

```bash
# Make changes based on feedback
# Add new commits or amend existing ones
git add .
git commit -m "address review feedback"

# Push updates
git push origin feature/your-feature-name
```

## Testing Guidelines

### Unit Tests

Write unit tests for all new functionality:

```go
func TestComponentValidation(t *testing.T) {
    tests := []struct {
        name      string
        component *Component
        wantErr   bool
    }{
        {
            name: "valid component",
            component: &Component{
                Name: "test-service",
                Type: "service",
            },
            wantErr: false,
        },
        {
            name: "invalid component - missing name",
            component: &Component{
                Type: "service",
            },
            wantErr: true,
        },
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            err := ValidateComponent(tt.component)
            if (err != nil) != tt.wantErr {
                t.Errorf("ValidateComponent() error = %v, wantErr %v", err, tt.wantErr)
            }
        })
    }
}
```

### Integration Tests

Test interactions between components:

```go
func TestComponentDeployment(t *testing.T) {
    // Setup test environment
    client := fake.NewClientBuilder().Build()
    
    // Create test component
    component := &Component{
        ObjectMeta: metav1.ObjectMeta{
            Name:      "test-component",
            Namespace: "test",
        },
        Spec: ComponentSpec{
            Type: "service",
        },
    }
    
    // Test deployment creation
    err := DeployComponent(client, component)
    assert.NoError(t, err)
    
    // Verify deployment was created
    deployment := &appsv1.Deployment{}
    err = client.Get(context.TODO(), types.NamespacedName{
        Name:      "test-component",
        Namespace: "test",
    }, deployment)
    assert.NoError(t, err)
}
```

## Documentation Contributions

### Documentation Structure

```
docs/
├── overview/          # High-level concepts
├── getting-started/   # Onboarding guides
├── core-concepts/     # Detailed explanations
├── tutorials/         # Step-by-step guides
├── reference/         # API documentation
└── contributing/      # Contributor guides
```

### Writing Guidelines

- **Clear and Concise**: Use simple, direct language
- **Examples**: Include practical code examples
- **Screenshots**: Add visuals where helpful
- **Links**: Link to related documentation
- **Testing**: Test all code examples

### Documentation Standards

```markdown
---
layout: docs
title: Page Title
---

# Page Title

Brief introduction explaining what this page covers.

## Main Section

Content with examples:

```yaml
apiVersion: choreo.dev/v1
kind: Component
metadata:
  name: example
spec:
  type: service
```

### Subsection

More detailed information.
```

## Release Process

### Development Branches

- `main`: Stable, production-ready code
- `develop`: Integration branch for new features
- `feature/*`: Individual feature branches
- `release/*`: Release preparation branches
- `hotfix/*`: Critical bug fixes

### Contribution Lifecycle

1. **Planning**: Feature proposals and design discussions
2. **Development**: Implementation in feature branches
3. **Review**: Code review and testing
4. **Integration**: Merge to develop branch
5. **Release**: Version tagging and release notes
6. **Deployment**: Distribution to users

## Community Guidelines

### Communication Channels

- **GitHub Discussions**: Feature requests and general discussions
- **GitHub Issues**: Bug reports and specific tasks
- **Slack**: Real-time community chat
- **Community Calls**: Regular video conferences

### Code of Conduct

We are committed to providing a welcoming and inclusive environment:

- **Be Respectful**: Treat all community members with respect
- **Be Collaborative**: Work together towards common goals
- **Be Patient**: Help newcomers learn and grow
- **Be Constructive**: Provide helpful feedback and suggestions

### Recognition

We recognize contributors through:
- **Contributor Hall of Fame**: Featured on our website
- **Release Notes**: Credit for significant contributions
- **Community Spotlights**: Highlighting community members
- **Conference Speaking**: Opportunities to present your work

## Getting Help

### Resources

- **Documentation**: Comprehensive guides and references
- **Examples**: Real-world application examples
- **Community Forums**: Ask questions and get help
- **Office Hours**: Regular help sessions with maintainers

### Mentorship Program

New contributors can request mentorship:
- **Pairing Sessions**: Work directly with experienced contributors
- **Code Reviews**: Detailed feedback on contributions
- **Career Development**: Guidance on open source contribution
- **Project Leadership**: Opportunities to lead initiatives

## Next Steps

Ready to contribute? Here's what to do next:

1. **Join the Community**: Connect with us on GitHub and Slack
2. **Explore the Codebase**: Familiarize yourself with the project structure
3. **Find Your First Issue**: Look for beginner-friendly issues
4. **Set Up Development Environment**: Follow the setup guide
5. **Make Your First Contribution**: Start with documentation or small fixes

Welcome to the OpenChoreo community! We're excited to see what you'll build with us.