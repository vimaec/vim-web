# VIM WebGL Component

### Documentation

Explore the full [API Documentation](https://vimaec.github.io/vim-web/api/).

### Package
https://www.npmjs.com/package/vim-web

## Live Demo

### WebGL Viewer
- **[Small - Residence](https://vimaec.github.io/vim-web/webgl)**
- **[Medium - Medical Tower](https://vimaec.github.io/vim-web/webgl?vim=https://storage.cdn.vimaec.com/samples/Medical_Tower.vim)**

### Ultra Viewer
- **[Small - Residence](https://vimaec.github.io/vim-web/ultra)**
- **[Medium - Medical Tower](https://vimaec.github.io/vim-web/ultra?vim=https://storage.cdn.vimaec.com/samples/Medical_Tower.vim)**

## Overview

The **VIM-Web** repository consists of four primary components, divided into two layers:

### Core Viewers
- **WebGL Viewer:** A WebGL-based viewer for the VIM format. Includes features like outlines, ghosting, and sectioning, but without UI components.
- **Ultra Viewer:** A high-performance viewer for the VIM Ultra Render Server, optimized for scale and speed.

### React Viewers
- **WebGL Component:** A React-based wrapper for the WebGL viewer, providing interactive UI elements and a BIM explorer.
- **Ultra Component:** A React-based wrapper for the Ultra viewer, featuring a UI for real-time interactions.

## VIM Format

The **VIM** file format is a high-performance 3D scene format that supports rich BIM data. It can also be extended to accommodate other relational and non-relational datasets. Unlike **IFC**, the VIM format is pre-tessellated, allowing for rapid loading and rendering.

Learn more about the VIM format here: [VIM GitHub Repository](https://github.com/vimaec/vim).

### Built With
- [VIM WebGL Viewer](https://github.com/vimaec/vim-webgl-viewer)
- [React.js](https://reactjs.org/)

## Getting Started

Follow these steps to get started with the project:

1. Clone the repository.
2. Open the project in **VS Code**.
3. Install the dependencies: `npm install`.
4. Start the development server: `npm run dev`.

> **Note:** Ensure you have a recent version of **Node.js** installed, as required by Vite.

## Repository Organization

- **`./docs`:** Root folder for GitHub Pages, built using the `build:website` script.
- **`./dist`:** Contains the built package for npm, created with the `build:libs` script.
- **`./src/pages`:** Source code for the demo pages published on GitHub Pages.
- **`./src/vim-web`:** Source code for building and publishing the vim-web npm package.
- **`./src/core-viewers/webgl`:** Source code for the WebGL core viewer. Based on [vim-webgl-viewer](https://github.com/vimaec/vim-webgl-viewer).
- **`./src/core-viewers/ultra`:** Source code for the Ultra core viewer.
- **`./src/react-viewers/webgl`:** Source code for the WebGL React component. Based on [vim-webgl-component](https://github.com/vimaec/vim-webgl-component).
- **`./src/react-viewers/ultra`:** Source code for the Ultra React component.

## License

Distributed under the **MIT License**. See `LICENSE.txt` for more details.

## Contact

- **Simon Roberge** - [simon.roberge@vimaec.com](mailto:simon.roberge@vimaec.com)
- **Martin Ashton** - [martin.ashton@vimaec.com](mailto:martin.ashton@vimaec.com)

## Acknowledgments

Special thanks to these packages and more:
- [react-complex-tree](https://github.com/lukasbach/react-complex-tree)
- [re-resizable](https://github.com/bokuweb/re-resizable)
- [react-tooltip](https://github.com/ReactTooltip/react-tooltip)
- [Strongly Typed Events](https://github.com/KeesCBakker/Strongly-Typed-Events-for-TypeScript#readme)
