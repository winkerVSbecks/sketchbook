const canvasSketch = require('canvas-sketch');
const createShader = require('canvas-sketch-util/shader');
const glsl = require('glslify');

// Setup our sketch
const settings = {
  dimensions: [1080, 1080],
  context: 'webgl',
  animate: true,
  duration: 6,
  fps: 50,
};

// Your glsl code
const frag = glsl(/* glsl */ `#extension GL_OES_standard_derivatives : enable

  precision highp float;
  uniform float time;
  uniform float density;
  varying vec2 vUv;

  #define PI 3.141592653589793
  #pragma glslify: noise = require(glsl-noise/simplex/3d);

  float patternZebra(float v){
    float d = 1.0 / density;
    float s = -cos(v / d * PI * 2.);
    return smoothstep(.0, .1 * d, .1 * s / fwidth(s));
  }

  void main() {
    // Generate noise data
    float amplitude = 1.0;
    float frequency = 1.5;
    float noiseValue = noise(vec3(vUv * frequency, time)) * amplitude;

    // Convert noise data to rings
    float t = patternZebra(noiseValue);
    vec3 color = mix(vec3(1.,0.4,0.369), vec3(0.824,0.318,0.369), t);

    // Clip the rings to a circle
    float dist = length(vUv - vec2(0.5, 0.5));
    float alpha = smoothstep(0.250, 0.2482, dist);

    gl_FragColor = vec4(color, alpha);
  }
`);

// Your sketch, which simply returns the shader
const sketch = ({ gl }) => {
  gl.getExtension('OES_standard_derivatives');

  // Create the shader and return it
  return createShader({
    clearColor: '#2B2B2B',
    // Pass along WebGL context
    gl,
    // Specify fragment and/or vertex shader strings
    frag,
    // Specify additional uniforms to pass down to the shaders
    uniforms: {
      // Expose props from canvas-sketch
      time: ({ playhead }) => playhead,
      density: 2.0,
    },
  });
};

canvasSketch(sketch, settings);
