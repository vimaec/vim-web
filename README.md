# Vim Webgl Component

# Documentation

[API Documentation](https://vimaec.github.io/vim-webgl-app/docs/api/index.html)

# Live Demo

## Web
- [Small Model Demo - Residence](https://vimaec.github.io/vim-webgl-app/release?vim=https://vim02.azureedge.net/samples/residence.v1.2.75.vim)
- [Medium Model Demo - Medical Tower](https://vimaec.github.io/vim-webgl-app/release?vim=https://vim02.azureedge.net/samples/skanska.vim)
- [Large Model Demo - Stadium](https://vimaec.github.io/vim-webgl-app/release?vim=https://vim02.azureedge.net/samples/stadium.vim) (_Warning_: slow download times)

## JSFiddle
- [JsFiddle - Hello World](https://jsfiddle.net/simon_vimaec/2khmqy9v/)
- [JsFiddle - Simple](https://jsfiddle.net/simon_vimaec/kmc7Lftw/)
- [JsFiddle - Isolation](https://jsfiddle.net/simon_vimaec/72xbfa4p/)
- [JsFiddle - Message](https://jsfiddle.net/simon_vimaec/bh17u03t/)
- [JsFiddle - Custom Inputs](https://jsfiddle.net/simon_vimaec/k0w4erjn/)
- [JsFiddle - Custom Context Menu](https://jsfiddle.net/simon_vimaec/7marsfwj/)
- [JsFiddle - Custom Camera](https://jsfiddle.net/simon_vimaec/2x0noetj/)
- [JsFiddle - Custom Loading](https://jsfiddle.net/simon_vimaec/3g2epmf1/)
- [JsFiddle - Embedding](https://jsfiddle.net/simon_vimaec/8y321skn/)


# Overview

The VIM Webgl Component is a React ui implementation for the [Vim WebGL Viewer]([https://jsfiddle.net/simon_vimaec/2khmqy9v/](https://github.com/vimaec/vim-webgl-viewer)).

## Intents

- Provide a smooth online user experience while browsing complex bim data.
- Test and demonstrate the capabilities of the underlying vim-webgl-viewer.
- Be easy to use, extend and customize for other developpers.

## VIM

The VIM file format is a high-performance 3D scene format that supports rich BIM data, and can be easily extended to support other relational or non-relation data sets.
Unlike IFC the VIM format is already tessellated, and ready to render. This results in very fast load times. Unlike glTF the VIM format is faster to load, scales better, and has a consistent structure for relational BIM data.
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
