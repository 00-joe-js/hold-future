import { Group, Mesh, Vector3, PointLight, CylinderGeometry, MeshBasicMaterial } from "three";

import { flashGreen } from "../renderer/index";

export interface Item {
    obj: Group,
    collidingObj: Mesh,
    onLoop: (dt: number) => void,
    onPlayerCollide: () => void
}

const createAndPlaceSpeedFruit = (pos: Vector3, increaseSpeed: (d: number) => void, pleaseDestroy: (g: Group) => void): Item => {

    const COLOR = 0x00ff00;

    const group = new Group();

    const cylinderGeo = new CylinderGeometry(20, 20, 80);
    const cylinder = new Mesh(cylinderGeo, new MeshBasicMaterial({ color: COLOR }));

    // const light = new PointLight(COLOR, 2);
    // light.position.y = -500;
    // group.add(light);

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
                increaseSpeed(1.25);
                flashGreen();
                pleaseDestroy(group);
            }
        }
    };

};

export default createAndPlaceSpeedFruit;