const canvasSketch = require('canvas-sketch');
const { Poline, positionFunctions } = require('poline/dist/index.cjs');
const chroma = require('chroma-js');
const WFC = require('./ndwfc');
const { WFCTool2D } = require('./ndwfc-tools');

const settings = {
  dimensions: [1080, 1080],
  animate: true,
  duration: 25,
  scaleToView: true,
  loop: true,
};

const poline = new Poline({
  numPoints: 9,
  positionFunctionX: positionFunctions.sinusoidalPosition,
  positionFunctionY: positionFunctions.quadraticPosition,
  positionFunctionZ: positionFunctions.linearPosition,
});

const rawColors = poline.colorsCSS;
const colors = rawColors.map((c) => chroma(c).rgb());
rawColors.forEach((color) => {
  console.log('%c  ', `background: ${color};`);
});

const sketch = () => {
  return {
    begin({ canvas, context, width, height, playhead }) {
      wfcDemo2D({ canvas, context, width, height, playhead });
    },
    render({ context, width, height, playhead }) {
      // context.clearRect(0, 0, width, height);
      // context.fillStyle = colors.surface;
      // context.fillRect(0, 0, width, height);
    },
  };
};

canvasSketch(sketch, settings);

let worker;

const tilesets = function (tool) {
  tool.addTile(`\
.......
#######
=======
-------
=======
#######
.......`);

  tool.addTile(`\
.......
#######
+++++++
~~~~~~~
+++++++
#######
.......`);

  tool.addTile(`\
.......
#######
@@@@@@@
;;;;;;;
@@@@@@@
#######
.......`);

  tool.addTile(`\
.#=-=#.
.#=-=##
.#=-===
.#=----
.#=====
.######
.......`);

  tool.addTile(`\
.#+~+#.
.#+~+##
.#+~+++
.#+~~~~
.#+++++
.######
.......`);

  tool.addTile(`\
.#@;@#.
.#@;@##
.#@;@@@
.#@;;;;
.#@@@@@
.######
.......`);

  tool.addTile(`\
.#+~+#.
#######
=======
-------
=======
#######
.#+~+#.`);

  tool.addTile(`\
.#=-=#.
#######
+++++++
~~~~~~~
+++++++
#######
.#=-=#.`);

  tool.addTile(`\
.#=-=#.
#######
@@@@@@@
;;;;;;;
@@@@@@@
#######
.#=-=#.`);

  tool.addTile(`\
.#@;@#.
#######
=======
-------
=======
#######
.#@;@#.`);

  tool.addTile(`\
.#+~+#.
#######
@@@@@@@
;;;;;;;
@@@@@@@
#######
.#+~+#.`);

  tool.addTile(`\
.#@;@#.
#######
+++++++
~~~~~~~
+++++++
#######
.#@;@#.`);

  tool.addColor('.', colors[0]);
  tool.addColor('#', colors[1]);

  tool.addColor('-', colors[2]);
  tool.addColor('=', colors[3]);

  tool.addColor('~', colors[4]);
  tool.addColor('+', colors[5]);

  tool.addColor(';', colors[6]);
  tool.addColor('@', colors[7]);
};

function wfcDemo2D({ context, canvas, width, height }) {
  if (worker) {
    worker.terminate();
  }

  var tool = new WFCTool2D();
  tilesets(tool);

  var viewport;
  var wave;

  var workerCode = function () {
    var viewport;
    var wfc;
    var aspectRatio;
    var size;
    var increment;
    var multiply;

    // console.log('connect');

    onmessage = function (e) {
      // console.log(e);
      if (e.data.op == 'init') {
        wfc = new WFC(e.data.wfcInput);
        aspectRatio = e.data.aspectRatio;
        size = e.data.initialSize;
        increment = e.data.increment;
        multiply = e.data.multiply;
        main();
      }
    };

    function main() {
      setTimeout(main, 1);
      if (!wfc) {
        return;
      }
      if (wfc.step()) {
        viewport = {
          x: -size,
          y: -Math.round(size * aspectRatio),
          w: size * 2,
          h: Math.round(size * 2 * aspectRatio),
        };
        wfc.expand(
          [viewport.y, viewport.x],
          [viewport.y + viewport.h, viewport.x + viewport.w]
        );
        size = Math.ceil((size + increment) * multiply);
      }
      postMessage({ viewport, wave: wfc.readout(/*false*/) });
    }
  };

  // console.log(tool.getTileFormulae());

  worker = new Worker(
    URL.createObjectURL(
      new Blob([
        'var WFC=' + WFC.toString() + ';(' + workerCode.toString() + ')()',
      ])
    )
  ); // new Worker('worker.js');

  worker.postMessage({
    op: 'init',
    wfcInput: tool.generateWFCInput(),
    aspectRatio: height / width,
    initialSize: 8 * 2,
    increment: 0,
    multiply: 1.5,
  });

  worker.onmessage = function (e) {
    viewport = e.data.viewport;
    wave = e.data.wave;
  };

  context.clearRect(0, 0, width, height);

  function main() {
    requestAnimationFrame(main);
    // tool.clearPlotCache();
    if (viewport && wave) {
      tool.plotWFCOutput(canvas, viewport, wave);
    }
  }
  main();
}
