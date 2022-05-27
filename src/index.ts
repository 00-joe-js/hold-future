import "./style.css";

import { Scene, PerspectiveCamera, AmbientLight, Color, Vector3, Group, _SRGBAFormat } from "three";
import { flashTeal, pauseRendering, resumeRendering } from "./renderer/index";

import { gamepad } from "./firstPersonCharacter/inputHelper";


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

const TEST_UPGRADES = [
    {
        name: "Hello, Neighbor!",
        description: `Your sphere of influence is stronger. <strong>Pull in speed fruit that are farther away</strong>.`,
        cost: 10
    },
    {
        name: "The Juice.",
        description: `<strong>Increase your base speed by 5m/s</strong>. It's not fancy, but it's fast.`,
        cost: 5
    },
    {
        name: "Project Gravitas",
        description: `<strong>All speed fruit will be grounded.</strong> Who needs to jump anyway!`,
        cost: 20
    }
];

import { renderLoop } from "./renderer";
import setupFPSCharacter from "./firstPersonCharacter";

const RESOLUTION = 16 / 9;

import Player from "./firstPersonCharacter/PlayerClass";
import createSkybox from "./level/skybox";
import globalTime from "./subscribe-to-global-render-loop";
import createGround from "./level/groundPath";
import createSpeedFruit, { Item } from "./items/speedFruit";
import GameTimer from "./gameTimer";
import upgradesManager from "./upgrades/gui";

const scene = new Scene();
const camera = new PerspectiveCamera(80, RESOLUTION, 1, 1500000);

let sceneMade = false;
let paused = false;
let protectPause = false;

let loopHooks: Array<(dt: number) => void> = [];

(async () => {

    const skybox = await createSkybox();

    let projectGravitasActivated = false;

    const { gameLoopFn, registerCollidingItem, changeSpeed, getSpeed, setSpeed, grantDecayingSpeedBonus, freezePlayer, increaseColliderSize } = await setupFPSCharacter(camera, scene);

    loopHooks.push((dt) => {
        if (protectPause) return;
        const gamepadState = gamepad.getState();
        if (!gamepadState) return;

        if (gamepadState.pauseDown && !paused) {
            paused = true;
            protectPause = true;
            setTimeout(() => {
                protectPause = false;
            }, 200);
            pauseRendering(true, () => {
                if (protectPause === true) return;
                const gp = gamepad.getState();
                if (gp && gp.pauseDown) {
                    paused = false;
                    protectPause = true;
                    setTimeout(() => {
                        protectPause = false;
                    }, 200);
                    resumeRendering();
                }
            });
        }
    });

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
            let y = 0;
            if (projectGravitasActivated) {
                y = 100;
            } else {
                y = (Math.random() > .5 ? 400 : 100);
            }

            randomPoints.push(new Vector3(
                Math.random() * (trackLength),
                y,
                (Math.random() - 0.5) * 4000
            ));
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

        player.setWorldPosition(new Vector3(50, 100, 0));
        player.faceForward();
    };

    renderLoop(scene, camera, (dt) => {

        if (sceneMade === false) {

            const hudTimerEle = document.querySelector<HTMLElement>("#hud-time");
            if (!hudTimerEle) throw new Error("No #hud-time");

            const hudDistanceToGoal = document.querySelector<HTMLElement>("#hud-goal-distance");
            if (!hudDistanceToGoal) throw new Error("No #hud-goal-distance");

            const timer = new GameTimer(dt, 60);
            let lost = false;

            loopHooks.push(dt => {
                timer.updateCurrentTime(dt);
                const timeLeft = timer.getTimeLeft();
                if (timeLeft <= 0) {
                    if (!lost) {
                        lost = true;
                        alert("Out of time.");
                        window.location.reload();
                    }
                }
                hudTimerEle.innerText = timer.getTimeLeft().toPrecision(4);
            });

            loopHooks.push(() => {
                if (Math.random() > .9) {
                    hudDistanceToGoal.innerText = Math.floor(distanceToGoal(player.camera.position)).toLocaleString("en-US") + "m";
                }
            });

            scene.add(skybox);

            const { ground, goal, phongGround, setTrackLength, distanceToGoal, setGoalBrightness } = createGround(20000);
            scene.add(phongGround);
            scene.add(ground);
            scene.add(goal);

            const ambient = new AmbientLight(0xffffff, 0.2);
            scene.add(ambient);

            sceneMade = true;

            const player = new Player(camera);

            const times = [25, 20, 10, 5, 1];

            let onLastGoal = false;
            let won = false;

            registerCollidingItem({
                obj: goal,
                whenInRange: () => {

                    if (won) return;

                    if (onLastGoal) {
                        won = true;
                        alert("You win!");
                        window.location.reload();
                    }


                    if (times.length > 0) {
                        const newTime = times.shift();
                        newTime && timer.grantMoreTime(newTime);
                        flashTeal();
                        pauseRendering();
                        upgradesManager.showContainer(Math.floor(timer.getTimeLeft()), TEST_UPGRADES, (selected: number) => {

                            if (selected === -1) {
                                // Skip.
                            } else {
                                const selectedUpgrade = TEST_UPGRADES[selected];

                                timer.deductTime(selectedUpgrade.cost);

                                if (selectedUpgrade.name === "Project Gravitas") {
                                    projectGravitasActivated = true;
                                } else if (selectedUpgrade.name === "The Juice.") {
                                    changeSpeed(5);
                                } else if (selectedUpgrade.name === "Hello, Neighbor!") {
                                    increaseColliderSize(200);
                                }
                            }

                            upgradesManager.hideContainer();
                            setTimeout(() => {
                                resumeRendering();
                                const newTrackLength = 100000;
                                resetLevel(scene, player, newTrackLength);
                                setTrackLength(newTrackLength);
                            }, 200);
                        });
                    } else {
                        const newTrackLength = 100000;
                        resetLevel(scene, player, newTrackLength);
                        setTrackLength(newTrackLength);
                        setGoalBrightness(0.8);
                        onLastGoal = true;
                    }
                }
            });

            resetLevel(scene, player, 20000);

        }

        loopHooks.forEach(fn => fn(dt));

    });

})();


