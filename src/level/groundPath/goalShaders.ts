export const vertexShader = `
varying vec3 pos;

void main() {
  pos = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}
`;

export const fragmentShader = `
uniform float u_time;
uniform float u_brightness;
varying vec3 pos;

void main (void)
{
  float inSection = step(0.0, sin((pos.y + pos.x) / 10000.0) + cos(pos.x / 2000.0) + sin(u_time / 1000.0));

  float isAlt = step(sin(u_time / 400.0), sin(pos.x / 500.0));
  float staticEffect = step(0.0, sin(pos.x / 2.0));

  float brightness = u_brightness;

  vec3 color = vec3(
    ((isAlt * 1.0) - inSection) * staticEffect * brightness, 
    0.0, 
    0.2
  );

  gl_FragColor = vec4(color, 1.0);
}
`;
