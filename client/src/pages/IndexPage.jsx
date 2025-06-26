import React, { useState, useEffect } from 'react';
import { Play } from 'lucide-react';

const IndexPage = () => {
  const [isHovered, setIsHovered] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handlePlayClick = () => {
    // Navigate to the shield plans learning game
    console.log('Starting Shield Quest game!');
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-blue-900 via-teal-900 to-green-900">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        {/* Floating Orbs - Health/Protection themed colors */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-72 h-72 bg-teal-400 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse delay-1000"></div>
        <div className="absolute bottom-1/4 left-1/2 w-80 h-80 bg-green-400 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse delay-2000"></div>
        
        {/* Medical Cross Pattern */}
        <div className="absolute top-10 right-10 opacity-10">
          <div className="w-16 h-4 bg-white rounded"></div>
          <div className="w-4 h-16 bg-white rounded absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
        </div>
        <div className="absolute bottom-20 left-10 opacity-10">
          <div className="w-12 h-3 bg-white rounded"></div>
          <div className="w-3 h-12 bg-white rounded absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
        </div>
        
        {/* Gradient Overlay with Mouse Tracking */}
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            background: `radial-gradient(600px circle at ${mousePosition.x}% ${mousePosition.y}%, rgba(255,255,255,0.1), transparent 40%)`
          }}
        ></div>
        
        {/* Animated Grid */}
        <div className="absolute inset-0 opacity-10">
          <div className="grid grid-cols-8 grid-rows-8 h-full">
            {Array.from({ length: 64 }).map((_, i) => (
              <div 
                key={i}
                className="border border-white/20 animate-pulse"
                style={{ animationDelay: `${i * 0.1}s` }}
              ></div>
            ))}
          </div>
        </div>
        
        {/* Shield and Health Icons */}
        <div className="absolute top-1/3 right-1/4 opacity-20 animate-bounce">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
        </div>
        <div className="absolute bottom-1/3 left-1/4 opacity-20 animate-bounce delay-1000">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white">
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7z"/>
          </svg>
        </div>
        <div className="absolute top-1/2 left-1/6 opacity-20 animate-bounce delay-2000">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 6v6l4 2"/>
          </svg>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen px-4">
        <div className="flex flex-col items-center text-center w-full">
          {/* Main Play Button - Perfectly Centered */}
          <div className="flex items-center justify-center mb-8">
            <button
              onClick={handlePlayClick}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              className={`
                group relative overflow-hidden
                w-32 h-32 md:w-40 md:h-40 lg:w-48 lg:h-48
                bg-white/10 backdrop-blur-lg
                border border-white/20
                rounded-full
                flex items-center justify-center
                transition-all duration-500 ease-out
                hover:scale-110 hover:bg-white/20
                shadow-2xl hover:shadow-teal-500/50
                ${isHovered ? 'animate-pulse' : ''}
              `}
            >
              {/* Button Glow Effect */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 via-teal-500 to-green-500 opacity-0 group-hover:opacity-20 transition-opacity duration-500"></div>
              
              {/* Shield Background */}
              <div className="absolute inset-4 rounded-full bg-gradient-to-br from-blue-500/20 to-teal-500/20 opacity-50"></div>
              
              {/* Ripple Effect */}
              <div className="absolute inset-0 rounded-full border-2 border-white/30 animate-ping"></div>
              <div className="absolute inset-0 rounded-full border-2 border-white/20 animate-ping delay-1000"></div>
              
              {/* Play Icon */}
              <Play 
                size={isHovered ? 56 : 48}
                className="text-white transition-all duration-300 drop-shadow-lg ml-2"
                fill="white"
              />
            </button>
          </div>

          {/* Title Text */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white">
            <span className="bg-gradient-to-r from-blue-400 via-teal-400 to-green-400 bg-clip-text text-transparent animate-pulse">
              Shield Quest
            </span>
          </h1>
          
          {/* Subtitle */}
          <p className="mt-4 text-lg md:text-xl text-white/80 max-w-2xl mx-auto">
            Learn about Integrated Shield Plans through an interactive adventure.<br/>
            <span className="text-teal-300">Protect your health, secure your future!</span>
          </p>

          {/* Decorative Elements - Insurance themed */}
          <div className="flex justify-center mt-8 space-x-4">
            <div className="flex items-center text-white/60 text-sm">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-1">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              Protection
            </div>
            <div className="flex items-center text-white/60 text-sm">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-1">
                <path d="M9 12l2 2 4-4"/>
                <path d="M21 12c.552 0 1-.448 1-1V8a2 2 0 0 0-2-2h-1a2 2 0 0 1-2-2V3a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v1a2 2 0 0 1-2 2H3a2 2 0 0 0-2 2v3c0 .552.448 1 1 1"/>
              </svg>
              Learning
            </div>
            <div className="flex items-center text-white/60 text-sm">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-1">
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7z"/>
              </svg>
              Health
            </div>
          </div>
          
          {/* Game Description */}
          <div className="mt-12 max-w-3xl mx-auto">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <h3 className="text-xl font-semibold text-white mb-3">What You'll Learn</h3>
              <div className="grid md:grid-cols-3 gap-4 text-sm text-white/80">
                <div className="text-center">
                  <div className="w-8 h-8 bg-blue-500/30 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-white font-bold">1</span>
                  </div>
                  <p>Understanding Shield Plans</p>
                </div>
                <div className="text-center">
                  <div className="w-8 h-8 bg-teal-500/30 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-white font-bold">2</span>
                  </div>
                  <p>Coverage Benefits</p>
                </div>
                <div className="text-center">
                  <div className="w-8 h-8 bg-green-500/30 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-white font-bold">3</span>
                  </div>
                  <p>Making Smart Choices</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1200 120" className="w-full h-24 fill-white/5">
          <path d="M0,60 C300,100 900,20 1200,60 L1200,120 L0,120 Z">
            <animate
              attributeName="d"
              dur="10s"
              repeatCount="indefinite"
              values="M0,60 C300,100 900,20 1200,60 L1200,120 L0,120 Z;
                      M0,40 C300,80 900,40 1200,80 L1200,120 L0,120 Z;
                      M0,60 C300,100 900,20 1200,60 L1200,120 L0,120 Z"
            />
          </path>
        </svg>
      </div>
    </div>
  );
};

export default IndexPage;