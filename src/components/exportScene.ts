import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

export function exportSceneToGLB(scene: THREE.Scene): Promise<void> {
  return new Promise((resolve, reject) => {
    const exporter = new GLTFExporter();
    exporter.parse(
      scene,
      (result) => {
        if (result instanceof ArrayBuffer) {
          const blob = new Blob([result], { type: 'model/gltf-binary' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'MI-K-VISION-3D-' + Date.now() + '.glb';
          a.click();
          setTimeout(() => URL.revokeObjectURL(url), 1000);
          resolve();
        } else {
          reject(new Error('Expected ArrayBuffer'));
        }
      },
      (error) => reject(error),
      { binary: true }
    );
  });
}
