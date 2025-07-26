import { Point } from './gestureRecognition';

export interface SpecialEffect {
  type: 'explosion' | 'ripple' | 'lightning' | 'sparkle' | 'pulse' | 'spiral_burst' | 'star_burst';
  center: Point;
  intensity: number;
  color: string;
  duration: number;
  timestamp: number;
}

export interface EffectParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  alpha: number;
  effectType: string;
}

export class SpecialEffectsManager {
  private effects: SpecialEffect[] = [];
  private effectParticles: EffectParticle[] = [];

  triggerShapeEffect(shapeType: string, center: Point, color: string): void {
    const effect = this.createEffectForShape(shapeType, center, color);
    if (effect) {
      this.effects.push(effect);
      this.generateEffectParticles(effect);
    }
  }

  private createEffectForShape(shapeType: string, center: Point, color: string): SpecialEffect | null {
    const timestamp = Date.now();
    
    switch (shapeType) {
      case 'circle':
        return {
          type: 'ripple',
          center,
          intensity: 1.0,
          color,
          duration: 2000,
          timestamp
        };
      
      case 'line':
        return {
          type: 'lightning',
          center,
          intensity: 0.8,
          color,
          duration: 1500,
          timestamp
        };
      
      case 'triangle':
        return {
          type: 'explosion',
          center,
          intensity: 1.2,
          color,
          duration: 1800,
          timestamp
        };
      
      case 'square':
        return {
          type: 'pulse',
          center,
          intensity: 0.9,
          color,
          duration: 2500,
          timestamp
        };
      
      case 'spiral':
        return {
          type: 'spiral_burst',
          center,
          intensity: 1.5,
          color,
          duration: 3000,
          timestamp
        };
      
      case 'star':
        return {
          type: 'star_burst',
          center,
          intensity: 1.8,
          color,
          duration: 2200,
          timestamp
        };
      
      case 'wave':
        return {
          type: 'sparkle',
          center,
          intensity: 1.1,
          color,
          duration: 2800,
          timestamp
        };
      
      default:
        return null;
    }
  }

  private generateEffectParticles(effect: SpecialEffect): void {
    const particleCount = Math.floor(20 * effect.intensity);
    
    for (let i = 0; i < particleCount; i++) {
      const particle = this.createParticleForEffect(effect);
      this.effectParticles.push(particle);
    }
  }

  private createParticleForEffect(effect: SpecialEffect): EffectParticle {
    const angle = (Math.PI * 2 * Math.random());
    const speed = (2 + Math.random() * 4) * effect.intensity;
    
    let vx = Math.cos(angle) * speed;
    let vy = Math.sin(angle) * speed;
    let size = (1 + Math.random() * 3) * effect.intensity;
    let maxLife = effect.duration / 20 + Math.random() * 20;

    // Customize based on effect type
    switch (effect.type) {
      case 'explosion':
        const explosionSpeed = (5 + Math.random() * 10) * effect.intensity;
        vx = Math.cos(angle) * explosionSpeed;
        vy = Math.sin(angle) * explosionSpeed;
        size = (2 + Math.random() * 4) * effect.intensity;
        break;
      
      case 'ripple':
        const rippleAngle = angle + (Math.random() - 0.5) * 0.5;
        const rippleSpeed = (1 + Math.random() * 3) * effect.intensity;
        vx = Math.cos(rippleAngle) * rippleSpeed;
        vy = Math.sin(rippleAngle) * rippleSpeed;
        size = (0.5 + Math.random() * 1.5) * effect.intensity;
        maxLife *= 1.5;
        break;
      
      case 'lightning':
        vx = (Math.random() - 0.5) * 8 * effect.intensity;
        vy = (Math.random() - 0.5) * 8 * effect.intensity;
        size = (0.8 + Math.random() * 2) * effect.intensity;
        maxLife *= 0.7;
        break;
      
      case 'sparkle':
        vx = (Math.random() - 0.5) * 3 * effect.intensity;
        vy = (Math.random() - 0.5) * 3 * effect.intensity;
        size = (1.5 + Math.random() * 2.5) * effect.intensity;
        maxLife *= 1.8;
        break;
      
      case 'spiral_burst':
        const spiralRadius = Math.random() * 100 * effect.intensity;
        const spiralAngle = angle + Math.sin(angle * 3) * 0.5;
        vx = Math.cos(spiralAngle) * (spiralRadius / 50);
        vy = Math.sin(spiralAngle) * (spiralRadius / 50);
        size = (1 + Math.random() * 3) * effect.intensity;
        maxLife *= 2;
        break;
      
      case 'star_burst':
        const starPoints = 5;
        const starAngle = (Math.PI * 2 / starPoints) * Math.floor(angle / (Math.PI * 2 / starPoints));
        const starSpeed = (3 + Math.random() * 6) * effect.intensity;
        vx = Math.cos(starAngle) * starSpeed;
        vy = Math.sin(starAngle) * starSpeed;
        size = (1.5 + Math.random() * 3.5) * effect.intensity;
        break;
      
      case 'pulse':
        const pulseSpeed = (1 + Math.random() * 2) * effect.intensity;
        vx = Math.cos(angle) * pulseSpeed;
        vy = Math.sin(angle) * pulseSpeed;
        size = (2 + Math.random() * 4) * effect.intensity;
        maxLife *= 1.2;
        break;
    }

    return {
      x: effect.center.x + (Math.random() - 0.5) * 10,
      y: effect.center.y + (Math.random() - 0.5) * 10,
      vx,
      vy,
      life: 0,
      maxLife,
      size,
      color: effect.color,
      alpha: 1,
      effectType: effect.type
    };
  }

