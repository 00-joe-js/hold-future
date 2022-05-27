import { Camera, Vector3, Euler, MathUtils, BufferGeometry, LineBasicMaterial, Line, Scene, Raycaster, Event, Layers, Intersection, Object3D, Matrix3, Color } from "three";

import Keyboard, { MouseInterface, gamepad } from "./inputHelper";
import ItemPickupManager, { RegisteredItem } from "./itemPickup";

const canvasElement = document.querySelector("#three-canvas");

let SPEED = 5;
const MAX_POLAR_ANGLE = MathUtils.degToRad(85);
const MIN_POLAR_ANGLE = -MAX_POLAR_ANGLE;
const SOLID_LAYER = 7;
const CAN_SPRINT_IN_AIR = true;
const PLAYER_HEIGHT = 60;
const JUMP_FORCE = 15;
const GRAVITY_MULT = 0.075;

const _euler = new Euler(0, 0, 0, 'YXZ');
const _vector = new Vector3(0, 0, 0);

// THIS SHOULD MOVE
if (canvasElement === null) {
    throw new Error("Document needs #three-canvas.");
}
canvasElement.addEventListener("click", () => {
    canvasElement.requestPointerLock();
});

const setupFPSCharacter = async (camera: Camera, scene: Scene) => {

    await gamepad.waitForGamepadConnect();

    const keyboard = new Keyboard();
    const mouse = new MouseInterface();

    const getSceneSolidObjects = (() => {
        const testLayers = new Layers();
        testLayers.disableAll();
        testLayers.enable(SOLID_LAYER);
        return () => {
            return scene.children.filter(o => o.layers.test(testLayers));
        };
    })();

    const raycastCheckForSolidObjects = (origin: Vector3, dir: Vector3) => {
        const solidObjects = getSceneSolidObjects();
        const raycaster = new Raycaster(origin, dir);
        raycaster.layers.disableAll();
        raycaster.layers.enable(SOLID_LAYER);
        const rayResults = raycaster.intersectObjects(solidObjects);
        return rayResults;
    };

    const touchesASolid = (moveDirection: Vector3, distance: number, origin: Vector3 = camera.position) => {

        const dir = moveDirection.clone();
        dir.normalize();

        // Distance 
        if (Math.abs(distance) !== distance) {
            dir.multiplyScalar(-1);
            distance = Math.abs(distance);
        }

        const rayResults = raycastCheckForSolidObjects(origin, dir);

        const collision = rayResults.some(result => result.distance < Math.abs(distance + 3));

        return collision;

    };

    const moveForward = (distance: number, copyToVector: Vector3) => {
        _vector.setFromMatrixColumn(camera.matrix, 0);
        _vector.crossVectors(camera.up, _vector);
        copyToVector.addScaledVector(_vector, distance);
    };

    const moveRight = (distance: number, copyToVector: Vector3) => {
        _vector.setFromMatrixColumn(camera.matrix, 0);
        _vector.y = 0;
        copyToVector.addScaledVector(_vector, distance);
    };


    let sprinting = true;
    let headBobDelta = 0;

    // To be called in loop:
    const assignSprinting = (isGrounded: boolean, sprintButtonDown: boolean) => {
        sprinting = true;
        return;
        if (sprinting === true) return sprinting;

        if (sprintButtonDown === true) {
            if (CAN_SPRINT_IN_AIR || isGrounded) {
                sprinting = true;
                return sprinting;
            }
        }

        if (sprinting === false && sprintButtonDown === true) { // Toggle sprint on with ctrl.
            sprinting = true;
        }
    };

    const applyCameraRotation = ({ xVelocity, yVelocity }: { xVelocity: number, yVelocity: number }, copyToEuler: Euler) => {
        if (xVelocity !== 0 || yVelocity !== 0) {

            copyToEuler.setFromQuaternion(camera.quaternion);

            copyToEuler.y -= xVelocity * 0.002 * 0.8;
            copyToEuler.x -= yVelocity * 0.002 * 0.8;
            copyToEuler.x = MathUtils.clamp(copyToEuler.x, MIN_POLAR_ANGLE, MAX_POLAR_ANGLE);
            camera.quaternion.setFromEuler(copyToEuler);

            mouse.zeroMovement();
        }
    };

    const getPointAheadOfCamera = () => {
        const forward = new Vector3(0, 0, -1);
        forward.applyQuaternion(camera.quaternion);
        forward.multiplyScalar(60);
        forward.add(camera.position);
        return forward;
    };

    const applyHeadBob = (movementVector: Vector3) => {
        const aheadOfCameraBeforeReposition = getPointAheadOfCamera();
        const vel = movementVector.clone().multiply(new Vector3(1, 0, 1)).length();

        const getWavePoint = () => Math.abs(Math.sin(headBobDelta / 2.5)) * 0.7;
        const currentWavePoint = getWavePoint();

        if (vel > 0) {
            headBobDelta += .2 + (sprinting ? .05 : 0);
            camera.position.y += getWavePoint() - currentWavePoint;
        } else if (currentWavePoint > .1) {
            headBobDelta += .2 + (sprinting ? .05 : 0);
            const newWavePoint = getWavePoint();
            if (newWavePoint > currentWavePoint) {
                headBobDelta -= .3 + (sprinting ? .05 : 0);
            }
            camera.position.y += getWavePoint() - currentWavePoint;
        }

        camera.lookAt(aheadOfCameraBeforeReposition);
    };


    const checkIsGrounded = (origin: Vector3 = camera.position) => {

        if (aerialVector.y > 0) {
            // Moving upwards
            // so you're not grounded at this distance right now.
            return { grounded: false, slipping: false, solidSurfacesBelow: [] };
        }

        const solidSurfacesBelow = raycastCheckForSolidObjects(origin, new Vector3(0, -1, 0));

        if (solidSurfacesBelow.length === 0) return { grounded: false, slipping: false, solidSurfacesBelow: [] };

        if (solidSurfacesBelow[0].distance <= PLAYER_HEIGHT + 1) {
            return { grounded: true, slipping: false, solidSurfacesBelow };
        } else {
            return { grounded: false, slipping: false, solidSurfacesBelow };
        }

    };

    const _normalMatrix = new Matrix3();
    const _worldNormal = new Vector3();
    const convertLocalNormalToWorld = (objectContainingNormal: Object3D, localNormal: Vector3,) => {
        _normalMatrix.getNormalMatrix(objectContainingNormal.matrixWorld);
        _worldNormal.copy(localNormal).applyMatrix3(_normalMatrix).normalize();
        return _worldNormal.clone();
    };

    const onSlipperySurface = (surfaces: Intersection<Object3D<Event>>[]) => {
        const closestSurface = surfaces[0];
        if (!closestSurface || !closestSurface.face) throw new Error("Calling slippery with no surfaces or there are no faces.");

        const surfaceNormal = closestSurface.face.normal.clone();

        const surfaceWorldNormal = convertLocalNormalToWorld(closestSurface.object, surfaceNormal);

        const dotNormal = surfaceWorldNormal.dot(camera.up);

        if (Math.abs(dotNormal) > .9) {
            return false;
        } else {
            return true;
        }
    };

    // My math goal right now is to not do this by looping and guessing. 
    // There MUST be a better, more determined way.
    const getSlippingVectorFromSurfaceNormal = (surfaceNormal: Vector3) => {
        let testVectors = [new Vector3(1, 0, 0), new Vector3(0, 0, 1), new Vector3(-1, 0, 0), new Vector3(0, 0, -1)];
        let slideVector = new Vector3(0, 0, 0);
        let yResults = [];
        let i = 0;

        do {
            const testVector = testVectors[i];
            i++;
            slideVector.crossVectors(surfaceNormal, testVector);
            yResults.push(slideVector.y);
        } while (i < testVectors.length)

        const indexOfBestResult = yResults.reduce((bestResult, result, i) => {
            if (result < bestResult.val) return { index: i, val: result };
            return bestResult;
        }, { index: -1, val: Infinity }).index;

        slideVector.crossVectors(surfaceNormal, testVectors[indexOfBestResult]);

        return slideVector;
    };

    let thisFallTotalTime = 0;
    let lastFallingFrameTime = 0;
    let aerialVector = new Vector3(0, 0, 0);

    const fall = (deltaTimeSinceSceneStart: number) => {

        if (lastFallingFrameTime === 0) {
            lastFallingFrameTime = deltaTimeSinceSceneStart;
            thisFallTotalTime = 0;
        } else {
            const additionalFallTime = deltaTimeSinceSceneStart - lastFallingFrameTime;
            thisFallTotalTime += additionalFallTime;
            lastFallingFrameTime = deltaTimeSinceSceneStart;
        }

        aerialVector.add(new Vector3(0, -((thisFallTotalTime / 1000) * 9.8) * GRAVITY_MULT, 0));

        camera.position.add(aerialVector);

    };

    let spacePressed = false;
    const getSpacePress = (jumpButtonDown: boolean) => {
        if (spacePressed === false && jumpButtonDown) {
            spacePressed = true;
            return true;
        } else if (spacePressed === true && !jumpButtonDown) {
            spacePressed = false;
            return false;
        } else {
            return false;
        }
    };

    const applyJumpAndGravity = (isGrounded: boolean, deltaTimeSinceSceneStart: number, jumpButtonDown: boolean) => {
        if (isGrounded) {

            lastFallingFrameTime = 0;
            if (!aerialVector.equals(ZERO_VEC3)) {
                aerialVector.set(0, 0, 0);
            }

            let spaceDown = getSpacePress(jumpButtonDown);
            if (spaceDown) {
                aerialVector.add(new Vector3(0, JUMP_FORCE, 0));
                fall(deltaTimeSinceSceneStart);
            }

        } else {
            fall(deltaTimeSinceSceneStart);
        }
    };

    const graduallyMaintainHeight = (distanceToGround: number) => {

        if (distanceToGround < PLAYER_HEIGHT) {
            camera.position.y += 0.1;
        }

    };

    let preventMovement = false;

    const itemPickupManager = new ItemPickupManager(camera);


    // Function to run on game loop.
    const gameLoopFn = (dt: number) => {

        const gamepadState = gamepad.getState();
        const movementVector = new Vector3(0, 0, 0);

        const initialGroundedCheck = checkIsGrounded();

        const isGrounded = initialGroundedCheck.grounded;

        applyJumpAndGravity(isGrounded, dt, gamepadState ? gamepadState.xDown : keyboard.spaceDown);
        assignSprinting(isGrounded, gamepadState ? gamepadState.zRDown : keyboard.ctrlDown);

        // let speed = SPEED * (sprinting && !isSlipping ? 5 : 1);
        let speed = SPEED * 5;
        speed += calculateSpeedBonuses(dt);

        if (gamepadState) {
            if (gamepadState.moveVel.y !== 0) {
                const y = MathUtils.clamp(gamepadState.moveVel.y, -1, 1);
                moveForward(speed * y, movementVector);
            }
            if (gamepadState.moveVel.x !== 0) {
                moveRight(speed * 0.7 * gamepadState.moveVel.x, movementVector);
            }
        } else {
            if (keyboard.wDown) {
                moveForward(speed, movementVector);
            }
            if (keyboard.sDown) {
                moveForward(-speed, movementVector);
            }
            if (keyboard.aDown) {
                moveRight(-speed * 0.7, movementVector);
            }
            if (keyboard.dDown) {
                moveRight(speed * 0.7, movementVector);
            }
        }

        if (!movementVector.equals(ZERO_VEC3)) {

            const groundedInNewPosition = checkIsGrounded(camera.position.clone().add(movementVector));

            if (groundedInNewPosition.grounded === true) {
                if (initialGroundedCheck.grounded === true) {
                    const oldDistaceFromFloor = initialGroundedCheck.solidSurfacesBelow[0].distance;
                    const newDistanceFromFloor = groundedInNewPosition.solidSurfacesBelow[0].distance;
                    const differenceInDistanceFromFloor = oldDistaceFromFloor - newDistanceFromFloor;
                    movementVector.y = differenceInDistanceFromFloor
                }
            }

            const maxSlopeableHeight = camera.position.clone();
            maxSlopeableHeight.add(new Vector3(0, 0, 0));
            if (!touchesASolid(movementVector, movementVector.length(), maxSlopeableHeight) && !preventMovement) {
                camera.position.add(movementVector);
            } else {
                movementVector.multiply(ZERO_VEC3); // This is where the movement vector can be zero'd out.
            }
        }

        // if (gamepadState) {
        //     applyCameraRotation({ xVelocity: gamepadState.lookVel.x, yVelocity: gamepadState.lookVel.y }, _euler);
        // } else {
        //     applyCameraRotation({ xVelocity: mouse.movement.x, yVelocity: mouse.movement.y }, _euler);
        // }

        const finalGrounded = checkIsGrounded(camera.position);

        if (finalGrounded.grounded) {
            // Lifts the camera away from solid surface beneath.
            applyHeadBob(movementVector);
        }

        itemPickupManager.testAndTriggerListeners();

    };

    interface Bonus {
        totalBonus: number, decayOverMs: number, initialDt: number
    }
    let speedBonuses: Bonus[] = [];
    const calculateSpeedBonuses = (currentDt: number): number => {
        let newSpeedBonuses: Bonus[] = [];
        const addedSpeed = speedBonuses.reduce((totalSpeedBonus, thisBonus) => {

            const { initialDt, decayOverMs, totalBonus } = thisBonus;

            if (initialDt + decayOverMs < currentDt) {
                return totalSpeedBonus;
            }

            newSpeedBonuses.push(thisBonus);
            const timeRemaining = currentDt - initialDt;
            totalSpeedBonus += totalBonus * (1 - (timeRemaining / decayOverMs));

            return totalSpeedBonus;
        }, 0);

        speedBonuses = newSpeedBonuses;

        return addedSpeed;
    };

    return {
        gameLoopFn,
        registerCollidingItem(item: RegisteredItem) {
            itemPickupManager.registerPickupableItem(item);
        },
        grantDecayingSpeedBonus(totalBonus: number, decayOverMs: number, initialDt: number) {
            speedBonuses.push({ totalBonus, decayOverMs, initialDt });
        },
        getSpeed(dt: number) {
            return SPEED + calculateSpeedBonuses(dt);
        },
        changeSpeed(d: number) {
            SPEED += d;
            return SPEED;
        },
        setSpeed(v: number) {
            SPEED = v;
        },
        freezePlayer(freeze: boolean) {
            preventMovement = freeze;
        }
    };

};

export default setupFPSCharacter;