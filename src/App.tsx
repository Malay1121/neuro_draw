import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import Header from './components/Header';
import Canvas from './components/Canvas';
import ControlPanel from './components/ControlPanel';

export interface GrowthSettings {
  brushSize: number;
  growthSpeed: number;
  branchComplexity: number;
  selectedColor: string;
  drawingMode: 'neural' | 'electric' | 'organic';
  glowIntensity: number;
  particleEffects: boolean;
  gestureRecognition: boolean;
  shapeDetection: boolean;
  specialEffects: boolean;
  physicsEnabled: boolean;
  gravity: number;
  windStrength: number;
  collisionDetection: boolean;
  springDynamics: boolean;
}

function App() {
  const [settings, setSettings] = useState<GrowthSettings>({
    brushSize: 3,
    growthSpeed: 50,
    branchComplexity: 15,
    selectedColor: '#00E0FF',
    drawingMode: 'neural',
    glowIntensity: 15,
    particleEffects: true,
    gestureRecognition: true,
    shapeDetection: true,
    specialEffects: true,
    physicsEnabled: false,
    gravity: 0.1,
    windStrength: 0.05,
    collisionDetection: false,
    springDynamics: false
  });

  const [regenerateKey, setRegenerateKey] = useState(0);

  const handleSettingsChange = useCallback((newSettings: Partial<GrowthSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  const handleRegenerate = useCallback(() => {
    setRegenerateKey(prev => prev + 1);
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 overflow-hidden font-inter">
      <div 
        className="fixed inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900"
        style={{ backgroundColor: '#0D0D0D' }}
      />
      
      <Header />
      
      <main className="relative z-10 h-screen flex">
        <div className="flex-1 relative">
          <Canvas 
            settings={settings} 
            regenerateKey={regenerateKey}
          />
        </div>
        
        <motion.div
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="hidden lg:block"
        >
          <ControlPanel
            settings={settings}
            onSettingsChange={handleSettingsChange}
            onRegenerate={handleRegenerate}
          />
        </motion.div>
      </main>

      {/* Mobile Control Panel */}
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.7 }}
        className="lg:hidden fixed bottom-4 left-4 right-4 z-20"
      >
        <ControlPanel
          settings={settings}
          onSettingsChange={handleSettingsChange}
          onRegenerate={handleRegenerate}
          isMobile={true}
        />
      </motion.div>
    </div>
  );
}

export default App;