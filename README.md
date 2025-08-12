# OpenChoreo Documentation Website

Official documentation website for [OpenChoreo](https://openchoreo.io) - an open-source Internal Developer Platform (IDP).

## 🚀 Quick Start

### Prerequisites

- **Ruby 3.1** or higher
- **Bundler** gem (`gem install bundler`)

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/openchoreo/openchoreo.github.io.git
   cd openchoreo.github.io
   ```

2. **Install dependencies**
   ```bash
   bundle install
   ```

3. **Run the development server**
   ```bash
   bundle exec jekyll serve
   ```
   
   The site will be available at `http://localhost:4000`

4. **Build for production**
   ```bash
   # Standard build
   bundle exec jekyll build
   
   # Build for GitHub Pages deployment
   bundle exec jekyll build --baseurl "/openchoreo.github.io"
   ```

## 📁 Project Structure

```
├── _data/              # Navigation and site data
│   └── docs_nav.yml    # Documentation navigation structure
├── _includes/          # Reusable Jekyll components
├── _layouts/           # Page layout templates
├── _site/              # Generated site (gitignored)
├── css/                # Stylesheets (Bootstrap, custom themes)
├── docs/               # Documentation content (Markdown)
├── img/                # Images and media assets
└── js/                 # JavaScript files
```

## 📝 Writing Documentation

### Adding a New Page

1. Create a new Markdown file in the appropriate `docs/` subdirectory
2. Add YAML front matter:
   ```yaml
   ---
   layout: docs
   title: Your Page Title
   ---
   ```
3. Write your content in Markdown
4. Update `_data/docs_nav.yml` to include your page in the navigation

### Documentation Structure

The documentation is organized into the following sections:

- **Overview** - Introduction to OpenChoreo, architecture, and roadmap
- **Getting Started** - Quick start guide, installation, and first deployment
- **Learn from Examples** - Practical examples and use cases
- **Core Concepts** - Platform philosophy, abstractions, and relationships
- **Reference** - FAQ, changelog, configuration schema, and limits

## 🎨 Features

- **Dark/Light Mode** - Automatic theme detection with manual toggle
- **Responsive Design** - Mobile-friendly documentation
- **Syntax Highlighting** - Code blocks with Prism.js
- **Auto-generated TOC** - Table of contents from headings
- **SEO Optimized** - Meta tags and Open Graph support

## 🛠 Development Commands

```bash
# Install dependencies
bundle install

# Start development server with live reload
bundle exec jekyll serve

# Build the site
bundle exec jekyll build

# Clean build artifacts
bundle exec jekyll clean

# Build for GitHub Pages
bundle exec jekyll build --baseurl "/openchoreo.github.io"
```

## 🚢 Deployment

The site is automatically deployed to GitHub Pages when changes are pushed to the main branch.

### Manual Deployment

1. Go to the [Actions tab](https://github.com/openchoreo/openchoreo.github.io/actions)
2. Select the "Deploy Jekyll site to Pages" workflow
3. Click "Run workflow"
4. Select the branch and click "Run workflow"

## 🤝 Contributing

We welcome contributions to improve the OpenChoreo documentation!

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/improvement`)
3. Make your changes
4. Test locally with `bundle exec jekyll serve`
5. Commit your changes (`git commit -am 'Add new documentation'`)
6. Push to the branch (`git push origin feature/improvement`)
7. Create a Pull Request

## 📚 Technologies Used

- **[Jekyll](https://jekyllrb.com/)** (v4.4.1) - Static site generator
- **[Bootstrap](https://getbootstrap.com/)** (v5.3) - CSS framework
- **[jQuery](https://jquery.com/)** (v3.7.1) - JavaScript library
- **[Prism.js](https://prismjs.com/)** - Syntax highlighting
- **[GitHub Pages](https://pages.github.com/)** - Hosting

## 📄 License

This project is part of the OpenChoreo open-source initiative. Please refer to the main OpenChoreo repository for licensing information.

## 🔗 Links

- [OpenChoreo Main Repository](https://github.com/openchoreo/openchoreo)
- [OpenChoreo Website](https://openchoreo.io)
- [Documentation](https://openchoreo.github.io)

## 💬 Support

For questions and support:
- Open an issue in this repository for documentation-related concerns
- Visit the main [OpenChoreo repository](https://github.com/openchoreo/openchoreo) for platform-related issues
- Join our community discussions

---

Built with ❤️ by the OpenChoreo community
