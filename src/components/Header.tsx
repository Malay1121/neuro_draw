import React from 'react';
import { motion } from 'framer-motion';
import { Brain } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <motion.header
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="fixed top-6 left-6 z-30"
    >
      <div className="flex items-center space-x-3">
        <motion.div
          animate={{ 
            rotate: [0, 5, -5, 0],
            scale: [1, 1.05, 1]
          }}
          transition={{ 
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="p-2 rounded-full bg-gradient-to-r from-cyan-500/20 to-purple-500/20 backdrop-blur-md border border-white/10"
        >
          <Brain className="w-6 h-6 text-cyan-400" />
        </motion.div>
        
        <motion.h1
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="text-2xl font-bold tracking-wide text-white"
          style={{
            textShadow: '0 0 20px rgba(0, 224, 255, 0.5)',
            letterSpacing: '0.15em'
          }}
        >
          NEURODRAW
        </motion.h1>
      </div>
      
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.6 }}
        className="text-sm text-cyan-300/70 mt-1 ml-11 tracking-wide"
      >
        Draw to grow living neural networks
      </motion.p>
    </motion.header>
  );
};

export default Header;