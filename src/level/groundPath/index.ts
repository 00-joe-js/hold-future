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

    const trackLength = 100000;
    const trackWidth = 3000;

    const createGroundGeos = (len = trackLength) => {
        return [
            new BoxGeometry(len, 0, trackWidth, 200, 1, 10),
            new BoxGeometry(len, 0, trackWidth, 1, 1, 1)
        ];
    };

    let [groundG, groundP] = createGroundGeos();

    const ground = new Mesh(groundG, groundMat);
    const phongGround = new Mesh(groundP, altGroundMat);

    ground.name = "ground";
    ground.layers.enable(7);

    phongGround.position.y = -35;
    ground.position.y = -5;

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

    const setTrackLength = (len: number) => {
        groundG.dispose();
        groundP.dispose();
        [groundG, groundP] = createGroundGeos(len);
        ground.geometry = groundG;
        phongGround.geometry = groundP;

        ground.position.x = len / 2;
        phongGround.position.x = len / 2;

        goal.position.x = len - 1000;
    };

    setTrackLength(trackLength);

    return { ground, phongGround, goal, setTrackLength };

};