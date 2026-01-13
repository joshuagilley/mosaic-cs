'use client';

import Link from 'next/link';

export default function Home() {
  // Hexagonal mosaic tiles arranged in circular pattern
  // Using polar coordinates: (radius, angle) where angle is in degrees
  const tiles = [
    // Center
    { id: 0, name: 'Coming Soon', path: '#', description: 'More tools coming...', radius: 0, angle: 0 },
    
    // Inner ring (6 hexagons)
    { id: 1, name: 'Vektor', path: '/vektor', description: 'Linear Algebra Playground', radius: 1, angle: 210 }, // Bottom-left
    { id: 2, name: 'Coming Soon', path: '#', description: 'More tools coming...', radius: 1, angle: 270 }, // Bottom
    { id: 3, name: 'Coming Soon', path: '#', description: 'More tools coming...', radius: 1, angle: 330 }, // Bottom-right
    { id: 4, name: 'Coming Soon', path: '#', description: 'More tools coming...', radius: 1, angle: 30 }, // Top-right
    { id: 5, name: 'Coming Soon', path: '#', description: 'More tools coming...', radius: 1, angle: 90 }, // Top
    { id: 6, name: 'Coming Soon', path: '#', description: 'More tools coming...', radius: 1, angle: 150 }, // Top-left
  ];

  // Hexagon size and spacing
  const hexSize = 120; // Size of hexagon (distance from center to vertex)
  const hexSpacing = 1.8; // Multiplier for spacing between hexagons

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 md:p-24 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="w-full max-w-7xl">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-center text-gray-900 dark:text-white">
          Welcome to Mosaic
        </h1>
        <p className="text-lg md:text-xl text-center mb-12 text-gray-600 dark:text-gray-400">
          A sandbox environment for mathematical computing and exploration
        </p>

        {/* Hexagonal Mosaic Layout */}
        <div className="flex justify-center items-center min-h-[500px] md:min-h-[600px]">
          <div className="relative" style={{ width: `${hexSize * hexSpacing * 3}px`, height: `${hexSize * hexSpacing * 3}px` }}>
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
  tile: { id: number; name: string; path: string; description: string; radius: number; angle: number }; 
  x: number; 
  y: number; 
  size: number;
}) {
  const isClickable = tile.path !== '#';
  
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
          : 'opacity-60'
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
          ? 'bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 text-white border-2 border-blue-400 dark:border-blue-500 shadow-lg hover:shadow-2xl' 
          : 'bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-700 dark:to-gray-800 text-gray-700 dark:text-gray-300 border-2 border-gray-400 dark:border-gray-600'
        }
      `}>
        <h3 className="text-lg md:text-xl font-bold mb-1 md:mb-2 text-center">
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
