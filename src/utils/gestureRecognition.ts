export interface Point {
  x: number;
  y: number;
}

export interface GestureResult {
  type: 'circle' | 'line' | 'triangle' | 'square' | 'spiral' | 'zigzag' | 'wave' | 'star' | 'unknown';
  confidence: number;
  center?: Point;
  radius?: number;
  boundingBox?: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  };
  properties?: {
    length?: number;
    angle?: number;
    turns?: number;
    corners?: number;
  };
}

export class GestureRecognizer {
  private minPoints = 5;
  private circleThreshold = 0.75;
  private lineThreshold = 0.85;
  private angleThreshold = 15; // degrees

  recognizeGesture(points: Point[]): GestureResult {
    if (points.length < this.minPoints) {
      return { type: 'unknown', confidence: 0 };
    }

    const simplified = this.simplifyPoints(points);
    const boundingBox = this.getBoundingBox(simplified);
    
    // Try different shape recognitions in order of specificity
    const lineResult = this.detectLine(simplified);
    if (lineResult.confidence > this.lineThreshold) {
      return lineResult;
    }

    const squareResult = this.detectSquare(simplified, boundingBox);
    if (squareResult.confidence > 0.7) {
      return squareResult;
    }

    const triangleResult = this.detectTriangle(simplified);
    if (triangleResult.confidence > 0.7) {
      return triangleResult;
    }

    const circleResult = this.detectCircle(simplified, boundingBox);
    if (circleResult.confidence > this.circleThreshold) {
      return circleResult;
    }

    const spiralResult = this.detectSpiral(simplified);
    if (spiralResult.confidence > 0.6) {
      return spiralResult;
    }

    const waveResult = this.detectWave(simplified);
    if (waveResult.confidence > 0.6) {
      return waveResult;
    }

    const starResult = this.detectStar(simplified);
    if (starResult.confidence > 0.6) {
      return starResult;
    }

    return { type: 'unknown', confidence: 0, boundingBox };
  }

  private simplifyPoints(points: Point[], tolerance = 5): Point[] {
    if (points.length <= 2) return points;
    
    const simplified: Point[] = [points[0]];
    
    for (let i = 1; i < points.length - 1; i++) {
      const dist = this.distance(points[i], simplified[simplified.length - 1]);
      if (dist > tolerance) {
        simplified.push(points[i]);
      }
    }
    
    simplified.push(points[points.length - 1]);
    return simplified;
  }

  private getBoundingBox(points: Point[]) {
    const xs = points.map(p => p.x);
    const ys = points.map(p => p.y);
    return {
      minX: Math.min(...xs),
      minY: Math.min(...ys),
      maxX: Math.max(...xs),
      maxY: Math.max(...ys)
    };
  }

  private detectCircle(points: Point[], boundingBox: any): GestureResult {
    const centerX = (boundingBox.minX + boundingBox.maxX) / 2;
    const centerY = (boundingBox.minY + boundingBox.maxY) / 2;
    const center = { x: centerX, y: centerY };
    
    const width = boundingBox.maxX - boundingBox.minX;
    const height = boundingBox.maxY - boundingBox.minY;
    
    // Check if bounding box is roughly square (circles should have square bounding boxes)
    const aspectRatio = Math.min(width, height) / Math.max(width, height);
    if (aspectRatio < 0.8) {
      return { type: 'circle', confidence: 0 };
    }
    
    const expectedRadius = Math.min(width, height) / 2;

    let totalDeviation = 0;
    let validPoints = 0;
    
    for (const point of points) {
      const actualRadius = this.distance(point, center);
      const deviation = Math.abs(actualRadius - expectedRadius);
      
      // Only consider points that are reasonably close to expected radius
      if (deviation < expectedRadius * 0.3) {
        totalDeviation += deviation;
        validPoints++;
      }
    }

    if (validPoints < points.length * 0.7) {
      return { type: 'circle', confidence: 0 };
    }

    const avgDeviation = totalDeviation / validPoints;
    const deviationScore = Math.max(0, 1 - (avgDeviation / (expectedRadius * 0.2)));
    const aspectScore = aspectRatio;
    const coverageScore = validPoints / points.length;
    
    // Check that we don't have obvious corners (which would indicate a square)
    const corners = this.findCorners(points);
    const cornerPenalty = corners.length > 2 ? (corners.length - 2) * 0.1 : 0;
    
    const confidence = (deviationScore * 0.5 + aspectScore * 0.3 + coverageScore * 0.2) - cornerPenalty;

    return {
      type: 'circle',
      confidence: Math.max(0, Math.min(confidence, 0.95)),
      center,
      radius: expectedRadius,
      boundingBox
    };
  }

