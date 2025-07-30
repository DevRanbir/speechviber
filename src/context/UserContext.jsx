import React, { createContext, useState, useEffect } from 'react';

export const UserContext = createContext({
  userName: '',
  setUserName: () => {},
  speechHistory: [],
  saveAnalysis: () => {}
});

export const UserProvider = ({ children }) => {
  const [userName, setUserName] = useState(localStorage.getItem('userName') || '');
  const [speechHistory, setSpeechHistory] = useState(
    JSON.parse(localStorage.getItem('speechHistory')) || []
  );

  const saveAnalysis = (mode, analysis) => {
    const newEntry = {
      id: Date.now(),
      mode,
      analysis,
      date: new Date().toISOString()
    };
    const updatedHistory = [newEntry, ...speechHistory];
    setSpeechHistory(updatedHistory);
    localStorage.setItem('speechHistory', JSON.stringify(updatedHistory));
  };

  useEffect(() => {
    localStorage.setItem('userName', userName);
  }, [userName]);

  return (
    <UserContext.Provider value={{ 
      userName, 
      setUserName, 
      speechHistory, 
      saveAnalysis 
    }}>
      {children}
    </UserContext.Provider>
  );
};