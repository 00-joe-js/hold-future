import { Mesh, BoxGeometry, ShaderMaterial, PlaneGeometry, MeshBasicMaterial, MeshPhongMaterial, TextureLoader } from "three";
import { vertexShader, fragmentShader } from "./groundShaders";
import { vertexShader as goalVShader, fragmentShader as goalFShader } from "./goalShaders";

import globalTime from "../../subscribe-to-global-render-loop";

import noiseTex from "../../../assets/noisetextures/explosion.png";

export default () => {

    const u = { uTime: { value: 0.0 } };
    const groundMat = new ShaderMaterial({
        wireframe: true,
        uniforms: u,
        vertexShader,
        fragmentShader
    });

    const altGroundMat = new MeshPhongMaterial({ color: 0x000000, shininess: 10000, specular: 0xffffff });

    const trackLength = 80000;
    const trackWidth = 3000;

    const groundG = new BoxGeometry(trackLength, 0, trackWidth, 30, 1, 30);
    const groundP = new BoxGeometry(trackLength, 0, trackWidth, 1, 1, 1);
    const ground = new Mesh(groundG, groundMat);
    const phongGround = new Mesh(groundP, altGroundMat);

    ground.name = "ground";
    ground.layers.enable(7);

    phongGround.position.y = -35;
    phongGround.position.x = trackLength / 2;
    ground.position.y = -5;
    ground.position.x = trackLength / 2;

    const goalU = {
        u_time: { value: 0 },
        u_tex: { value: new TextureLoader().load(noiseTex) }
    };

    const goalMat = new ShaderMaterial({
        uniforms: goalU,
        vertexShader: goalVShader,
        fragmentShader: goalFShader
    });

    const goalG = new PlaneGeometry(trackWidth, 10000);
    const goal = new Mesh(goalG, goalMat);

    goal.rotation.y = -Math.PI / 2;
    goal.position.x = trackLength - 1000;


    globalTime.subscribe((dt: number) => {
        u.uTime.value = dt;
        goalU.u_time.value = dt;
    });

    return { ground, phongGround, goal };

};