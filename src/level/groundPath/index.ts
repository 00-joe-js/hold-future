import { Mesh, BoxGeometry, ShaderMaterial, PlaneGeometry, MeshBasicMaterial, MeshPhongMaterial, TextureLoader, Vector3 } from "three";
import { vertexShader, fragmentShader } from "./groundShaders";
import { vertexShader as goalVShader, fragmentShader as goalFShader } from "./goalShaders";

import globalTime from "../../subscribe-to-global-render-loop";

import noiseTex from "../../../assets/noisetextures/explosion.png";

export default (initialTrackLength = 100000, initialTrackWidth = 5000) => {

    const u = { uTime: { value: 0.0 } };
    const groundMat = new ShaderMaterial({
        wireframe: true,
        uniforms: u,
        vertexShader,
        fragmentShader
    });

    const trackLength = initialTrackLength;
    const trackWidth = initialTrackWidth;

    const createGroundGeos = (len = trackLength, width = trackWidth) => {
        return [
            new BoxGeometry(len, 0, width, 200, 1, 10),
            new BoxGeometry(len, 0, width, 1, 1, 1)
        ];
    };

    let [groundG, groundP] = createGroundGeos();

    const ground = new Mesh(groundG, groundMat);

    ground.name = "ground";
    ground.layers.enable(7);

    const goalU = {
        u_time: { value: 0 },
        u_tex: { value: new TextureLoader().load(noiseTex) },
        u_brightness: { value: 0.0 }
    };

    const setGoalBrightness = (v: number) => {
        goalU.u_brightness.value = v;
    };

    const goalMat = new ShaderMaterial({
        uniforms: goalU,
        vertexShader: goalVShader,
        fragmentShader: goalFShader
    });

    const goalG = new BoxGeometry(trackLength, 30000, trackWidth, 15, 15, 15);
    const goal = new Mesh(goalG, goalMat);

    goal.rotation.y = Math.PI / 2;
    goal.position.y = 0;
    goal.position.x = trackLength;

    globalTime.subscribe((dt: number) => {
        u.uTime.value = dt;
        goalU.u_time.value = dt;
    });

    const setTrackDimensions = (len: number, width: number) => {
        groundG.dispose();
        groundP.dispose();
        [groundG, groundP] = createGroundGeos(len, width);
        ground.geometry = groundG;

        ground.position.x = len / 2;
        goal.position.x = len;
    };

    setTrackDimensions(trackLength, trackWidth);

    const distanceToGoal = (pt: Vector3) => {
        // Length of track is x-axis.
        return goal.position.x - pt.x;
    };

    return { ground, goal, setTrackDimensions, distanceToGoal, setGoalBrightness };

};