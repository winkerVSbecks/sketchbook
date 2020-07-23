const canvasSketch = require('canvas-sketch');
const { renderPaths } = require('canvas-sketch-util/penplot');
const { clipPolylinesToBox } = require('canvas-sketch-util/geometry');
const { linspace, lerpArray, lerp } = require('canvas-sketch-util/math');
const Random = require('canvas-sketch-util/random');
const RBush = require('rbush');
const knn = require('rbush-knn');
const clrs = require('./clrs').clrs();

// You can force a specific seed by replacing this with a string value
const defaultSeed = '';

// Set a random seed so we can reproduce this print later
Random.setSeed(defaultSeed || Random.getRandomSeed());

// Print to console so we can see which seed is being used and copy it if desired
console.log('Random Seed:', Random.getSeed());

const settings = {
  suffix: Random.getSeed(),
  scaleToView: true,
  animate: true,
  dimensions: [800 * 2, 600 * 2],
  // duration: 12,
};

const config = {};

const sketch = (props) => {
  const { width, height } = props;
  const foreground = clrs.ink();
  const background = clrs.bg;

  const tree = new XYRBush();
  const scale = 12;
  const forceMultiplier = 0.5;
  config.repulsionForce = 0.5 * forceMultiplier;
  config.attractionForce = 0.5 * forceMultiplier;
  config.alignmentForce = 0.35 * forceMultiplier;
  config.brownianMotionRange = (width * 0.005) / scale;
  config.leastMinDistance = (width * 0.03) / scale; // the closest comfortable distance between two vertices
  config.repulsionRadius = (width * 0.125) / scale; // the distance beyond which disconnected vertices will ignore each other
  config.maxDistance = (width * 0.1) / scale; // maximum acceptable distance between two connected nodes (otherwise split)

  let path;
  const margin = 0.25;
  const bounds = [
    width * margin,
    width * (1 - margin),
    height * margin,
    height * (1 - margin),
  ];

  return {
    begin() {
      path = createLine(6, width / 2, height / 2, width / 12);
      tree.clear();
      tree.load(path);
    },
    render({ context }) {
      iterate(tree, path, bounds);

      context.fillStyle = background;
      context.fillRect(0, 0, width, height);

      context.fillStyle = foreground;
      context.lineWidth = 12;
      context.lineJoin = 'round';
      context.beginPath();

      path.forEach(([x, y], idx) => {
        if (idx === 0) {
          context.moveTo(x, y);
        } else {
          context.lineTo(x, y);
        }
      });
      context.closePath();
      context.fill();

      context.strokeStyle = foreground;
      context.beginPath();
      context.moveTo(bounds[0], bounds[2]);
      context.lineTo(bounds[1], bounds[2]);
      context.lineTo(bounds[1], bounds[3]);
      context.lineTo(bounds[0], bounds[3]);
      context.closePath();
      context.stroke();

      // context.fillStyle = background;
      // context.strokeStyle = foreground;
      // path.forEach(([x, y]) => {
      //   context.beginPath();
      //   context.ellipse(x, y, 1, 1, 0, 0, 2 * Math.PI);
      //   context.fill();
      //   context.stroke();
      // });
    },
  };
};

canvasSketch(sketch, settings);

/**
 *
 * https://adrianton3.github.io/blog/art/differential-growth/differential-growth
 * https://medium.com/@jason.webb/2d-differential-growth-in-js-1843fd51b0ce
 * https://inconvergent.net/2016/shepherding-random-growth
 *
 * 1. Each node wants to be close to it’s connected neighbour nodes and
 *    will experience a mutual attraction force to them.
 *
 * 2. Each node wants to maintain a minimum distance from all nearby nodes,
 *    connected or not, and will experience a mutual repulsion force from them.
 *
 * 3. Each node wants to rest exactly halfway between it’s connected neighbour
 *    nodes on as straight of a line as possible and will experience an alignment
 *    force towards the midpoint.
 *
 *
 * 1. Nodes and Edges: nodes are connected to a certain number of neighbouring nodes through edges.
 *
 * 2. Attraction: connected nodes will try to maintain a reasonably close proximity to each other.
 *    In the figure below attraction happens between connected nodes in the loop.
 *
 * 3. Rejection: nodes will try to avoid being too close to surrounding nodes (within a certain distance).
 *    Rejection forces are indicated by cyan lines in the figure below.
 *
 * 4. Splits: If an edges gets too long, a new node will be injected at the middle of the edge.
 *
 * 5. Growth: in addition to the splits, new nodes are injected according to some growth scheme.
 *
 */
class XYRBush extends RBush {
  toBBox([x, y]) {
    return { minX: x, minY: y, maxX: x, maxY: y };
  }
  compareMinX(a, b) {
    return a.x - b.x;
  }
  compareMinY(a, b) {
    return a.y - b.y;
  }
}

