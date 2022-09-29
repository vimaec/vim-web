import * as VIM from 'vim-webgl-viewer/'
import { Settings } from '../helpers/settings'

export function setBehind (value: boolean) {
  const component = document.getElementsByClassName('vim-component')[0]
  const behind = component.classList.contains('behind')
  if (value && !behind) {
    component.classList.add('behind')
  } else if (!value && behind) {
    component.classList.remove('behind')
  }
}

export function resetCamera (viewer: VIM.Viewer) {
  viewer.camera.reset()
  viewer.camera.frame('all', 45)
}

export function frameContext (viewer: VIM.Viewer) {
  const box =
    viewer.selection.count > 0
      ? viewer.selection.getBoundingBox()
      : getVisibleBoundingBox(viewer)

  if (box) viewer.camera.frame(box, 'none', viewer.camera.defaultLerpDuration)
}

export function frameSelection (viewer: VIM.Viewer) {
  if (viewer.selection.count === 0) return
  const box = viewer.selection.getBoundingBox()

  if (box && viewer.sectionBox.box.intersectsBox(box)) {
    viewer.camera.frame(box, 'none', viewer.camera.defaultLerpDuration)
  }
}

export function isolate (
  viewer: VIM.Viewer,
  settings: Settings,
  objects: VIM.Object[]
) {
  if (!objects) {
    showAll(viewer, settings)
  } else {
    const set = new Set(objects)

    viewer.vims.forEach((vim) => {
      for (const obj of vim.getAllObjects()) {
        obj.visible = set.has(obj)
      }
      vim.scene.material = settings.useIsolationMaterial
        ? viewer.renderer.materials.isolation
        : undefined
    })
  }

  viewer.camera.frame(
    getVisibleBoundingBox(viewer),
    'none',
    viewer.camera.defaultLerpDuration
  )
  viewer.selection.clear()
}

export function hideSelection (viewer: VIM.Viewer, settings: Settings) {
  for (const obj of viewer.selection.objects) {
    obj.visible = false
  }

  const vim = viewer.selection.vim
  vim.scene.material = settings.useIsolationMaterial
    ? viewer.renderer.materials.isolation
    : undefined

  viewer.selection.clear()
}

export function showAll (viewer: VIM.Viewer, settings: Settings) {
  viewer.vims.forEach((v) => {
    for (const obj of v.getAllObjects()) {
      obj.visible = true
    }
    v.scene.material = undefined
  })
}

export function toGhost (source: VIM.Viewer | VIM.Vim) {
  const vimToGhost = (vim: VIM.Vim) => {
    for (const obj of vim.getAllObjects()) {
      obj.visible = false
    }
    vim.scene.material = vim.scene.builder.meshBuilder.materials.isolation
  }
  if (source instanceof VIM.Viewer) {
    for (const vim of source.vims) {
      vimToGhost(vim)
    }
  } else {
    vimToGhost(source)
  }
}

export function setAllVisible (source: VIM.Viewer | VIM.Vim) {
  const vimShowAll = (vim: VIM.Vim) => {
    for (const obj of vim.getAllObjects()) {
      obj.visible = true
    }
    vim.scene.material = undefined
  }
  if (source instanceof VIM.Viewer) {
    for (const vim of source.vims) {
      vimShowAll(vim)
    }
  } else {
    vimShowAll(source)
  }
}

export function getVisibleObjects (source: VIM.Viewer | VIM.Vim) {
  const all: VIM.Object[] = []
  const vimAllObjects = (vim: VIM.Vim) => {
    for (const obj of vim.getAllObjects()) {
      if (obj.visible) {
        all.push(obj)
      }
    }
  }
  if (source instanceof VIM.Viewer) {
    for (const vim of source.vims) {
      vimAllObjects(vim)
    }
  } else {
    vimAllObjects(source)
  }
  return all
}

export function getObjects (source: VIM.Viewer | VIM.Vim) {
  const all: VIM.Object[] = []
  const vimAllObjects = (vim: VIM.Vim) => {
    for (const obj of vim.getAllObjects()) {
      all.push(obj)
    }
  }
  if (source instanceof VIM.Viewer) {
    for (const vim of source.vims) {
      vimAllObjects(vim)
    }
  } else {
    vimAllObjects(source)
  }
  return all
}

export function getAllVisible (source: VIM.Viewer | VIM.Vim) {
  const vimAllVisible = (vim: VIM.Vim) => {
    for (const obj of vim.getAllObjects()) {
      if (!obj.visible) return false
    }
    return true
  }
  if (source instanceof VIM.Viewer) {
    for (const vim of source.vims) {
      if (!vimAllVisible(vim)) return false
    }
    return true
  } else {
    return vimAllVisible(source)
  }
}

export function getVisibleBoundingBox (source: VIM.Viewer | VIM.Vim) {
  let box: VIM.THREE.Box3

  const vimBoxUnion = (vim: VIM.Vim) => {
    for (const obj of vim.getAllObjects()) {
      if (!obj.visible) continue
      const b = obj.getBoundingBox()
      box = box ? box.union(b) : b.clone()
    }
  }
  if (source instanceof VIM.Viewer) {
    for (const vim of source.vims) {
      vimBoxUnion(vim)
    }
  } else {
    vimBoxUnion(source)
  }

  return box
}
