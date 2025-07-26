export interface PhysicsPoint {
  x: number;
  y: number;
  vx: number; // velocity x
  vy: number; // velocity y
  ax: number; // acceleration x
  ay: number; // acceleration y
  mass: number;
  fixed: boolean; // if true, point doesn't move
}

export interface PhysicsSpring {
  point1: number; // index of first point
  point2: number; // index of second point
  restLength: number;
  stiffness: number;
  damping: number;
}

export interface PhysicsConstraint {
  type: 'distance' | 'angle';
  points: number[];
  targetValue: number;
  strength: number;
}

export class PhysicsSimulation {
  private points: PhysicsPoint[] = [];
  private springs: PhysicsSpring[] = [];
  private constraints: PhysicsConstraint[] = [];
  private wind: { x: number; y: number } = { x: 0, y: 0 };
  private gravity: number = 0;
  private canvasWidth: number = 800;
  private canvasHeight: number = 600;

  setCanvasSize(width: number, height: number) {
    this.canvasWidth = width;
    this.canvasHeight = height;
  }

  setGravity(gravity: number) {
    this.gravity = gravity;
  }

  setWind(windX: number, windY: number) {
    this.wind.x = windX;
    this.wind.y = windY;
  }

  addPoint(x: number, y: number, mass: number = 1, fixed: boolean = false): number {
    const index = this.points.length;
    this.points.push({
      x, y,
      vx: 0, vy: 0,
      ax: 0, ay: 0,
      mass,
      fixed
    });
    return index;
  }

  addSpring(point1: number, point2: number, stiffness: number = 0.1, damping: number = 0.99): void {
    if (point1 >= this.points.length || point2 >= this.points.length) return;
    
    const p1 = this.points[point1];
    const p2 = this.points[point2];
    const restLength = Math.sqrt(
      Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2)
    );

