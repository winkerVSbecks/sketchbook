const canvasSketch = require('canvas-sketch');
const Random = require('canvas-sketch-util/random');
const { mapRange, linspace } = require('canvas-sketch-util/math');
const { Vector } = require('p5');
const { drawShape } = require('./geometry');
const { matrixMultiply } = require('./matrix');

const settings = {
  animate: true,
  duration: 8,
  dimensions: [1080, 1080],
  scaleToView: true,
};

const CONFIG = {
  neighbourDist: 50,
  desiredSeparation: 25,
  sphereSize: 30,
  scale: 1,
  separation: 4.0, //2,
  alignment: 2.0, //1.0,
  bond: 2.0, //1.0,
  velocity: 1,
};

const BG = '#000023';
const colors = [
  '#EB4B67',
  '#F5C2CB',
  '#ED6D52',
  '#1B0A59',
  '#1A0D73',
  '#100F40',
];

canvasSketch(() => {
  console.clear();

  let flock = [];
  let innerFlock = [];

  let angle = (3 * Math.PI) / 4;

  return {
    begin() {
      flock = linspace(128 * 10).map(() =>
        boidOf(
          Random.onSphere(CONFIG.sphereSize),
          colors,
          CONFIG.velocity * 0.5,
          CONFIG.sphereSize
        )
      );

      // innerFlock = linspace(128).map(() =>
      //   boidOf(
      //     Random.onSphere(CONFIG.sphereSize * 0.75),
      //     innerColors,
      //     CONFIG.velocity * 0.25,
      //     CONFIG.sphereSize * 0.75
      //   )
      // );
    },
    render({ context, width, height, playhead }) {
      // angle = mapRange(playhead, 0, 1, 0, Math.PI * 2);

      // prettier-ignore
      const rotationZ = [
        [Math.cos(0), -Math.sin(0), 0],
        [Math.sin(0),  Math.cos(0), 0],
        [0, 0, 1],
      ];

      // prettier-ignore
      const rotationX = [
        [1, 0, 0],
        [0, Math.cos(0), -Math.sin(0)],
        [0, Math.sin(0),  Math.cos(0)],
      ];

      // prettier-ignore
      const rotationY = [
        [ Math.cos(angle), 0, Math.sin(angle)],
        [ 0, 1, 0],
        [-Math.sin(angle), 0, Math.cos(angle)],
      ];

      context.clearRect(0, 0, width, height);
      context.fillStyle = BG;
      context.fillRect(0, 0, width, height);

      if (playhead > 0.9) {
        context.globalAlpha = mapRange(playhead, 0.9, 1, 1, 0);
      }

      context.translate(width / 2, height / 2);

      const tick = (boid) => {
        move(flock, boid);
        update(boid);
        render(boid, context, width, height, [rotationX, rotationY, rotationZ]);

        if (playhead > 0.8) {
          boid.trailLength = Math.max(
            Math.round(mapRange(playhead, 0.8, 0.9, 20, 1)),
            0
          );
          boid.trail.shift();
        }
      };

      flock.forEach(tick);
      // innerFlock.forEach(tick);
    },
  };
}, settings);

/**
 * Boid
 * Based on Daniel Shiffman's code
 *  https://p5js.org/examples/simulate-flocking.html
 * and demonstration of Craig Reynolds' "Flocking" behavior
 *  http://www.red3d.com/cwr/boids/ Rules
 */
function boidOf([x, y, z], colors, velocity, sphereSize) {
  return {
    acceleration: new Vector(0, 0, 0),
    velocity: new Vector(
      Random.range(0, velocity),
      Random.range(0, velocity),
      Random.range(0, velocity)
    ),
    position: new Vector(x, y, z),
    r: 2, //Random.rangeFloor(2, 6) * CONFIG.scale,
    maxSpeed: 3 * CONFIG.scale,
    maxForce: 0.05 * CONFIG.scale,
    trail: [],
    trailLength: Random.range(20, 45),
    color: Random.pick(colors),
    sphereSize: sphereSize,
  };
}

/**
 * Compute acceleration based on the three flocking rules
 */
function move(boids, boid) {
  const separation = separate(boids, boid);
  const alignment = align(boids, boid);
  const bond = cohesion(boids, boid);

  // Weight these forces
  separation.mult(CONFIG.separation);
  alignment.mult(CONFIG.alignment);
  bond.mult(CONFIG.bond);

  // Add the force vectors to acceleration
  boid.acceleration.add(separation);
  boid.acceleration.add(alignment);
  boid.acceleration.add(bond);
}

/**
 * Update the location of the boid
 */
