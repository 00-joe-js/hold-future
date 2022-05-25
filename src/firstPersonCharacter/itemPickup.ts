import { Object3D, Vector3, Raycaster, SphereBufferGeometry, Sphere, Camera, Mesh, Box3, Group } from "three";

export interface RegisteredItem {
    obj: Mesh | Group,
    whenInRange: () => void
}

class ItemPickupManager {

    public collisionDistance: number;
    public playerObj: Object3D;

    private collidingArea: Sphere;
    private pickupableItems: RegisteredItem[] = [];

    constructor(playerObj: Object3D, collisionDistance = 70) {
        this.collisionDistance = collisionDistance;
        this.playerObj = playerObj;
        this.collidingArea = new Sphere(playerObj.position, this.collisionDistance);
    }

    registerPickupableItem(item: RegisteredItem) {
        this.pickupableItems.push(item);
    }

    testAndTriggerListeners() {
        this.onUpdate();

        if (this.pickupableItems.length === 0) {
            return;
        };

        this.pickupableItems.forEach(({ obj, whenInRange }) => {

            const objBox = new Box3();
            objBox.setFromObject(obj);

            // console.group();
            // console.log("Obj box min", objBox.min);
            // console.log("Obj box max", objBox.max);
            // console.log("Center", this.collidingArea.center);
            // console.log(this.collidingArea.intersectsBox(objBox));
            // console.groupEnd();

            if (this.collidingArea.intersectsBox(objBox)) {
                whenInRange();
            }

        });


    }

    onUpdate() {
        this.collidingArea.set(this.playerObj.position, this.collisionDistance);
    }
}

export default ItemPickupManager;