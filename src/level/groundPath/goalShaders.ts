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

void main (void)
{
  vec2 uv = vUv;
  vec3 color = vec3(texture2D(u_tex, uv));
  
  float r = (sin(u_time / 50.0) + 1.0) / 2.0;

  gl_FragColor = vec4(vec3(0, r * u_brightness / 4.0, 0.5), 0.5);
}
`;
