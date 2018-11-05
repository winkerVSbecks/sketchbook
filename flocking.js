const canvasSketch = require('canvas-sketch');
const Random = require('canvas-sketch-util/random');
const { mapRange, linspace } = require('canvas-sketch-util/math');
const { Vector } = require('p5');
const { drawShape } = require('./geometry');
const { warm } = require('./clrs');

const settings = {
  animate: true,
  duration: 12,
  dimensions: [800, 800],
  scaleToView: true,
};

const CONFIG = {
  neighbourDist: 50,
  desiredSeparation: 25,
};

canvasSketch(() => {
  console.clear();

  let flock = [];

  return {
    begin({ width, height }) {
      flock = linspace(128).map(() => boidOf(width / 2, height / 2));
    },
    render({ context, width, height, playhead }) {
      context.clearRect(0, 0, width, height);
      context.fillStyle = '#f1f8fd';
      context.fillRect(0, 0, width, height);
      const handleScreenBoundaries = handleBoundaries(width, height);

      if (playhead > 0.9) {
        context.globalAlpha = mapRange(playhead, 0.9, 1, 1, 0);
      }

      flock.forEach(boid => {
        move(flock, boid);
        update(boid);
        handleScreenBoundaries(boid);
        render(boid, context, width, height);

        if (playhead > 0.8) {
          boid.trailLength = Math.max(
            Math.round(mapRange(playhead, 0.8, 0.9, 20, 1)),
            0,
          );
          boid.trail.shift();
        }
      });
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
function boidOf(x, y) {
  return {
    acceleration: new Vector(0, 0),
    velocity: new Vector(Random.range(-1, 1), Random.range(-1, 1)),
    position: new Vector(x, y),
    r: Random.range(2, 4),
    maxSpeed: 3,
    maxForce: 0.05,
    trail: [],
    trailLength: Random.range(25, 60),
    color: Random.pick(warm),
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
  separation.mult(2);
  alignment.mult(1.0);
  bond.mult(1.0);

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
  boid.trail.push([boid.position.x, boid.position.y]);

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
function render(boid, context, width, height, color) {
  const theta = boid.velocity.heading() + Math.PI / 2;

  context.fillStyle = boid.color; //'#fff';
  context.strokeStyle = boid.color; //'#fff';
  context.lineWidth = boid.r;

  const chunks = splitPath(boid, width, height);

  chunks.forEach(chunk => {
    if (chunk.length > 1) {
      context.beginPath();
      drawShape(context, chunk, false);
      context.stroke();
    }
  });

  context.beginPath();
  context.arc(boid.position.x, boid.position.y, boid.r * 1.25, 0, 2 * Math.PI);
  context.fill();
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
    [0, new Vector(0, 0)],
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
    [0, new Vector(0, 0)],
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
    [0, new Vector(0, 0)],
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

/**
 * Wrap the boid around canvas boundaries
 */
function handleBoundaries(width, height) {
  return boid => {
    // Left
    if (boid.position.x < -boid.r) {
      boid.position.x = width + boid.r;
    }
    // Top
    if (boid.position.y < -boid.r) {
      boid.position.y = height + boid.r;
    }
    // Right
    if (boid.position.x > width + boid.r) {
      boid.position.x = -boid.r;
    }
    // Bottom
    if (boid.position.y > height + boid.r) {
      boid.position.y = -boid.r;
    }
  };
}

/**
 * Split path into chunks that are on or off canvas
 */
function splitPath(boid, width, height) {
  let prevOffCanvas = false;

  return boid.trail.reduce(
    (acc, pt) => {
      const offCanvas =
        pt[0] < -boid.r ||
        pt[0] > width + boid.r ||
        pt[1] < -boid.r ||
        pt[1] > height + boid.r;

      if (offCanvas !== prevOffCanvas) {
        acc.push([]);
      }

      acc[acc.length - 1].push(pt);
      prevOffCanvas = offCanvas;
      return acc;
    },
    [[]],
  );
}
