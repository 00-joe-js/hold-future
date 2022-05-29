export const vertexShader = `
uniform float uTime;
uniform float uSeed;
uniform float lift;
float rand(float n){return fract(sin(n) * 43758.5453123);}
float noise(float p){
    float fl = floor(p);
    float fc = fract(p);
    return mix(rand(fl), rand(fl + 1.0), fc);
}
varying vec3 vPos;
void main() {
    vec3 pos = position + vec3(
        0.0,
        noise((position.x / 200.0) + (position.z) + (uTime / (1000.0 - (800.0 * lift)))) * (-60.0 + (lift * -90.0)), 
        (sin(uTime) / 5000.0)
    );
    vPos = pos;
    gl_Position = projectionMatrix * modelViewMatrix * vec4( pos, 1.0 );
}
`;

export const fragmentShader = `
uniform float uTime;
uniform float lift;
varying vec3 vPos;
void main() {
    vec3 color = vec3(step(lift * -60.0, vPos.y), 0.0, 0.7 + sin(vPos.y * 400.0)).rgb;
    gl_FragColor = vec4(color, 1.0);
}
`;