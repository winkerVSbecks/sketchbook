const canvasSketch = require('canvas-sketch');
const { linspace } = require('canvas-sketch-util/math');
const Random = require('canvas-sketch-util/random');

const settings = {
  animate: true,
  duration: 4,
  dimensions: [800, 600],
  scaleToView: true,
};

const pointCount = 1000;
const spread = [200, 800];
const frameCount = 570;
// Parameters of sound sensitivity
const baseFreq = 20500;
const apexFreq = 20;
const frequency = 125;
const amplitude = 1;
// Parameters of movement
const tiedSteps = 50;
const movementScale = 1.0;
const steps = 10;
const baseWaveLength = 50;

canvasSketch(() => {
  let basilar;

  return {
    begin({ canvas, context, width, height }) {
      console.clear();
      basilar = new BasilarMembrane(width, height);
    },
    render({ context, width, height, deltaTime, playhead, frame }) {
      context.clearRect(0, 0, width, height);
      context.fillStyle = '#001';
      context.fillRect(0, 0, width, height);

      context.strokeStyle = '#fff';
      context.lineWidth = 4;
      context.lineCap = 'round';
      context.lineJoin = 'round';
      // context.shadowBlur = 12;
      // context.shadowColor = '#fff';

      context.fillStyle = '#fff';
      context.font = `${width * 0.05}px monospace`;
      context.fillText(`${frequency}hz`, width * 0.1, height * 0.9);

      context.beginPath();
      context.moveTo(width * 0.1, height / 2);
      context.lineTo(width * 0.9, height / 2);
      context.stroke();

      basilar.update(deltaTime, playhead);
      basilar.draw(context);

      // drawScanLines(context, width, height, frame);
      // drawVignette(context, width, height);
    },
  };
}, settings);

function drawVignette(context, width, height) {
  const outerRadius = width * 0.5;
  const innerRadius = width * 0.2;
  const grd = context.createRadialGradient(
    width / 2,
    height / 2,
    innerRadius,
    width / 2,
    height / 2,
    outerRadius
  );
  grd.addColorStop(1, 'rgba(0,0,0, 0.5)');
  grd.addColorStop(0.2, 'rgba(0,0,0,0)');
  grd.addColorStop(0, 'rgba(0,0,0,0)');

  context.fillStyle = grd;
  context.globalCompositeOperation = 'darken';
  context.rect(0, 0, width, height);
  context.fill();
}

function drawScanLines(context, width, height, frame) {
  context.strokeStyle =
    Random.sign() > 0
      ? 'rgba(255, 255, 255, 0.05)'
      : 'rgba(255, 255, 255, 0.1)';

  linspace(height)
    .map((v) => v * height)
    .filter((_, idx) => idx % 8 === 0)
    .forEach((y) => {
      context.lineWidth = 4;
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(width, y);
      context.stroke();
    });
}

/**
 * Original code from The Travelling Wave
 * https://isle.hanover.edu/Ch10AuditorySystem/Ch10TravellingWave.html
 */
class BasilarMembrane {
  constructor(width, height) {
    this.base = { x: width * 0.1, y: height / 2 };
    this.apex = { x: width * 0.9, y: height / 2 };

    this.leadPoint = 0;
    this.wavelength = 50.0;

    // initialize the basilar membrane
    const pow = 2.3;
    this.basilarMembrane = linspace(pointCount).map(() => ({ x: 0, y: 0 }));
    this.basilarMembraneResonance = linspace(pointCount).map(
      (_, idx) =>
        Math.pow(pointCount - idx, pow) *
          ((baseFreq - apexFreq) / Math.pow(pointCount, pow)) +
        apexFreq
    );
  }