  private detectLine(points: Point[]): GestureResult {
    if (points.length < 2) return { type: 'line', confidence: 0 };

    const start = points[0];
    const end = points[points.length - 1];
    const lineLength = this.distance(start, end);
    
    // Calculate how well points fit on the line
    let totalDeviation = 0;
    for (const point of points) {
      const deviation = this.pointToLineDistance(point, start, end);
      totalDeviation += deviation;
    }

    const avgDeviation = totalDeviation / points.length;
    const confidence = Math.max(0, 1 - (avgDeviation / 20)); // 20px tolerance

    const angle = Math.atan2(end.y - start.y, end.x - start.x) * 180 / Math.PI;

    return {
      type: 'line',
      confidence,
      boundingBox: this.getBoundingBox(points),
      properties: {
        length: lineLength,
        angle
      }
    };
  }

  private detectTriangle(points: Point[]): GestureResult {
    const corners = this.findCorners(points);
    
    if (corners.length < 3) {
      return { type: 'triangle', confidence: 0 };
    }

    // Take the three most prominent corners
    const topCorners = corners.slice(0, 3);
    
    // Check if they form a reasonable triangle
    const angles = this.getTriangleAngles(topCorners);
    const angleSum = angles.reduce((sum, angle) => sum + angle, 0);
    
    // Triangle angles should sum to ~180 degrees
    const angleConfidence = 1 - Math.abs(angleSum - 180) / 180;
    
    return {
      type: 'triangle',
      confidence: Math.max(0, angleConfidence * 0.8), // Reduce confidence slightly
      boundingBox: this.getBoundingBox(points),
      properties: {
        corners: 3
      }
    };
  }

  private detectSquare(points: Point[], boundingBox: any): GestureResult {
    const width = boundingBox.maxX - boundingBox.minX;
    const height = boundingBox.maxY - boundingBox.minY;
    
    // Check if it's roughly square (aspect ratio close to 1)
    const aspectRatio = Math.min(width, height) / Math.max(width, height);
    if (aspectRatio < 0.7) {
      return { type: 'square', confidence: 0 };
    }
    
    const corners = this.findCorners(points);
    
    // A square should have exactly 4 corners
    if (corners.length < 3 || corners.length > 6) {
      return { type: 'square', confidence: 0 };
    }
    
    // Check if corners form roughly right angles
    let rightAngles = 0;
    if (corners.length >= 4) {
      for (let i = 0; i < Math.min(4, corners.length); i++) {
        const prev = corners[i];
        const curr = corners[(i + 1) % corners.length];
        const next = corners[(i + 2) % corners.length];
        
        const angle = this.getAngle(prev, curr, next);
        // Check if angle is close to 90 degrees (within 25 degrees tolerance)
        if (Math.abs(angle - 90) < 25) {
          rightAngles++;
        }
      }
    }
    
    // Check if points are evenly distributed around the perimeter (not clustered like a circle)
    const perimeterDistribution = this.checkPerimeterDistribution(points, boundingBox);
    
    const cornerScore = corners.length >= 4 ? Math.min(corners.length / 4, 1) : corners.length / 4;
    const angleScore = rightAngles / 4;
    const aspectScore = aspectRatio;
    const distributionScore = perimeterDistribution;
    
    const confidence = (cornerScore * 0.4 + angleScore * 0.3 + aspectScore * 0.2 + distributionScore * 0.1);

    return {
      type: 'square',
      confidence: Math.min(confidence, 0.95), // Cap at 95% to avoid overconfidence
      boundingBox,
      properties: {
        corners: corners.length
      }
    };
  }

  private checkPerimeterDistribution(points: Point[], boundingBox: any): number {
    const width = boundingBox.maxX - boundingBox.minX;
    const height = boundingBox.maxY - boundingBox.minY;
    
    // Count points on each side of the rectangle
    const tolerance = Math.min(width, height) * 0.1;
    let topPoints = 0, bottomPoints = 0, leftPoints = 0, rightPoints = 0;
    
    for (const point of points) {
      if (Math.abs(point.y - boundingBox.minY) < tolerance) topPoints++;
      if (Math.abs(point.y - boundingBox.maxY) < tolerance) bottomPoints++;
      if (Math.abs(point.x - boundingBox.minX) < tolerance) leftPoints++;
      if (Math.abs(point.x - boundingBox.maxX) < tolerance) rightPoints++;
    }
    
    const totalSidePoints = topPoints + bottomPoints + leftPoints + rightPoints;
    const expectedPerSide = totalSidePoints / 4;
    
    // Calculate how evenly distributed the points are
    const variance = [topPoints, bottomPoints, leftPoints, rightPoints]
      .map(count => Math.abs(count - expectedPerSide))
      .reduce((sum, diff) => sum + diff, 0);
    
    return Math.max(0, 1 - (variance / totalSidePoints));
  }