    this.springs.push({
      point1,
      point2,
      restLength,
      stiffness,
      damping
    });
  }

  addDistanceConstraint(point1: number, point2: number, distance: number, strength: number = 0.5): void {
    this.constraints.push({
      type: 'distance',
      points: [point1, point2],
      targetValue: distance,
      strength
    });
  }

  createBranchFromPoints(points: { x: number; y: number }[], mass: number = 1): number[] {
    const indices: number[] = [];
    
    // Add all points
    for (let i = 0; i < points.length; i++) {
      const fixed = i === 0; // Fix the first point (root)
      const index = this.addPoint(points[i].x, points[i].y, mass, fixed);
      indices.push(index);
    }

    // Connect adjacent points with springs
    for (let i = 0; i < indices.length - 1; i++) {
      this.addSpring(indices[i], indices[i + 1], 0.2, 0.98);
    }

    return indices;
  }

  update(deltaTime: number = 1): void {
    // Reset accelerations
    for (const point of this.points) {
      point.ax = 0;
      point.ay = 0;
    }

    // Apply gravity
    if (this.gravity > 0) {
      for (const point of this.points) {
        if (!point.fixed) {
          point.ay += this.gravity * point.mass;
        }
      }
    }

    // Apply wind forces
    if (this.wind.x !== 0 || this.wind.y !== 0) {
      for (const point of this.points) {
        if (!point.fixed) {
          // Wind force is proportional to velocity difference
          const relativeVx = this.wind.x - point.vx;
          const relativeVy = this.wind.y - point.vy;
          const windForce = 0.1;
          
          point.ax += relativeVx * windForce;
          point.ay += relativeVy * windForce;
        }
      }
    }

    // Apply spring forces
    for (const spring of this.springs) {
      const p1 = this.points[spring.point1];
      const p2 = this.points[spring.point2];

      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > 0) {
        const force = (distance - spring.restLength) * spring.stiffness;
        const fx = (dx / distance) * force;
        const fy = (dy / distance) * force;

        if (!p1.fixed) {
          p1.ax += fx / p1.mass;
          p1.ay += fy / p1.mass;
        }

        if (!p2.fixed) {
          p2.ax -= fx / p2.mass;
          p2.ay -= fy / p2.mass;
        }

        // Apply damping
        const dvx = p2.vx - p1.vx;
        const dvy = p2.vy - p1.vy;
        const dampingForce = 0.05;

        if (!p1.fixed) {
          p1.ax += dvx * dampingForce;
          p1.ay += dvy * dampingForce;
        }

        if (!p2.fixed) {
          p2.ax -= dvx * dampingForce;
          p2.ay -= dvy * dampingForce;
        }
      }
    }

    // Apply collision detection between points
    for (let i = 0; i < this.points.length; i++) {
      for (let j = i + 1; j < this.points.length; j++) {
        const p1 = this.points[i];
        const p2 = this.points[j];

        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const minDistance = 10; // Minimum distance between points

        if (distance < minDistance && distance > 0) {
          const overlap = minDistance - distance;
          const separation = overlap / 2;
          const fx = (dx / distance) * separation;
          const fy = (dy / distance) * separation;

          if (!p1.fixed) {
            p1.x -= fx;
            p1.y -= fy;
          }

          if (!p2.fixed) {
            p2.x += fx;
            p2.y += fy;
          }
        }
      }
    }

    // Apply constraints
    for (const constraint of this.constraints) {
      if (constraint.type === 'distance' && constraint.points.length === 2) {
        const p1 = this.points[constraint.points[0]];
        const p2 = this.points[constraint.points[1]];

        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 0) {
          const difference = constraint.targetValue - distance;
          const correction = difference * constraint.strength;
          const correctionX = (dx / distance) * correction * 0.5;
          const correctionY = (dy / distance) * correction * 0.5;

          if (!p1.fixed) {
            p1.x -= correctionX;
            p1.y -= correctionY;
          }

          if (!p2.fixed) {
            p2.x += correctionX;
            p2.y += correctionY;
          }
        }
      }
    }

    // Integrate physics (Verlet integration)
    for (const point of this.points) {
      if (!point.fixed) {
        // Update velocity
        point.vx += point.ax * deltaTime;
        point.vy += point.ay * deltaTime;

        // Apply air resistance
        const airResistance = 0.999;
        point.vx *= airResistance;
        point.vy *= airResistance;

        // Update position
        point.x += point.vx * deltaTime;
        point.y += point.vy * deltaTime;

        // Boundary constraints
        const margin = 5;
        if (point.x < margin) {
          point.x = margin;
          point.vx *= -0.3; // Bounce with energy loss
        }
        if (point.x > this.canvasWidth - margin) {
          point.x = this.canvasWidth - margin;
          point.vx *= -0.3;
        }
        if (point.y < margin) {
          point.y = margin;
          point.vy *= -0.3;
        }
        if (point.y > this.canvasHeight - margin) {
          point.y = this.canvasHeight - margin;
          point.vy *= -0.3;
        }
      }
    }
  }

  getPoints(): PhysicsPoint[] {
    return this.points;
  }

  getSprings(): PhysicsSpring[] {
    return this.springs;
  }

  clear(): void {
    this.points = [];
    this.springs = [];
    this.constraints = [];
  }

  removePoint(index: number): void {
    if (index >= 0 && index < this.points.length) {
      // Remove springs connected to this point
      this.springs = this.springs.filter(spring => 
        spring.point1 !== index && spring.point2 !== index
      );

      // Remove constraints involving this point
      this.constraints = this.constraints.filter(constraint =>
        !constraint.points.includes(index)
      );

      // Remove the point
      this.points.splice(index, 1);

      // Update indices in springs and constraints
      for (const spring of this.springs) {
        if (spring.point1 > index) spring.point1--;
        if (spring.point2 > index) spring.point2--;
      }

      for (const constraint of this.constraints) {
        for (let i = 0; i < constraint.points.length; i++) {
          if (constraint.points[i] > index) {
            constraint.points[i]--;
          }
        }
      }
    }
  }

  applyForceToPoint(index: number, fx: number, fy: number): void {
    if (index >= 0 && index < this.points.length && !this.points[index].fixed) {
      this.points[index].ax += fx / this.points[index].mass;
      this.points[index].ay += fy / this.points[index].mass;
    }
  }

  getPointsNear(x: number, y: number, radius: number): number[] {
    const nearbyPoints: number[] = [];
    
    for (let i = 0; i < this.points.length; i++) {
      const point = this.points[i];
      const distance = Math.sqrt(
        Math.pow(point.x - x, 2) + Math.pow(point.y - y, 2)
      );
      
      if (distance <= radius) {
        nearbyPoints.push(i);
      }
    }
    
    return nearbyPoints;
  }
}

export const physicsSimulation = new PhysicsSimulation();