function createLine(count, x, y, r) {
  return linspace(count, { endpoint: true }).map((idx) => [
    x + r * Math.cos(Math.PI * 2 * idx),
    y + r * Math.sin(Math.PI * 2 * idx),
  ]);
}

function iterate(tree, nodes, bounds) {
  tree.clear();
  // Generate tree from path nodes
  tree.load(nodes);

  for (let [idx, node] of nodes.entries()) {
    applyBrownianMotion(idx, node);
    applyRepulsion(idx, nodes, tree);
    applyAttraction(idx, nodes);
    applyAlignment(idx, nodes);
    keepInBounds(idx, nodes, bounds);
  }

  splitEdges(nodes);
  pruneNodes(nodes);
}

function applyBrownianMotion(node) {
  node[0] += Random.range(
    -config.brownianMotionRange / 2,
    config.brownianMotionRange / 2
  );
  node[1] += Random.range(
    -config.brownianMotionRange / 2,
    config.brownianMotionRange / 2
  );
}

function applyRepulsion(idx, nodes, tree) {
  const node = nodes[idx];
  // Perform knn search to find all neighbours within certain radius
  const neighbours = knn(
    tree,
    node[0],
    node[1],
    undefined,
    undefined,
    config.repulsionRadius
  );

  // Move this node away from all nearby neighbours
  neighbours.forEach((neighbour) => {
    const d = distance(neighbour, node);
    nodes[idx] = lerpArray(
      node,
      neighbour,
      -config.repulsionForce
      // (-config.repulsionForce * d) / config.repulsionRadius
    );
  });
}

/**
 *
 *                *
 *                ^
 *                |
 *                |
 *   * ⟍         |             ⟋ *
 *    B  ⟍       |          ⟋  C
 *         ⟍     |       ⟋
 *           ⟍   |    ⟋
 *             ⟍ | ⟋
 *                *
 *                A
 */
function applyAttraction(index, nodes) {
  const node = nodes[index];
  const connectedNodes = getConnectedNodes(index, nodes);

  Object.values(connectedNodes).forEach((neighbour) => {
    const d = distance(node, neighbour);

    if (d > config.leastMinDistance) {
      nodes[index] = lerpArray(node, neighbour, config.attractionForce);
    }
  });
}

/**
 *
 *   * ⟍---------*-------------⟋ *
 *    B  ⟍       ^          ⟋  C
 *         ⟍     |       ⟋
 *           ⟍   |    ⟋
 *             ⟍ | ⟋
 *                *
 *                A
 */
function applyAlignment(index, nodes) {
  const node = nodes[index];
  const { previousNode, nextNode } = getConnectedNodes(index, nodes);

  if (!previousNode || !nextNode) {
    return;
  }

  // Find the midpoint between the neighbours of this node
  const midpoint = getMidpoint(previousNode, nextNode);

  // Move this point towards this midpoint
  nodes[index] = lerpArray(node, midpoint, config.alignmentForce);
}

function keepInBounds(idx, nodes, bounds) {
  const [x, y] = nodes[idx];
  let nx = x;
  let ny = y;

  if (x < bounds[0]) {
    nx = bounds[0];
  } else if (x > bounds[1]) {
    nx = bounds[1];
  }

  if (y < bounds[2]) {
    ny = bounds[2];
  } else if (y > bounds[3]) {
    ny = bounds[3];
  }

  nodes[idx] = [nx, ny];
}

function splitEdges(nodes) {
  for (let [idx, node] of nodes.entries()) {
    const { previousNode } = getConnectedNodes(idx, nodes);

    if (previousNode === undefined) {
      break;
    }

    if (distance(node, previousNode) >= config.maxDistance) {
      const midpoint = getMidpoint(node, previousNode);

      // Inject the new midpoint into the global list
      if (idx == 0) {
        nodes.splice(nodes.length, 0, midpoint);
      } else {
        nodes.splice(idx, 0, midpoint);
      }
    }
  }
}

function pruneNodes(nodes) {
  for (let [index, node] of nodes.entries()) {
    const { previousNode } = getConnectedNodes(index, nodes);

    if (
      previousNode !== undefined &&
      distance(node, previousNode) < config.leastMinDistance
    ) {
      if (index == 0) {
        nodes.splice(nodes.length - 1, 1);
      } else {
        nodes.splice(index - 1, 1);
      }
    }
  }
}

function getConnectedNodes(index, nodes, isClosed = true) {
  let previousNode, nextNode;

  if (index == 0 && isClosed) {
    previousNode = nodes[nodes.length - 1];
  } else if (index >= 1) {
    previousNode = nodes[index - 1];
  }

  if (index == nodes.length - 1 && isClosed) {
    nextNode = nodes[0];
  } else if (index <= nodes.length - 1) {
    nextNode = nodes[index + 1];
  }

  return { previousNode, nextNode };
}

function distance(v1, v2) {
  const dx = v2[0] - v1[0];
  const dy = v2[1] - v1[1];
  return Math.hypot(dx, dy);
}

function getMidpoint(a, b) {
  return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
}