  updateBasilarMembrane() {
    this.basilarMembrane[0] = this.base;
    this.basilarMembrane[pointCount - 1] = this.apex;

    // Determine the wavelength that is convert frequency to wavelength
    const minFreq = this.basilarMembraneResonance[
      this.basilarMembraneResonance.length - 1
    ];
    const maxFreq = this.basilarMembraneResonance[0];

    // check the min vs max
    if (minFreq > maxFreq) {
      [minFreq, maxFreq] = [maxFreq, minFreq];
    }

    this.wavelength =
      (((maxFreq - frequency) / (maxFreq - minFreq)) *
        (this.apex.x - this.base.x)) /
        1.2 +
      baseWaveLength;

    // Determine if a correction is need on the amplitudes
    let relAmp = 1;
    const totAmp = amplitude;
    if (this.totAmp > 1) {
      relAmp = 1 / totAmp;
    }

    const xStep = (this.apex.x - this.base.x) / (pointCount - 1);
    const cyclePoint = linspace(pointCount).fill(0);
    const localPhase = linspace(pointCount).fill(0);

    this.basilarMembrane.forEach((pt, idx) => {
      pt.x = this.base.x + Math.floor(xStep * idx);
      pt.y = this.base.y;
      this.resOff = verticalOffset(
        idx,
        frequency,
        this.basilarMembraneResonance
      );

      localPhase[idx] =
        (2 * Math.PI * (this.leadPoint - idx)) / this.wavelength;

      if (localPhase[idx] > 2 * Math.PI) {
        localPhase[idx] = localPhase[idx] % (2 * Math.PI);
      }

      cyclePoint[idx] = Math.sin(localPhase[idx]);
      this.peak = this.resOff * relAmp * amplitude * cyclePoint[idx];

      if (idx < tiedSteps) {
        this.peak = (this.peak * idx) / tiedSteps;
      }

      pt.y += this.peak * movementScale * (this.base.y / 2);
    });
  }

  update(deltaTime, playhead) {
    // const step = Math.floor(steps * deltaTime * 30);
    this.leadPoint = playhead * frameCount;

    if (this.leadPoint >= pointCount + this.wavelength) {
      this.leadPoint = pointCount;
    }

    this.updateBasilarMembrane();
  }

  draw(context) {
    context.beginPath();
    const path = this.basilarMembrane.slice(...spread);
    // context.moveTo(this.base.x, this.base.y);
    context.moveTo(path[0].x, path[0].y);
    path.forEach((pt) => {
      context.lineTo(pt.x, pt.y);
    });
    context.stroke();
  }
}

/**
 * Determine relative vertical offset
 */
function verticalOffset(x, freq, basilarMembraneResonance) {
  // Find the range of frequencies
  const minFreq = basilarMembraneResonance[basilarMembraneResonance.length - 1];
  const maxFreq = basilarMembraneResonance[0];
  let resOff = 1.0;

  // Adjust the sensitivity of the point on the basilar membrane
  // to the difference between frequency and resonance value
  if (freq === basilarMembraneResonance[x]) {
    resOff = 1.0;
  } else if (freq < basilarMembraneResonance[x]) {
    let scaleVal = (basilarMembraneResonance[x] - freq) / (20000 - freq);
    const pwr = 1.1 - 1.05 * scaleVal;
    resOff = 1.0 - Math.pow(scaleVal, pwr);
  } else if (freq > basilarMembraneResonance[x]) {
    const tuningDivider =
      (3000.0 * (freq - minFreq)) / (maxFreq - minFreq) + 410.0;
    const relDist = (freq - basilarMembraneResonance[x]) / tuningDivider;
    let scaleVal = Math.pow(relDist, 5.0);

    if (scaleVal > 1.0) scaleVal = 1.0;
    resOff = 1.0 - scaleVal;
  }

  return resOff < 0 ? 0 : resOff;
}

function getPeak(
  x,
  freq,
  basilarMembraneResonance,
  tiedSteps,
  amplitude,
  base,
  movementScale
) {
  const resOff = verticalOffset(x, freq, basilarMembraneResonance);
  let peak = resOff * amplitude * 1.0;

  if (x < tiedSteps) {
    peak = (peak * x) / tiedSteps;
  }

  return peak * movementScale * (base.y / 2) + base.y;
}
