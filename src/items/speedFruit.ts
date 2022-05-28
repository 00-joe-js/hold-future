import { Group, Mesh, Vector3, PointLight, CylinderGeometry, MeshBasicMaterial, SphereGeometry, IcosahedronGeometry } from "three";

import { flashGreen } from "../renderer/index";

import { playClick, playRareFruit } from "../sound";

export interface Item {
    obj: Group,
    collidingObj: Mesh,
    onLoop: (dt: number) => void,
    onPlayerCollide: () => void
}

const createAndPlaceSpeedFruit = (
    rareChance: number, 
    pos: Vector3, 
    increaseSpeed: (d: number) => void, 
    pleaseDestroy: (g: Group) => void
): Item => {

    let isRare = false;
    let color = 0x00ff00;
    let radius = 10 + Math.random() * 20;

    if (Math.random() < rareChance) {
        isRare = true;
        color = 0xffaaee;
        radius = radius * 4;
    }

    const group = new Group();

    const fruitGeo = new IcosahedronGeometry(radius, 1);
    const cylinder = new Mesh(fruitGeo, new MeshBasicMaterial({ color }));

    group.add(cylinder);

    group.position.copy(pos);

    let rewarded = false;

    return {
        obj: group,
        collidingObj: cylinder,
        onLoop: () => {
            cylinder.rotateOnAxis(new Vector3(1, 0, 0), 0.01);
            cylinder.rotateOnAxis(new Vector3(0, 1, 0), 0.07);
        },
        onPlayerCollide: () => {
            if (!rewarded) {
                rewarded = true;
                increaseSpeed(isRare ? 5 : 1.25);
                flashGreen();
                if (isRare) {
                    playRareFruit();
                } else {
                    playClick();
                }
            }
        }
    };

};

export default createAndPlaceSpeedFruit;