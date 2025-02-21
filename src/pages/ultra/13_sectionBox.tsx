import { useRef, useState } from 'react'
import { UltraViewer, UltraReact } from '../../vim-web'
import { useUltraNoModel } from './ultraPageUtils'
import { residence } from '../devUrls'
import { Box3, Vector3 } from '../../vim-web/core-viewers/ultra/utils/math3d'

export function UltraSectionBox() {
  const div = useRef(null)
  const ref = useRef<UltraReact.UltraComponentRef>()
  const [enable, setEnable] = useState(false)
  const [visible, setVisible] = useState(false)
  const [interactible, setInteractible] = useState(false)
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
      ref.current.viewer.sectionBox.fitBox(box3);
      return updatedBox;
    });
  };

  useUltraNoModel(div, (ultra) => {
    createSectionBox(ultra);
    ref.current = ultra;
    ultra.viewer.sectionBox.onUpdate.subscribe(() => {
      setEnable(ultra.viewer.sectionBox.enabled);
      setVisible(ultra.viewer.sectionBox.visible);
      setInteractible(ultra.viewer.sectionBox.interactible);
      setClip(ultra.viewer.sectionBox.clip);
      setBox(ultra.viewer.sectionBox.getBox());
    });
  });

  return (
    <div className='vc-inset-0 vc-absolute'>
      <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 1000, background: 'white', padding: '10px', borderRadius: '5px' }}>
        <Checkbox label='Enable' checked={enable} onChange={(value) => { setEnable(value); if (ref.current) ref.current.viewer.sectionBox.enabled = value; }} />
        <br />
        <Checkbox label='Visible' checked={visible} onChange={(value) => { setVisible(value); if (ref.current) ref.current.viewer.sectionBox.visible = value; }} />
        <br />
        <Checkbox label='Interactible' checked={interactible} onChange={(value) => { setInteractible(value); if (ref.current) ref.current.viewer.sectionBox.interactible = value; }} />
        <br />
        <Checkbox label='Clip' checked={clip} onChange={(value) => { setClip(value); if (ref.current) ref.current.viewer.sectionBox.clip = value; }} />
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

async function createSectionBox(ultra) {
  await ultra.viewer.connect();
  const request = ultra.load({ url: residence });
  const result = await request.getResult();
  if (result.isSuccess) {
    await ultra.viewer.camera.frameAll(0);
    const box = await result.vim.getBoundingBox('all');
    ultra.viewer.sectionBox.fitBox(box);
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
