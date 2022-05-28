import { WebGLRenderer } from "three/src/renderers/WebGLRenderer";

import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass";
import { CopyShader } from "three/examples/jsm/shaders/CopyShader";


import { Scene, Camera, Vector2, Color, Vector3, Shader, MathUtils } from "three";


const canvasElement = document.querySelector("#three-canvas");

if (canvasElement === null) {
    throw new Error("Document needs #three-canvas.");
}

const renderer = new WebGLRenderer({
    canvas: canvasElement,
});

const composer = new EffectComposer(renderer);

renderer.setSize(canvasElement.clientWidth, canvasElement.clientHeight);
composer.setSize(canvasElement.clientWidth, canvasElement.clientHeight);
renderer.setClearColor(0x000000);

const ColorifyShader = {
    uniforms: {
        'tDiffuse': { value: null },
        'color': { value: new Color(0xffffff) }
    },
    vertexShader: /* glsl */`
		varying vec2 vUv;
		void main() {
    		vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
		}`,

    fragmentShader: /* glsl */`
		uniform vec3 color;
		uniform sampler2D tDiffuse;

		varying vec2 vUv;

		void main() {

			vec4 texel = texture2D( tDiffuse, vUv );

			// vec3 luma = vec3( 0.299, 0.587, 0.114 );
			// float v = dot( texel.xyz, luma );

			gl_FragColor = vec4(vec3(texel) + color, texel.w);

		}`
};

const screenRes = new Vector2(canvasElement.clientWidth, canvasElement.clientHeight);
const bloomPass = new UnrealBloomPass(screenRes, 0.7, 0, 0.5);
const colorifyPass = new ShaderPass(ColorifyShader);
const copyPass = new ShaderPass(CopyShader);

let calculatedFlashColor: Vector3 = new Vector3();

class FlashCollection {

    private lastUsedId: number = 0;
    private flashes: { [id: number]: Vector3 } = {};
    private outputVector: Vector3 = new Vector3();

    addNewFlash(currentColor: Vector3) {
        const id = this.lastUsedId + 1;
        this.lastUsedId = id;
        this.flashes[id] = currentColor;
        return id;
    }

    setFlashValue(id: number, value: Vector3) {
        if (this.flashes[id]) {
            this.flashes[id].copy(value);
        } else {
            throw new Error(`Bad id given ${id}`);
        }
    }

    removeFlash(id: number) {
        delete this.flashes[id];
    }

    getAllFlashesColor(): Vector3 {
        const o = this.outputVector;
        o.set(0, 0, 0);
        Object.values(this.flashes).forEach(f => {
            o.set(o.x + f.x, o.y + f.y, o.z + f.z);
        });
        return o;
    }

}

const flashCollection = new FlashCollection();

export const flash = (baseColor: number[], initialLevel: number = 0.25) => {

    let flashLevel = initialLevel;

    const colorV = new Vector3();
    colorV.set(baseColor[0], baseColor[1], baseColor[2]);
    colorV.multiplyScalar(flashLevel);

    const flashId = flashCollection.addNewFlash(colorV);

    const interval = setInterval(() => {
        colorV.set(baseColor[0], baseColor[1], baseColor[2]);
        colorV.multiplyScalar(flashLevel);
        flashCollection.setFlashValue(flashId, colorV);
        flashLevel = flashLevel - 0.003;
        if (flashLevel <= 0) {
            if (interval) {
                flashCollection.removeFlash(flashId);
                clearInterval(interval);
            }
        }
    }, 16);

};

let renderPaused = false;
let runDuringPause: Function | null = null;
let deltaTimePaused: number | null = null;
let deltaTimePauseOffset = 0;
export const pauseRendering = (pause: boolean = true, fn?: Function) => {
    renderPaused = pause;
    if (pause === false) {
        runDuringPause = null
    } else if (pause === true && fn) {
        runDuringPause = fn;
    }
};

export const resumeRendering = () => {
    pauseRendering(false);
};

export const renderLoop = (scene: Scene, camera: Camera, onLoop: (dt: number) => void) => {

    colorifyPass.uniforms.color.value.setRGB(0, 0, 0);
    // Clamp flash value.
    const cFV = (v: number) => {
        return MathUtils.clamp(v, 0, 0.15);
    };

    composer.addPass(new RenderPass(scene, camera));
    composer.addPass(colorifyPass);
    composer.addPass(bloomPass);
    composer.addPass(copyPass);

    copyPass.renderToScreen = true;

    const internalLoop = (absoluteCurrentTime: number) => {
        window.requestAnimationFrame(internalLoop);
        if (!renderPaused) {
            if (deltaTimePaused !== null) {
                deltaTimePauseOffset += absoluteCurrentTime - deltaTimePaused;
                deltaTimePaused = null;
            }
            const { x, y, z } = flashCollection.getAllFlashesColor();
            console.log(x, y, z);
            colorifyPass.uniforms.color.value.setRGB(cFV(x), cFV(y), cFV(z));

            onLoop(absoluteCurrentTime - deltaTimePauseOffset);
            composer.render();
        } else {
            if (deltaTimePaused === null) {
                deltaTimePaused = absoluteCurrentTime;
            }
            if (runDuringPause) {
                runDuringPause(absoluteCurrentTime);
            }
        }
    };

    window.requestAnimationFrame(internalLoop);

};

export default renderer;