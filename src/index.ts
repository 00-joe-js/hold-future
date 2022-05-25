import "./style.css";

import { Scene, PerspectiveCamera, AmbientLight, DirectionalLight, MeshPhongMaterial, BoxGeometry, Color, MathUtils, ShaderMaterial, Vector3, Euler, Group } from "three";
import { Mesh, UniformsUtils, ShaderLib, BufferAttribute, SphereBufferGeometry } from "three";

import customPhongVertex from "./shading/customPhongVertex";

import loadModels from "./importHelpers/gltfLoader";

/* GLOBALS */
declare global {
    var PI: number;
    var PI2: number;
    var ZERO_VEC3: Vector3;
    var RED: Color;
    var BLUE: Color;
    var HYPER_BLUE: Color;
    var POWERED_PINKRED: Color;
}
window.PI = Math.PI;
window.PI2 = Math.PI * 2;
window.ZERO_VEC3 = new Vector3(0, 0, 0);
window.RED = new Color(0xff0000);
window.BLUE = new Color(0x0000ff);
window.HYPER_BLUE = new Color(0xaaffff);
window.POWERED_PINKRED = new Color(0xffeeee);
// ---

import { renderLoop } from "./renderer";
import setupFPSCharacter from "./firstPersonCharacter";

const RESOLUTION = 16 / 9;

import Player from "./firstPersonCharacter/PlayerClass";
import { RegisteredItem } from "./firstPersonCharacter/itemPickup";
import createSkybox from "./level/skybox";
import globalTime from "./subscribe-to-global-render-loop";
import createGround from "./level/groundPath";
import createSpeedFruit from "./items/speedFruit";

const scene = new Scene();
const camera = new PerspectiveCamera(80, RESOLUTION, 1, 1500000);


// randos.
const randomColor = () => {
    const rChannel = () => MathUtils.randFloat(0, 1);
    const color = new Color(rChannel(), rChannel(), rChannel());
    return color;
};

const createRandos = (registerCollide: (item: RegisteredItem) => void) => {
    const AMOUNT = 20;
    const DISTANCE = 1.0;

    const gameLoopFns = [];

    for (let i = 0; i < AMOUNT; i++) {
        const sphereG = new SphereBufferGeometry(MathUtils.randFloat(5.0, 8.5), MathUtils.randInt(7, 15), MathUtils.randInt(10, 20));

        let offsets = new Float32Array();
        for (let i = 0; i < sphereG.attributes.position.count; i++) {
            offsets[i] = Math.random();
        }

        sphereG.setAttribute('offset', new BufferAttribute(offsets, 1));

        const tryMaterial = "phong";

        const combinedUniforms = UniformsUtils.merge([
            ShaderLib[tryMaterial].uniforms,
            { specular: { value: randomColor() } },
            { shininess: { value: 2000.0 } },
            { diffuse: { value: randomColor() } },
            { time: { value: 0.0 } },
        ]);

        const customMaterial = new ShaderMaterial({
            uniforms: combinedUniforms,
            vertexShader: customPhongVertex,
            fragmentShader: ShaderLib[tryMaterial].fragmentShader,
            lights: true,
        });

        const sphere = new Mesh(sphereG, customMaterial);

        sphere.position.y = .5;
        sphere.rotation.y = Math.random() * PI;

        const orbitRadius = (i - 5) * -DISTANCE;
        sphere.position.x = orbitRadius * Math.cos(MathUtils.randFloat(0, PI2));
        sphere.position.z = orbitRadius * Math.sin(MathUtils.randFloat(0, PI2));

        scene.add(sphere);

        registerCollide({
            obj: sphere,
            whenInRange: () => {
                scene.remove(sphere);
            }
        });

        const initialY = sphere.position.y;
        const offset = MathUtils.randInt(0, 5000);
        const xOffset = MathUtils.randInt(-300, 300);
        const extra = MathUtils.randInt(25, 50);
        const normSin = (sin: number) => (sin + 1) / 2;
        gameLoopFns.push((dt: number) => {
            sphere.position.y = initialY + normSin(Math.sin((offset + dt) / 500));
            sphere.position.x = ((Math.sin((dt + offset) / (offset + 1000))) * extra) + xOffset;
            sphere.position.z += (Math.cos((dt + offset) / 2000));
            combinedUniforms.time.value = dt;
        });
    }

    return gameLoopFns;


};

let sceneMade = false;

let loopHooks: Array<(dt: number) => void> = [];

(async () => {

    const skybox = await createSkybox();
    const models = await loadModels();

    const { gameLoopFn, registerCollidingItem, changeSpeed } = await setupFPSCharacter(camera, scene);

    loopHooks.push(gameLoopFn);

    loopHooks.push((dt) => {
        globalTime.provideTime(dt);
    });

    renderLoop(scene, camera, (dt) => {

        if (sceneMade === false) {

            const player = new Player(camera);
            player.setWorldPosition(new Vector3(0, 100, 100));

            sceneMade = true;

            scene.add(skybox);

            const newGround = createGround();
            scene.add(newGround);

            // registerCollidingItem({
            //     obj: newGround,
            //     whenInRange: () => {
            //         console.log("Standing on me.");
            //     }
            // })

            const ambient = new AmbientLight(0xffffff, 0.2);
            scene.add(ambient);


            const randomPoints = [];

            for (let i = 0; i < 1000; i++) {
                randomPoints.push(new Vector3((Math.random() - 0.5) * 1500, 40, Math.random() * -500000));
            }

            const fruits = randomPoints.map(pt => createSpeedFruit(pt, changeSpeed, (group: Group) => {
                scene.remove(group);
            }));

            fruits.forEach(f => {
                scene.add(f.obj)
                loopHooks.push(f.onLoop);
                registerCollidingItem({
                    obj: f.collidingObj,
                    whenInRange: () => {
                        f.onPlayerCollide();
                    }
                });
            });

        }

        loopHooks.forEach(fn => fn(dt));

    });

})();


