'use client';

import Link from 'next/link';

export default function Home() {
  // Top-level CS topics arranged in circular pattern
  // Using polar coordinates: (radius, angle) where angle is in degrees
  const tiles = [
    // Center
    { id: 0, name: 'Computer Science', path: '#', description: 'Explore CS Topics', radius: 0, angle: 0, color: 'from-purple-500 to-purple-600' },
    
    // Outer ring (8 hexagons for main CS topics)
    { id: 1, name: 'Data Science', path: '/data-science', description: 'Data analysis & visualization', radius: 1, angle: 0, color: 'from-blue-500 to-blue-600' }, // Top
    { id: 2, name: 'AI/ML', path: '#', description: 'Artificial Intelligence', radius: 1, angle: 45, color: 'from-green-500 to-green-600' }, // Top-right
    { id: 3, name: 'Software Engineering', path: '#', description: 'Development practices', radius: 1, angle: 90, color: 'from-yellow-500 to-yellow-600' }, // Right
    { id: 4, name: 'Cybersecurity', path: '#', description: 'Security & privacy', radius: 1, angle: 135, color: 'from-red-500 to-red-600' }, // Bottom-right
    { id: 5, name: 'Algorithms & Theory', path: '#', description: 'Computational theory', radius: 1, angle: 180, color: 'from-indigo-500 to-indigo-600' }, // Bottom
    { id: 6, name: 'Computer Systems', path: '#', description: 'Systems & architecture', radius: 1, angle: 225, color: 'from-teal-500 to-teal-600' }, // Bottom-left
    { id: 7, name: 'HCI', path: '#', description: 'Human-Computer Interaction', radius: 1, angle: 270, color: 'from-pink-500 to-pink-600' }, // Left
    { id: 8, name: 'Graphics', path: '#', description: 'Computer graphics', radius: 1, angle: 315, color: 'from-orange-500 to-orange-600' }, // Top-left
  ];

  // Hexagon size and spacing
  const hexSize = 100; // Size of hexagon (distance from center to vertex)
  const hexSpacing = 2.2; // Multiplier for spacing between hexagons

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 md:p-24 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="w-full max-w-7xl relative">
        <h1 className="text-5xl md:text-6xl font-black mb-4 text-left text-gray-900 dark:text-white tracking-tight absolute top-0 left-0" style={{ fontFamily: 'system-ui, -apple-system, sans-serif', letterSpacing: '-0.02em' }}>
          MOSAIC
        </h1>

        {/* Hexagonal Mosaic Layout */}
        <div className="flex justify-center items-center min-h-[600px] md:min-h-[700px]">
          <div className="relative" style={{ width: `${hexSize * hexSpacing * 4}px`, height: `${hexSize * hexSpacing * 4}px` }}>
            {tiles.map((tile) => {
              // Convert polar to cartesian coordinates
              const angleRad = (tile.angle * Math.PI) / 180;
              const x = tile.radius * hexSize * hexSpacing * Math.cos(angleRad);
              const y = tile.radius * hexSize * hexSpacing * Math.sin(angleRad);
              
              return (
                <HexagonTile
                  key={tile.id}
                  tile={tile}
                  x={x}
                  y={y}
                  size={hexSize}
                />
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}

function HexagonTile({ 
  tile, 
  x, 
  y, 
  size 
}: { 
  tile: { id: number; name: string; path: string; description: string; radius: number; angle: number; color: string }; 
  x: number; 
  y: number; 
  size: number;
}) {
  const isClickable = tile.path !== '#';
  const isCenter = tile.radius === 0;
  
  // Create hexagon points for clip-path
  const hexPoints = Array.from({ length: 6 }, (_, i) => {
    const angle = (Math.PI / 3) * i;
    const px = 50 + 50 * Math.cos(angle);
    const py = 50 + 50 * Math.sin(angle);
    return `${px}% ${py}%`;
  }).join(', ');

  const content = (
    <div
      className={`
        absolute
        transition-all duration-300
        flex flex-col items-center justify-center
        ${isClickable 
          ? 'hover:scale-110 hover:z-50 cursor-pointer' 
          : isCenter 
            ? 'opacity-80' 
            : 'opacity-50'
        }
      `}
      style={{
        left: `calc(50% + ${x}px)`,
        top: `calc(50% + ${y}px)`,
        transform: 'translate(-50%, -50%)',
        width: `${size * 2}px`,
        height: `${size * 2}px`,
        clipPath: `polygon(${hexPoints})`,
      }}
    >
      <div className={`
        w-full h-full
        flex flex-col items-center justify-center
        p-4 md:p-6
        ${isClickable 
          ? `bg-gradient-to-br ${tile.color} dark:${tile.color} text-white border-2 border-opacity-50 shadow-lg hover:shadow-2xl` 
          : isCenter
            ? 'bg-gradient-to-br from-gray-400 to-gray-500 dark:from-gray-600 dark:to-gray-700 text-white border-2 border-gray-500 dark:border-gray-600'
            : 'bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-700 dark:to-gray-800 text-gray-700 dark:text-gray-300 border-2 border-gray-400 dark:border-gray-600'
        }
      `}>
        <h3 className={`${isCenter ? 'text-xl md:text-2xl' : 'text-base md:text-lg'} font-bold mb-1 md:mb-2 text-center`}>
          {tile.name}
        </h3>
        <p className="text-xs md:text-sm text-center opacity-90">
          {tile.description}
        </p>
      </div>
    </div>
  );

  if (isClickable) {
    return (
      <Link href={tile.path} className="block">
        {content}
      </Link>
    );
  }

  return content;
}
