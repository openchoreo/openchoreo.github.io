---
title: CI Integration
unlisted: true
---

# CI Integration

OpenChoreo seamlessly integrates with existing CI/CD pipelines to automate application deployment and management. This guide demonstrates how to incorporate OpenChoreo into popular CI systems for streamlined development workflows.

## Overview

OpenChoreo's CI integration enables:
- **Automated deployments** triggered by code changes
- **Environment promotion** through deployment pipelines
- **Configuration validation** before deployment
- **Rollback capabilities** for failed deployments
- **Integration testing** in isolated environments

## Supported CI Systems

### GitHub Actions

OpenChoreo provides official GitHub Actions for seamless integration:

```yaml
name: Deploy to OpenChoreo
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup OpenChoreo CLI
      uses: openchoreo/setup-choreo@v1
      with:
        version: 'latest'
        
    - name: Deploy Application
      run: |
        choreo auth login --token ${{ secrets.CHOREO_TOKEN }}
        choreo deploy --environment production
      env:
        CHOREO_TOKEN: ${{ secrets.CHOREO_TOKEN }}
```

### GitLab CI

Integration with GitLab CI using Docker containers:

```yaml
stages:
  - build
  - test
  - deploy

deploy_production:
  stage: deploy
  image: openchoreo/cli:latest
  script:
    - choreo auth login --token $CHOREO_TOKEN
    - choreo deploy --environment production
  only:
    - main
  variables:
    CHOREO_TOKEN: $CHOREO_API_TOKEN
```

### Jenkins

Jenkins pipeline integration using the OpenChoreo CLI:

```groovy
pipeline {
    agent any
    
    environment {
        CHOREO_TOKEN = credentials('choreo-api-token')
    }
    
    stages {
        stage('Deploy') {
            steps {
                sh '''
                    curl -sSL https://install.openchoreo.dev | sh
                    choreo auth login --token ${CHOREO_TOKEN}
                    choreo deploy --environment production
                '''
            }
        }
    }
}
```

## CI Workflow Patterns

### Feature Branch Deployment

Deploy feature branches to ephemeral environments:

```yaml
name: Feature Branch Deploy
on:
  pull_request:
    types: [opened, synchronize]

jobs:
  deploy-feature:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Create Feature Environment
      run: |
        choreo env create --name "feature-${{ github.head_ref }}" \
          --template development
        
    - name: Deploy to Feature Environment  
      run: |
        choreo deploy --environment "feature-${{ github.head_ref }}"
```

### Multi-Environment Promotion

Promote applications through environments:

```yaml
name: Multi-Environment Deploy
on:
  push:
    branches: [main]

jobs:
  deploy-staging:
    runs-on: ubuntu-latest
    steps:
    - name: Deploy to Staging
      run: choreo deploy --environment staging
      
  deploy-production:
    needs: deploy-staging
    runs-on: ubuntu-latest
    environment: production
    steps:
    - name: Deploy to Production
      run: choreo deploy --environment production
```

## Build Integration

### Container Image Building

Integrate with container registries:

```yaml
- name: Build and Push Image
  run: |
    docker build -t ${{ env.REGISTRY }}/app:${{ github.sha }} .
    docker push ${{ env.REGISTRY }}/app:${{ github.sha }}
    
- name: Update OpenChoreo Configuration
  run: |
    choreo component update app \
      --image ${{ env.REGISTRY }}/app:${{ github.sha }}
```

### Cloud Native Buildpacks

Use Buildpacks for automatic image creation:

```yaml
- name: Build with Buildpacks
  run: |
    pack build ${{ env.REGISTRY }}/app:${{ github.sha }} \
      --builder paketobuildpacks/builder:base
    docker push ${{ env.REGISTRY }}/app:${{ github.sha }}
```

## Testing Integration

### Integration Testing

Run tests against deployed environments:

```yaml
- name: Deploy Test Environment
  run: choreo deploy --environment test
  
- name: Run Integration Tests
  run: |
    export API_URL=$(choreo env get test --output json | jq -r '.endpoints.api.url')
    npm run test:integration
    
- name: Cleanup Test Environment
  run: choreo env delete test
  if: always()
```

### Load Testing

Automated performance testing:

```yaml
- name: Load Testing
  run: |
    export APP_URL=$(choreo component get api --environment staging -o json | jq -r '.url')
    k6 run --env API_URL=$APP_URL load-test.js
```

## Security and Secrets Management

### API Token Management

Secure token handling across CI systems:

```yaml
- name: Configure OpenChoreo Auth
  run: |
    echo "${{ secrets.CHOREO_TOKEN }}" | choreo auth login --stdin
    
- name: Verify Authentication
  run: choreo auth whoami
```

### Secrets Injection

Automatic secrets deployment:

```yaml
- name: Deploy Application Secrets
  run: |
    choreo secret create database-url \
      --value "${{ secrets.DATABASE_URL }}" \
      --environment production
```

## Monitoring and Notifications

### Deployment Status

Track deployment progress:

```yaml
- name: Monitor Deployment
  run: |
    choreo deploy --environment production --wait
    
- name: Verify Health Checks
  run: |
    choreo component status api --environment production
```

### Slack Integration

Notify teams of deployment status:

```yaml
- name: Notify Deployment Success
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    text: "Deployment to production completed successfully"
  if: success()
```

## Troubleshooting

### Common Issues

**Authentication Failures**
- Verify API token permissions
- Check token expiration
- Ensure proper secret configuration

**Deployment Timeouts**
- Increase timeout values
- Check resource availability
- Monitor application startup logs

**Environment Conflicts**
- Use unique environment names
- Implement proper cleanup strategies
- Validate environment state before deployment

### Debug Mode

Enable verbose logging for troubleshooting:

```bash
choreo deploy --environment production --debug --verbose
```

## Best Practices

- **Use environment-specific configurations**
- **Implement proper secret management**
- **Enable deployment monitoring and alerting**
- **Use feature flags for gradual rollouts**
- **Maintain deployment history and rollback capabilities**
- **Test deployments in staging environments first**