  updateEffects(): void {
    const now = Date.now();
    
    // Remove expired effects
    this.effects = this.effects.filter(effect => 
      now - effect.timestamp < effect.duration
    );

    // Update effect particles
    this.effectParticles = this.effectParticles
      .map(particle => ({
        ...particle,
        x: particle.x + particle.vx,
        y: particle.y + particle.vy,
        life: particle.life + 1,
        vx: particle.vx * 0.98, // Add friction
        vy: particle.vy * 0.98,
        alpha: 1 - (particle.life / particle.maxLife)
      }))
      .filter(particle => particle.life < particle.maxLife);
  }

  renderEffects(ctx: CanvasRenderingContext2D, devicePixelRatio: number): void {
    // Render effect particles
    this.effectParticles.forEach(particle => {
      ctx.save();
      ctx.globalAlpha = particle.alpha;
      
      // Special rendering based on effect type
      switch (particle.effectType) {
        case 'lightning':
          ctx.fillStyle = particle.color;
          ctx.shadowColor = particle.color;
          ctx.shadowBlur = 10;
          ctx.fillRect(
            particle.x / devicePixelRatio - particle.size / 2,
            particle.y / devicePixelRatio - particle.size / 2,
            particle.size,
            particle.size * 3
          );
          break;
        
        case 'sparkle':
          ctx.fillStyle = particle.color;
          ctx.shadowColor = particle.color;
          ctx.shadowBlur = 15;
          
          // Draw sparkle as a cross shape
          const sparkleSize = particle.size;
          ctx.fillRect(
            particle.x / devicePixelRatio - sparkleSize / 2,
            particle.y / devicePixelRatio - 1,
            sparkleSize,
            2
          );
          ctx.fillRect(
            particle.x / devicePixelRatio - 1,
            particle.y / devicePixelRatio - sparkleSize / 2,
            2,
            sparkleSize
          );
          break;
        
        default:
          // Default circular particle
          ctx.fillStyle = particle.color;
          ctx.shadowColor = particle.color;
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.arc(
            particle.x / devicePixelRatio,
            particle.y / devicePixelRatio,
            particle.size,
            0,
            Math.PI * 2
          );
          ctx.fill();
          break;
      }
      
      ctx.restore();
    });

    // Render active effect overlays
    this.effects.forEach(effect => {
      const progress = (Date.now() - effect.timestamp) / effect.duration;
      const alpha = 1 - progress;
      
      ctx.save();
      ctx.globalAlpha = alpha * 0.3;
      
      switch (effect.type) {
        case 'ripple':
          const rippleRadius = progress * 100 * effect.intensity;
          ctx.strokeStyle = effect.color;
          ctx.lineWidth = 3;
          ctx.shadowColor = effect.color;
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.arc(
            effect.center.x / devicePixelRatio,
            effect.center.y / devicePixelRatio,
            rippleRadius,
            0,
            Math.PI * 2
          );
          ctx.stroke();
          break;
        
        case 'pulse':
          const pulseRadius = (Math.sin(progress * Math.PI * 4) + 1) * 20 * effect.intensity;
          ctx.fillStyle = effect.color;
          ctx.shadowColor = effect.color;
          ctx.shadowBlur = 20;
          ctx.beginPath();
          ctx.arc(
            effect.center.x / devicePixelRatio,
            effect.center.y / devicePixelRatio,
            pulseRadius,
            0,
            Math.PI * 2
          );
          ctx.fill();
          break;
      }
      
      ctx.restore();
    });
  }

  getEffectParticles(): EffectParticle[] {
    return this.effectParticles;
  }

  clearEffects(): void {
    this.effects = [];
    this.effectParticles = [];
  }
}

export const specialEffectsManager = new SpecialEffectsManager();
