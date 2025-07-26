import type { GrowthSettings } from '../App';

interface Point {
  x: number;
  y: number;
}

interface Branch {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  angle: number;
  length: number;
  generation: number;
  progress: number;
  maxProgress: number;
  color: string;
  opacity: number;
  lastGrowth: number;
}

const colors = ['#00E0FF', '#FF2CFB', '#A020F0', '#00FFAA', '#FF6B35'];

const getRandomColor = (generation: number, settings: GrowthSettings): string => {
  if (settings.drawingMode === 'electric') {
    const electricColors = ['#00E0FF', '#4F46E5', '#8B5CF6', '#06B6D4'];
    return electricColors[Math.floor(Math.random() * electricColors.length)];
  }
  
  if (settings.drawingMode === 'organic') {
    const organicColors = ['#00FFAA', '#10B981', '#34D399', '#6EE7B7'];
    return organicColors[Math.floor(Math.random() * organicColors.length)];
  }
  
  if (generation === 0) return settings.selectedColor;
  if (generation === 1) return '#FF2CFB';
  return colors[Math.floor(Math.random() * colors.length)];
};

export const generateBranches = (strokePoints: Point[], settings: GrowthSettings): Branch[] => {
  if (strokePoints.length < 2) return [];

  const branches: Branch[] = [];
  const complexity = Math.min(settings.branchComplexity / 100, 0.25);
  
  let numBranches: number;
  let branchLengthMultiplier: number;
  let angleVariation: number;
  
  if (settings.drawingMode === 'electric') {
    numBranches = Math.max(1, Math.floor(strokePoints.length * complexity * 0.08));
    branchLengthMultiplier = 1.5;
    angleVariation = 1.2;
  } else if (settings.drawingMode === 'organic') {
    numBranches = Math.max(1, Math.floor(strokePoints.length * complexity * 0.03));
    branchLengthMultiplier = 0.8;
    angleVariation = 0.6;
  } else {
    numBranches = Math.max(1, Math.floor(strokePoints.length * complexity * 0.05));
    branchLengthMultiplier = 1.0;
    angleVariation = 0.8;
  }

  for (let i = 0; i < numBranches; i++) {
    const pointIndex = Math.floor((strokePoints.length - 1) * (i / numBranches));
    const point = strokePoints[pointIndex];
    
    let strokeAngle = 0;
    if (pointIndex < strokePoints.length - 1) {
      const nextPoint = strokePoints[pointIndex + 1];
      strokeAngle = Math.atan2(nextPoint.y - point.y, nextPoint.x - point.x);
    }

    const numInitialBranches = settings.drawingMode === 'electric' ? 
      Math.floor(Math.random() * 3) + 1 : 
      Math.floor(Math.random() * 2) + 1;
    
    for (let j = 0; j < numInitialBranches; j++) {
      const angleOffset = (Math.random() - 0.5) * Math.PI * angleVariation;
      const angle = strokeAngle + angleOffset;
      const length = (30 + Math.random() * 50) * branchLengthMultiplier;
      
      branches.push({
        startX: point.x,
        startY: point.y,
        endX: point.x + Math.cos(angle) * length,
        endY: point.y + Math.sin(angle) * length,
        angle,
        length,
        generation: 0,
        progress: 0,
        maxProgress: 60 + Math.random() * 40,
        color: getRandomColor(0, settings),
        opacity: 0.8 + Math.random() * 0.2,
        lastGrowth: Date.now() + Math.random() * 2000
      });
    }
  }

  return branches;
};

export const animateBranches = (branches: Branch[], growthSpeed: number, settings: GrowthSettings, onParticleGeneration?: (x: number, y: number, color: string) => void): Branch[] => {
  const now = Date.now();
  const speedMultiplier = growthSpeed / 50;
  const newBranches: Branch[] = [];

  const maxBranches = 500;
  const activeBranches = branches.slice(0, maxBranches);

  let branchProbability: number;
  let maxGenerations: number;
  let growthDelay: number;

  if (settings.drawingMode === 'electric') {
    branchProbability = 0.015;
    maxGenerations = 4;
    growthDelay = 800;
  } else if (settings.drawingMode === 'organic') {
    branchProbability = 0.008;
    maxGenerations = 5;
    growthDelay = 1500;
  } else {
    branchProbability = 0.01;
    maxGenerations = 3;
    growthDelay = 1000;
  }

  activeBranches.forEach(branch => {
    const prevProgress = branch.progress;
    if (branch.progress < branch.maxProgress && now - branch.lastGrowth > 16) {
      branch.progress = Math.min(branch.maxProgress, branch.progress + speedMultiplier);
      branch.lastGrowth = now;
      
      if (settings.particleEffects && onParticleGeneration && branch.progress >= branch.maxProgress && prevProgress < branch.maxProgress) {
        const endX = branch.startX + Math.cos(branch.angle) * branch.length;
        const endY = branch.startY + Math.sin(branch.angle) * branch.length;
        onParticleGeneration(endX, endY, branch.color);
      }
    }

    newBranches.push(branch);

    if (
      branch.progress >= branch.maxProgress && 
      branch.generation < maxGenerations &&
      Math.random() < branchProbability * speedMultiplier &&
      now - branch.lastGrowth > growthDelay &&
      newBranches.length < maxBranches
    ) {
      const numNewBranches = settings.drawingMode === 'electric' ? 
        Math.floor(Math.random() * 2) + 1 : 1;
      
      for (let i = 0; i < numNewBranches; i++) {
        const angleDeviation = settings.drawingMode === 'organic' ?
          (Math.random() - 0.5) * Math.PI * 0.4 :
          (Math.random() - 0.5) * Math.PI * 0.6;
        const newAngle = branch.angle + angleDeviation;
        const newLength = branch.length * (0.6 + Math.random() * 0.3);
        
        const startX = branch.startX + Math.cos(branch.angle) * branch.length;
        const startY = branch.startY + Math.sin(branch.angle) * branch.length;
        
        if (newBranches.length < maxBranches) {
          newBranches.push({
            startX,
            startY,
            endX: startX + Math.cos(newAngle) * newLength,
            endY: startY + Math.sin(newAngle) * newLength,
            angle: newAngle,
            length: newLength,
            generation: branch.generation + 1,
            progress: 0,
            maxProgress: 40 + Math.random() * 30,
            color: getRandomColor(branch.generation + 1, settings),
            opacity: Math.max(0.3, branch.opacity - branch.generation * 0.15),
            lastGrowth: now + Math.random() * 1000
          });
        }
      }

      branch.lastGrowth = now;
    }
  });

  return newBranches.map(branch => {
    if (branch.progress >= branch.maxProgress && now % 100 < 16) {
      const pulseIntensity = settings.drawingMode === 'electric' ? 0.1 : 0.05;
      const pulseSpeed = settings.drawingMode === 'electric' ? 0.002 : 0.001;
      const pulsePhase = (now * pulseSpeed + branch.startX * 0.01) % (Math.PI * 2);
      branch.opacity = Math.max(0.3, branch.opacity + Math.sin(pulsePhase) * pulseIntensity);
    }
    return branch;
  });
};