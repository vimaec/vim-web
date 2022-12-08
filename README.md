# Vim Webgl Component

## About The Project

Live Demo : [HERE](https://vimaec.github.io/vim-webgl-app/release/)

The vim webgl component is a UI layer built on top of the vim webgl viewer.

Intents:

- Provide a smooth online user experience while browsing complex bim data.
- Test and demonstrate the capabilities of the underlying vim-viewer.
- Be easy to use, extend and customize for other developpers.

### Built With
- [vim webgl viewer](https://github.com/vimaec/vim-webgl-viewer)
- [react.js](https://reactjs.org/)
- [three.js](https://threejs.org/)

<!-- GETTING STARTED -->

## Getting Started

1. Clone the project.
2. Open the project in VS Code.
3. Install packages by running npm install.
4. Run the dev command to start a live test server.

Make sure you have a recent version of NodeJS installed as Vite requires it.

## How To

### Customize Inputs

```javascript
// Define the new input scheme.
class MyScheme implements VIM.InputScheme {
  default: VIM.DefaultInputScheme

  constructor (viewer: VIM.Viewer) {
    this.default = new VIM.DefaultInputScheme(viewer)
  }

  onMainAction (hit: VIM.InputAction): void {
    console.log('Custom click message')
    this.default.onMainAction(hit)
  }

  // Idle action is called when the mouse is idle for a certain delay
  onIdleAction (hit: VIM.InputAction): void {
    console.log('Idle action is disabled')
    // Because we are not calling default
  }

  onKeyAction (key: number): boolean {
    switch (key) {
      case VIM.KEYS.KEY_SPACE: {
        console.log('Space bar is disabled.')
        // Because we are not calling default
        return true
      }
    }
    return this.default.onKeyAction(key)
  }
}

createVimComponent((cmp: VimComponentRef) => {
  cmp.viewer.loadVim('https://vim.azureedge.net/samples/residence.vim')
  // Override the viewer input scheme.
  cmp.viewer.inputs.scheme = new MyScheme(cmp.viewer)
})
```

### Customize Context Menu
```javascript
createVimComponent((cmp: VimComponentRef) => {
  cmp.viewer.loadVim('https://vim.azureedge.net/samples/residence.vim')
  cmp.customizeContextMenu((menu) => [
    // Keep existing menu
    ...menu,
    // Append a divider
    {
      id: 'custom-divier',
      enabled: true
    },
    // Append a custom button
    {
      action: () => console.log('Custom button'),
      enabled: true,
      id: 'custom-button',
      keyboard: '',
      label: 'Custom Button'
    }
  ])
})
```

### Isolate an object
```javascript

createVimComponent((cmp: VimComponentRef) => {
  cmp.viewer
    .loadVim('https://vim.azureedge.net/samples/residence.vim')
    .then((vim) => {
      // Get object using its BIM id form the loaded vim.
      const objects = vim.getObjectsFromElementId(ID)
      cmp.isolation.isolate(objects, 'custom')
    })
})

```

### Display a Custom Message
```javascript
createVimComponent((cmp: VimComponentRef) => {
  cmp.viewer
    .loadVim('https://vim.azureedge.net/samples/residence.vim')
    .then((vim) => {
      cmp.setMsg('Custom message for 3 seconds')
      setTimeout(() => cmp.setMsg(undefined), 3000)
    })
})

```


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


