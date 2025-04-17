import { useRef, useState } from 'react'
import * as VIM from '../../vim-web'
import { useUltraNoModel } from './ultraPageUtils'
import { residence } from '../devUrls'
import { Box3, Vector3 } from '../../vim-web/utils/math3d'
import ViewerRef = VIM.React.Ultra.ViewerRef

export function UltraSectionBox() {
  const div = useRef(null)
  const ref = useRef<ViewerRef>()
  const [visible, setVisible] = useState(false)
  const [interactive, setInteractive] = useState(false)
  const [clip, setClip] = useState(false)
  const [box, setBox] = useState({ min: { x: 0, y: 0, z: 0 }, max: { x: 0, y: 0, z: 0 } })

  const updateBox = (axis:string, type:string, value:string) => {
    const newValue = parseFloat(value) || 0;
    setBox(prev => {
      const updatedBox = { min: { ...prev.min }, max: { ...prev.max } };
      updatedBox[type][axis] = newValue;
      const box3 = new Box3(
        new Vector3(updatedBox.min.x, updatedBox.min.y, updatedBox.min.z),
        new Vector3(updatedBox.max.x, updatedBox.max.y, updatedBox.max.z)
      );
      ref.current.core.sectionBox.fitBox(box3);
      return updatedBox;
    });
  };

  useUltraNoModel(div, (ultra) => {
    createSectionBox(ultra);
    ref.current = ultra;
    ultra.core.sectionBox.onUpdate.subscribe(() => {
      setVisible(ultra.core.sectionBox.visible);
      setInteractive(ultra.core.sectionBox.interactive);
      setClip(ultra.core.sectionBox.clip);
      setBox(ultra.core.sectionBox.getBox());
    });
  });

  return (
    <div className='vc-inset-0 vc-absolute'>
      <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 1000, background: 'white', padding: '10px', borderRadius: '5px' }}>
        <Checkbox label='Visible' checked={visible} onChange={(value) => { setVisible(value); if (ref.current) ref.current.core.sectionBox.visible = value; }} />
        <br />
        <Checkbox label='Interactible' checked={interactive} onChange={(value) => { setInteractive(value); if (ref.current) ref.current.core.sectionBox.interactive = value; }} />
        <br />
        <Checkbox label='Clip' checked={clip} onChange={(value) => { setClip(value); if (ref.current) ref.current.core.sectionBox.clip = value; }} />
        <br />
        {['x', 'y', 'z'].map(axis => (
          <div key={axis} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <label>Min.{axis} <input type='number' style={{ width: '50px' }} value={box.min[axis].toFixed(1)} onChange={(e) => updateBox(axis, 'min', e.target.value)} /></label>
            <label>Max.{axis} <input type='number' style={{ width: '50px' }} value={box.max[axis].toFixed(1)} onChange={(e) => updateBox(axis, 'max', e.target.value)} /></label>
          </div>
        ))}
      </div>
      <div ref={div} className='vc-inset-0 vc-absolute' />
    </div>
  );
}

async function createSectionBox(ultra : ViewerRef) {
  await ultra.core.connect();
  
  const request = ultra.load({ url: residence });
  const result = await request.getResult();
  if (result.isSuccess) {
    await ultra.core.camera.frameAll(0);
    const box = await ultra.core.renderer.getBoundingBox();
    ultra.core.sectionBox.fitBox(box);
  }
}

function Checkbox({ label, checked, onChange }) {
  return (
    <label>
      <input type='checkbox' checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}
