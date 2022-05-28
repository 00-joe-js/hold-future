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

import TEST_UPGRADES from "./upgrades/upgrades-doc";

function shuffleArray(array: Array<any>) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    return array;
}

const getRandomUpgrades = () => {
    return shuffleArray(TEST_UPGRADES).slice(0, 3);
};

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
import ProgressBar from "./progressBar";
import StartEndScreen, { Clippy } from "./startEndScreen";

const scene = new Scene();
const camera = new PerspectiveCamera(80, RESOLUTION, 1, 200000000);

let sceneMade = false;
let paused = false;
let protectPause = false;

let loopHooks: Array<(dt: number) => void> = [];

const HUD = document.querySelector<HTMLElement>("#hud-overlay");
if (!HUD) throw new Error("HUD.");
HUD.style.opacity = "1.0";

const startEndScreen = new StartEndScreen();
const clippy = new Clippy();

startEndScreen.showStartScreen();

const startGame = async () => {

    clippy.hide();

    const skybox = await createSkybox();

    // UPGRADE VALUES other than SPEED.
    let trackWidth = 5000;
    let projectGravitasActivated = false;
    let fruitBoost = 10;
    let fruitPerTrack = 50;

    const {
        gameLoopFn,
        registerCollidingItem,
        changeSpeed,
        getSpeed,
        getBaseSpeed,
        grantDecayingSpeedBonus,
        increaseColliderSize,
        setTrackWallZed
    } = await setupFPSCharacter(camera, scene);

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
    const totalSpeed = speedInterface.querySelector<HTMLElement>("#total-speed");
    const baseSpeed = speedInterface.querySelector<HTMLElement>("span strong");
    if (!speedInterface || !baseSpeed || !totalSpeed) throw new Error("Speed interface?");

    loopHooks.push((dt) => {
        if (Math.random() > .5) {
            totalSpeed.innerText = getSpeed(dt).toFixed(2);
            baseSpeed.innerText = getBaseSpeed().toFixed(0);
        }
    });

    renderLoop(scene, camera, (dt) => {

        if (sceneMade === false) {

            const hudTimerEle = document.querySelector<HTMLElement>("#hud-time");
            if (!hudTimerEle) throw new Error("No #hud-time");

            const hudDistanceToGoal = document.querySelector<HTMLElement>("#hud-goal-distance");
            if (!hudDistanceToGoal) throw new Error("No #hud-goal-distance");

            const totalRunTime = 120;
            // 7 15s to work with


            let START_TRACK_LENGTH = 50000;
            let NORMAL_TRACK_LENGTH = 100000;
            let FINAL_DOWNLOAD_LENGTH = 500000;
            let TOTAL_DOWNLOAD_LENGTH = START_TRACK_LENGTH + (NORMAL_TRACK_LENGTH * 5) + FINAL_DOWNLOAD_LENGTH;

            const times = [10, 10, 5, 5, 30];
            const timer = new GameTimer(dt, 60);
            let lost = false;

            const progressBar = new ProgressBar(TOTAL_DOWNLOAD_LENGTH, [
                [50000 / TOTAL_DOWNLOAD_LENGTH, 10],
                [150000 / TOTAL_DOWNLOAD_LENGTH, 10],
                [250000 / TOTAL_DOWNLOAD_LENGTH, 5],
                [350000 / TOTAL_DOWNLOAD_LENGTH, 5],
                [450000 / TOTAL_DOWNLOAD_LENGTH, 30]
            ]);

            let lastRecordedDistance = 0;
            loopHooks.push(() => {
                const x = camera.position.x;
                progressBar.addDistance(x - lastRecordedDistance);
                lastRecordedDistance = x;
            });

            loopHooks.push(dt => {
                timer.updateCurrentTime(dt);
                const timeLeft = timer.getTimeLeft();
                if (timeLeft <= 0) {
                    if (!lost) {
                        lost = true;
                        pauseRendering();
                        startEndScreen.showFailedScreen();
                    }
                }
                hudTimerEle.innerText = timer.getTimeLeft().toPrecision(4);
            });

            scene.add(skybox);

            const { ground, goal, setTrackDimensions, setGoalBrightness } = createGround(START_TRACK_LENGTH, trackWidth);
            scene.add(ground);
            scene.add(goal);

            const ambient = new AmbientLight(0xffffff, 0.2);
            scene.add(ambient);

            sceneMade = true;

            const player = new Player(camera);

            let onLastGoal = false;
            let won = false;

            registerCollidingItem({
                obj: goal,
                whenInRange: () => {

                    // Must be close enough
                    const playerX = camera.position.x;
                    const goalX = goal.position.x;
                    if (playerX > goalX) {
                        return;
                    }

                    if (won) return;

                    if (onLastGoal) {
                        won = true;
                        pauseRendering();
                        startEndScreen.showWinScreen();
                        return;
                    }
                    

                    if (times.length > 0) {
                        const newTime = times.shift();
                        newTime && timer.grantMoreTime(newTime);
                        flashTeal();
                        pauseRendering();
                        upgradesManager.showContainer(Math.floor(timer.getTimeLeft()), getRandomUpgrades(), (selected: number) => {

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
                                } else if (selectedUpgrade.name === "Extra Juicy!") {
                                    changeSpeed(20);
                                } else if (selectedUpgrade.name === "Boost Fruit") {
                                    fruitBoost += 10;
                                } else if (selectedUpgrade.name === "MORE Fruit") {
                                    fruitPerTrack += 50;
                                } else if (selectedUpgrade.name === "LOADS of Fruit") {
                                    fruitPerTrack += 300;
                                } else if (selectedUpgrade.name === "Optic Fiber") {
                                    trackWidth -= 1750;
                                    setTrackWallZed(trackWidth / 2);
                                }
                            }

                            upgradesManager.hideContainer();
                            progressBar.addDistance(goal.position.x - camera.position.x);
                            setTimeout(() => {
                                resumeRendering();
                                const newTrackLength = 100000;
                                resetLevel(scene, player, newTrackLength);
                                setTrackDimensions(newTrackLength, trackWidth);
                            }, 200);
                        });
                    } else {
                        const newTrackLength = 500000;
                        resetLevel(scene, player, newTrackLength);
                        setTrackDimensions(newTrackLength, trackWidth);
                        setGoalBrightness(0.8);
                        onLastGoal = true;
                    }
                }
            });

            let items: Item[] = [];
            const resetLevel = (scene: Scene, player: Player, trackLength: number) => {

                lastRecordedDistance = 0;

                if (items.length > 0) {
                    items.forEach(f => scene.remove(f.obj));
                }

                const randomPoints = [];
                for (let i = 0; i < fruitPerTrack; i++) {
                    let y = 0;
                    if (projectGravitasActivated) {
                        y = 100;
                    } else {
                        y = (Math.random() > .5 ? 400 : 100);
                    }

                    randomPoints.push(new Vector3(
                        Math.random() * (trackLength),
                        y,
                        (Math.random() - 0.5) * (trackWidth - (trackWidth / 5))
                    ));
                }

                items = randomPoints.map(pt => createSpeedFruit(pt, (moreSpeed: number) => {
                    grantDecayingSpeedBonus(moreSpeed * fruitBoost, 2000, globalTime.getTime());
                    changeSpeed(moreSpeed / 5);
                    setGoalBrightness(0.4);
                    setTimeout(() => {
                        setGoalBrightness(0.0);
                    }, 300);
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

            resetLevel(scene, player, START_TRACK_LENGTH);

        }

        loopHooks.forEach(fn => fn(dt));

    });

};


startEndScreen.registerOnPlayListener(async () => {
    await startGame();
    setTimeout(() => {
        pauseRendering();
    }, 0);
    setTimeout(() => {
        resumeRendering();
    }, 1000);
});
