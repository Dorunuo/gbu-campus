import * as THREE from 'three';
import {CAMPUS} from '../../shared/campus-layout.js';

// Optional navigation overlay only: never changes missions or collision geometry.
export function createMemoryBeacons(scene) {
  const root = new THREE.Group();
  root.name = 'memory-location-beacons';
  root.visible = false;
  scene.add(root);
  const resources = [];
  const material = opacity => {
    const value = new THREE.MeshBasicMaterial({color:0xffcf55, transparent:true,
      opacity, depthTest:false, depthWrite:false, fog:false, toneMapped:false,
      side:THREE.DoubleSide});
    resources.push(value);
    return value;
  };
  const markers = CAMPUS.stations.map(station => {
    const group = new THREE.Group();
    group.position.set(station.position.x, 0, station.position.z);
    group.name = station.id;
    root.add(group);
    const add = (geometry, mat, y) => {
      resources.push(geometry);
      const mesh = new THREE.Mesh(geometry, mat);
      mesh.position.y = y;
      mesh.renderOrder = 900; // After buildings, before the first-person kick (1000).
      group.add(mesh);
      return mesh;
    };
    add(new THREE.CylinderGeometry(.13,.13,55,8,1,true),material(.85),27.5);
    add(new THREE.CylinderGeometry(.75,1.3,55,12,1,true),material(.10),27.5);
    const ring = add(new THREE.RingGeometry(1.1,1.5,32),material(.85),.12);
    ring.rotation.x = -Math.PI/2;

    const canvas = document.createElement('canvas');
    canvas.width = 768; canvas.height = 128;
    const ctx = canvas.getContext('2d');
    // If canvas labels are unavailable, keep the location columns usable.
    if (!ctx) return {id:station.id,group,label:null};
    ctx.fillStyle = 'rgba(15,22,27,.88)'; ctx.fillRect(0,0,768,128);
    ctx.strokeStyle = '#ffcf55'; ctx.lineWidth = 3; ctx.strokeRect(2,2,764,124);
    ctx.textAlign = 'center'; ctx.fillStyle = '#ffdf83'; ctx.font = 'bold 32px sans-serif';
    ctx.fillText(station.title,384,48);
    ctx.font = '27px sans-serif';
    ctx.fillText(`X ${station.position.x}  /  Z ${station.position.z} · game units`,384,94);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const labelMaterial = new THREE.SpriteMaterial({map:texture,transparent:true,
      depthTest:false,depthWrite:false,fog:false,toneMapped:false});
    const label = new THREE.Sprite(labelMaterial);
    label.position.y = 18; label.scale.set(24,4,1); label.renderOrder = 901;
    group.add(label); resources.push(texture,labelMaterial);
    return {id:station.id,group,label};
  });
  return {
    update({enabled=false,active=false,memories=[]}={}) {
      root.visible = enabled && active;
      // Keep all four locations, including completed ones; no spoilers about solutions.
      for (const marker of markers) marker.label?.material.color.set(memories.includes(marker.id)?0xa6e6c3:0xffffff);
    },
    diagnostics() { return {visible:root.visible,markers:markers.map(({id,group})=>({id,x:group.position.x,z:group.position.z})),throughWalls:true}; },
    dispose() {scene.remove(root);resources.forEach(resource=>resource.dispose());}
  };
}
