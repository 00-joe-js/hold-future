import { Group, Mesh, Vector3, PointLight, CylinderGeometry, MeshBasicMaterial, SphereGeometry, IcosahedronGeometry, MathUtils, Color } from "three";

import { flash } from "../renderer/index";

import globalTime from "../subscribe-to-global-render-loop";

import { playClick, playRareFruit } from "../sound";

export interface Item {
    obj: Group,
    collidingObj: Mesh,
    onLoop: (dt: number) => void,
    onPlayerCollide: () => void
}

const randomColors = [0xff0000, 0x00ff00, 0xffff00, 0xeeff00, 0xff00aa];

const createAndPlaceSpeedFruit = (
    rareChance: number,
    baseRadius: number = 15,
    randomColor: boolean = false,
    shouldDance: boolean = false,
    pos: Vector3,
    increaseSpeed: (d: number) => void,
    pleaseDestroy: (g: Group) => void
): Item => {

    let isRare = false;
    let color = 0x00ff00;

    const randomScalar = Math.random() * 30;

    let radius = baseRadius + randomScalar;
    let baseSpeed = 1 + ((randomScalar / 30) * .25);

    if (Math.random() < rareChance) {
        isRare = true;
        color = 0xffaaee;
        if (!randomColor) {
            radius = radius * 4;
            baseSpeed = baseSpeed * 3;
        } else {
            baseSpeed = baseSpeed * 3 * 2;
        }
    }

    if (randomColor) {
        color = randomColors[Math.floor(Math.random() * randomColors.length)]
    }

    const group = new Group();

    const fruitGeo = new IcosahedronGeometry(radius, 1);
    const cylinder = new Mesh(fruitGeo, new MeshBasicMaterial({ color }));

    group.add(cylinder);

    group.position.copy(pos);

    let rewarded = false;

    let baseAnimate = () => {
        cylinder.rotateOnAxis(new Vector3(1, 0, 0), 0.01);
        cylinder.rotateOnAxis(new Vector3(0, 1, 0), 0.07);
    };

    let animate = baseAnimate;
    if (shouldDance) {
        let r = MathUtils.randFloat(0.2, 2);
        animate = () => {
            baseAnimate();
            cylinder.position.y += Math.sin(globalTime.getTime() / 70.0) * -8.5;
            cylinder.position.z += Math.cos(globalTime.getTime() / (1000.0) * r) * 5;
        };
    }

    return {
        obj: group,
        collidingObj: cylinder,
        onLoop: animate,
        onPlayerCollide: () => {
            if (!rewarded) {
                rewarded = true;
                increaseSpeed(baseSpeed);
                if (isRare) {
                    /// 0xffaaee
                    flash([1, 0.6, 0.9], 0.05, 0.0001);
                    playRareFruit();
                } else {
                    flash([0, 1, 0], 0.015, 0.0005);
                    playClick();
                }
            }
        }
    };

};

export default createAndPlaceSpeedFruit;