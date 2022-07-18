import React from "react";

export function MenuMore(){

  return <div className="vim-menu-more">
    <ol>
      <li key={'vim-menu-more-navigation-orbit'}>
        <button> Orbit</button>
      </li>
      <li key={'vim-menu-more-navigation-first'}>
        <button> First Person</button>
      </li>
      <li key={'vim-menu-more-projection-persp'}>
        <button> Perspective</button>
      </li>
      <li key={'vim-menu-more-projection-ortho'}>
        <button> Orthographic</button>
      </li>
      <li key={'vim-menu-more-section-ignore'}>
        <button> Ignore Section Box</button>
      </li>
      <li key={'vim-menu-more-section-reset'}>
        <button> Reset Section Box</button>
      </li>
      <li key={'vim-menu-more-controls'}>
        <button> Show Controls</button>
      </li>
      <li key={'vim-menu-more-support'}>
        <button> Support Center</button>
      </li>
    </ol>
</div>
}