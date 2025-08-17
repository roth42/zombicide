# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a static front-end website for a Zombicide-related project. The site is built with vanilla HTML, CSS, and JavaScript for maximum compatibility and can be deployed to GitHub Pages.

## Development Setup

The project uses vanilla web technologies:
- HTML5 for structure
- CSS3 for styling with responsive design
- Vanilla JavaScript for interactivity
- GitHub Actions for automated deployment

### Project Structure
```
├── index.html          # Main HTML file
├── styles.css          # CSS styling
├── script.js           # JavaScript functionality
├── .github/
│   └── workflows/
│       └── deploy.yml  # GitHub Pages deployment
└── CLAUDE.md          # This file
```

## Commands

### Development
- Open `index.html` in a web browser to preview locally
- Use a local HTTP server for better development experience:
  ```bash
  python -m http.server 8000
  # or
  npx serve .
  ```

### Deployment
- Push to the `master` or `main` branch to trigger automatic deployment to GitHub Pages
- GitHub Actions workflow handles the deployment automatically

## Architecture

The site follows a simple static architecture:
- **index.html**: Single-page application with multiple sections
- **styles.css**: Mobile-first responsive CSS with modern styling
- **script.js**: Smooth scrolling navigation and active section highlighting
- **GitHub Actions**: Automated deployment pipeline

## GitHub Pages Setup

To enable GitHub Pages deployment:
1. Go to repository Settings > Pages
2. Set Source to "GitHub Actions"
3. The workflow will automatically deploy on pushes to main/master branch

## Notes for Future Development

- Site is optimized for static hosting and GitHub Pages
- Uses semantic HTML and accessible navigation
- Responsive design works on mobile and desktop
- JavaScript enhances UX with smooth scrolling
- Easy to extend with additional sections or pages