const canvasSketch = require('canvas-sketch');
const createShader = require('canvas-sketch-util/shader');
const glsl = require('glslify');

// Setup our sketch
const settings = {
  dimensions: [1024, 1024],
  context: 'webgl',
  animate: true,
  duration: 5,
  fps: 50,
};

// Your glsl code
const frag = glsl(/* glsl */ `
  precision highp float;
  uniform float playhead;
  varying vec2 vUv;
  #pragma glslify: noise = require(glsl-noise/simplex/3d);

  float loopNoise (float x, float y, float t, float scale, float offset) {
    float duration = scale;
    float current = t * scale;
    return ((duration - current) * noise(vec3(x, y, current + offset)) + current * noise(vec3(x, y, current - duration + offset))) / duration;
  }

  void main () {
    float dist = length(vUv - vec2(0.5, 0.5));
    // float red = smoothstep(0.15, 0.155, loopNoise(vUv.x, vUv.y, playhead, 1.0, 0.0));
    // float green = smoothstep(0.105, 0.108, loopNoise(vUv.x, vUv.y, playhead, 1.0, 120.0));
    // float blue = 0.5;
    // // float blue = smoothstep(0.2, 0.205, noise(vec3(vUv.x, vUv.y, playhead * 0.5 + 100.0)));
    // vec3 color = vec3(red, green, blue);

    float c = smoothstep(0.5, 0.503, loopNoise(vUv.x, vUv.y, playhead, 1.0, 0.0));
    vec3 colorA = vec3(c, c, c);

    float c2 = smoothstep(0.2, 0.205, loopNoise(vUv.x, vUv.y, playhead, 1.0, 30.0));
    vec3 colorB = vec3(c2, c2, c2);

    vec3 color = colorA + colorB;

    float alpha = smoothstep(0.250, 0.2482, dist);
    gl_FragColor = vec4(color, alpha);
  }
`);

// Your sketch, which simply returns the shader
const sketch = ({ gl }) => {
  // Create the shader and return it
  return createShader({
    clearColor: 'rgb(240, 248, 255)',
    // Pass along WebGL context
    gl,
    // Specify fragment and/or vertex shader strings
    frag,
    // Specify additional uniforms to pass down to the shaders
    uniforms: {
      // Expose props from canvas-sketch
      playhead: ({ playhead }) => playhead,
    },
  });
};

canvasSketch(sketch, settings);
