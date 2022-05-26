import "./style.css";

import { Scene, PerspectiveCamera, AmbientLight, DirectionalLight, MeshPhongMaterial, BoxGeometry, Color, MathUtils, ShaderMaterial, Vector3, Euler, Group, _SRGBAFormat } from "three";
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
import createSpeedFruit, { Item } from "./items/speedFruit";

const scene = new Scene();
const camera = new PerspectiveCamera(70, RESOLUTION, 1, 1500000);

let sceneMade = false;

let loopHooks: Array<(dt: number) => void> = [];

(async () => {

    const skybox = await createSkybox();
    const models = await loadModels();

    const { gameLoopFn, registerCollidingItem, changeSpeed, getSpeed, setSpeed, grantDecayingSpeedBonus, freezePlayer } = await setupFPSCharacter(camera, scene);

    loopHooks.push(gameLoopFn);

    loopHooks.push((dt) => {
        globalTime.provideTime(dt);
    });

    const speedInterface = document.querySelector<HTMLElement>("#speed");
    if (!speedInterface) throw new Error("Speed interface?");
    loopHooks.push((dt) => {
        if (Math.random() > .5) {
            speedInterface.innerText = getSpeed(dt).toFixed(2);
        }
    });

    let items: Item[] = [];
    const resetLevel = (scene: Scene, player: Player, trackLength: number) => {

        if (items.length > 0) {
            items.forEach(f => scene.remove(f.obj));
        }

        const randomPoints = [];
        for (let i = 0; i < 50; i++) {
            randomPoints.push(new Vector3(1000 + (Math.random() * (trackLength - 5000)), (Math.random() > .5 ? 400 : 100), (Math.random() - 0.5) * 4000));
        }

        items = randomPoints.map(pt => createSpeedFruit(pt, (moreSpeed: number) => {
            grantDecayingSpeedBonus(moreSpeed * 20, 2000, globalTime.getTime());
            changeSpeed(moreSpeed / 8);
        }, (group: Group) => {
            requestAnimationFrame(() => {
                scene.remove(group);
            });
        }));

        items.forEach(f => {
            scene.add(f.obj)
            loopHooks.push(f.onLoop);
            setTimeout(() => {
                registerCollidingItem({
                    obj: f.collidingObj,
                    whenInRange: () => {
                        f.onPlayerCollide();
                    }
                });
            }, 100);

        });

        player.setWorldPosition(new Vector3(0, 100, 0));
        player.faceForward();
    };


    renderLoop(scene, camera, (dt) => {

        if (sceneMade === false) {

            scene.add(skybox);

            const { ground, goal, phongGround, setTrackLength } = createGround();
            scene.add(phongGround);
            scene.add(ground);
            scene.add(goal);

            const ambient = new AmbientLight(0xffffff, 0.2);
            scene.add(ambient);

            sceneMade = true;

            const player = new Player(camera);

            registerCollidingItem({
                obj: goal,
                whenInRange: () => {
                    // freezePlayer(true);
                    const newTrackLength = 100000 + (Math.floor(Math.random() * 100000));
                    resetLevel(scene, player, newTrackLength);
                    setTrackLength(newTrackLength);
                    setTimeout(() => {
                        freezePlayer(false);
                    }, 5000);

                }
            });
            resetLevel(scene, player, 100000);

        }

        loopHooks.forEach(fn => fn(dt));

    });

})();


