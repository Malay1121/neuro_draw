import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { generateBranches, animateBranches } from '../utils/growthAlgorithm';
import type { GrowthSettings } from '../App';

interface Point {
  x: number;
  y: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

interface Stroke {
  points: Point[];
  timestamp: number;
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

interface CanvasProps {
  settings: GrowthSettings;
  regenerateKey: number;
}

const Canvas: React.FC<CanvasProps> = ({ settings, regenerateKey }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [currentStroke, setCurrentStroke] = useState<Point[]>([]);
  const animationRef = useRef<number>();

  const getCanvasPoint = useCallback((e: MouseEvent | TouchEvent): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  }, []);

  const generateParticles = useCallback((x: number, y: number, color: string) => {
    if (!settings.particleEffects) return;
    
    const newParticles: Particle[] = [];
    const particleCount = 3 + Math.random() * 5;
    
    for (let i = 0; i < particleCount; i++) {
      newParticles.push({
        x: x + (Math.random() - 0.5) * 10,
        y: y + (Math.random() - 0.5) * 10,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        life: 0,
        maxLife: 60 + Math.random() * 40,
        color: color,
        size: 1 + Math.random() * 2
      });
    }
    
    setParticles(prev => [...prev, ...newParticles].slice(-200));
  }, [settings.particleEffects]);

  const updateParticles = useCallback(() => {
    setParticles(prev => prev
      .map(particle => ({
        ...particle,
        x: particle.x + particle.vx,
        y: particle.y + particle.vy,
        life: particle.life + 1,
        vx: particle.vx * 0.98,
        vy: particle.vy * 0.98
      }))
      .filter(particle => particle.life < particle.maxLife)
    );
  }, []);

  const startDrawing = useCallback((e: MouseEvent | TouchEvent) => {
    e.preventDefault();
    setIsDrawing(true);
    const point = getCanvasPoint(e);
    setCurrentStroke([point]);
  }, [getCanvasPoint]);

  const draw = useCallback((e: MouseEvent | TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;

    const point = getCanvasPoint(e);
    setCurrentStroke(prev => [...prev, point]);
    
    if (settings.particleEffects && Math.random() < 0.3) {
      generateParticles(point.x, point.y, settings.selectedColor);
    }
  }, [isDrawing, getCanvasPoint, generateParticles, settings.particleEffects, settings.selectedColor]);

  const stopDrawing = useCallback((e: MouseEvent | TouchEvent) => {
    e.preventDefault();
    if (!isDrawing || currentStroke.length === 0) return;

    setIsDrawing(false);
    const newStroke: Stroke = {
      points: currentStroke,
      timestamp: Date.now()
    };
    setStrokes(prev => [...prev, newStroke]);
    setCurrentStroke([]);

    const newBranches = generateBranches(currentStroke, settings);
    setBranches(prev => [...prev, ...newBranches]);
  }, [isDrawing, currentStroke, settings]);

