import "./style.css";

import { Scene, PerspectiveCamera, AmbientLight, Color, Vector3, Group, _SRGBAFormat, MathUtils } from "three";
import { flash, pauseRendering, resumeRendering, setBlurLevel } from "./renderer/index";

import { gamepad } from "./firstPersonCharacter/inputHelper";

import { playBgMusic, playScreenOpen } from "./sound";


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

import t from "./upgrades/upgrades-doc";
import { Upgrade } from "./upgrades/gui";

const TEST_UPGRADES: Upgrade[] = t;

function shuffleArray<T>(array: Array<T>) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    return array;
}

const getRandomUpgrades = (discount: number, gravitasActivated: boolean, paintActivated: boolean, grantTimeForSpeed: boolean, dancing: boolean) => {

    let ups: Upgrade[] = [];
    let eligibleUpgrades = TEST_UPGRADES.slice(0);

    let alwaysPick: Upgrade[] = TEST_UPGRADES.filter(u => u.alwaysPick);

    eligibleUpgrades = eligibleUpgrades.filter(({ name }) => {
        if (name === "Paint" && paintActivated) return false;
        if (name === "Project Gravitas" && gravitasActivated) return false;
        if (name === "Limited-Time Offer" && discount > 0) return false;
        if (name === "Instant Rebate" && grantTimeForSpeed === true) return false;
        if (name === "Do the Wave" && dancing === true) return false;
        return true;
    });

    ups = [...alwaysPick, ...shuffleArray<Upgrade>(eligibleUpgrades).slice(0, 3 - alwaysPick.length)];

    return ups.map(u => (
        { ...u, cost: u.cost - discount }
    ));

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
import StartEndScreen, { clippy } from "./startEndScreen";

const scene = new Scene();
const camera = new PerspectiveCamera(80, RESOLUTION, 1, 200000000);

let sceneMade = false;
let paused = false;
let protectPause = false;

let loopHooks: Array<(dt: number) => void> = [];

const HUD = document.querySelector<HTMLElement>("#hud-overlay");
if (!HUD) throw new Error("HUD.");
const HUD_STATS = document.querySelector<HTMLElement>("#hud-stats");
if (!HUD_STATS) throw new Error("HUD stats.");
HUD.style.opacity = "1.0";

const startEndScreen = new StartEndScreen();

startEndScreen.showStartScreen();

const startGame = async () => {

    clippy.hide();

    const skybox = await createSkybox();

    playBgMusic();

    // UPGRADE VALUES other than SPEED.
    let trackWidth = 5000;
    let projectGravitasActivated = false;
    let fruitBoost = 15;
    let fruitPerTrack = 50;
    let chanceForRareFruit = 0.05;
    let portionForBaseSpeed = 0.2;
    let upgradeDiscount = 0;
    let fruitRadius = 15;
    let randomFruitColors = false;
    let columnRate = 1;
    let topSpeedThisLevel = 0;
    let grantTimeBasedOnTopSpeed = false;
    let dancingFruit = false;

    const {
        gameLoopFn,
        registerCollidingItem,
        changeSpeed,
        getSpeed,
        getBaseSpeed,
        getBonusSpeed,
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
        const speed = getSpeed(dt);
        if (topSpeedThisLevel < speed) {
            topSpeedThisLevel = speed;
        }
        const bl = getBonusSpeed(dt) / 75;
        setBlurLevel(bl);
        if (Math.random() > .5) {
            totalSpeed.innerText = speed.toFixed(2);
            const r = speed / 100;
            totalSpeed.style.color = `rgb(${255 - (255 * r / 2)}, ${255}, ${255 - (255 * r)})`;
            baseSpeed.innerText = getBaseSpeed().toFixed(0);
        }
    });

    renderLoop(scene, camera, (dt) => {

        if (sceneMade === false) {

            const hudTimerEle = document.querySelector<HTMLElement>("#hud-time");
            if (!hudTimerEle) throw new Error("No #hud-time");

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

            const { ground, goal, setTrackDimensions, styleFinalDownload } = createGround(START_TRACK_LENGTH, trackWidth);
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
                        if (grantTimeBasedOnTopSpeed) {
                            timer.grantMoreTime((topSpeedThisLevel / 100) * 1.4);
                        }
                        topSpeedThisLevel = 0;
                        pauseRendering();
                        playScreenOpen();
                        const upgrades = getRandomUpgrades(
                            upgradeDiscount, projectGravitasActivated, randomFruitColors, grantTimeBasedOnTopSpeed, dancingFruit
                        );
                        const isLastUpgrade = times.length === 0; // After shifting.
                        console.log("raw isLast", isLastUpgrade)
                        upgradesManager.showContainer(Math.floor(timer.getTimeLeft()), upgrades, isLastUpgrade, (selected: number) => {

                            if (selected === -1) {
                                // Skip.
                            } else {
                                const selectedUpgrade = upgrades[selected];
                                const upgradeName = selectedUpgrade.name;

                                timer.deductTime(selectedUpgrade.cost);

                                if (upgradeName === "Project Gravitas") {
                                    projectGravitasActivated = true;
                                } else if (upgradeName === "The Juice") {
                                    changeSpeed(5);
                                } else if (upgradeName === "Hello, Neighbor!") {
                                    increaseColliderSize(150);
                                } else if (upgradeName === "Extra Juicy!") {
                                    changeSpeed(20);
                                } else if (upgradeName === "Boost Fruit") {
                                    fruitBoost += 10;
                                } else if (upgradeName === "More Fruit") {
                                    fruitPerTrack += 30;
                                } else if (upgradeName === "Loads of Fruit") {
                                    fruitPerTrack += 200;
                                } else if (upgradeName === "Optic Fiber") {
                                    trackWidth -= 1750;
                                    setTrackWallZed(trackWidth / 2);
                                } else if (upgradeName === "Super Berries") {
                                    chanceForRareFruit += 0.4;
                                } else if (upgradeName === "Limited-Time Offer") {
                                    upgradeDiscount += 5;
                                } else if (upgradeName === "Sustainability") {
                                    fruitBoost -= 10;
                                    portionForBaseSpeed += 0.4;
                                } else if (upgradeName === "Jacked Fruit") {
                                    fruitRadius += 30;
                                } else if (upgradeName === "Paint") {
                                    randomFruitColors = true;
                                } else if (upgradeName === "Sub-axis") {
                                    columnRate -= (columnRate * .75);
                                } else if (upgradeName === "Instant Rebate") {
                                    grantTimeBasedOnTopSpeed = true;
                                } else if (upgradeName === "Do the Wave") {
                                    dancingFruit = true;
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
                        fruitRadius += 30;
                        fruitPerTrack = fruitPerTrack * 2;
                        increaseColliderSize(50);
                        portionForBaseSpeed -= 0.2;
                        fruitBoost += 5;
                        
                        resetLevel(scene, player, newTrackLength);
                        setTrackDimensions(newTrackLength, trackWidth);
                        styleFinalDownload();
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

                const randZ = (trackWidth: number) => {
                    const column = MathUtils.randInt(0, 8 * columnRate) * (1 / columnRate);
                    const segmentWidth = trackWidth / 20;
                    const sign = Math.random() < 0.5 ? 1 : -1;
                    return column * sign * segmentWidth;
                };

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
                        randZ(trackWidth)
                    ));
                }

                items = randomPoints.map(pt => createSpeedFruit(chanceForRareFruit, fruitRadius, randomFruitColors, dancingFruit, pt, (moreSpeed: number) => {
                    grantDecayingSpeedBonus(moreSpeed * fruitBoost, 1000, globalTime.getTime());
                    changeSpeed(moreSpeed * portionForBaseSpeed);
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

        HUD_STATS.style.opacity = "1.0";

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
