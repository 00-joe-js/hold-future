import { Mesh, BoxGeometry, ShaderMaterial } from "three";
import { vertexShader, fragmentShader } from "./groundShaders";

import globalTime from "../../subscribe-to-global-render-loop";

export default () => {

    const u = { uTime: { value: 0.0 } };
    const groundMat = new ShaderMaterial({
        wireframe: true,
        uniforms: u,
        vertexShader,
        fragmentShader
    });

    const groundG = new BoxGeometry(2000, 0, 200000, 10, 1, 1000);
    const ground = new Mesh(groundG, groundMat);

    ground.name = "ground";
    ground.layers.enable(7);
    ground.position.y = -2;

    ground.position.z = -49000;

    globalTime.subscribe((dt: number) => {
        u.uTime.value = dt;
    });

    return ground;

};