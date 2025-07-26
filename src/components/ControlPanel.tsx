import React from 'react';
import { motion } from 'framer-motion';
import { RotateCcw, Download, Palette, Zap, TreePine, Sparkles, Circle, Eye, Wand2, Shapes, MousePointer } from 'lucide-react';
import { exportCanvasAsPNG } from '../utils/exportImage';
import type { GrowthSettings } from '../App';

interface ControlPanelProps {
  settings: GrowthSettings;
  onSettingsChange: (settings: Partial<GrowthSettings>) => void;
  onRegenerate: () => void;
  isMobile?: boolean;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  settings,
  onSettingsChange,
  onRegenerate,
  isMobile = false
}) => {
  const handleExport = () => {
    exportCanvasAsPNG();
  };

  const colorOptions = [
    { name: 'Cyan', value: '#00E0FF' },
    { name: 'Purple', value: '#FF2CFB' },
    { name: 'Green', value: '#00FFAA' },
    { name: 'Orange', value: '#FF6B35' },
    { name: 'Blue', value: '#4F46E5' },
    { name: 'Pink', value: '#EC4899' },
    { name: 'Yellow', value: '#F59E0B' },
    { name: 'Red', value: '#EF4444' }
  ];

  const drawingModes = [
    { name: 'Neural', value: 'neural', icon: TreePine },
    { name: 'Electric', value: 'electric', icon: Zap },
    { name: 'Organic', value: 'organic', icon: Sparkles }
  ];

  const SliderControl = ({ 
    label, 
    value, 
    onChange, 
    min = 0, 
    max = 100, 
    icon: Icon 
  }: {
    label: string;
    value: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
    icon: React.ComponentType<{ className?: string }>;
  }) => (
    <div className="space-y-3">
      <div className="flex items-center space-x-2">
        <Icon className="w-4 h-4 text-cyan-400" />
        <span className="text-sm font-medium text-white/80">{label}</span>
      </div>
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-2 bg-white/5 rounded-lg appearance-none cursor-pointer slider"
          style={{
            background: `linear-gradient(to right, #00E0FF 0%, #00E0FF ${(value - min) / (max - min) * 100}%, rgba(255,255,255,0.1) ${(value - min) / (max - min) * 100}%, rgba(255,255,255,0.1) 100%)`
          }}
        />
        <div className="flex justify-between text-xs text-white/40 mt-1">
          <span>{min}</span>
          <span className="text-cyan-400 font-medium">{value}</span>
          <span>{max}</span>
        </div>
      </div>
    </div>
  );

  const ColorPicker = () => (
    <div className="space-y-3">
      <div className="flex items-center space-x-2">
        <Palette className="w-4 h-4 text-cyan-400" />
        <span className="text-sm font-medium text-white/80">Color</span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {colorOptions.map((color) => (
          <motion.button
            key={color.value}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onSettingsChange({ selectedColor: color.value })}
            className={`w-8 h-8 rounded-full border-2 transition-all ${
              settings.selectedColor === color.value
                ? 'border-white shadow-lg'
                : 'border-white/30 hover:border-white/60'
            }`}
            style={{ backgroundColor: color.value }}
            title={color.name}
          />
        ))}
      </div>
    </div>
  );

  const ModeSelector = () => (
    <div className="space-y-3">
      <div className="flex items-center space-x-2">
        <Circle className="w-4 h-4 text-cyan-400" />
        <span className="text-sm font-medium text-white/80">Mode</span>
      </div>
      <div className="grid grid-cols-3 gap-1">
        {drawingModes.map((mode) => {
          const Icon = mode.icon;
          return (
            <motion.button
              key={mode.value}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSettingsChange({ drawingMode: mode.value as any })}
              className={`p-2 rounded-lg border transition-all text-xs font-medium flex flex-col items-center space-y-1 ${
                settings.drawingMode === mode.value
                  ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-400'
                  : 'bg-white/5 border-white/10 text-white/60 hover:border-white/20'
              }`}
            >
              <Icon className="w-3 h-3" />
              <span>{mode.name}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );

  const ToggleSwitch = ({ 
    label, 
    value, 
    onChange, 
    icon: Icon 
  }: {
    label: string;
    value: boolean;
    onChange: (value: boolean) => void;
    icon: React.ComponentType<{ className?: string }>;
  }) => (
    <div className="space-y-3">
      <div className="flex items-center space-x-2">
        <Icon className="w-4 h-4 text-cyan-400" />
        <span className="text-sm font-medium text-white/80">{label}</span>
      </div>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => onChange(!value)}
        className={`w-full p-3 rounded-lg border transition-all font-medium flex items-center justify-center space-x-2 ${
          value
            ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-400'
            : 'bg-white/5 border-white/10 text-white/60 hover:border-white/20'
        }`}
      >
        <span>{value ? '✨' : '○'}</span>
        <span>{value ? 'Enabled' : 'Disabled'}</span>
      </motion.button>
    </div>
  );

  const panelClasses = isMobile
    ? "backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-4 max-h-[80vh] overflow-y-auto"
    : "w-80 max-h-[calc(100vh-3rem)] overflow-y-auto backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 m-6 sticky top-6";

  return (
    <motion.div
      className={panelClasses}
      style={{
        backdropFilter: 'blur(20px)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
      }}
    >
      <div className="space-y-4">
        {!isMobile && (
          <div className="text-center">
            <h2 className="text-lg font-semibold text-white mb-1">Neural Controls</h2>
            <p className="text-sm text-white/60">Customize your neural growth</p>
          </div>
        )}

        <div className={`space-y-4 ${isMobile ? 'grid grid-cols-1 gap-3' : ''}`}>
          <ColorPicker />
          
          <ModeSelector />
          
          <SliderControl
            label="Brush Size"
            value={settings.brushSize}
            onChange={(value) => onSettingsChange({ brushSize: value })}
            min={1}
            max={10}
            icon={Palette}
          />

          <SliderControl
            label="Growth Speed"
            value={settings.growthSpeed}
            onChange={(value) => onSettingsChange({ growthSpeed: value })}
            min={10}
            max={100}
            icon={Zap}
          />

          <SliderControl
            label="Branch Complexity"
            value={settings.branchComplexity}
            onChange={(value) => onSettingsChange({ branchComplexity: value })}
            min={5}
            max={25}
            icon={TreePine}
          />

          <SliderControl
            label="Glow Intensity"
            value={settings.glowIntensity}
            onChange={(value) => onSettingsChange({ glowIntensity: value })}
            min={5}
            max={30}
            icon={Sparkles}
          />

          <ToggleSwitch
            label="Particle Effects"
            value={settings.particleEffects}
            onChange={(value) => onSettingsChange({ particleEffects: value })}
            icon={Sparkles}
          />

          <ToggleSwitch
            label="Gesture Recognition"
            value={settings.gestureRecognition}
            onChange={(value) => onSettingsChange({ gestureRecognition: value })}
            icon={MousePointer}
          />

          <ToggleSwitch
            label="Shape Detection"
            value={settings.shapeDetection}
            onChange={(value) => onSettingsChange({ shapeDetection: value })}
            icon={Shapes}
          />

          <ToggleSwitch
            label="Special Effects"
            value={settings.specialEffects}
            onChange={(value) => onSettingsChange({ specialEffects: value })}
            icon={Wand2}
          />

          <ToggleSwitch
            label="Physics Simulation"
            value={settings.physicsEnabled}
            onChange={(value) => onSettingsChange({ physicsEnabled: value })}
            icon={Zap}
          />
        </div>

        {/* Physics Controls */}
        {settings.physicsEnabled && (
          <div className="space-y-3 border-t border-white/10 pt-4">
            <h3 className="text-sm font-medium text-gray-300 mb-3">Physics Settings</h3>
            
            <SliderControl
              label="Gravity"
              value={settings.gravity}
              onChange={(value) => onSettingsChange({ gravity: value })}
              min={0}
              max={2}
              icon={TreePine}
            />

            <SliderControl
              label="Wind Strength"
              value={settings.windStrength}
              onChange={(value) => onSettingsChange({ windStrength: value })}
              min={0}
              max={5}
              icon={Sparkles}
            />

            <ToggleSwitch
              label="Collision Detection"
              value={settings.collisionDetection}
              onChange={(value) => onSettingsChange({ collisionDetection: value })}
              icon={Circle}
            />

            <ToggleSwitch
              label="Spring Dynamics"
              value={settings.springDynamics}
              onChange={(value) => onSettingsChange({ springDynamics: value })}
              icon={Eye}
            />
          </div>
        )}

        <div className={`space-y-3 ${isMobile ? 'flex space-y-0 space-x-3' : ''}`}>
          <motion.button
            whileHover={{ scale: 1.02, boxShadow: '0 0 20px rgba(0, 224, 255, 0.4)' }}
            whileTap={{ scale: 0.98 }}
            onClick={onRegenerate}
            className="w-full bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 text-white border border-cyan-500/30 hover:border-cyan-400/50 rounded-xl py-3 px-4 font-medium transition-all duration-200 flex items-center justify-center space-x-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Regenerate</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02, boxShadow: '0 0 20px rgba(255, 44, 251, 0.4)' }}
            whileTap={{ scale: 0.98 }}
            onClick={handleExport}
            className="w-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 text-white border border-purple-500/30 hover:border-purple-400/50 rounded-xl py-3 px-4 font-medium transition-all duration-200 flex items-center justify-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Save PNG</span>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default ControlPanel;