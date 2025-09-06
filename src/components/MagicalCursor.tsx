import React, { useEffect, useState } from 'react';

interface CursorTrail {
  id: number;
  x: number;
  y: number;
  timestamp: number;
}

const MagicalCursor: React.FC = () => {
  const [trails, setTrails] = useState<CursorTrail[]>([]);
  const [isInteracting, setIsInteracting] = useState(false);

  useEffect(() => {
    let trailId = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const newTrail: CursorTrail = {
        id: trailId++,
        x: e.clientX,
        y: e.clientY,
        timestamp: Date.now()
      };

      setTrails(prev => {
        const filtered = prev.filter(trail => Date.now() - trail.timestamp < 1000);
        return [...filtered, newTrail].slice(-15); // Keep last 15 trails
      });
    };

    const handleMouseDown = () => setIsInteracting(true);
    const handleMouseUp = () => setIsInteracting(false);

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseup', handleMouseUp);

    // Clean up old trails
    const cleanupInterval = setInterval(() => {
      setTrails(prev => prev.filter(trail => Date.now() - trail.timestamp < 1000));
    }, 100);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mouseup', handleMouseUp);
      clearInterval(cleanupInterval);
    };
  }, []);

  // Don't show cursor effects on mobile or if user prefers reduced motion
  if (window.innerWidth < 768 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return null;
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999]">
      {trails.map((trail, index) => {
        const age = Date.now() - trail.timestamp;
        const opacity = Math.max(0, 1 - age / 1000);
        const scale = Math.max(0.1, 1 - age / 1000);
        
        return (
          <div
            key={trail.id}
            className={`absolute w-2 h-2 rounded-full transition-all duration-100 ${
              isInteracting 
                ? 'bg-gradient-to-r from-pink-400 to-purple-600' 
                : 'bg-gradient-to-r from-blue-400 to-cyan-500'
            }`}
            style={{
              left: trail.x - 4,
              top: trail.y - 4,
              opacity,
              transform: `scale(${scale})`,
              animationDelay: `${index * 50}ms`
            }}
          />
        );
      })}
      
      {/* Main cursor replacement for interactive elements */}
      {isInteracting && trails.length > 0 && (
        <div
          className="absolute w-8 h-8 pointer-events-none"
          style={{
            left: trails[trails.length - 1]?.x - 16,
            top: trails[trails.length - 1]?.y - 16,
          }}
        >
          <div className="w-full h-full rounded-full bg-gradient-to-r from-pink-400 to-purple-600 animate-ping opacity-75" />
          <div className="absolute inset-2 rounded-full bg-white animate-pulse" />
        </div>
      )}
    </div>
  );
};

export default MagicalCursor;