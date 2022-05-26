export const vertexShader = `
varying float v_noise;
varying vec2 vUv;

uniform float u_time;

void main() {
  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}
`;

export const fragmentShader = `
#define PI 3.141592653589
#define PI2 6.28318530718

uniform float u_time;
uniform float u_brightness;

varying vec2 vUv;
varying float v_noise;

uniform sampler2D u_tex;

float n(float v) {
    return (v + 1.0) / 2.0;
}

void main (void)
{
  float r = (u_time / 500.0);
  vec2 uv = vUv + vec2(n(sin(r)), n(cos(r)));
  vec3 color = texture2D(u_tex, uv).rbg;
  gl_FragColor = vec4(color * u_brightness, 1.0);
}
`;
