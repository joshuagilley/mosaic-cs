'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';

export default function VektorPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [matrix, setMatrix] = useState([[1, 0], [0, 1]]);
  const [originalGrid, setOriginalGrid] = useState<number[][]>([]);
  const [transformedGrid, setTransformedGrid] = useState<number[][]>([]);
  const [vector] = useState([2, 1]);
  const [transformedVector, setTransformedVector] = useState([2, 1]);
  const [eigenvectors, setEigenvectors] = useState<number[][] | null>(null);
  const [eigenvalues, setEigenvalues] = useState<number[] | number[][] | null>(null);
  const [determinant, setDeterminant] = useState(1);
  const [showEigen, setShowEigen] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [showVector, setShowVector] = useState(true);
  const [pcaData, setPcaData] = useState<number[][] | null>(null);
  const [pcaResult, setPcaResult] = useState<any>(null);
  const [currentMode, setCurrentMode] = useState('Transform');
  const [error, setError] = useState<string | null>(null);

  const API_BASE = typeof window !== 'undefined' ? window.location.origin : '';

  const updateMatrix = useCallback(async () => {
    try {
      // Transform grid
      const transformResponse = await fetch(`${API_BASE}/api/transform`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matrix: matrix,
          grid_size: 20,
          grid_range: 4.0
        })
      });

      if (!transformResponse.ok) {
        throw new Error(`API error: ${transformResponse.status}`);
      }

      const transformData = await transformResponse.json();
      setOriginalGrid(transformData.original || []);
      setTransformedGrid(transformData.transformed || []);

      // Transform vector
      const vectorArray = [vector];
      const vectorResponse = await fetch(`${API_BASE}/api/transform`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matrix: matrix,
          points: vectorArray
        })
      });

      if (!vectorResponse.ok) {
        throw new Error(`Vector API error: ${vectorResponse.status}`);
      }

      const vectorData = await vectorResponse.json();
      if (vectorData.transformed && vectorData.transformed[0]) {
        setTransformedVector(vectorData.transformed[0]);
      }

      // Compute determinant
      const detResponse = await fetch(`${API_BASE}/api/determinant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matrix: matrix })
      });

      const detData = await detResponse.json();
      setDeterminant(detData.determinant);

      // Compute eigenvalues/eigenvectors
      if (showEigen) {
        const eigenResponse = await fetch(`${API_BASE}/api/eigen`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ matrix: matrix })
        });

        const eigenData = await eigenResponse.json();
        setEigenvalues(eigenData.eigenvalues);
        setEigenvectors(eigenData.eigenvectors);
      }

      setError(null);
    } catch (err: any) {
      setError(err.message);
    }
  }, [matrix, vector, showEigen, API_BASE]);

  useEffect(() => {
    if (canvasRef.current) {
      setupCanvas();
    }
  }, []);

  useEffect(() => {
    updateMatrix();
  }, [matrix, showEigen]);

  useEffect(() => {
    if (canvasRef.current) {
      draw();
    }
  }, [originalGrid, transformedGrid, transformedVector, eigenvectors, eigenvalues, showEigen, showGrid, showVector, pcaData, pcaResult, currentMode]);

  function setupCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const width = rect.width || 800;
    const height = rect.height || 800;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
  }

  function handleMatrixChange(row: number, col: number, value: number) {
    const newMatrix = [...matrix];
    newMatrix[row] = [...newMatrix[row]];
    newMatrix[row][col] = value;
    setMatrix(newMatrix);
  }

  function setMatrixValue(newMatrix: number[][]) {
    setMatrix(newMatrix);
  }

  function draw() {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;
    const centerX = width / 2;
    const centerY = height / 2;
    const scale = 60;

    function toCanvas(x: number, y: number) {
      return {
        x: centerX + x * scale,
        y: centerY - y * scale
      };
    }

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#f5f7fa';
    ctx.fillRect(0, 0, width, height);

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Draw axes
    ctx.strokeStyle = '#cbd5e0';
    ctx.lineWidth = 1.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.moveTo(centerX, 0);
    ctx.lineTo(centerX, height);
    ctx.stroke();

    ctx.fillStyle = '#64748b';
    ctx.font = '12px sans-serif';
    ctx.fillText('X', width - 20, centerY - 10);
    ctx.fillText('Y', centerX + 10, 20);

    if (currentMode === 'PCA' && pcaData && pcaResult) {
      drawPCA(ctx, toCanvas, width, height, centerX, centerY);
    } else {
      if (showGrid && originalGrid.length > 0) {
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1.5;
        drawGrid(ctx, originalGrid, toCanvas);
      }

      if (showGrid && transformedGrid.length > 0) {
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2.5;
        drawGrid(ctx, transformedGrid, toCanvas);
      }

      if (showVector) {
        const orig = toCanvas(vector[0], vector[1]);
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 2.5;
        drawArrow(ctx, centerX, centerY, orig.x, orig.y);
      }

      if (showVector) {
        const trans = toCanvas(transformedVector[0], transformedVector[1]);
        ctx.strokeStyle = '#64ffda';
        ctx.lineWidth = 3.5;
        drawArrow(ctx, centerX, centerY, trans.x, trans.y);
      }

      if (showEigen && eigenvectors && eigenvalues) {
        drawEigenvectors(ctx, eigenvectors, eigenvalues, toCanvas, width, height, centerX, centerY);
      }
    }
  }

  function drawGrid(ctx: CanvasRenderingContext2D, points: number[][], toCanvas: (x: number, y: number) => { x: number; y: number }) {
    const totalPoints = points.length;
    const gridSize = Math.sqrt(totalPoints / 2);

    if (!Number.isInteger(gridSize) || gridSize < 2) {
      points.forEach(point => {
        const p = toCanvas(point[0], point[1]);
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2, 0, 2 * Math.PI);
        ctx.fill();
      });
      return;
    }

    const pointsPerLine = gridSize;
    const horizontalStart = 0;
    const verticalStart = gridSize * gridSize;

    for (let i = 0; i < gridSize; i++) {
      ctx.beginPath();
      let first = true;
      for (let j = 0; j < pointsPerLine; j++) {
        const idx = horizontalStart + i * pointsPerLine + j;
        if (idx < points.length) {
          const p = toCanvas(points[idx][0], points[idx][1]);
          if (first) {
            ctx.moveTo(p.x, p.y);
            first = false;
          } else {
            ctx.lineTo(p.x, p.y);
          }
        }
      }
      ctx.stroke();
    }

    for (let j = 0; j < gridSize; j++) {
      ctx.beginPath();
      let first = true;
      for (let i = 0; i < pointsPerLine; i++) {
        const idx = verticalStart + j * pointsPerLine + i;
        if (idx < points.length) {
          const p = toCanvas(points[idx][0], points[idx][1]);
          if (first) {
            ctx.moveTo(p.x, p.y);
            first = false;
          } else {
            ctx.lineTo(p.x, p.y);
          }
        }
      }
      ctx.stroke();
    }
  }

  function drawArrow(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number) {
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    const angle = Math.atan2(y2 - y1, x2 - x1);
    const arrowLength = 12;
    const arrowAngle = Math.PI / 6;

    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(
      x2 - arrowLength * Math.cos(angle - arrowAngle),
      y2 - arrowLength * Math.sin(angle - arrowAngle)
    );
    ctx.moveTo(x2, y2);
    ctx.lineTo(
      x2 - arrowLength * Math.cos(angle + arrowAngle),
      y2 - arrowLength * Math.sin(angle + arrowAngle)
    );
    ctx.stroke();
  }

  function drawEigenvectors(ctx: CanvasRenderingContext2D, eigenvectors: number[][], eigenvalues: number[] | number[][], toCanvas: (x: number, y: number) => { x: number; y: number }, width: number, height: number, centerX: number, centerY: number) {
    const length = 3.0;

    for (let i = 0; i < eigenvectors.length; i++) {
      const eigenvec = eigenvectors[i];
      let eigenval = Array.isArray(eigenvalues) ? eigenvalues[i] : eigenvalues;

      let isComplex = false;
      let realPart = 0;
      let imagPart = 0;

      if (Array.isArray(eigenval) && eigenval.length === 2) {
        realPart = eigenval[0];
        imagPart = eigenval[1];
        isComplex = Math.abs(imagPart) > 1e-10;
      } else {
        realPart = typeof eigenval === 'number' ? eigenval : parseFloat(String(eigenval)) || 0;
        imagPart = 0;
      }

      const magnitude = isComplex ? Math.sqrt(realPart * realPart + imagPart * imagPart) : Math.abs(realPart);
      const scaledLength = length * magnitude;
      const x = eigenvec[0] * scaledLength;
      const y = eigenvec[1] * scaledLength;

      const p = toCanvas(x, y);
      const sign = realPart >= 0 ? 1 : -1;
      ctx.strokeStyle = sign >= 0 ? '#10b981' : '#f59e0b';
      ctx.lineWidth = 3.5;
      drawArrow(ctx, centerX, centerY, p.x, p.y);

      ctx.fillStyle = sign >= 0 ? '#10b981' : '#f59e0b';
      ctx.font = 'bold 12px sans-serif';
      let label;
      if (isComplex && Math.abs(imagPart) > 0.01) {
        const realStr = realPart.toFixed(2);
        const imagStr = Math.abs(imagPart).toFixed(2);
        const signStr = imagPart >= 0 ? '+' : '-';
        label = `λ${i + 1} = ${realStr}${signStr}${imagStr}i`;
      } else {
        label = `λ${i + 1} = ${realPart.toFixed(2)}`;
      }
      ctx.fillText(label, p.x + 10, p.y - 10);
    }
  }

  function drawPCA(ctx: CanvasRenderingContext2D, toCanvas: (x: number, y: number) => { x: number; y: number }, width: number, height: number, centerX: number, centerY: number) {
    ctx.fillStyle = '#8b5cf6';
    ctx.beginPath();
    pcaData!.forEach(point => {
      const p = toCanvas(point[0], point[1]);
      ctx.arc(p.x, p.y, 4, 0, 2 * Math.PI);
      ctx.fill();
    });

    const mean = pcaResult.mean;
    const meanP = toCanvas(mean[0], mean[1]);
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(meanP.x, meanP.y, 6, 0, 2 * Math.PI);
    ctx.fill();

    const pc = pcaResult.principal_components;
    const length = 2.0;

    for (let i = 0; i < pc.length; i++) {
      const component = pc[i];
      const x = component[0] * length;
      const y = component[1] * length;

      const p1 = toCanvas(mean[0] - x, mean[1] - y);
      const p2 = toCanvas(mean[0] + x, mean[1] + y);

      ctx.strokeStyle = i === 0 ? '#3b82f6' : '#f59e0b';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();

      ctx.fillStyle = i === 0 ? '#3b82f6' : '#f59e0b';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText(`PC${i + 1} (${(pcaResult.explained_variance[i] * 100).toFixed(1)}%)`, p2.x + 10, p2.y - 10);
    }
  }

  function generatePCAData() {
    const data: number[][] = [];
    const center = [0, 0];
    const numPoints = 100;

    for (let i = 0; i < numPoints; i++) {
      const angle = Math.random() * 2 * Math.PI;
      const radius = Math.random() * 2;
      const x = center[0] + radius * Math.cos(angle) + (Math.random() - 0.5) * 0.5;
      const y = center[1] + radius * Math.sin(angle) + (Math.random() - 0.5) * 0.5;
      data.push([x, y]);
    }

    setPcaData(data);
  }

  async function computePCA() {
    if (!pcaData || pcaData.length === 0) {
      alert('Please generate sample data first!');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/pca`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: pcaData })
      });

      const result = await response.json();
      setPcaResult(result);
      setCurrentMode('PCA');
    } catch (err: any) {
      alert('Error computing PCA. Make sure the backend is running.');
    }
  }

  return (
    <div className="min-h-screen bg-[#0a192f] text-[#e6f1ff] p-4 md:p-8">
      <div className="max-w-[1600px] mx-auto">
        <header className="text-center mb-8">
          <Link href="/" className="text-[#64ffda] hover:underline mb-2 inline-block">
            ← Back to Mosaic
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold mb-2 text-white">Vektor</h1>
          <p className="text-lg md:text-xl text-[#8892b0]">Linear Algebra Playground</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_minmax(350px,450px)] gap-5">
          <div className="relative bg-[#f5f7fa] rounded-lg overflow-hidden border border-[#233554] h-[800px]">
            <canvas
              ref={canvasRef}
              className="w-full h-full block cursor-crosshair"
              style={{ width: '100%', height: '100%' }}
            />
            {error && (
              <div className="absolute top-4 left-4 bg-red-500 text-white p-3 rounded">
                Error: {error}
              </div>
            )}
            <div className="absolute top-2 right-2 bg-[rgba(17,34,64,0.95)] p-4 rounded-lg border border-[#233554] backdrop-blur-sm">
              <div className="mb-2 text-sm">
                <span className="font-semibold text-[#8892b0]">Determinant:</span>
                <span className="ml-2">{determinant.toFixed(2)}</span>
              </div>
              <div className="text-sm">
                <span className="font-semibold text-[#8892b0]">Mode:</span>
                <span className="ml-2">{currentMode}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-5 overflow-y-auto h-[800px] pr-2">
            <div className="bg-[#112240] p-5 rounded-lg border border-[#233554]">
              <h2 className="text-xl mb-4 text-[#64ffda] font-semibold">Matrix</h2>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  id="a"
                  value={matrix[0][0]}
                  step="0.1"
                  onChange={(e) => handleMatrixChange(0, 0, parseFloat(e.target.value) || 0)}
                  className="p-2 border border-[#233554] rounded bg-[#0a192f] text-[#e6f1ff] text-center focus:outline-none focus:border-[#64ffda]"
                />
                <input
                  type="number"
                  id="b"
                  value={matrix[0][1]}
                  step="0.1"
                  onChange={(e) => handleMatrixChange(0, 1, parseFloat(e.target.value) || 0)}
                  className="p-2 border border-[#233554] rounded bg-[#0a192f] text-[#e6f1ff] text-center focus:outline-none focus:border-[#64ffda]"
                />
                <input
                  type="number"
                  id="c"
                  value={matrix[1][0]}
                  step="0.1"
                  onChange={(e) => handleMatrixChange(1, 0, parseFloat(e.target.value) || 0)}
                  className="p-2 border border-[#233554] rounded bg-[#0a192f] text-[#e6f1ff] text-center focus:outline-none focus:border-[#64ffda]"
                />
                <input
                  type="number"
                  id="d"
                  value={matrix[1][1]}
                  step="0.1"
                  onChange={(e) => handleMatrixChange(1, 1, parseFloat(e.target.value) || 0)}
                  className="p-2 border border-[#233554] rounded bg-[#0a192f] text-[#e6f1ff] text-center focus:outline-none focus:border-[#64ffda]"
                />
              </div>
            </div>

            <div className="bg-[#112240] p-5 rounded-lg border border-[#233554]">
              <h2 className="text-xl mb-4 text-[#64ffda] font-semibold">Presets</h2>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    const angle = Math.PI / 4;
                    setMatrixValue([[Math.cos(angle), -Math.sin(angle)], [Math.sin(angle), Math.cos(angle)]]);
                  }}
                  className="p-3 border border-[#64ffda] rounded bg-transparent text-[#64ffda] hover:bg-[rgba(100,255,218,0.1)] transition"
                >
                  Rotate
                </button>
                <button
                  onClick={() => setMatrixValue([[1.5, 0], [0, 1.5]])}
                  className="p-3 border border-[#64ffda] rounded bg-transparent text-[#64ffda] hover:bg-[rgba(100,255,218,0.1)] transition"
                >
                  Scale
                </button>
                <button
                  onClick={() => setMatrixValue([[1, 0], [0, -1]])}
                  className="p-3 border border-[#64ffda] rounded bg-transparent text-[#64ffda] hover:bg-[rgba(100,255,218,0.1)] transition"
                >
                  Reflect X
                </button>
                <button
                  onClick={() => setMatrixValue([[-1, 0], [0, 1]])}
                  className="p-3 border border-[#64ffda] rounded bg-transparent text-[#64ffda] hover:bg-[rgba(100,255,218,0.1)] transition"
                >
                  Reflect Y
                </button>
                <button
                  onClick={() => setMatrixValue([[1, 0.5], [0, 1]])}
                  className="p-3 border border-[#64ffda] rounded bg-transparent text-[#64ffda] hover:bg-[rgba(100,255,218,0.1)] transition"
                >
                  Shear
                </button>
                <button
                  onClick={() => {
                    setMatrixValue([[1, 0], [0, 1]]);
                    setPcaData(null);
                    setPcaResult(null);
                    setCurrentMode('Transform');
                  }}
                  className="p-3 border border-[#ff6b6b] rounded bg-transparent text-[#ff6b6b] hover:bg-[rgba(255,107,107,0.1)] transition col-span-2"
                >
                  Reset
                </button>
              </div>
            </div>

            <div className="bg-[#112240] p-5 rounded-lg border border-[#233554]">
              <h2 className="text-xl mb-4 text-[#64ffda] font-semibold">Visualization</h2>
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showEigen}
                    onChange={(e) => setShowEigen(e.target.checked)}
                    className="w-5 h-5 cursor-pointer"
                  />
                  <span>Show Eigenvectors</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showGrid}
                    onChange={(e) => setShowGrid(e.target.checked)}
                    className="w-5 h-5 cursor-pointer"
                  />
                  <span>Show Grid</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showVector}
                    onChange={(e) => setShowVector(e.target.checked)}
                    className="w-5 h-5 cursor-pointer"
                  />
                  <span>Show Vector</span>
                </label>
              </div>
            </div>

            <div className="bg-[#112240] p-5 rounded-lg border border-[#233554]">
              <h2 className="text-xl mb-4 text-[#64ffda] font-semibold">PCA Mode</h2>
              <div className="flex flex-col gap-2">
                <button
                  onClick={generatePCAData}
                  className="p-3 border border-[#64ffda] rounded bg-transparent text-[#64ffda] hover:bg-[rgba(100,255,218,0.1)] transition"
                >
                  Generate Sample Data
                </button>
                <button
                  onClick={computePCA}
                  className="p-3 border border-[#64ffda] rounded bg-transparent text-[#64ffda] hover:bg-[rgba(100,255,218,0.1)] transition"
                >
                  Compute PCA
                </button>
                <button
                  onClick={() => {
                    setPcaData(null);
                    setPcaResult(null);
                    setCurrentMode('Transform');
                  }}
                  className="p-3 border border-[#64ffda] rounded bg-transparent text-[#64ffda] hover:bg-[rgba(100,255,218,0.1)] transition"
                >
                  Clear PCA
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
