import { Group, Mesh, Vector3, PointLight, CylinderGeometry, MeshBasicMaterial, SphereGeometry, IcosahedronGeometry } from "three";

import { flash } from "../renderer/index";

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
    
    const randomScalar = Math.random() * 30;

    let radius = 10 + randomScalar;
    let baseSpeed = 1 + ((randomScalar / 30) * .5);

    if (Math.random() < rareChance) {
        isRare = true;
        color = 0xffaaee;
        radius = radius * 4;
        baseSpeed = baseSpeed * 5;
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
                increaseSpeed(baseSpeed);
                if (isRare) {
                    /// 0xffaaee
                    flash([1, 0.67, 0.93], 0.15);
                    playRareFruit();
                } else {
                    flash([0, 1, 0], 0.05);
                    playClick();
                }
            }
        }
    };

};

export default createAndPlaceSpeedFruit;