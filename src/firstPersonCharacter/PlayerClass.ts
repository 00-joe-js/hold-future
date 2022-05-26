import { Camera, Vector3 } from "three";

class Player {

    camera: Camera;

    constructor(camera: Camera) {
        this.camera = camera;
    }

    setWorldPosition(pos: Vector3) {
        this.camera.position.copy(pos);
    }

    faceForward() {
        this.camera.rotation.y = -Math.PI / 2;
    }

}

export default Player;