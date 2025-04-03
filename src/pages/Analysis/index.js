'use client';

import React, { useState, useEffect } from 'react';

const API_KEY = "AIzaSyDtTaeo58Dzie60E-F2l3SVFmCdkCegrsk";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

const InterviewSimulator = () => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [timeLeft, setTimeLeft] = useState(15);
  const [isListening, setIsListening] = useState(false);
  const [testComplete, setTestComplete] = useState(false);
  const [evaluations, setEvaluations] = useState([]);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [showIntro, setShowIntro] = useState(true);

  const allQuestions = [
    "Tell me about yourself.",
    "What are your greatest strengths?",
    "Where do you see yourself in 5 years?",
    "Why should we hire you?",
    "What is your biggest weakness?",
    "How do you handle stress and pressure?",
    "Describe a challenging situation you've faced at work.",
    "What are your salary expectations?",
    "Why do you want to work here?",
    "What are your career goals?",
    "How do you handle conflict at work?",
    "What motivates you?",
    "Describe your leadership style.",
    "How do you prioritize your work?",
    "What makes you unique?",
    "Can you describe a time when you failed and how you handled it?",
    "Tell me about a time when you had to work with a difficult coworker.",
    "What do you know about our company?",
    "How do you handle constructive criticism?",
    "Describe a situation where you had to meet a tight deadline.",
    "How do you stay organized and manage your time?",
    "What skills do you bring to this role?",
    "Tell me about a time when you took initiative at work.",
    "What do you do to stay updated in your field?",
    "Give an example of how you’ve dealt with ambiguity in the workplace.",
    "How do you handle multiple projects at once?",
    "Have you ever had to make a tough decision at work? What was the outcome?",
    "Tell me about a time you disagreed with your manager and how you handled it.",
    "What steps do you take to improve yourself professionally?",
    "What is your biggest professional achievement?",
    "How do you deal with failure?",
    "What would your coworkers say about you?",
    "How do you ensure accuracy in your work?",
    "Tell me about a time you had to adapt to a sudden change.",
    "What do you do when you don’t know the answer to a question at work?",
    "Describe a time you went above and beyond for a project.",
    "What do you think is the most important quality for this role?",
    "What kind of work environment do you prefer?",
    "How do you handle a situation where a team member is not contributing?",
    "How do you approach problem-solving?",
    "Tell me about a time you had to convince someone to see things your way.",
    "What do you consider your biggest success in your career?",
    "What are your long-term career aspirations?",
    "Tell me about a time you made a mistake and how you handled it.",
    "How do you stay motivated when working on repetitive tasks?",
    "What interests you the most about this position?",
    "How do you handle feedback from your manager or peers?",
    "Tell me about a time when you had to learn a new skill quickly.",
    "Describe a time when you led a team to success.",
    "What strategies do you use to stay productive?",
    "How do you handle working under a difficult boss?",
    "How do you ensure effective communication within a team?",
    "What do you do when you have a disagreement with a team member?",
    "If you were given a task outside of your expertise, how would you handle it?",
    "Describe a situation where you exceeded expectations.",
    "How do you stay calm under pressure?",
    "What kind of leadership do you respond best to?",
    "How do you deal with tight deadlines?",
    "What do you consider when making important work-related decisions?",
    "How do you balance quality and efficiency in your work?",
    "Tell me about a time you solved a complex problem.",
    "What role do you usually take in a team setting?",
    "How do you handle unexpected challenges in a project?",
    "What do you think makes a great team player?",
    "What do you value most in a workplace?",
    "What have you done to improve your knowledge in the past year?",
    "Tell me about a time you had to handle a difficult customer.",
    "What would you do if you had to work on a project with little guidance?",
    "How do you manage stress in a fast-paced environment?",
    "How do you build relationships with coworkers?",
    "What does success mean to you?",
    "What kind of challenges are you looking for in a new position?",
    "If you could change one thing about your last job, what would it be?",
    "What are your thoughts on workplace diversity and inclusion?",
    "How do you handle ethical dilemmas at work?",
    "What is one thing you would improve about yourself?",
    "Tell me about a time you helped a colleague succeed.",
    "How do you keep yourself accountable for meeting deadlines?",
    "What do you do when priorities shift unexpectedly?",
    "How do you evaluate success in your job?",
    "Describe a time when you worked with a cross-functional team.",
    "What is the best piece of career advice you’ve ever received?",
    "Tell me about a time when you worked on a team with different personalities.",
    "How do you ensure that you meet customer expectations?",
    "If you were to start your career over, what would you do differently?",
    "What is one professional risk you took and what was the outcome?",
    "How do you prepare for an important presentation or meeting?",
    "If you had to explain your job to a five-year-old, how would you do it?",
    "What would you do if you had multiple urgent deadlines at the same time?",
    "What are three things your previous employer would say about you?",
    "If you could have dinner with any leader or professional in your field, who would it be and why?",
    "What do you think sets you apart from other candidates?",
    "If you were a hiring manager, what qualities would you look for in a candidate?",
    "What do you consider your most important professional lesson?",
    "Describe a situation where you had to step up as a leader unexpectedly."
];


  useEffect(() => {
    // Select 4 random questions at start
    const shuffled = [...allQuestions].sort(() => 0.5 - Math.random());
    setSelectedQuestions(shuffled.slice(0, 4));
  }, []);

  useEffect(() => {
    let timer;
    if (isListening && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isListening) {
      stopListening();
    }
    return () => clearInterval(timer);
  }, [isListening, timeLeft]);

  const startListening = () => {
    setTimeLeft(15);
    setIsListening(true);
    
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = 'en-US';
    recognition.continuous = true;
    recognition.start();
    
    recognition.onresult = function(event) {
      const transcript = event.results[0][0].transcript;
      setAnswers(prev => {
        const newAnswers = [...prev];
        newAnswers[currentQuestionIndex] = transcript;
        return newAnswers;
      });
    };

    recognition.onerror = function(event) {
      console.error('Speech recognition error:', event.error);
    };
  };

  const stopListening = () => {
    setIsListening(false);
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < 3) {
      setCurrentQuestionIndex(prev => prev + 1);
      setTimeLeft(15);
    } else {
      setTestComplete(true);
      evaluateAllAnswers();
    }
  };

  const evaluateAllAnswers = async () => {
    setIsEvaluating(true);
    const evaluationResults = [];
    
    for (let i = 0; i < selectedQuestions.length; i++) {
      try {
        const result = await askAI(selectedQuestions[i], answers[i]);
        evaluationResults.push(result);
      } catch (error) {
        console.error("Evaluation error:", error);
        evaluationResults.push({ response: "Evaluation failed", accuracy: "N/A" });
      }
    }
    
    setEvaluations(evaluationResults);
    setIsEvaluating(false);
  };

  const askAI = async (question, answer) => {
    const body = JSON.stringify({
      contents: [{
        parts: [{ text: `Question: '${question}', Answer: '${answer || "No answer provided"}'. Give a very brief evaluation (max 2 sentences) and rate correctness from 0-100%.` }]
      }]
    });

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body
      });
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      
      let accuracyValue = "N/A";
      let responseText = "No response";
      
      if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        responseText = data.candidates[0].content.parts[0].text;
        const match = responseText.match(/\b(\d{1,3})\b/);
        if (match) {
          accuracyValue = match[1];
        }
      }
      
      return {
        response: responseText,
        accuracy: accuracyValue
      };
    } catch (error) {
      console.error("Error fetching AI response:", error);
      return {
        response: "Error fetching response",
        accuracy: "N/A"
      };
    }
  };

  // Calculate progress percentage
  const progressPercentage = ((currentQuestionIndex) / 4) * 100;

  if (showIntro) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-indigo-950 text-white p-6">
        <div className="max-w-4xl mx-auto">
          <div className="relative backdrop-blur-sm bg-gray-800/30 rounded-3xl p-12 border border-indigo-500/30 shadow-2xl overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-600/20 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-600/20 rounded-full blur-3xl"></div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-indigo-600/30 backdrop-blur-sm border border-indigo-500/30 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-300">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z"></path>
                  </svg>
                </div>
                <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">Audio Fastrack Analysis</h1>
              </div>
              
              <p className="text-xl mb-8 text-gray-200 leading-relaxed">Perfect your interview skills with AI-powered feedback. Practice with real questions and receive personalized evaluations.</p>
              
              <div className="grid grid-cols-2 gap-6 mb-10">
                <div className="bg-gray-800/40 backdrop-blur-sm rounded-xl p-5 border border-gray-700/50">
                  <div className="w-10 h-10 rounded-full bg-purple-900/60 border border-purple-500/30 flex items-center justify-center mb-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-300">
                      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                      <line x1="12" y1="19" x2="12" y2="22"></line>
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-200 mb-1">Voice Recognition</h3>
                  <p className="text-gray-400">Speak your answers naturally like in a real interview</p>
                </div>
                
                <div className="bg-gray-800/40 backdrop-blur-sm rounded-xl p-5 border border-gray-700/50">
                  <div className="w-10 h-10 rounded-full bg-indigo-900/60 border border-indigo-500/30 flex items-center justify-center mb-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-300">
                      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                      <polyline points="7.5 4.21 12 6.81 16.5 4.21"></polyline>
                      <polyline points="7.5 19.79 7.5 14.6 3 12"></polyline>
                      <polyline points="21 12 16.5 14.6 16.5 19.79"></polyline>
                      <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                      <line x1="12" y1="22.08" x2="12" y2="12"></line>
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-200 mb-1">AI Feedback</h3>
                  <p className="text-gray-400">Receive detailed evaluations for all your responses</p>
                </div>
              </div>
              
              <button 
                onClick={() => setShowIntro(false)}
                style={{
                  width: '100%',
                  padding: '1rem 2rem',
                  background: 'linear-gradient(to right, #4f46e5, #8b5cf6)',
                  color: 'white',
                  borderRadius: '0.75rem',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.75rem',
                  transition: 'all 0.3s',
                  boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.3)',
                  border: '1px solid rgba(79, 70, 229, 0.3)',
                  cursor: 'pointer'
                }}
              >
                <span style={{ fontSize: '1.125rem' }}>BEGIN YOUR INTERVIEW</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-indigo-950 text-white p-6">
      <div className="max-w-5xl mx-auto">
        <header className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-indigo-600/30 backdrop-blur-sm border border-indigo-500/30 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-300">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z"></path>
              </svg>
            </div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
              Audio Fastrack Analysis
            </h1>
          </div>
          
          {!testComplete && (
            <div className="flex items-center gap-3">
              <div className="px-4 py-2 rounded-full bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 text-sm font-medium text-gray-300">
                Question {currentQuestionIndex + 1} of 4
              </div>
              <div className={`w-16 h-16 rounded-full flex items-center justify-center border-3 text-xl font-bold transition-colors ${
                timeLeft > 10 ? 'border-green-500/70 text-green-400 bg-green-900/30' :
                timeLeft > 5 ? 'border-yellow-500/70 text-yellow-400 bg-yellow-900/30' :
                'border-red-500/70 text-red-400 bg-red-900/30 animate-pulse'
              }`}>
                Time remaining: {timeLeft}
              </div>
            </div>
          )}
        </header>
        
        {!testComplete ? (
          <div className="backdrop-blur-sm bg-gray-800/40 rounded-3xl p-8 border border-indigo-500/30 shadow-xl overflow-hidden relative">
            {/* Decorative elements */}
            <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-indigo-600/10 rounded-full blur-3xl"></div>
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-purple-600/10 rounded-full blur-3xl"></div>
            
            <div className="relative z-10">
              {/* Progress bar */}
              <div className="mb-8">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-medium text-indigo-300">Progress: </span>
                  <span className="text-sm font-medium text-gray-400">
                    {Math.floor(progressPercentage)}% complete
                  </span>
                </div>
                <div className="w-full h-3 bg-gray-800/80 rounded-full overflow-hidden p-0.5">
                  <div 
                    className="h-full bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full transition-all duration-500" 
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
              </div>

              {/* Question card */}
              <div className="bg-gray-800/70 backdrop-blur-sm p-8 rounded-2xl mb-8 border border-gray-700/50 shadow-lg transform transition-all hover:shadow-indigo-900/20 hover:border-indigo-500/40">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-24 h-24 rounded-full bg-indigo-900/60 border border-indigo-500/30 flex items-center justify-center text-lg font-bold shrink-0 text-indigo-300">
                  </div>
                  <h2 className="text-2xl font-semibold text-white">
                    Q: {selectedQuestions[currentQuestionIndex]}
                  </h2>
                </div>
                
                {answers[currentQuestionIndex] && (
                  <div className="mt-6 p-5 bg-gray-900/70 rounded-xl border border-gray-700/50">
                    <h3 className="text-sm uppercase text-gray-400 mb-2 flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
                        <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                        <line x1="12" y1="19" x2="12" y2="22"></line>
                      </svg>
                      Your Response:
                    </h3>
                    <p className="text-gray-300 italic">{answers[currentQuestionIndex]}</p>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                <button
                  onClick={isListening ? stopListening : startListening}
                  style={{
                    padding: '1.25rem',
                    borderRadius: '0.75rem',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.3s',
                    background: isListening 
                      ? 'linear-gradient(to right, #dc2626, #b91c1c)'
                      : 'linear-gradient(to right, #4f46e5, #8b5cf6)',
                    boxShadow: isListening
                      ? '0 4px 15px -3px rgba(220, 38, 38, 0.4)'
                      : '0 4px 15px -3px rgba(79, 70, 229, 0.4)',
                    border: isListening
                      ? '1px solid rgba(220, 38, 38, 0.3)'
                      : '1px solid rgba(79, 70, 229, 0.3)',
                    cursor: 'pointer',
                    transform: 'translateZ(0)',
                    color: 'white'
                  }}
                >
                  {isListening ? (
                    <>
                      <span style={{ 
                        position: 'relative',
                        display: 'flex',
                        height: '0.75rem',
                        width: '0.75rem',
                        marginRight: '0.5rem'
                      }}>
                        <span style={{
                          animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite',
                          position: 'absolute',
                          display: 'inline-flex',
                          height: '100%',
                          width: '100%',
                          borderRadius: '9999px',
                          backgroundColor: '#f87171',
                          opacity: 0.75
                        }}></span>
                        <span style={{
                          position: 'relative',
                          display: 'inline-flex',
                          borderRadius: '9999px',
                          height: '0.75rem',
                          width: '0.75rem',
                          backgroundColor: '#ef4444'
                        }}></span>
                      </span>
                      <span style={{ fontSize: '1.125rem' }}>Stop Recording</span>
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '0.5rem' }}>
                        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
                        <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                        <line x1="12" y1="19" x2="12" y2="22"></line>
                      </svg>
                      <span style={{ fontSize: '1.125rem' }}>Start Speaking</span>
                    </>
                  )}
                </button>
                
                <button
                  onClick={nextQuestion}
                  disabled={isListening || (timeLeft > 0 && !answers[currentQuestionIndex])}
                  style={{
                    padding: '1.25rem',
                    borderRadius: '0.75rem',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.3s',
                    background: isListening || (timeLeft > 0 && !answers[currentQuestionIndex])
                      ? 'rgba(55, 65, 81, 0.5)'
                      : 'linear-gradient(to right, #4f46e5, #8b5cf6)',
                    boxShadow: isListening || (timeLeft > 0 && !answers[currentQuestionIndex])
                      ? 'none'
                      : '0 4px 15px -3px rgba(79, 70, 229, 0.4)',
                    border: isListening || (timeLeft > 0 && !answers[currentQuestionIndex])
                      ? '1px solid rgba(75, 85, 99, 0.3)'
                      : '1px solid rgba(79, 70, 229, 0.3)',
                    cursor: isListening || (timeLeft > 0 && !answers[currentQuestionIndex])
                      ? 'not-allowed'
                      : 'pointer',
                    transform: 'translateZ(0)',
                    color: 'white'
                  }}
                >
                  <span style={{ fontSize: '1.125rem' }}>Next Question</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="backdrop-blur-sm bg-gray-800/40 rounded-3xl p-8 border border-indigo-500/30 shadow-xl overflow-hidden relative">
            {/* Decorative elements */}
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-purple-600/10 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-indigo-600/10 rounded-full blur-3xl"></div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-indigo-900/60 border border-indigo-500/30 flex items-center justify-center text-xl font-bold text-indigo-300">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-300">
                      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                      <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                      <line x1="12" y1="22.08" x2="12" y2="12"></line>
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
                    Interview Results
                  </h2>
                </div>
                
                {!isEvaluating && (
                  <button 
                    onClick={() => {
                      setTestComplete(false);
                      setCurrentQuestionIndex(0);
                      setAnswers([]);
                      setEvaluations([]);
                      setTimeLeft(15);
                      
                      // Select new questions
                      const shuffled = [...allQuestions].sort(() => 0.5 - Math.random());
                      setSelectedQuestions(shuffled.slice(0, 4));
                    }}
                    style={{
                      padding: '0.75rem 1.5rem',
                      borderRadius: '0.75rem',
                      background: 'linear-gradient(to right, #4f46e5, #8b5cf6)',
                      transition: 'all 0.3s',
                      boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.3)',
                      fontWeight: '500',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      border: '1px solid rgba(79, 70, 229, 0.3)',
                      cursor: 'pointer',
                      color: 'white'
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                      <path d="M3 3v5h5"></path>
                      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"></path>
                      <path d="M16 16h5v5"></path>
                    </svg>
                    <span className="text-lg">Try Again</span>
                  </button>
                )}
              </div>
              
              {isEvaluating ? (
                <div className="text-center py-20 bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50">
                  <div className="w-24 h-24 border-4 border-t-indigo-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin mx-auto mb-8"></div>
                  <p className="text-2xl font-medium bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">Analyzing your responses</p>
                  <p className="text-gray-400 mt-3">Our AI is evaluating your interview performance</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-8">
                  {selectedQuestions.map((question, index) => (
                    <div key={index} className="bg-gray-600/70 backdrop-blur-sm rounded-2xl border border-gray-700/50 overflow-hidden padding-top-10px ">
                      <div className="p-6">
                        <hr className="mb-4" />
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-full bg-indigo-900/60 border border-indigo-500/30 flex items-center justify-center text-xl font-bold text-indigo-300">
                          </div>
                          <div>
                            <h3 className="text-xl font-semibold text-white mb-4">for Q: {question}</h3>
                            <div className="bg-gray-900/40 rounded-xl p-4 border border-gray-700/50">
                              <p className="text-gray-300 italic">You Replied: {answers[index] || "No answer provided"}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {evaluations[index] && (
                        <div className="bg-gray-900/70 p-6 border-t border-gray-700/50">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-full bg-purple-900/60 border border-purple-500/30 flex items-center justify-center text-xl font-bold text-purple-300">
                              Accuracy: {evaluations[index].accuracy}%
                            </div>
                            <p className="text-gray-300">{evaluations[index].response}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InterviewSimulator;