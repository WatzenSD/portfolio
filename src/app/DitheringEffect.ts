import { Effect } from "postprocessing";
import * as THREE from "three";
import ditheringShader from './DitheringShader';

export interface DitheringEffectOptions {
  time?: number;
  resolution?: THREE.Vector2;
  gridSize?: number;
  luminanceMethod?: number;
  invertColor?: boolean;
  pixelSizeRatio?: number;
  grayscaleOnly?: boolean;
  dynamicPixelation?: boolean;
  ditherColor?: THREE.Color | string;
}

export class DitheringEffect extends Effect {
  override uniforms: Map<string, THREE.Uniform<number | THREE.Vector2 | THREE.Color>>;
  dynamicPixelation: boolean;

  constructor({
    time = 0,
    resolution = new THREE.Vector2(1, 1),
    gridSize = 4.0,
    luminanceMethod = 0,
    invertColor = false,
    pixelSizeRatio = 1,
    grayscaleOnly = false,
    dynamicPixelation = false,
    ditherColor = "rgb(20, 20, 20)",
  }: DitheringEffectOptions = {}) {

    const uniforms = new Map<string, THREE.Uniform<number | THREE.Vector2 | THREE.Color>>([
      ["time", new THREE.Uniform(time)],
      ["resolution", new THREE.Uniform(resolution)],
      ["gridSize", new THREE.Uniform(gridSize)],
      ["luminanceMethod", new THREE.Uniform(luminanceMethod)],
      ["invertColor", new THREE.Uniform(invertColor ? 1 : 0)],
      ["ditheringEnabled", new THREE.Uniform(1)],
      ["pixelSizeRatio", new THREE.Uniform(pixelSizeRatio)],
      ["grayscaleOnly", new THREE.Uniform(grayscaleOnly ? 1 : 0)],
      ["ditherColor", new THREE.Uniform(new THREE.Color(ditherColor ?? 0x000000))]
    ]);

    super("DitheringEffect", ditheringShader, { uniforms });

    this.uniforms = uniforms;
    this.dynamicPixelation = dynamicPixelation;
  }

  override update(renderer: THREE.WebGLRenderer, inputBuffer: THREE.WebGLRenderTarget, deltaTime: number) {
    const timeUniform = this.uniforms.get("time");
    if (timeUniform && typeof timeUniform.value === "number") timeUniform.value += deltaTime;

    const resUniform = this.uniforms.get("resolution");
    const pixelSizeUniform = this.uniforms.get("pixelSizeRatio");

    if (resUniform && resUniform.value instanceof THREE.Vector2) {
      let scale = 1;
      if (this.dynamicPixelation && pixelSizeUniform && typeof pixelSizeUniform.value === "number") {
        scale = 1 / pixelSizeUniform.value; // adjust resolution based on pixel size
      }
      resUniform.value.set(inputBuffer.width * scale, inputBuffer.height * scale);
    }
  }

  setGridSize(size: number) { const u = this.uniforms.get("gridSize"); if(u) u.value = size; }
  setPixelSizeRatio(ratio: number) { const u = this.uniforms.get("pixelSizeRatio"); if(u) u.value = ratio; }
  setGrayscaleOnly(enabled: boolean) { const u = this.uniforms.get("grayscaleOnly"); if(u) u.value = enabled ? 1 : 0; }
  setInvertColor(enabled: boolean) { const u = this.uniforms.get("invertColor"); if(u) u.value = enabled ? 1 : 0; }
  setLuminanceMethod(method: number) { const u = this.uniforms.get("luminanceMethod"); if(u) u.value = method; }
  enableDithering(enabled: boolean) { const u = this.uniforms.get("ditheringEnabled"); if(u) u.value = enabled ? 1 : 0; }
  setDynamicPixelation(enabled: boolean) { this.dynamicPixelation = enabled; }
}