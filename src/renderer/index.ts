import { WebGLRenderer } from "three/src/renderers/WebGLRenderer";

import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass";
// import { ColorifyShader } from "three/examples/jsm/shaders/ColorifyShader";
import { CopyShader } from "three/examples/jsm/shaders/CopyShader";


import { Scene, Camera, Vector2, Color, Vector3, Shader } from "three";


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
const bloomPass = new UnrealBloomPass(screenRes, 0.8, 0, 0.5);
const colorifyPass = new ShaderPass(ColorifyShader);
const copyPass = new ShaderPass(CopyShader);

let currentGreenFlash: number | undefined = undefined;
export const flashGreen = () => {

    if (flashTealInterval) return;

    if (currentGreenFlash) {
        clearInterval(currentGreenFlash);
    }

    let flashLevel = 0.1;
    currentGreenFlash = setInterval(() => {
        colorifyPass.uniforms.color.value.setRGB(0, flashLevel, 0);
        flashLevel = flashLevel - 0.005;
        if (flashLevel <= 0) {
            clearInterval(currentGreenFlash);
        }
    }, 16);

};

let flashTealInterval: number | null = null;
export const flashTeal = () => {

    let flashLevel = 0.2;
    flashTealInterval = setInterval(() => {
        colorifyPass.uniforms.color.value.setRGB(0, flashLevel, flashLevel);
        flashLevel = flashLevel - 0.001;
        if (flashLevel <= 0) {
            if (flashTealInterval) {
                clearInterval(flashTealInterval);
                flashTealInterval = null;
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

    composer.addPass(new RenderPass(scene, camera));
    composer.addPass(colorifyPass);
    composer.addPass(bloomPass);
    composer.addPass(copyPass);

    copyPass.renderToScreen = true;

    const internalLoop = (absoluteCurrentTime: number) => {
        window.requestAnimationFrame(internalLoop);
        if (!renderPaused) {
            if (deltaTimePaused !== null) {
                console.log(`Adding ${absoluteCurrentTime - deltaTimePaused} (${deltaTimePaused}, ${absoluteCurrentTime})`);
                deltaTimePauseOffset += absoluteCurrentTime - deltaTimePaused;
                deltaTimePaused = null;
            }
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