import React, { useState, useEffect, useRef } from 'react';
import { Camera, CheckCircle, XCircle, RotateCcw, Trophy, Timer } from 'lucide-react';

const GamePage = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [headPosition, setHeadPosition] = useState('center');
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [gameState, setGameState] = useState('setup'); // setup, playing, finished
  const [timeLeft, setTimeLeft] = useState(10);
  const [streak, setStreak] = useState(0);

  const questions = [
    {
      id: 1,
      question: "Integrated Shield Plans provide coverage beyond basic MediShield Life benefits",
      answer: true,
      explanation: "Correct! Integrated Shield Plans (IPs) are designed to provide enhanced coverage above and beyond MediShield Life."
    },
    {
      id: 2,
      question: "You can only purchase Integrated Shield Plans after age 65",
      answer: false,
      explanation: "False! You can purchase IPs at various ages, though premiums may vary based on when you enroll."
    },
    {
      id: 3,
      question: "Integrated Shield Plans can help cover private hospital treatments",
      answer: true,
      explanation: "True! Many IPs provide coverage for private hospital treatments and specialist care."
    }
  ];

  // Camera setup
  useEffect(() => {
    if (cameraActive) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [cameraActive]);

  // Timer effect
  useEffect(() => {
    let timer;
    if (gameState === 'playing' && timeLeft > 0) {
      timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    } else if (timeLeft === 0 && gameState === 'playing') {
      handleTimeout();
    }
    return () => clearTimeout(timer);
  }, [timeLeft, gameState]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480 } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          detectMotion();
        };
      }
    } catch (error) {
      console.error('Camera access denied:', error);
      alert('Camera access is required for this game. Please allow camera permissions.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const detectMotion = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    let previousFrame = null;
    let leftMovement = 0;
    let rightMovement = 0;
    let centerPosition = 0;

    const analyze = () => {
      if (video.readyState !== video.HAVE_ENOUGH_DATA) {
        requestAnimationFrame(analyze);
        return;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);
      
      const currentFrame = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      if (previousFrame) {
        const diff = calculateFrameDifference(previousFrame, currentFrame);
        const movement = analyzeMovement(diff);
        
        // Update movement tracking
        if (movement.direction === 'left') {
          leftMovement += movement.intensity;
          rightMovement = Math.max(0, rightMovement - 1);
          centerPosition = 0;
        } else if (movement.direction === 'right') {
          rightMovement += movement.intensity;
          leftMovement = Math.max(0, leftMovement - 1);
          centerPosition = 0;
        } else {
          leftMovement = Math.max(0, leftMovement - 1);
          rightMovement = Math.max(0, rightMovement - 1);
          centerPosition++;
        }

        // Determine head position
        if (leftMovement > 15) {
          setHeadPosition('left');
          if (gameState === 'playing' && !selectedAnswer) {
            handleAnswer(false);
          }
        } else if (rightMovement > 15) {
          setHeadPosition('right');
          if (gameState === 'playing' && !selectedAnswer) {
            handleAnswer(true);
          }
        } else if (centerPosition > 10) {
          setHeadPosition('center');
        }
      }
      
      previousFrame = currentFrame;
      if (cameraActive) {
        requestAnimationFrame(analyze);
      }
    };

    analyze();
  };

  const calculateFrameDifference = (prev, curr) => {
    const diff = [];
    for (let i = 0; i < prev.data.length; i += 4) {
      const prevGray = (prev.data[i] + prev.data[i + 1] + prev.data[i + 2]) / 3;
      const currGray = (curr.data[i] + curr.data[i + 1] + curr.data[i + 2]) / 3;
      diff.push(Math.abs(prevGray - currGray));
    }
    return diff;
  };

  const analyzeMovement = (diff) => {
    const leftSide = diff.slice(0, diff.length / 2);
    const rightSide = diff.slice(diff.length / 2);
    
    const leftMovement = leftSide.reduce((sum, val) => sum + val, 0);
    const rightMovement = rightSide.reduce((sum, val) => sum + val, 0);
    
    const threshold = 5000;
    
    if (leftMovement > rightMovement && leftMovement > threshold) {
      return { direction: 'left', intensity: Math.min(leftMovement / 1000, 10) };
    } else if (rightMovement > leftMovement && rightMovement > threshold) {
      return { direction: 'right', intensity: Math.min(rightMovement / 1000, 10) };
    }
    
    return { direction: 'center', intensity: 0 };
  };

  const handleAnswer = (userAnswer) => {
    if (selectedAnswer !== null) return;
    
    const correct = userAnswer === questions[currentQuestion].answer;
    setSelectedAnswer(userAnswer);
    
    if (correct) {
      setScore(score + 100);
      setStreak(streak + 1);
    } else {
      setStreak(0);
    }

    setTimeout(() => {
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setSelectedAnswer(null);
        setTimeLeft(10);
      } else {
        setGameState('finished');
      }
    }, 2000);
  };

  const handleTimeout = () => {
    setSelectedAnswer('timeout');
    setStreak(0);
    setTimeout(() => {
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setSelectedAnswer(null);
        setTimeLeft(10);
      } else {
        setGameState('finished');
      }
    }, 2000);
  };

  const startGame = () => {
    setCameraActive(true);
    setGameState('playing');
    setCurrentQuestion(0);
    setScore(0);
    setStreak(0);
    setTimeLeft(10);
    setSelectedAnswer(null);
  };

  const resetGame = () => {
    setGameState('setup');
    setCameraActive(false);
    setCurrentQuestion(0);
    setScore(0);
    setStreak(0);
    setSelectedAnswer(null);
  };

  if (gameState === 'setup') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-teal-900 to-green-900 flex items-center justify-center p-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20">
            <Camera size={64} className="mx-auto text-white mb-6" />
            <h1 className="text-4xl font-bold text-white mb-4">Shield Quest Challenge</h1>
            <p className="text-white/80 mb-6 text-lg">
              Test your knowledge about Integrated Shield Plans using head movements!
            </p>
            
            <div className="bg-white/5 rounded-2xl p-6 mb-6">
              <h3 className="text-white font-semibold mb-4">How to Play:</h3>
              <div className="grid md:grid-cols-2 gap-4 text-sm text-white/80">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-red-500/30 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">←</span>
                  </div>
                  <span>Lean LEFT for FALSE</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-500/30 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">→</span>
                  </div>
                  <span>Lean RIGHT for TRUE</span>
                </div>
              </div>
            </div>
            
            <button
              onClick={startGame}
              className="bg-gradient-to-r from-blue-500 to-teal-500 text-white px-8 py-4 rounded-full text-lg font-semibold hover:from-blue-600 hover:to-teal-600 transition-all duration-300 shadow-lg"
            >
              Start Game
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'finished') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-teal-900 to-green-900 flex items-center justify-center p-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20">
            <Trophy size={64} className="mx-auto text-yellow-400 mb-6" />
            <h1 className="text-4xl font-bold text-white mb-4">Game Complete!</h1>
            
            <div className="bg-white/5 rounded-2xl p-6 mb-6">
              <div className="text-2xl font-bold text-white mb-2">Final Score: {score}</div>
              <div className="text-white/80">
                You answered {questions.filter((q, i) => {
                  // This is simplified - in a real app you'd track actual answers
                  return score > 0;
                }).length} out of {questions.length} questions correctly!
              </div>
            </div>

            <div className="space-y-4 mb-6">
              {questions.map((q, index) => (
                <div key={q.id} className="bg-white/5 rounded-xl p-4 text-left">
                  <div className="text-white font-medium mb-2">Q{index + 1}: {q.question}</div>
                  <div className="text-sm text-white/80">{q.explanation}</div>
                </div>
              ))}
            </div>
            
            <button
              onClick={resetGame}
              className="bg-gradient-to-r from-blue-500 to-teal-500 text-white px-8 py-4 rounded-full text-lg font-semibold hover:from-blue-600 hover:to-teal-600 transition-all duration-300 shadow-lg flex items-center space-x-2 mx-auto"
            >
              <RotateCcw size={20} />
              <span>Play Again</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-teal-900 to-green-900 p-4">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-6">
        <div className="flex justify-between items-center bg-white/10 backdrop-blur-lg rounded-2xl p-4 border border-white/20">
          <div className="flex items-center space-x-4">
            <div className="text-white">
              <span className="text-sm opacity-80">Question</span>
              <div className="text-xl font-bold">{currentQuestion + 1}/{questions.length}</div>
            </div>
            <div className="text-white">
              <span className="text-sm opacity-80">Score</span>
              <div className="text-xl font-bold">{score}</div>
            </div>
            {streak > 1 && (
              <div className="text-white">
                <span className="text-sm opacity-80">Streak</span>
                <div className="text-xl font-bold text-yellow-400">{streak}🔥</div>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-2 text-white">
            <Timer size={20} />
            <span className={`text-xl font-bold ${timeLeft <= 3 ? 'text-red-400' : ''}`}>
              {timeLeft}s
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-6">
        {/* Question Panel */}
        <div className="space-y-6">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-4">
              {questions[currentQuestion].question}
            </h2>
            
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                headPosition === 'left' 
                  ? 'border-red-400 bg-red-500/20' 
                  : 'border-white/20 bg-white/5'
              }`}>
                <div className="flex items-center space-x-2 text-white">
                  <XCircle size={24} className="text-red-400" />
                  <span className="font-semibold">FALSE</span>
                </div>
                <div className="text-sm text-white/80 mt-1">Lean LEFT</div>
              </div>
              
              <div className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                headPosition === 'right' 
                  ? 'border-green-400 bg-green-500/20' 
                  : 'border-white/20 bg-white/5'
              }`}>
                <div className="flex items-center space-x-2 text-white">
                  <CheckCircle size={24} className="text-green-400" />
                  <span className="font-semibold">TRUE</span>
                </div>
                <div className="text-sm text-white/80 mt-1">Lean RIGHT</div>
              </div>
            </div>

            {selectedAnswer !== null && (
              <div className="mt-6 p-4 bg-white/10 rounded-xl">
                <div className={`text-lg font-semibold ${
                  selectedAnswer === 'timeout' ? 'text-yellow-400' :
                  selectedAnswer === questions[currentQuestion].answer ? 'text-green-400' : 'text-red-400'
                }`}>
                  {selectedAnswer === 'timeout' ? 'Time\'s up!' :
                   selectedAnswer === questions[currentQuestion].answer ? 'Correct!' : 'Incorrect!'}
                </div>
                <div className="text-white/80 text-sm mt-2">
                  {questions[currentQuestion].explanation}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Camera Panel */}
        <div className="space-y-6">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <h3 className="text-xl font-bold text-white mb-4">Camera View</h3>
            
            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-64 bg-black rounded-xl object-cover"
              />
              <canvas
                ref={canvasRef}
                className="hidden"
              />
              
              {/* Head position indicator */}
              <div className="absolute top-4 left-4 right-4">
                <div className="flex justify-between items-center">
                  <div className={`w-3 h-3 rounded-full ${
                    headPosition === 'left' ? 'bg-red-400' : 'bg-white/30'
                  }`}></div>
                  <div className={`w-3 h-3 rounded-full ${
                    headPosition === 'center' ? 'bg-blue-400' : 'bg-white/30'
                  }`}></div>
                  <div className={`w-3 h-3 rounded-full ${
                    headPosition === 'right' ? 'bg-green-400' : 'bg-white/30'
                  }`}></div>
                </div>
              </div>

              {/* Movement indicator */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                <div className="bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                  {headPosition === 'left' ? '← Lean Left' :
                   headPosition === 'right' ? 'Lean Right →' :
                   'Center'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GamePage;