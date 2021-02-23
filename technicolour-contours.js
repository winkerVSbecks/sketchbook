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
  uniform float scale;
  uniform float size;
  uniform float density;
  varying vec2 vUv;

  #pragma glslify: aastep = require('glsl-aastep')
  #pragma glslify: noise = require(glsl-noise/simplex/3d);
  #define PI 3.141592653589793
  #define black vec4(0.0,0.0,0.0,0.0)
  #define color1 vec3(0.071,0.,0.471)
  #define color2 vec3(0.616,0.004,0.569)
  #define color3 vec3(0.992,0.227,0.412)
  #define color4 vec3(0.996,0.804,0.102)

  float patternZebra(float v){
    float d = 1.0 / density;
    float s = -cos(v / d * PI * 2.);
    return smoothstep(.0, .1 * d, .1 * s / fwidth(s));
  }

  float loopNoise (vec2 v, float t, float scale, float offset) {
    float duration = scale;
    float current = t * scale;
    return ((duration - current) * noise(vec3(v, current + offset)) + current * noise(vec3(v, current - duration + offset))) / duration;
  }

  vec3 rotHue(vec3 p, float a) {
    vec2 cs = sin(vec2(1.570796, 0) + a);

    mat3 hr = mat3(0.299,  0.587,  0.114,  0.299,  0.587,  0.114,  0.299,  0.587,  0.114) +
        	  mat3(0.701, -0.587, -0.114, -0.299,  0.413, -0.114, -0.300, -0.588,  0.886) * cs.x +
        	  mat3(0.168,  0.330, -0.497, -0.328,  0.035,  0.292,  1.250, -1.050, -0.203) * cs.y;

    return clamp(p*hr, 0., 1.);
  }

  void main() {
    vec2 p = vUv * scale;
    float amp = 0.5;
    float v = 0.0;

    v += loopNoise(p, time, 1.0, 60.0) * amp;
    amp *= 0.5;
    p *= 2.0;
    v /= size;

    vec3 color;
    float t = patternZebra(v);

    if (v < 0.25) {
      color = mix(color1, color2, t);
    } else if (v < 0.75) {
      color = mix(color2, color3, t);
    } else {
      color = mix(color3, color4, t);
    }

    // // Circle
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
    clearColor: '#0a043c',
    // Pass along WebGL context
    gl,
    // Specify fragment and/or vertex shader strings
    frag,
    // Specify additional uniforms to pass down to the shaders
    uniforms: {
      // Expose props from canvas-sketch
      time: ({ playhead }) => playhead,
      scale: 1,
      size: 0.25,
      density: 2.0,
    },
  });
};

canvasSketch(sketch, settings);
