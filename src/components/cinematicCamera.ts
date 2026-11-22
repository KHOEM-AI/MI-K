import * as THREE from 'three';

export class CinematicCamera {
  private enabled = false;
  private radius = 500;
  private height = 200;
  private speed = 0.15;
  private angle = 0;
  
  toggle(): boolean {
    this.enabled = !this.enabled;
    return this.enabled;
  }
  
  isEnabled(): boolean {
    return this.enabled;
  }
  
  disable(): void {
    this.enabled = false;
  }
  
  update(camera: THREE.PerspectiveCamera, controls: { target: THREE.Vector3; update: () => void }, dt: number): void {
    if (!this.enabled) return;
    this.angle += this.speed * dt;
    camera.position.x = Math.cos(this.angle) * this.radius;
    camera.position.z = Math.sin(this.angle) * this.radius;
    camera.position.y = this.height + Math.sin(this.angle * 2) * 40;
    camera.lookAt(controls.target);
  }
}