  useEffect(() => {
    let lastUpdate = 0;
    const targetFPS = 30;
    const frameInterval = 1000 / targetFPS;

    const animate = (currentTime: number) => {
      if (currentTime - lastUpdate >= frameInterval) {
        setBranches(prev => animateBranches(prev, settings.growthSpeed, settings, generateParticles));
        updateParticles();
        lastUpdate = currentTime;
      }
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [settings.growthSpeed, generateParticles, updateParticles]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const devicePixelRatio = window.devicePixelRatio || 1;

    ctx.fillStyle = '#0D0D0D';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (strokes.length > 0) {
      ctx.strokeStyle = settings.selectedColor;
      ctx.lineWidth = settings.brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.shadowColor = settings.selectedColor;
      ctx.shadowBlur = settings.glowIntensity;

      strokes.forEach(stroke => {
        if (stroke.points.length < 2) return;

        ctx.beginPath();
        ctx.moveTo(stroke.points[0].x / devicePixelRatio, stroke.points[0].y / devicePixelRatio);
        
        for (let i = 1; i < stroke.points.length; i++) {
          ctx.lineTo(stroke.points[i].x / devicePixelRatio, stroke.points[i].y / devicePixelRatio);
        }
        ctx.stroke();
      });
      
      ctx.shadowBlur = 0;
    }

    if (currentStroke.length > 1) {
      ctx.beginPath();
      ctx.moveTo(currentStroke[0].x / devicePixelRatio, currentStroke[0].y / devicePixelRatio);
      
      for (let i = 1; i < currentStroke.length; i++) {
        ctx.lineTo(currentStroke[i].x / devicePixelRatio, currentStroke[i].y / devicePixelRatio);
      }

      ctx.strokeStyle = settings.selectedColor;
      ctx.lineWidth = settings.brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.shadowColor = settings.selectedColor;
      ctx.shadowBlur = settings.glowIntensity;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    if (branches.length > 0) {
      const branchGroups = new Map<string, Branch[]>();
      
      branches.forEach(branch => {
        if (branch.progress <= 0) return;
        
        if (!branchGroups.has(branch.color)) {
          branchGroups.set(branch.color, []);
        }
        branchGroups.get(branch.color)!.push(branch);
      });

      branchGroups.forEach((groupBranches, color) => {
        ctx.strokeStyle = color;
        ctx.shadowColor = color;
        
        if (settings.drawingMode === 'electric') {
          ctx.shadowBlur = settings.glowIntensity * 1.5;
          ctx.lineCap = 'butt';
        } else if (settings.drawingMode === 'organic') {
          ctx.shadowBlur = settings.glowIntensity * 0.5;
          ctx.lineCap = 'round';
        } else {
          ctx.shadowBlur = settings.glowIntensity;
          ctx.lineCap = 'round';
        }
        
        groupBranches.forEach(branch => {
          const currentLength = branch.length * (branch.progress / branch.maxProgress);
          const endX = branch.startX + Math.cos(branch.angle) * currentLength;
          const endY = branch.startY + Math.sin(branch.angle) * currentLength;

          ctx.beginPath();
          ctx.moveTo(branch.startX / devicePixelRatio, branch.startY / devicePixelRatio);
          
          if (settings.drawingMode === 'organic') {
            const midX = (branch.startX + endX) / 2 + (Math.random() - 0.5) * 5;
            const midY = (branch.startY + endY) / 2 + (Math.random() - 0.5) * 5;
            ctx.quadraticCurveTo(midX / devicePixelRatio, midY / devicePixelRatio, endX / devicePixelRatio, endY / devicePixelRatio);
          } else {
            ctx.lineTo(endX / devicePixelRatio, endY / devicePixelRatio);
          }

          ctx.globalAlpha = branch.opacity * (branch.progress / branch.maxProgress);
          
          let lineWidth = Math.max(1, settings.brushSize * (1 - branch.generation * 0.2));
          if (settings.drawingMode === 'electric') {
            lineWidth *= 0.8;
          } else if (settings.drawingMode === 'organic') {
            lineWidth *= 1.2;
          }
          
          ctx.lineWidth = lineWidth;
          ctx.stroke();
        });
        
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
      });
    }

    if (settings.particleEffects && particles.length > 0) {
      particles.forEach(particle => {
        const alpha = 1 - (particle.life / particle.maxLife);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = particle.color;
        ctx.shadowColor = particle.color;
        ctx.shadowBlur = 5;
        
        ctx.beginPath();
        ctx.arc(particle.x / devicePixelRatio, particle.y / devicePixelRatio, particle.size, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
      });
    }
  }, [strokes, currentStroke, branches, particles, settings.brushSize, settings.selectedColor, settings.glowIntensity, settings.drawingMode, settings.particleEffects]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);

    canvas.addEventListener('touchstart', startDrawing, { passive: false });
    canvas.addEventListener('touchmove', draw, { passive: false });
    canvas.addEventListener('touchend', stopDrawing, { passive: false });

    return () => {
      canvas.removeEventListener('mousedown', startDrawing);
      canvas.removeEventListener('mousemove', draw);
      canvas.removeEventListener('mouseup', stopDrawing);
      canvas.removeEventListener('mouseout', stopDrawing);
      canvas.removeEventListener('touchstart', startDrawing);
      canvas.removeEventListener('touchmove', draw);
      canvas.removeEventListener('touchend', stopDrawing);
    };
  }, [startDrawing, draw, stopDrawing]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      const devicePixelRatio = window.devicePixelRatio || 1;
      
      canvas.width = rect.width * devicePixelRatio;
      canvas.height = rect.height * devicePixelRatio;
      
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(devicePixelRatio, devicePixelRatio);
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  useEffect(() => {
    setStrokes([]);
    setBranches([]);
    setParticles([]);
    setCurrentStroke([]);
  }, [regenerateKey]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1, delay: 0.2 }}
      className="w-full h-full relative"
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-crosshair touch-none"
        style={{ 
          width: '100%', 
          height: '100%',
          background: 'radial-gradient(ellipse at center, #0D0D0D 0%, #000000 100%)'
        }}
      />
      
      {strokes.length === 0 && branches.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1 }}
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
        >
          <div className="text-center">
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-4xl md:text-6xl font-light text-white/30 mb-4"
            >
              ✨
            </motion.div>
            <p className="text-white/40 text-lg md:text-xl font-light tracking-wide mb-2">
              Draw to create living neural networks
            </p>
            <div className="text-sm text-white/30 flex items-center justify-center space-x-2">
              <span>Mode:</span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                settings.drawingMode === 'electric' 
                  ? 'bg-blue-500/20 text-blue-400' 
                  : settings.drawingMode === 'organic'
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-cyan-500/20 text-cyan-400'
              }`}>
                {settings.drawingMode.charAt(0).toUpperCase() + settings.drawingMode.slice(1)}
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default Canvas;