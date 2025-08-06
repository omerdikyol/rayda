# 🚊 Rayda - Marmaray Train Tracker

> Real-time simulation of Istanbul's Marmaray train line with interactive map visualization

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://reactjs.org/)
[![Contributions Welcome](https://img.shields.io/badge/contributions-welcome-brightgreen.svg)](CONTRIBUTING.md)

## ✨ About

Rayda is an open-source web application that provides a real-time simulation of train positions on Istanbul's Marmaray line. Since official real-time tracking isn't publicly available, we create an intelligent simulation using official schedules, station coordinates, and travel times.

### 🎯 Features

- **Interactive Map**: Full Marmaray route with all 43 stations on an Istanbul map
- **Real-time Simulation**: Animated train icons showing estimated positions
- **Station Timetables**: Click any station to see next arrivals
- **Multiple Routes**: Supports different service patterns (Halkalı↔Gebze, Ataköy↔Pendik)
- **Mobile Optimized**: Responsive design for commuters on-the-go
- **Open Source**: Community-driven with transparent development

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- A Mapbox access token (free at [mapbox.com](https://mapbox.com))

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/rayda.git
cd rayda

# Install dependencies
npm install

# Set up environment (add your Mapbox token)
cp .env.example .env.local
# Edit .env.local and add: VITE_MAPBOX_ACCESS_TOKEN=your_token_here

# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) to view the app.

## 🛠 Development

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build production bundle
- `npm run lint` - Run ESLint for code quality
- `npm run preview` - Preview production build locally

### Tech Stack

- **Frontend**: React 19 + TypeScript
- **Mapping**: Mapbox GL JS for interactive visualization
- **State**: Zustand for train position management
- **Styling**: Tailwind CSS + Radix UI components
- **Build**: Vite for fast development and optimized builds

## 🗺 How It Works

Since real-time train location data isn't publicly available, Rayda creates an intelligent simulation:

1. **Schedule Data**: Uses official Marmaray timetables and route patterns
2. **Time Calculation**: Calculates train positions based on departure times and inter-station travel data
3. **Position Mapping**: Converts timing data to geographic coordinates for map display
4. **Real-time Updates**: Updates every second to show current estimated positions

## 🤝 Contributing

We welcome contributions from the community! This project especially needs:

- **📍 Accurate Data**: Station coordinates and precise travel times
- **🐛 Bug Reports**: Testing on different devices and browsers
- **💡 Features**: Ideas for improving the user experience
- **🌐 Localization**: Turkish language support and other translations

Read our [Contributing Guide](CONTRIBUTING.md) to get started.

### Priority Contributions Needed

- [ ] Verification of station coordinates (see issues labeled `data-needed`)
- [ ] Inter-station travel time collection
- [ ] Mobile testing and UX improvements
- [ ] Accessibility enhancements

## 📋 Roadmap

Check our [Roadmap](ROADMAP.md) for planned features and development timeline.

**Current Phase**: Foundation & Data Collection  
**Next**: Core MVP with station selection and timetables

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Istanbul Metropolitan Municipality for public transport data
- OpenStreetMap contributors for geographic data
- Mapbox for mapping infrastructure
- The open-source community for tools and libraries

## 📞 Support

- **🐛 Bug Reports**: [Create an issue](https://github.com/YOUR_USERNAME/rayda/issues/new/choose)
- **💡 Feature Requests**: [Start a discussion](https://github.com/YOUR_USERNAME/rayda/discussions)
- **❓ Questions**: Check our [FAQ](https://github.com/YOUR_USERNAME/rayda/discussions/categories/q-a)
- **🔒 Security**: See our [Security Policy](SECURITY.md)

---

Made with ❤️ for Istanbul's commuters and transit enthusiasts worldwide.