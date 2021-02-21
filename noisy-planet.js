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
  uniform float mode;
  varying vec2 vUv;

  #define PI 3.141592653589793
  #pragma glslify: aastep = require('glsl-aastep')
  #pragma glslify: noise = require(glsl-noise/simplex/3d);

  float patternZebra(float v){
    float d = 1.0 / density;
    float s = -cos(v / d * PI * 2.);
    return smoothstep(.0, .1 * d, .1 * s / fwidth(s));
  }

  float patternLine(float v) {
    float f = abs(fract(v) - .5);
    float df = fwidth(v) * density;
    return smoothstep(0., df, f);
  }

  float loopNoise (vec2 v, float t, float scale, float offset) {
    float duration = scale;
    float current = t * scale;
    return ((duration - current) * noise(vec3(v, current + offset)) + current * noise(vec3(v, current - duration + offset))) / duration;
  }

  float sdEquilateralTriangle( in vec2 p ) {
    const float k = sqrt(3.0);
    p.x = abs(p.x) - 1.0;
    p.y = p.y + 1.0/k;
    if( p.x+k*p.y>0.0 ) p = vec2(p.x-k*p.y,-k*p.x-p.y) / 2.0;
    p.x -= clamp( p.x, -2.0, 0.0 );
    return -length(p)*sign(p.y);
  }

  void main() {
    // vec3 p = vec3(vUv * scale, 0.0);
    vec2 p = vUv * scale;
    float amp = 0.5;
    float v = 0.0;

    for (int i = 0; i < 3; i++) {
      // v += snoise(p + time * float(i)) * amp;
      // v += noise(p + time * float(i)) * amp;
      v += loopNoise(p, time, 1.0, 60.0) * amp;
      amp *= 0.5;
      p *= 2.0;
    }
    v /= size;

    float t = mode == 0.0 ? patternLine(v) : patternZebra(v);
    // vec3 color = vec3(mix(0.0, 1.0, t));
    vec3 color = mix(vec3(1.,0.4,0.369), vec3(0.824,0.318,0.369), t);

    // Triangle
    // float dist = sdEquilateralTriangle(5.*(vUv+vec2(-0.5, -0.45)));
    // float alpha = smoothstep(0.250, 0.2482, dist);

    // Circle
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
    // clearColor: 'rgb(0, 0, 0)',
    clearColor: '#2B2B2B',
    // Pass along WebGL context
    gl,
    // Specify fragment and/or vertex shader strings
    frag,
    // Specify additional uniforms to pass down to the shaders
    uniforms: {
      // Expose props from canvas-sketch
      time: ({ playhead }) => playhead,
      scale: 1,
      size: 0.5,
      density: 2.0,
      mode: 1,
    },
  });
};

canvasSketch(sketch, settings);
