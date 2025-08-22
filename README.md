# OpenChoreo Documentation & Website

This repository contains the source code for the [OpenChoreo documentation website](https://openchoreo.dev), built with [Docusaurus](https://docusaurus.io/).

OpenChoreo is an open-source Internal Developer Platform (IDP) that simplifies Kubernetes complexity for development teams.

## Prerequisites

- **Node.js** version 20.0 or above
- **npm** (comes with Node.js)

## Installation

```bash
npm install
```

## Local Development

```bash
npm run start
```

This command starts a local development server and opens a browser window. Most changes are reflected live without having to restart the server.

The site will be available at `http://localhost:3000`

## Build

```bash
npm run build
```

This command generates static content into the `build` directory and can be served using any static contents hosting service.

## Project Structure

```
├── blog/                 # Blog content (optional)
├── docs/                 # Documentation content (Markdown/MDX)
├── src/                  # React components and custom pages
│   ├── components/       # Reusable React components
│   ├── css/              # Custom styles
│   └── pages/            # Custom pages (homepage, etc.)
├── static/               # Static assets
├── docusaurus.config.ts  # Main configuration file
├── sidebars.ts           # Sidebar navigation structure
└── package.json          # Dependencies and scripts
```

## Writing Documentation

### Adding a New Documentation Page

1. Create a new Markdown file in the appropriate `docs/` subdirectory
2. Add front matter at the beginning of the file:
   ```markdown
   ---
   title: Your Page Title
   ---
   ```
3. Write your content using Markdown or MDX
4. Update `sidebars.ts` to include your page in the navigation

### Linking to Other Docs

When linking to other documentation pages, use relative file paths with the `.md` extension:

```markdown
[Link to another page](../concepts/developer-abstractions.md)
```

This approach ensures links work on GitHub, in Markdown editors, and with Docusaurus versioning.

## Deployment

The site automatically deploys to GitHub Pages when changes are pushed to the main branch via GitHub Actions.

## Contributing

We welcome contributions to improve the OpenChoreo documentation!

### How to Contribute

1. Fork the repository
2. Create a feature branch (`git checkout -b <your-improvement>`)
3. Make your changes
4. Test locally with `npm run start`
5. Build to check for errors: `npm run build`
6. Commit your changes with a descriptive message
7. Push to your fork (`git push origin <your-improvement>`)
8. Create a Pull Request with a clear description of your changes

## Links

- [OpenChoreo Main Repository](https://github.com/openchoreo/openchoreo)
- [OpenChoreo Website](https://openchoreo.dev)
- [Discord Community](https://discord.com/invite/asqDFC8suT)
- [GitHub Discussions](https://github.com/openchoreo/openchoreo/discussions)
