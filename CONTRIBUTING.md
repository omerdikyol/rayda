# Contributing to Rayda

Thank you for your interest in contributing to Rayda! This document provides guidelines for contributing to the Marmaray Train Tracker project.

## 🚀 Quick Start

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/rayda.git`
3. Install dependencies: `npm install`
4. Start development server: `npm run dev`
5. Open http://localhost:5173 in your browser

## 📋 Ways to Contribute

### 🐛 Bug Reports
- Use the Bug Report template when creating issues
- Include browser/device information and steps to reproduce
- Check if the issue already exists before creating a new one

### 🌟 Feature Requests
- Use the Feature Request template for new ideas
- Explain the use case and why it would benefit users
- Reference the roadmap to see if it's already planned

### 📍 Data Contributions
- **High Priority**: We need accurate station coordinates and travel times
- Each station needs verification - check the "Data Needed" issues
- Provide sources for any data you contribute

### 💻 Code Contributions
- Start with issues labeled `good first issue` or `help wanted`
- Follow the existing code style and patterns
- Add tests for new features
- Update documentation as needed

## 🛠 Development Setup

### Prerequisites
- Node.js 18+ and npm
- Git
- A Mapbox access token (for map features)

### Environment Setup
1. Copy `.env.example` to `.env.local` (when available)
2. Add your Mapbox token: `VITE_MAPBOX_ACCESS_TOKEN=your_token_here`

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues automatically

### Code Style
- We use ESLint and Prettier for code formatting
- Run `npm run lint` before committing
- Follow TypeScript best practices
- Use meaningful component and variable names

## 📁 Project Structure

```
src/
├── components/     # React components
├── hooks/         # Custom React hooks  
├── stores/        # Zustand state management
├── data/          # Static data (stations, routes)
├── utils/         # Utility functions
├── types/         # TypeScript type definitions
└── styles/        # Global styles
```

## 🔄 Pull Request Process

1. Create a feature branch: `git checkout -b feature/your-feature-name`
2. Make your changes following the code style
3. Add/update tests if applicable
4. Run `npm run lint` to check for issues
5. Commit with a clear message describing the change
6. Push to your fork and create a Pull Request
7. Fill out the PR template completely
8. Wait for review and address any feedback

### PR Requirements
- All CI checks must pass
- Code must be reviewed by at least one maintainer
- Include screenshots for UI changes
- Update documentation if needed

## 🗺 Data Standards

### Station Data
- Coordinates must be in [longitude, latitude] format
- Use accurate coordinates from official sources
- Include data source in PR description

### Travel Times
- Provide times in seconds between consecutive stations
- Consider both directions if they differ
- Source from official timetables when possible

## 🏷 Issue Labels

- `bug` - Something isn't working
- `enhancement` - New feature or improvement
- `good first issue` - Good for newcomers
- `help wanted` - Extra attention needed
- `data-needed` - Requires accurate station/timing data
- `documentation` - Documentation improvements

## 🤝 Code of Conduct

This project follows our [Code of Conduct](CODE_OF_CONDUCT.md). Please read it before participating.

## 📞 Getting Help

- **General questions**: Use GitHub Discussions
- **Bug reports**: Create an issue with the bug template
- **Real-time chat**: Join our community (links in README)
- **Security issues**: See SECURITY.md for private reporting

## 🎯 Roadmap

Check our [ROADMAP.md](ROADMAP.md) to see what we're working on and planned features.

---

By contributing to Rayda, you're helping make public transit more accessible for Istanbul residents and visitors. Thank you! 🙏