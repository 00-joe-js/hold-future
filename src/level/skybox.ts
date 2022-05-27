import { TextureLoader, Mesh, BoxGeometry, BackSide, MeshBasicMaterial, ShaderMaterial } from "three";

import cubeBack from "../../assets/skybox/space_bk.png";
import cubeFront from "../../assets/skybox/space_ft.png";
import cubeLeft from "../../assets/skybox/space_lf.png";
import cubeRight from "../../assets/skybox/space_rt.png";
import cubeUp from "../../assets/skybox/space_up.png";
import cubeDown from "../../assets/skybox/space_dn.png";

const cubeImgs = [cubeFront, cubeBack, cubeUp, cubeDown, cubeRight, cubeLeft];

const vertexShader = `
varying vec2 vUv;
void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}
`;

const fragmentShader = `
uniform sampler2D u_tex;
varying vec2 vUv;



void main (void)
{
  vec3 color = texture2D(u_tex, vUv).rgb;
  gl_FragColor = vec4(color.rgb * 0.5, 1.0); 
}
`;

const createSkybox = async () => {

    const mats = cubeImgs.map(path => {
        const texture = new TextureLoader().load(path);
        return new ShaderMaterial({
            side: BackSide,
            vertexShader, fragmentShader,
            uniforms: { u_tex: { value: texture } }
        });
    });

    const size = 1000000000000;
    const boxGeo = new BoxGeometry(size, size, size);

    return new Mesh(boxGeo, mats);

};

export default createSkybox;