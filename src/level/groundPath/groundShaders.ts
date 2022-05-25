export const vertexShader = `
uniform float uTime;
uniform float uSeed;
float rand(float n){return fract(sin(n) * 43758.5453123);}
float noise(float p){
    float fl = floor(p);
    float fc = fract(p);
    return mix(rand(fl), rand(fl + 1.0), fc);
}
varying vec3 vPos;
void main() {
    vec3 pos = position + vec3(0.0, noise((position.x / 200.0) + (position.z) + (uTime / 1500.0)) * -60.0, (sin(uTime) / 2000.0));
    vPos = pos;
    gl_Position = projectionMatrix * modelViewMatrix * vec4( pos, 1.0 );
}
`;

export const fragmentShader = `
uniform float uTime;
varying vec3 vPos;
void main() {
    vec3 color = vec3(0.0 + (abs(vPos.y) / 50.0), sin(vPos.z / 100.0 + (uTime / 200.0)), abs(sin(vPos.y)));
    gl_FragColor = vec4(color, 1.0);
}
`;