/**
 * Somewhat based on https://www.shadertoy.com/view/4s2SRt
 */
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
  uniform float playhead;
  uniform float scale;
  uniform float size;
  uniform float density;
  uniform vec2 resolution;
  varying vec2 vUv;

  #pragma glslify: aastep = require('glsl-aastep')
  #pragma glslify: noise = require(glsl-noise/simplex/3d);
  #define PI 3.141592653589793
  #define HALF_PI 1.5707963267948966
  #define SMOOTH(r,R) (1.0-smoothstep(R-1.0,R+1.0, r))
  #define RS(a,b,x) ( smoothstep(a-1.0,a+1.0,x)*(1.0-smoothstep(b-1.0,b+1.0,x)) )
  #define blue vec3(0.784,0.839,0.973)
  #define blue3 vec3(0.35,0.76,0.83)
  #define lightBlue vec3(0.855,0.949,0.961)
  #define black vec3(0.0,0.0,0.0)
  #define white vec3(1.0,1.0,1.0)
  #define red vec3(1.,0.384,0.251)
  #define green vec3(0.,0.867,0.365)
  // #define yellow vec3(1.,0.984,0.38)
  #define yellow vec3(0.502,0.502,0.)


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

  float smoothedge(float v, float f) {
    return smoothstep(0.0, f / resolution.x, v);
  }

  float easeInOutCubic(float t) {
    if ((t *= 2.0) < 1.0) {
      return 0.5 * t * t * t;
    } else {
      return 0.5 * ((t -= 2.0) * t * t + 2.0);
    }
  }

  float beat(float value, float intensity, float frequency) {
    float v = atan(sin(value * PI * frequency) * intensity);
    return (v + HALF_PI) / PI;
  }

  float linearstep(float begin, float end, float t) {
    return clamp((t - begin) / (end - begin), 0.0, 1.0);
  }

  float circleStroke(vec2 uv, vec2 center, float radius, float width) {
    float r = length(uv - center);
    return SMOOTH(r-width/2.0,radius)-SMOOTH(r+width/2.0,radius);
  }

  float circleFill(vec2 uv, vec2 center, float radius) {
    float r = length(uv - center);
    return SMOOTH(r,radius);
  }

  float circleStrokeDashed(vec2 uv, vec2 center, float radius, float width) {
    vec2 d = uv - center;
    float r = sqrt( dot( d, d ) );
    d = normalize(d);
    float theta = 180.0*(atan(d.y,d.x)/PI);
    return smoothstep(2.0, 2.1, abs(mod(theta+2.0,45.0)-2.0)) *
        mix( 0.5, 1.0, step(45.0, abs(mod(theta, 180.0)-90.0)) ) *
        (SMOOTH(r-width/2.0,radius)-SMOOTH(r+width/2.0,radius));
  }

  float circleStroke2(vec2 uv, vec2 center, float radius, float width, float opening) {
    vec2 d = uv - center;
    float r = sqrt( dot( d, d ) );
    d = normalize(d);
    if( abs(d.y) > opening )
	    return SMOOTH(r-width/2.0,radius)-SMOOTH(r+width/2.0,radius);
    else
        return 0.0;
  }

  float grid(vec2 uv, vec2 center, float radius) {
    vec2 d = uv - center;
    int x = int(d.x);
    int y = int(d.y);
    float r = sqrt( dot( d, d ) );
    if(r>radius && ((x==y) || (x==-y) || (x==0) || (y==0)))
      return 1.0;
    else return 0.0;
  }

  float gradations(vec2 uv, vec2 center, float xLoc, float ySpan) {
    vec2 d = uv - center;
    float x = d.x;
    int y = int(d.y);
    float r = sqrt( dot( d, d ) );
    if( (x>xLoc-10.0 && x<xLoc+10.0) && (y<int(ySpan) && y>int(-ySpan)) && (mod(float(y), 20.0)==0.0))
      return 1.0;
    else return 0.0;
  }

  float gradationsPulse(vec2 uv, vec2 center, float xLoc, float ySpan, float playhead) {
    vec2 d = uv - center;
    float x = d.x;
    int y = int(d.y);
    float r = sqrt( dot( d, d ) );
    float yLoc = ySpan * loopNoise(vec2(0.0,0.0), playhead, 1.0, xLoc);

    if((x>xLoc-10.0 && x<xLoc+10.0) && (y>int(yLoc)-2 && y<int(yLoc)+2))
      return 1.0;
    else return 0.0;
  }

  vec3 isolines(vec2 uv, vec2 center, float radius, vec3 _color) {
    vec2 p = vUv * scale;
    float amp = 0.5;
    float v = 0.0;

    for (int i = 0; i < 3; i++) {
      v += loopNoise(p, playhead, 1.0, 20.0) * amp;
      amp *= 0.5;
      p *= 2.0;
    }
    v /= size;

    float t = patternLine(v);
    vec3 color = vec3(mix(_color, black, t));

    // Circle mask
    float alpha = circleFill(uv, center,  radius);

    return color * alpha;
  }

  float triangles(vec2 uv, vec2 center, float radius) {
    vec2 d = uv - center;
    return RS(-8.0, 0.0, d.x-radius) * (1.0-smoothstep( 7.0+d.x-radius,9.0+d.x-radius, abs(d.y)))
         + RS( 0.0, 8.0, d.x+radius) * (1.0-smoothstep( 7.0-d.x-radius,9.0-d.x-radius, abs(d.y)))
         + RS(-8.0, 0.0, d.y-radius) * (1.0-smoothstep( 7.0+d.y-radius,9.0+d.y-radius, abs(d.x)))
         + RS( 0.0, 8.0, d.y+radius) * (1.0-smoothstep( 7.0-d.y-radius,9.0-d.y-radius, abs(d.x)));
  }

  float ping(vec2 uv, vec2 center, float fromRadius, float amplitude, float time) {
    float r = length(uv - center);
    // float R = 8.0+mod(radius * time, 1.1 * radius);
    float R = fromRadius + (amplitude + 5.0) * time;
    float thickness = 5.0 + 30.0 * sin(PI * time);

    return smoothstep(max(0.0, R-thickness),R,r) - SMOOTH(R,r);
  }

  void main() {
    vec3 finalColor = black;
    vec2 center = vec2(resolution.x * 0.5, resolution.y * 0.5);
    vec2 uv = gl_FragCoord.xy;
    vec2 st = uv / resolution.xy;
    float radius = 150.0;
    float radius2 = radius + 20.0;
    float radius3 = radius * 1.75;
    float radius4 = radius * 2.25;
    float radius5 = resolution.x;

    // Grid lines
    finalColor += grid(uv, center, radius2) * yellow;
    // bottom arcs
    finalColor += circleStroke(uv, vec2(resolution.x * 0.5, resolution.y * -0.25), resolution.x * 0.5, 1.0) * yellow;
    finalColor += circleStroke(uv, vec2(resolution.x * 0.5, resolution.y * -0.15), resolution.x * 0.25, 1.0) * yellow;
    // top arcs
    finalColor += circleStroke(uv, vec2(resolution.x * 0.5, resolution.y * 1.25), resolution.x * 0.5, 1.0) * yellow;
    finalColor += circleStroke(uv, vec2(resolution.x * 0.5, resolution.y * 1.15), resolution.x * 0.25, 1.0) * yellow;
    // right arcs
    finalColor += circleStroke(uv, vec2(resolution.x * 1.25, resolution.y * 0.5), resolution.x * 0.5, 1.0) * yellow;
    finalColor += circleStroke(uv, vec2(resolution.x * 1.15, resolution.y * 0.5), resolution.x * 0.25, 1.0) * yellow;
    // left arcs
    finalColor += circleStroke(uv, vec2(resolution.x * -0.25, resolution.y * 0.5), resolution.x * 0.5, 1.0) * yellow;
    finalColor += circleStroke(uv, vec2(resolution.x * -0.15, resolution.y * 0.5), resolution.x * 0.25, 1.0) * yellow;
    // gradations
    finalColor += gradations(uv, center, radius * 2.875, radius) * green;
    finalColor += gradations(uv, center, -radius * 2.9, radius) * green;
    finalColor += gradationsPulse(uv, center, radius * 2.875, radius, playhead) * red;
    finalColor += gradationsPulse(uv, center, -radius * 2.9, radius, playhead) * red;
    // isolines
    finalColor += isolines(uv, center, radius, green);
    // Ping
    float beatT = beat(playhead, 10.0, 4.0);
    finalColor += ping(uv, center, radius2, radius3-radius2, beatT) * mix(green, blue, beatT);
    // Outline circle
    finalColor += circleStroke(uv, center, radius2, 10.0) * blue;
    // Modulating dashed circle
    finalColor += 0.7 * circleStroke2(uv, center, radius3, 5.0, 0.5+0.2*cos(time)) * blue;
    // Triangles
    finalColor += triangles(uv, center, radius4 + radius * 0.5 * cos(PI * playhead * 2.0)) * blue;
    // Dashed Circle
    finalColor += circleStrokeDashed(uv, center, radius4, 5.0) * lightBlue;

    gl_FragColor = vec4(finalColor, 1.0);
  }
`);

// Your sketch, which simply returns the shader
const sketch = ({ gl }) => {
  gl.getExtension('OES_standard_derivatives');

  // Create the shader and return it
  return createShader({
    clearColor: 'rgb(0, 0, 0)',
    // Pass along WebGL context
    gl,
    // Specify fragment and/or vertex shader strings
    frag,
    // Specify additional uniforms to pass down to the shaders
    uniforms: {
      // Expose props from canvas-sketch
      time: ({ time }) => time,
      playhead: ({ playhead }) => playhead,
      scale: 2,
      size: 0.1,
      density: 3.0,
      resolution: ({ width, height }) => [width, height],
    },
  });
};

canvasSketch(sketch, settings);
