'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function Home() {
  const [hoveredTile, setHoveredTile] = useState<number | null>(null);

  // Top-level CS topics arranged in honeycomb pattern
  // Arranged for 2-3-2 pattern with Computer Science (id: 0) in center
  const tiles = [
    // Top row (2 hexagons) - Algorithms first, then Data Science to the right
    { id: 5, name: 'Algorithms & Theory', path: '#', description: 'Computational theory', color: 'from-indigo-500 to-indigo-600', subTopics: ['Coming Soon', 'Coming Soon', 'Coming Soon', 'Coming Soon', 'Coming Soon', 'Coming Soon'] },
    { id: 1, name: 'Data Science', path: '/data-science', description: 'Data analysis & visualization', color: 'from-blue-500 to-blue-600', subTopics: ['Vektor', 'Coming Soon', 'Coming Soon', 'Coming Soon', 'Coming Soon', 'Coming Soon'] },
    
    // Middle row (3 hexagons - Computer Science center, Software Engineering swapped to right)
    { id: 6, name: 'Computer Systems', path: '#', description: 'Systems & architecture', color: 'from-teal-500 to-teal-600', subTopics: ['Coming Soon', 'Coming Soon', 'Coming Soon', 'Coming Soon', 'Coming Soon', 'Coming Soon'] },
    { id: 0, name: 'Computer Science', path: '#', description: 'Explore CS Topics', color: 'from-purple-500 to-purple-600' },
    { id: 3, name: 'Software Engineering', path: '#', description: 'Development practices', color: 'from-yellow-500 to-yellow-600', subTopics: ['Coming Soon', 'Coming Soon', 'Coming Soon', 'Coming Soon', 'Coming Soon', 'Coming Soon'] },
    
    // Bottom row (2 hexagons)
    { id: 2, name: 'AI/ML', path: '#', description: 'Artificial Intelligence', color: 'from-green-500 to-green-600', subTopics: ['Coming Soon', 'Coming Soon', 'Coming Soon', 'Coming Soon', 'Coming Soon', 'Coming Soon'] },
    { id: 4, name: 'Cybersecurity', path: '#', description: 'Security & privacy', color: 'from-red-500 to-red-600', subTopics: ['Coming Soon', 'Coming Soon', 'Coming Soon', 'Coming Soon', 'Coming Soon', 'Coming Soon'] },
  ];

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 md:p-24 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="w-full max-w-7xl relative">
        <h1 className="text-5xl md:text-6xl font-black mb-4 text-left text-gray-900 dark:text-white tracking-tight absolute top-0 left-0 z-10" style={{ fontFamily: 'system-ui, -apple-system, sans-serif', letterSpacing: '-0.02em' }}>
          MOSAIC
        </h1>

        {/* Hexagonal Mosaic Layout */}
        <div className="flex justify-center items-center min-h-[600px] md:min-h-[700px]">
          <div className="hexagon-main">
            {/* Row 1: 2 hexagons (offset) */}
            <div className="hex-row offset">
              <HexagonTile
                tile={tiles[0]}
                index={0}
                hoveredTile={hoveredTile}
                setHoveredTile={setHoveredTile}
              />
              <HexagonTile
                tile={tiles[1]}
                index={1}
                hoveredTile={hoveredTile}
                setHoveredTile={setHoveredTile}
              />
            </div>
            
            {/* Row 2: 3 hexagons (center row, no offset) */}
            <div className="hex-row">
              <HexagonTile
                tile={tiles[2]}
                index={2}
                hoveredTile={hoveredTile}
                setHoveredTile={setHoveredTile}
              />
              <HexagonTile
                tile={tiles[3]}
                index={3}
                hoveredTile={hoveredTile}
                setHoveredTile={setHoveredTile}
              />
              <HexagonTile
                tile={tiles[4]}
                index={4}
                hoveredTile={hoveredTile}
                setHoveredTile={setHoveredTile}
              />
            </div>
            
            {/* Row 3: 2 hexagons (offset) */}
            <div className="hex-row offset">
              <HexagonTile
                tile={tiles[5]}
                index={5}
                hoveredTile={hoveredTile}
                setHoveredTile={setHoveredTile}
              />
              <HexagonTile
                tile={tiles[6]}
                index={6}
                hoveredTile={hoveredTile}
                setHoveredTile={setHoveredTile}
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function HexagonTile({ 
  tile, 
  index: _index,
  hoveredTile,
  setHoveredTile
}: { 
  tile: { id: number; name: string; path: string; description: string; color: string; subTopics?: string[] }; 
  index: number;
  hoveredTile: number | null;
  setHoveredTile: (id: number | null) => void;
}) {
  const isClickable = tile.path !== '#';
  const isCenter = tile.id === 0; // Center is the one with id 0, not necessarily index 0
  const isHovered = hoveredTile === tile.id;
  const hasHoveredTile = hoveredTile !== null && hoveredTile !== tile.id;
  
  const hexSize = 160;
  
  // Calculate push-away effect for non-hovered tiles
  let pushScale = 1;
  let pushOpacity = 1;
  
  if (hasHoveredTile && !isHovered) {
    pushScale = 0.6;
    pushOpacity = 0.3;
  }

  // Generate sub-hexagon positions in honeycomb pattern (matching main layout)
  // Helper function to calculate honeycomb positions - matches the CSS flexbox layout
  const calculateHoneycombPositions = (centerX: number, centerY: number, hexSize: number, items: string[], spacing: number = 5) => {
    const hexHeight = hexSize * 1.1547; // Height of pointy-top hexagon
    const rowOverlap = hexHeight * 0.2886; // Vertical overlap between rows (matches CSS margin-top: -0.2886)
    
    // Add subtle spacing (fixed pixel amount) to distances
    const horizontalDistance = hexSize + spacing;
    const verticalDistance = hexHeight + spacing;
    
    // Pattern matches main layout: 2-3-2 (but with center removed, so 2-2-2)
    // Top row (offset): 2 hexagons centered between middle row positions, filling gaps above
    // Middle row: 2 hexagons (left and right of center)
    // Bottom row (offset): 2 hexagons centered between middle row positions, filling gaps below
    
    // Top row (offset) - centered between middle row positions to nest into gaps above (moved up a bit)
    const topLeft = { x: centerX - horizontalDistance / 2, y: centerY - verticalDistance + rowOverlap - spacing, name: items[0] || 'Coming Soon', index: 0 };
    const topRight = { x: centerX + horizontalDistance / 2, y: centerY - verticalDistance + rowOverlap - spacing, name: items[1] || 'Coming Soon', index: 1 };
    
    // Middle row - directly left and right of center
    const middleLeft = { x: centerX - horizontalDistance, y: centerY, name: items[2] || 'Coming Soon', index: 2 };
    const middleRight = { x: centerX + horizontalDistance, y: centerY, name: items[3] || 'Coming Soon', index: 3 };
    
    // Bottom row (offset) - centered between middle row positions to nest into gaps below (moved down a bit)
    const bottomLeft = { x: centerX - horizontalDistance / 2, y: centerY + verticalDistance - rowOverlap + spacing, name: items[4] || 'Coming Soon', index: 4 };
    const bottomRight = { x: centerX + horizontalDistance / 2, y: centerY + verticalDistance - rowOverlap + spacing, name: items[5] || 'Coming Soon', index: 5 };
    
    return [topLeft, topRight, middleLeft, middleRight, bottomLeft, bottomRight];
  };

  const subHexPositions = isClickable && tile.subTopics ? calculateHoneycombPositions(0, 0, hexSize, tile.subTopics, 5) : [];

  // Helper to get path for sub-topic
  const getSubTopicPath = (name: string) => {
    if (name === 'Vektor') return '/data-science/vektor';
    return '#';
  };

  const content = (
    <div 
      className="relative" 
      style={{ transform: isHovered && isClickable ? 'scale(1.2)' : `scale(${pushScale})`, zIndex: isHovered ? 100 : (isClickable ? 10 : 1), opacity: isHovered ? 1 : pushOpacity }}
      onMouseEnter={() => isClickable && setHoveredTile(tile.id)}
      onMouseLeave={() => setHoveredTile(null)}
    >
      <div
        className={`
          hexagon-item
          transition-all duration-700 ease-out
          flex flex-col items-center justify-center
          ${isClickable 
            ? 'cursor-pointer' 
            : isCenter 
              ? 'opacity-80' 
              : 'opacity-50'
          }
        `}
      >
        <div className={`
          w-full h-full
          flex flex-col items-center justify-center
          p-4 md:p-6
          transition-all duration-700
          ${isClickable 
            ? `bg-gradient-to-br ${tile.color} dark:${tile.color} text-white shadow-lg ${isHovered ? 'shadow-2xl' : ''}` 
            : isCenter
              ? 'bg-gradient-to-br from-gray-400 to-gray-500 dark:from-gray-600 dark:to-gray-700 text-white'
              : 'bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-700 dark:to-gray-800 text-gray-700 dark:text-gray-300'
          }
        `}>
          <h3 className={`${isCenter ? 'text-xl md:text-2xl' : 'text-base md:text-lg'} font-bold mb-1 md:mb-2 text-center transition-all duration-700 ${isHovered ? 'scale-110' : ''}`}>
            {tile.name}
          </h3>
          <p className={`text-xs md:text-sm text-center opacity-90 transition-all duration-700 ${isHovered ? 'opacity-100' : ''}`}>
            {tile.description}
          </p>
        </div>
      </div>

      {/* Sub-hexagons that appear on hover - positioned outside clipped hexagon in honeycomb pattern */}
      {isHovered && isClickable && subHexPositions.length > 0 && (
        <div 
          className="absolute"
          style={{
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: 0,
            height: 0,
          }}
        >
          {subHexPositions.map((subHex, subIndex) => {
            const subHexH = Math.round(hexSize * 1.1547);
            const subHexClip = "polygon(0% 25%, 0% 75%, 50% 100%, 100% 75%, 100% 25%, 50% 0%)";
            const subHexPath = getSubTopicPath(subHex.name);
            const subHexClickable = subHexPath !== '#';

            const subHexElement = (
              <div
                className={`absolute transition-all duration-500 ease-out ${subHexClickable ? 'cursor-pointer' : ''}`}
                style={{
                  left: `${subHex.x}px`,
                  top: `${subHex.y}px`,
                  transform: 'translate(-50%, -50%)',
                  width: `${hexSize}px`,
                  height: `${subHexH}px`,
                  clipPath: subHexClip,
                  WebkitClipPath: subHexClip,
                  opacity: 0,
                  animation: `fadeIn 0.4s ease-out ${subIndex * 80}ms forwards`,
                }}
              >
                <div className={`
                  w-full h-full
                  flex flex-col items-center justify-center
                  p-4 md:p-6
                  bg-gradient-to-br from-white/25 to-white/15 dark:from-white/15 dark:to-white/8
                  border border-white/40 dark:border-white/30
                  backdrop-blur-md
                  text-white
                  text-sm md:text-base
                  font-semibold
                  shadow-lg
                  ${subHexClickable ? 'hover:scale-110' : ''}
                `}>
                  {subHex.name}
                </div>
              </div>
            );

            if (subHexClickable) {
              return (
                <Link key={subIndex} href={subHexPath}>
                  {subHexElement}
                </Link>
              );
            }

            return <div key={subIndex}>{subHexElement}</div>;
          })}
        </div>
      )}
    </div>
  );

  if (isClickable) {
    return (
      <Link href={tile.path} className="inline-block align-top">
        {content}
      </Link>
    );
  }

  return content;
}