  private detectSpiral(points: Point[]): GestureResult {
    if (points.length < 10) return { type: 'spiral', confidence: 0 };

    const center = this.getCentroid(points);
    let turns = 0;
    let previousAngle = 0;
    let totalAngleChange = 0;

    for (let i = 1; i < points.length; i++) {
      const angle = Math.atan2(points[i].y - center.y, points[i].x - center.x);
      const angleDiff = angle - previousAngle;
      
      // Normalize angle difference
      let normalizedDiff = angleDiff;
      if (normalizedDiff > Math.PI) normalizedDiff -= 2 * Math.PI;
      if (normalizedDiff < -Math.PI) normalizedDiff += 2 * Math.PI;
      
      totalAngleChange += Math.abs(normalizedDiff);
      previousAngle = angle;
    }

    turns = totalAngleChange / (2 * Math.PI);
    const confidence = Math.min(1, turns > 1.5 ? turns / 3 : 0);

    return {
      type: 'spiral',
      confidence,
      center,
      boundingBox: this.getBoundingBox(points),
      properties: {
        turns: Math.round(turns)
      }
    };
  }

  private detectWave(points: Point[]): GestureResult {
    if (points.length < 8) return { type: 'wave', confidence: 0 };

    let peaks = 0;
    let valleys = 0;
    
    for (let i = 1; i < points.length - 1; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const next = points[i + 1];
      
      // Check for peaks (local maxima) and valleys (local minima)
      if (curr.y < prev.y && curr.y < next.y) valleys++;
      if (curr.y > prev.y && curr.y > next.y) peaks++;
    }

    const oscillations = peaks + valleys;
    const confidence = Math.min(1, oscillations >= 3 ? oscillations / 6 : 0);

    return {
      type: 'wave',
      confidence,
      boundingBox: this.getBoundingBox(points),
      properties: {
        turns: oscillations
      }
    };
  }

  private detectStar(points: Point[]): GestureResult {
    const corners = this.findCorners(points);
    
    if (corners.length < 5) {
      return { type: 'star', confidence: 0 };
    }

    const center = this.getCentroid(points);
    const distances = corners.map(corner => this.distance(corner, center));
    
    // Stars have alternating long and short distances from center
    const sortedDistances = [...distances].sort((a, b) => a - b);
    const median = sortedDistances[Math.floor(sortedDistances.length / 2)];
    
    let alternating = 0;
    for (let i = 0; i < distances.length; i++) {
      const isLong = distances[i] > median;
      const nextIsShort = distances[(i + 1) % distances.length] <= median;
      if (isLong && nextIsShort) alternating++;
    }

    const confidence = Math.min(1, alternating >= 3 ? alternating / 5 : 0);

    return {
      type: 'star',
      confidence,
      center,
      boundingBox: this.getBoundingBox(points),
      properties: {
        corners: corners.length
      }
    };
  }

  private findCorners(points: Point[]): Point[] {
    if (points.length < 3) return [];

    const corners: Point[] = [];
    const angleThreshold = 30; // degrees
    
    for (let i = 1; i < points.length - 1; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const next = points[i + 1];
      
      const angle1 = Math.atan2(curr.y - prev.y, curr.x - prev.x);
      const angle2 = Math.atan2(next.y - curr.y, next.x - curr.x);
      
      let angleDiff = Math.abs(angle2 - angle1) * 180 / Math.PI;
      if (angleDiff > 180) angleDiff = 360 - angleDiff;
      
      if (angleDiff > angleThreshold) {
        corners.push(curr);
      }
    }

    return corners;
  }

  private getTriangleAngles(corners: Point[]): number[] {
    if (corners.length < 3) return [];

    const angles: number[] = [];
    for (let i = 0; i < 3; i++) {
      const p1 = corners[i];
      const p2 = corners[(i + 1) % 3];
      const p3 = corners[(i + 2) % 3];
      
      const angle = this.getAngle(p1, p2, p3);
      angles.push(angle);
    }

    return angles;
  }

  private getAngle(p1: Point, vertex: Point, p2: Point): number {
    const v1 = { x: p1.x - vertex.x, y: p1.y - vertex.y };
    const v2 = { x: p2.x - vertex.x, y: p2.y - vertex.y };
    
    const dot = v1.x * v2.x + v1.y * v2.y;
    const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
    const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
    
    const cosAngle = dot / (mag1 * mag2);
    return Math.acos(Math.max(-1, Math.min(1, cosAngle))) * 180 / Math.PI;
  }

  private getCentroid(points: Point[]): Point {
    const sum = points.reduce((acc, point) => ({
      x: acc.x + point.x,
      y: acc.y + point.y
    }), { x: 0, y: 0 });

    return {
      x: sum.x / points.length,
      y: sum.y / points.length
    };
  }

  private distance(p1: Point, p2: Point): number {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private pointToLineDistance(point: Point, lineStart: Point, lineEnd: Point): number {
    const A = point.x - lineStart.x;
    const B = point.y - lineStart.y;
    const C = lineEnd.x - lineStart.x;
    const D = lineEnd.y - lineStart.y;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    
    if (lenSq === 0) return this.distance(point, lineStart);

    const param = dot / lenSq;
    
    let closestPoint: Point;
    if (param < 0) {
      closestPoint = lineStart;
    } else if (param > 1) {
      closestPoint = lineEnd;
    } else {
      closestPoint = {
        x: lineStart.x + param * C,
        y: lineStart.y + param * D
      };
    }

    return this.distance(point, closestPoint);
  }
}

export const gestureRecognizer = new GestureRecognizer();
