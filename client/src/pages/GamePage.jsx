import React, { useState, useEffect, useRef } from 'react';
import { Camera, CheckCircle, XCircle, RotateCcw, Shield } from 'lucide-react';

const GamePage = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [cameraPermission, setCameraPermission] = useState('pending');
  const [gameStarted, setGameStarted] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [currentPosition, setCurrentPosition] = useState('center');
  const [positionHoldTime, setPositionHoldTime] = useState(0);
  const [holdProgress, setHoldProgress] = useState(0);
  const [faceDetected, setFaceDetected] = useState(false);

  const questions = [
    "Do you enjoy playing video games? 🎮",
    "Is pizza your favorite food? 🍕",
    "Are you currently feeling happy? 😊",
    "Do you prefer cats over dogs? 🐱",
    "Is today a good day for you? ☀️"
  ];

  const holdThreshold = 1500; // 1.5 seconds
  const lastPositionTimeRef = useRef(Date.now());
  const faceDetectorOptionsRef = useRef(null);
  const animationFrameRef = useRef(null);

  useEffect(() => {
    return () => {
      // Cleanup
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
      }
      if (animationFrameRef.current) {
        clearTimeout(animationFrameRef.current);
      }
    };
  }, []);

  const requestCameraPermission = async () => {
    try {
      setCameraPermission('pending');
      // Don't show loading until we actually start loading models
      
      const constraints = {
        video: {
          width: { ideal: 640 }, // Reduced resolution for faster processing
          height: { ideal: 480 },
          facingMode: { ideal: 'user' }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = async () => {
          setCameraPermission('granted');
          setIsLoading(true); // Only show loading when we start loading models
          await initializeFaceAPI();
        };
      }
      
    } catch (error) {
      console.error('Camera access denied:', error);
      setCameraPermission('denied');
      setIsLoading(false);
    }
  };

  const initializeFaceAPI = async () => {
    try {
      if (!window.faceapi) {
        throw new Error('face-api.js library not loaded');
      }

      // Load face detection model from local weights folder (much faster)
      await window.faceapi.nets.tinyFaceDetector.loadFromUri('/weights/');
      
      faceDetectorOptionsRef.current = new window.faceapi.TinyFaceDetectorOptions({
        inputSize: 416, // Reduced for faster processing
        scoreThreshold: 0.5
      });

      setIsLoading(false);
      startDetection();
    } catch (error) {
      console.error('Error initializing face detection:', error);
      setIsLoading(false);
      alert('Failed to load face detection. Please refresh the page and try again.');
    }
  };

  const getPositionFromDetection = (detection) => {
    const box = detection.box;
    const faceX = box.x + box.width / 2;
    const videoEl = videoRef.current;
    
    if (!videoEl) return 'center';
    
    const centerX = videoEl.videoWidth / 2;
    const threshold = videoEl.videoWidth * 0.2;
    
    if (faceX < centerX - threshold) {
      return 'left';
    } else if (faceX > centerX + threshold) {
      return 'right';
    } else {
      return 'center';
    }
  };

  const handlePositionHold = (position) => {
    const now = Date.now();
    
    if (position === currentPosition && (position === 'left' || position === 'right')) {
      const timeDelta = now - lastPositionTimeRef.current;
      const newHoldTime = positionHoldTime + timeDelta;
      setPositionHoldTime(newHoldTime);
      
      const progress = Math.min(100, (newHoldTime / holdThreshold) * 100);
      setHoldProgress(progress);
      
      // Answer confirmed
      if (newHoldTime >= holdThreshold) {
        const answer = position === 'right';
        
        setAnswers(prev => [...prev, { 
          question: questions[currentQuestionIndex],
          answer: answer ? 'YES' : 'NO'
        }]);
        
        setPositionHoldTime(0);
        setHoldProgress(0);
        setCurrentPosition('center');
        
        // Move to next question or end game
        if (currentQuestionIndex + 1 >= questions.length) {
          setGameEnded(true);
        } else {
          setCurrentQuestionIndex(prev => prev + 1);
        }
      }
    } else {
      setPositionHoldTime(0);
      setHoldProgress(0);
    }
    
    lastPositionTimeRef.current = now;
  };

  const startDetection = async () => {
    const detect = async () => {
      const videoEl = videoRef.current;
      const canvas = canvasRef.current;
      
      if (!videoEl || !canvas || videoEl.paused || videoEl.ended || !faceDetectorOptionsRef.current) {
        animationFrameRef.current = setTimeout(detect, 200); // Slower retry when not ready
        return;
      }

      try {
        const result = await window.faceapi.detectSingleFace(videoEl, faceDetectorOptionsRef.current);

        if (result) {
          setFaceDetected(true);
          
          // Only setup canvas once or when dimensions change
          if (canvas.width !== videoEl.videoWidth || canvas.height !== videoEl.videoHeight) {
            canvas.width = videoEl.videoWidth;
            canvas.height = videoEl.videoHeight;
          }
          
          const ctx = canvas.getContext('2d');
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          
          // Skip drawing detection box for better performance
          // window.faceapi.draw.drawDetections(canvas, resizedResult);
          
          // Get position and handle game logic
          const position = getPositionFromDetection(result);
          setCurrentPosition(position);
          
          // Start game when face is detected
          if (!gameStarted && !gameEnded) {
            setGameStarted(true);
          }
          
          // Handle position holding
          if (gameStarted && !gameEnded) {
            handlePositionHold(position);
          }
        } else {
          setFaceDetected(false);
          setCurrentPosition('center');
          setPositionHoldTime(0);
          setHoldProgress(0);
        }
      } catch (error) {
        console.error('Detection error:', error);
      }

      // Run detection every 150ms instead of 100ms for better performance
      animationFrameRef.current = setTimeout(detect, 150);
    };

    detect();
  };

  const restartGame = () => {
    setGameStarted(false);
    setGameEnded(false);
    setCurrentQuestionIndex(0);
    setAnswers([]);
    setPositionHoldTime(0);
    setHoldProgress(0);
    setCurrentPosition('center');
  };

  const getVideoContainerClass = () => {
    let baseClass = "relative w-full overflow-hidden transition-all duration-300 rounded-2xl ";
    
    switch(currentPosition) {
      case 'left':
        return baseClass + "ring-4 ring-red-400 shadow-xl shadow-red-400/30";
      case 'right':
        return baseClass + "ring-4 ring-green-400 shadow-xl shadow-green-400/30";
      default:
        return baseClass + "ring-2 ring-white/20";
    }
  };

  // Loading Screen
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-20 w-20 border-b-2 border-white mx-auto mb-6"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Camera size={32} className="text-white" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Loading Face Detection...</h2>
          <p className="text-white/70 text-sm">This will only take a few seconds</p>
        </div>
      </div>
    );
  }

  // Camera Permission Screen
  if (cameraPermission === 'pending' && !videoRef.current?.srcObject) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-teal-900 to-green-900 flex items-center justify-center p-4">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20">
            <Shield size={64} className="mx-auto text-white mb-6" />
            <h1 className="text-3xl font-bold text-white mb-4">Head Lean Filter</h1>
            <p className="text-white/80 mb-6">
              Lean your head LEFT for NO, RIGHT for YES!<br/>
              We need camera access to track your head movements.
            </p>
            <button
              onClick={requestCameraPermission}
              className="bg-gradient-to-r from-blue-500 to-teal-500 text-white px-8 py-4 rounded-full text-lg font-semibold hover:from-blue-600 hover:to-teal-600 transition-all duration-300 shadow-lg w-full flex items-center justify-center space-x-2"
            >
              <Camera size={24} />
              <span>Allow Camera Access</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Camera Permission Denied
  if (cameraPermission === 'denied') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 via-pink-900 to-purple-900 flex items-center justify-center p-4">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20">
            <XCircle size={64} className="mx-auto text-red-400 mb-6" />
            <h1 className="text-3xl font-bold text-white mb-4">Camera Access Required</h1>
            <p className="text-white/80 mb-6">
              Please allow camera access in your browser settings and refresh the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-6 py-3 rounded-full font-semibold hover:scale-105 transition-all duration-300"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Game Results Screen
  if (gameEnded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-500 via-teal-500 to-blue-500 flex items-center justify-center p-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-white/20 backdrop-blur-xl rounded-3xl p-8 border border-white/30">
            <CheckCircle size={80} className="mx-auto text-green-300 mb-6" />
            <h1 className="text-4xl font-bold text-white mb-6">All Done!</h1>
            
            {/* Show Answers */}
            <div className="bg-white/10 rounded-2xl p-6 mb-6">
              <h3 className="text-xl font-bold text-white mb-4">Your Answers:</h3>
              <div className="space-y-3">
                {answers.map((answer, index) => (
                  <div key={index} className="bg-white/10 rounded-lg p-3">
                    <div className="text-white font-medium">{answer.question}</div>
                    <div className={`text-lg font-bold ${answer.answer === 'YES' ? 'text-green-300' : 'text-red-300'}`}>
                      {answer.answer}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={restartGame}
              className="bg-gradient-to-r from-white to-gray-100 text-gray-800 px-8 py-4 rounded-full text-xl font-bold hover:scale-105 transition-all duration-300 shadow-xl flex items-center justify-center space-x-3 mx-auto"
            >
              <RotateCcw size={24} />
              <span>Play Again</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main Game Interface
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600">
      
      {/* Current Question */}
      {gameStarted && (
        <div className="absolute top-4 left-0 right-0 z-10 p-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white/20 backdrop-blur-xl rounded-2xl p-6 border border-white/30 text-center">
              <div className="text-white/80 text-sm mb-2">
                Question {currentQuestionIndex + 1} of {questions.length}
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-white">
                {questions[currentQuestionIndex]}
              </h2>
              <div className="mt-4 text-white/90">
                👈 Lean LEFT for NO • Lean RIGHT for YES 👉
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Camera View */}
      <div className="p-4 pt-32">
        <div className="max-w-4xl mx-auto">
          <div className={getVideoContainerClass()}>
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-[60vh] md:h-[70vh] object-cover transform scale-x-[-1]"
            />
            <canvas
              ref={canvasRef}
              className="absolute top-0 left-0 w-full h-full pointer-events-none transform scale-x-[-1]"
            />
            
            {/* Position Indicators */}
            <div className={`absolute top-1/2 left-6 transform -translate-y-1/2 w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center text-white font-bold text-lg transition-all duration-300 ${
              currentPosition === 'left' ? 'bg-red-500 scale-110 shadow-lg' : 'bg-red-500/40'
            }`}>
              NO
            </div>
            <div className={`absolute top-1/2 right-6 transform -translate-y-1/2 w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center text-white font-bold text-lg transition-all duration-300 ${
              currentPosition === 'right' ? 'bg-green-500 scale-110 shadow-lg' : 'bg-green-500/40'
            }`}>
              YES
            </div>

            {/* Progress Bar */}
            {holdProgress > 0 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-64 bg-white/20 rounded-full h-3 overflow-hidden">
                <div 
                  className={`h-full transition-all duration-100 ${
                    currentPosition === 'left' ? 'bg-red-400' : 'bg-green-400'
                  }`}
                  style={{ width: `${holdProgress}%` }}
                />
              </div>
            )}

            {/* Face Detection Status */}
            {!faceDetected && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-2xl">
                <div className="text-white text-center p-4">
                  <Camera size={48} className="mx-auto mb-2" />
                  <div className="text-xl font-bold">Position your face in the camera</div>
                  <div className="text-sm opacity-80">Make sure you're in good lighting</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="absolute bottom-4 left-0 right-0 p-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-3 border border-white/20">
            <p className="text-white text-sm">
              Hold your head position for 1.5 seconds to confirm your answer
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GamePage;