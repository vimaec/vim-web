# Vim Webgl Component

# Documentation

[API Documentation](https://vimaec.github.io/vim-web/api/)

# Live Demo

## Web
- [Small Webgl Demo] - (https://vimaec.github.io/vim-web/webgl)
- [Medium Webgl Demo] - (https://vimaec.github.io/vim-web/webgl?vim=https://vim.azureedge.net/samples/skanska.vim)
- [Small Webgl Demo] - (https://vimaec.github.io/vim-web/webgl?vim=https://vim.azureedge.net/samples/stadium.vim)

- [Small Ultra Demo] - (https://vimaec.github.io/vim-web/ultra)
- [Medium Ultra Demo] - (https://vimaec.github.io/vim-web/ultra?vim=https://vim.azureedge.net/samples/skanska.vim)
- [Small Ultra Demo] - (https://vimaec.github.io/vim-web/ultra?vim=https://vim.azureedge.net/samples/stadium.vim)

You can find detailed camera controls here:  
https://docs.vimaec.com/docs/vim-cloud/webgl-navigation-and-controls-guide

# Overview

The Vim-Web Repo has four main constituents which can be divided in 2 layers:
Core Viewers:
- Webgl Viewer : A webgl viewer for the vim format with no ui featuring, outlines, ghosting, sectionning and more.
- Ultra Viewer : A client viewer for the VIM Ultra Render Server featuring unparalled scale and performance.
React Viewers:
- WebglComponent : A react based wrapper for the the core wegbl viewer providing interactive ui and a bim explorer.
- UltraComponent : A react based wrapper for the the core ultra viewer providing ui for the current state.

## VIM

The VIM file format is a high-performance 3D scene format that supports rich BIM data, and can be easily extended to support other relational or non-relation data sets.
Unlike IFC the VIM format is already tessellated, and ready to render. This results in very fast load times.
More information on the vim format can be found here: https://github.com/vimaec/vim

### Built With

- [VIM Webgl Viewer](https://github.com/vimaec/vim-webgl-viewer)
- [react.js](https://reactjs.org/)

## Getting Started

1. Clone the project.
2. Open the project in VS Code.
3. Install packages by running npm install.
4. Run the dev command to start a live test server.

Make sure you have a recent version of NodeJS installed as Vite requires it.

## Repo organization

./docs - the root folder for the GitHub pages. These are built by running the build:website script.
./dist - built package destined to npm ends up here. Built using the build:libs script.
./src/pages - the source code for the demo pages published on github pages. 
./src/vim-web - the source code to build and publish vim-web into an npm package.
./src/core-viewers/webgl - the source code for the webgl core viewer. Originaly https://github.com/vimaec/vim-webgl-viewer
./src/core-viewers/ultra - the source code for the ultra core viewer.
./src/react-viewers/webgl - the source code for the webgl react component. Originaly https://github.com/vimaec/vim-webgl-component
./src/react-viewers/ultra -  the source code for the ultra react component.  


## License

Distributed under the MIT License. See `LICENSE.txt` for more information.

## Contact

- Simon Roberge - simon.roberge@vimaec.com
- Martin Ashton - martin.ashton@vimaec.com

## Acknowledgments

Thanks to these great packages and more:

- [react-complex-tree](https://github.com/lukasbach/react-complex-tree)
- [re-resizable](https://github.com/bokuweb/re-resizable)
- [react-tooltip](https://github.com/ReactTooltip/react-tooltip)
- [strongly typed events](https://github.com/KeesCBakker/Strongly-Typed-Events-for-TypeScript#readme)
