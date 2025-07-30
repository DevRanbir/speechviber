import React, { createContext, useState, useContext, useEffect } from 'react';

const ParticleContext = createContext();

const defaultSettings = {
  enabled: true,
  trailEnabled: false,
  clickEnabled: true,
  particleColor: '#7C3AED',
  trailParticleCount: 2,
  clickParticleCount: 6,
  particleSize: 2
};

export const ParticleProvider = ({ children }) => {
  const [particleSettings, setParticleSettings] = useState(defaultSettings);
  
  // Store settings in localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('particleSettings');
    if (savedSettings) {
      setParticleSettings(JSON.parse(savedSettings));
    }
  }, []);

  const updateSettings = (newSettings) => {
    const updatedSettings = { ...particleSettings, ...newSettings };
    setParticleSettings(updatedSettings);
    localStorage.setItem('particleSettings', JSON.stringify(updatedSettings));
  };

  const resetSettings = () => {
    setParticleSettings(defaultSettings);
    localStorage.setItem('particleSettings', JSON.stringify(defaultSettings));
  };

  return (
    <ParticleContext.Provider value={{ particleSettings, updateSettings, resetSettings }}>
      {children}
    </ParticleContext.Provider>
  );
};

export const useParticle = () => {
  const context = useContext(ParticleContext);
  if (!context) {
    throw new Error('useParticle must be used within a ParticleProvider');
  }
  return context;
};

export default ParticleContext;