function update(boid) {
  boid.velocity.add(boid.acceleration);
  // Limit speed
  boid.velocity.limit(boid.maxSpeed);
  boid.position.add(boid.velocity);

  // Trail
  boid.trail.push([boid.position.x, boid.position.y, boid.position.z]);

  if (boid.trail.length > boid.trailLength) {
    boid.trail.shift();
  }

  // Reset acceleration to 0 each cycle
  boid.acceleration.mult(0);
}

/**
 * Render the boid
 * A triangle rotated in the direction of the velocity
 */
function render(
  boid,
  context,
  width,
  height,
  [rotationX, rotationY, rotationZ]
) {
  const theta = boid.velocity.heading() + Math.PI / 2;

  context.fillStyle = boid.color; //'#fff';
  context.strokeStyle = boid.color; //'#fff';
  context.lineWidth = boid.r;
  context.lineCap = 'round';
  context.lineJoin = 'round';

  if (boid.trail.length > 1) {
    const projectedTrail = projected(boid.trail, boid.sphereSize, [
      rotationX,
      rotationY,
      rotationZ,
    ]);

    drawShape(context, projectedTrail, false);
    context.stroke();
  }
}

function projected(path, sphereSize, [rotationX, rotationY, rotationZ]) {
  return path.map((vertex) => {
    const mag = Math.hypot(...vertex);
    const v = vertex.map((v) => [(v * sphereSize) / mag]);

    let rotated = matrixMultiply(rotationX, v);
    rotated = matrixMultiply(rotationY, rotated);
    rotated = matrixMultiply(rotationZ, rotated);
    const scaled = matrixMultiply(scale(10), rotated);

    // prettier-ignore
    const projection2d = [
        [1, 0,   0],
        [0,   1, 0],
      ];
    const projected2d = matrixMultiply(projection2d, scaled);

    return projected2d;
  });
}

/**
 * Separation
 * Steer to avoid crowding local boids
 */
function separate(boids, boid) {
  const [count, direction] = boids.reduce(
    ([count, direction], otherBoid) => {
      const d = boid.position.dist(otherBoid.position);
      if (d > 0 && d < CONFIG.desiredSeparation) {
        // Calculate vector pointing away from neighbour
        const diff = Vector.sub(boid.position, otherBoid.position)
          .normalize()
          .div(d); // Weight by distance
        return [count + 1, direction.add(diff)];
      }
      return [count, direction];
    },
    [0, new Vector(0, 0, 0)]
  );

  return count > 0
    ? direction
        .div(count) // average
        .normalize()
        .mult(boid.maxSpeed)
        .sub(boid.velocity)
        .limit(boid.maxForce)
    : direction;
}

/**
 * Alignment
 * Steer towards the average heading of local boids
 */
function align(boids, boid) {
  const [count, direction] = boids.reduce(
    ([count, direction], otherBoid) => {
      const d = Vector.dist(boid.position, otherBoid.position);
      return d > 0 && d < CONFIG.neighbourDist
        ? [count + 1, direction.add(otherBoid.velocity)]
        : [count, direction];
    },
    [0, new Vector(0, 0, 0)]
  );

  return count > 0
    ? direction
        .div(count)
        .normalize()
        .mult(boid.maxSpeed)
        .sub(boid.velocity)
        .limit(boid.maxForce)
    : direction;
}

/**
 * Cohesion
 * Steer to move toward the average position of local boids
 */
function cohesion(boids, boid) {
  const [count, direction] = boids.reduce(
    ([count, direction], otherBoid) => {
      const d = Vector.dist(boid.position, otherBoid.position);
      return d > 0 && d < CONFIG.neighbourDist
        ? [count + 1, direction.add(otherBoid.position)]
        : [count, direction];
    },
    [0, new Vector(0, 0, 0)]
  );

  if (count > 0) {
    direction.div(count);
    return seek(direction, boid);
  } else {
    return direction;
  }
}

/**
 * Calculate and apply a steering force towards a target
 * Steer = Desired - Velocity
 */
function seek(target, boid) {
  // A vector pointing from the boid location to the target
  const desired = Vector.sub(target, boid.position);
  // Normalize and scale to maximum speed
  desired.normalize();
  desired.mult(boid.maxSpeed);
  // Steer = Desired - Velocity
  const steer = Vector.sub(desired, boid.velocity);
  // Limit to maximum steering force
  steer.limit(boid.maxForce);
  return steer;
}

function scale(v) {
  // prettier-ignore
  return [
    [v, 0, 0],
    [0, v, 0],
    [0, 0, v],
  ];
}
