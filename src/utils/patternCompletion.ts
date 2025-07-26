import { Point } from './gestureRecognition';

export interface PatternTemplate {
  name: string;
  points: Point[];
  type: 'neural' | 'geometric' | 'organic';
  completion: Point[];
}

export class PatternCompleter {
  private templates: PatternTemplate[] = [
    // Neural network patterns
    {
      name: 'neural_branch',
      type: 'neural',
      points: [
        { x: 0, y: 0 },
        { x: 50, y: 0 },
        { x: 75, y: -25 },
        { x: 100, y: -50 }
      ],
      completion: [
        { x: 75, y: 25 },
        { x: 100, y: 50 },
        { x: 125, y: 25 },
        { x: 150, y: 0 }
      ]
    },
    {
      name: 'neural_dendrite',
      type: 'neural',
      points: [
        { x: 0, y: 0 },
        { x: 30, y: 10 },
        { x: 60, y: -5 }
      ],
      completion: [
        { x: 90, y: 15 },
        { x: 120, y: 5 },
        { x: 150, y: 20 },
        { x: 180, y: 10 }
      ]
    },
    // Geometric patterns
    {
      name: 'spiral_completion',
      type: 'geometric',
      points: [
        { x: 50, y: 50 },
        { x: 60, y: 50 },
        { x: 65, y: 45 },
        { x: 65, y: 40 }
      ],
      completion: [
        { x: 60, y: 35 },
        { x: 50, y: 35 },
        { x: 40, y: 40 },
        { x: 35, y: 50 },
        { x: 35, y: 65 },
        { x: 45, y: 75 }
      ]
    },
    // Organic patterns
    {
      name: 'growth_pattern',
      type: 'organic',
      points: [
        { x: 0, y: 0 },
        { x: 20, y: 5 },
        { x: 40, y: 15 }
      ],
      completion: [
        { x: 60, y: 30 },
        { x: 80, y: 50 },
        { x: 100, y: 75 },
        { x: 120, y: 105 }
      ]
    }
  ];

  findBestMatch(userStroke: Point[], drawingMode: string): PatternTemplate | null {
    if (userStroke.length < 3) return null;

    let bestMatch: PatternTemplate | null = null;
    let bestScore = 0;

    for (const template of this.templates) {
      // Filter templates by drawing mode
      if (drawingMode === 'neural' && template.type !== 'neural') continue;
      if (drawingMode === 'electric' && template.type !== 'geometric') continue;
      if (drawingMode === 'organic' && template.type !== 'organic') continue;

      const score = this.calculateMatchScore(userStroke, template.points);
      if (score > bestScore && score > 0.6) { // Minimum threshold
        bestScore = score;
        bestMatch = template;
      }
    }

    return bestMatch;
  }

  generateCompletion(userStroke: Point[], template: PatternTemplate): Point[] {
    if (userStroke.length === 0) return [];

    const lastPoint = userStroke[userStroke.length - 1];
    const templateEnd = template.points[template.points.length - 1];
    
    // Scale and translate completion points to match user's stroke
    const scale = this.calculateScale(userStroke, template.points);
    const offset = {
      x: lastPoint.x - templateEnd.x * scale,
      y: lastPoint.y - templateEnd.y * scale
    };

    return template.completion.map(point => ({
      x: point.x * scale + offset.x,
      y: point.y * scale + offset.y
    }));
  }

  private calculateMatchScore(userStroke: Point[], templatePoints: Point[]): number {
    const normalizedUser = this.normalizeStroke(userStroke);
    const normalizedTemplate = this.normalizeStroke(templatePoints);

    if (normalizedUser.length < 2 || normalizedTemplate.length < 2) return 0;

    // Compare direction vectors
    const userVectors = this.getDirectionVectors(normalizedUser);
    const templateVectors = this.getDirectionVectors(normalizedTemplate);

    let totalSimilarity = 0;
    const minLength = Math.min(userVectors.length, templateVectors.length);

    for (let i = 0; i < minLength; i++) {
      const similarity = this.vectorSimilarity(userVectors[i], templateVectors[i]);
      totalSimilarity += similarity;
    }

    return minLength > 0 ? totalSimilarity / minLength : 0;
  }

  private normalizeStroke(points: Point[]): Point[] {
    if (points.length === 0) return [];

    // Find bounding box
    const minX = Math.min(...points.map(p => p.x));
    const minY = Math.min(...points.map(p => p.y));
    const maxX = Math.max(...points.map(p => p.x));
    const maxY = Math.max(...points.map(p => p.y));

    const width = maxX - minX;
    const height = maxY - minY;
    const scale = Math.max(width, height);

    if (scale === 0) return points;

    // Normalize to 0-1 range
    return points.map(point => ({
      x: (point.x - minX) / scale,
      y: (point.y - minY) / scale
    }));
  }

  private getDirectionVectors(points: Point[]): Point[] {
    const vectors: Point[] = [];
    for (let i = 1; i < points.length; i++) {
      const dx = points[i].x - points[i - 1].x;
      const dy = points[i].y - points[i - 1].y;
      const length = Math.sqrt(dx * dx + dy * dy);
      
      if (length > 0) {
        vectors.push({
          x: dx / length,
          y: dy / length
        });
      }
    }
    return vectors;
  }

  private vectorSimilarity(v1: Point, v2: Point): number {
    const dotProduct = v1.x * v2.x + v1.y * v2.y;
    return Math.max(0, dotProduct); // Clamp to positive values
  }

  private calculateScale(userStroke: Point[], templatePoints: Point[]): number {
    const userBounds = this.getBounds(userStroke);
    const templateBounds = this.getBounds(templatePoints);

    const userSize = Math.max(userBounds.width, userBounds.height);
    const templateSize = Math.max(templateBounds.width, templateBounds.height);

    return templateSize > 0 ? userSize / templateSize : 1;
  }

  private getBounds(points: Point[]) {
    if (points.length === 0) return { width: 0, height: 0 };

    const minX = Math.min(...points.map(p => p.x));
    const minY = Math.min(...points.map(p => p.y));
    const maxX = Math.max(...points.map(p => p.x));
    const maxY = Math.max(...points.map(p => p.y));

    return {
      width: maxX - minX,
      height: maxY - minY
    };
  }
}

export const patternCompleter = new PatternCompleter();
