#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// Chart configurations: maps chart directory names to output files
const CHARTS = [
  {
    chartDir: 'openchoreo-control-plane',
    outputFile: 'control-plane.mdx',
    title: 'Control Plane',
    description: 'Helm chart values reference for openchoreo-control-plane.',
    sidebarPosition: 1,
  },
  {
    chartDir: 'openchoreo-data-plane',
    outputFile: 'data-plane.mdx',
    title: 'Data Plane',
    description: 'Helm chart values reference for openchoreo-data-plane.',
    sidebarPosition: 2,
  },
  {
    chartDir: 'openchoreo-build-plane',
    outputFile: 'build-plane.mdx',
    title: 'Build Plane',
    description: 'Helm chart values reference for openchoreo-build-plane.',
    sidebarPosition: 3,
  },
  {
    chartDir: 'openchoreo-observability-plane',
    outputFile: 'observability-plane.mdx',
    title: 'Observability Plane',
    description: 'Helm chart values reference for openchoreo-observability-plane.',
    sidebarPosition: 4,
  },
];

/**
 * Converts camelCase, kebab-case, or lowercase strings to Title Case with spaces
 */
function formatSectionTitle(str) {
  const withSpaces = str
    .replace(/-/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .trim();
  return withSpaces
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Recursively flattens a JSON schema into rows for the markdown table
 */
function flattenSchema(schema, currentPath, rows) {
  if (schema.properties) {
    for (const [key, value] of Object.entries(schema.properties)) {
      flattenSchema(value, `${currentPath}.${key}`, rows);
    }
  } else {
    rows.push({
      path: currentPath,
      description: schema.description,
      type: schema.type,
      default: schema.default,
    });
  }
}

/**
 * Generates markdown documentation for a single Helm chart
 */
function generateChartDocs(chartConfig, helmBasePath, outputBasePath) {
  const schemaPath = path.join(helmBasePath, chartConfig.chartDir, 'values.schema.json');
  const chartPath = path.join(helmBasePath, chartConfig.chartDir, 'Chart.yaml');
  const outputPath = path.join(outputBasePath, chartConfig.outputFile);

  if (!fs.existsSync(schemaPath)) {
    console.warn(`[helm-doc-gen] Schema not found: ${schemaPath}. Skipping ${chartConfig.title}.`);
    return false;
  }

  if (!fs.existsSync(chartPath)) {
    console.warn(`[helm-doc-gen] Chart.yaml not found: ${chartPath}. Skipping ${chartConfig.title}.`);
    return false;
  }

  let schema, chart;

  try {
    const schemaContent = fs.readFileSync(schemaPath, 'utf-8');
    schema = JSON.parse(schemaContent);
  } catch (e) {
    console.error(`[helm-doc-gen] Error parsing schema for ${chartConfig.title}: ${e.message}`);
    return false;
  }

  try {
    const chartContent = fs.readFileSync(chartPath, 'utf-8');
    chart = yaml.load(chartContent);
  } catch (e) {
    console.error(`[helm-doc-gen] Error parsing Chart.yaml for ${chartConfig.title}: ${e.message}`);
    return false;
  }

  const backtick = '`';

  // Build markdown content
  let markdown = `---
title: ${chartConfig.title}
description: ${chartConfig.description}
sidebar_position: ${chartConfig.sidebarPosition}
---

`;

  // Build a map of dependency names/aliases to their repository URLs
  // Use alias if defined, otherwise use name (alias is what appears in values.yaml)
  const dependencyMap = {};
  if (chart.dependencies && chart.dependencies.length > 0) {
    chart.dependencies.forEach(dep => {
      if (dep.repository) {
        const key = dep.alias || dep.name;
        if (key) {
          dependencyMap[key] = dep.repository;
        }
      }
    });
  }

  // Dependencies Section
  if (chart.dependencies && chart.dependencies.length > 0) {
    markdown += `## Dependencies\n\n`;
    markdown += `This chart depends on the following sub-charts. For full configuration options of each dependency, please refer to their official documentation.\n\n`;
    markdown += `| Name | Version | Repository | Condition |\n`;
    markdown += `| :--- | :--- | :--- | :--- |\n`;

    chart.dependencies.forEach(dep => {
      const name = dep.name || '-';
      const version = dep.version || '-';
      const condition = dep.condition ? `${backtick}${dep.condition}${backtick}` : '-';

      let repoDisplay = dep.repository || '-';
      if (dep.repository && dep.repository.startsWith('http')) {
        repoDisplay = `[${dep.repository}](${dep.repository})`;
      }

      let nameDisplay = name;
      if (dep.repository) {
        nameDisplay = `[${name}](${dep.repository})`;
      }

      markdown += `| ${nameDisplay} | ${version} | ${repoDisplay} | ${condition} |\n`;
    });

    markdown += `\n`;
  }

  // Schema Properties Sections
  if (schema.properties) {
    for (const [sectionName, sectionSchema] of Object.entries(schema.properties)) {
      const formattedTitle = formatSectionTitle(sectionName);
      markdown += `## ${formattedTitle}\n\n`;

      // Check if this section is a dependency and add link to official docs
      if (dependencyMap[sectionName]) {
        const repoUrl = dependencyMap[sectionName];
        markdown += `For full configuration options, please refer to the [official chart documentation](${repoUrl}).\n\n`;
      }

      if (sectionSchema.description) {
        markdown += `${sectionSchema.description}\n\n`;
      }

      const rows = [];
      flattenSchema(sectionSchema, sectionName, rows);

      if (rows.length > 0) {
        markdown += `| Parameter | Description | Type | Default |\n`;
        markdown += `| :--- | :--- | :--- | :--- |\n`;

        rows.forEach(row => {
          let desc = (row.description || '')
            .replace(/\|/g, '\\|')
            .replace(/\n/g, ' ')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');

          let def = '';
          if (row.default !== undefined) {
            if (typeof row.default === 'object') {
              def = JSON.stringify(row.default);
            } else {
              def = String(row.default);
            }
          }
          def = def.replace(/[\u200B-\u200D\uFEFF\u2060]/g, '').trim();

          // Handle multiline strings - replace newlines to keep table intact
          if (def.includes('\n')) {
            // For multiline config strings, show a placeholder
            def = '(multiline string)';
          } else {
            def = def.replace(/\|/g, '\\|');
            def = def.replace(/</g, '&lt;').replace(/>/g, '&gt;');
          }

          const defDisplay = def ? `${backtick}${def}${backtick}` : '';
          const typeDisplay = `${backtick}${row.type || 'object'}${backtick}`;
          const paramDisplay = `${backtick}${row.path}${backtick}`;

          markdown += `| ${paramDisplay} | ${desc} | ${typeDisplay} | ${defDisplay} |\n`;
        });

        markdown += `\n`;
      }
    }
  }

  // Only write if content has changed
  if (fs.existsSync(outputPath)) {
    const currentContent = fs.readFileSync(outputPath, 'utf-8');
    if (currentContent === markdown) {
      console.log(`[helm-doc-gen] ${chartConfig.title}: No changes`);
      return true;
    }
  }

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, markdown);
  console.log(`[helm-doc-gen] Generated: ${outputPath}`);
  return true;
}

// Main execution
const siteDir = path.resolve(__dirname, '..');
const helmBasePath = path.resolve(siteDir, '../openchoreo/install/helm');
const outputBasePath = path.resolve(siteDir, 'docs/reference/helm');

if (!fs.existsSync(helmBasePath)) {
  console.error(`[helm-doc-gen] Error: Helm charts directory not found at ${helmBasePath}`);
  console.error('[helm-doc-gen] Make sure the openchoreo repo is cloned as a sibling directory.');
  process.exit(1);
}

console.log('[helm-doc-gen] Generating Helm chart documentation...');

let generatedCount = 0;
for (const chartConfig of CHARTS) {
  if (generateChartDocs(chartConfig, helmBasePath, outputBasePath)) {
    generatedCount++;
  }
}

console.log(`[helm-doc-gen] Done. Processed ${generatedCount}/${CHARTS.length} charts.`);
