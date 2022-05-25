import { Object3D, Vector3, Raycaster, SphereBufferGeometry, Sphere, Camera, Mesh, Box3 } from "three";

export interface RegisteredItem {
    obj: Mesh,
    whenInRange: () => void
}

class ItemPickupManager {

    public collisionDistance: number;
    public playerObj: Object3D;

    private collidingArea: Sphere;
    private pickupableItems: RegisteredItem[] = [];

    constructor(playerObj: Object3D, collisionDistance = 40) {
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

            obj.geometry.computeBoundingBox();

            const originalBoundingBox = obj.geometry.boundingBox;
            if (!(originalBoundingBox instanceof Box3)) {
                throw new Error("Couldn't compute or access bounding box. Why?");
            }

            const boxContainingObj = originalBoundingBox.clone();
            boxContainingObj.applyMatrix4(obj.matrixWorld);

            if (this.collidingArea.intersectsBox(boxContainingObj)) {
                whenInRange();
            }

        });


    }

    onUpdate() {
        this.collidingArea.set(this.playerObj.position, this.collisionDistance);
        if (Math.random() < 0) {
            console.log("Sphere area", this.collidingArea.center);
            console.log("Camera pos", this.playerObj.position);
        }

    }
}

export default ItemPickupManager;