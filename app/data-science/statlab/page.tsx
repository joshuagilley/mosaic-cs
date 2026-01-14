'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';

interface CSVData {
  columns: string[];
  shape: number[];
  preview: Record<string, any>[];
  numeric_columns: string[];
}

interface Statistics {
  [key: string]: {
    mean: number;
    median: number;
    std: number;
    min: number;
    max: number;
    q25: number;
    q75: number;
    count: number;
    missing: number;
  };
}

interface HistogramData {
  counts: number[];
  bin_edges: number[];
  bin_centers: number[];
}

interface ScatterData {
  x: number[];
  y: number[];
}

export default function StatLabPage() {
  const [file, setFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<CSVData | null>(null);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [histogramData, setHistogramData] = useState<HistogramData | null>(null);
  const [scatterData, setScatterData] = useState<ScatterData | null>(null);
  const [selectedColumn, setSelectedColumn] = useState<string>('');
  const [xColumn, setXColumn] = useState<string>('');
  const [yColumn, setYColumn] = useState<string>('');
  const [bins, setBins] = useState(20);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visualizationType, setVisualizationType] = useState<'histogram' | 'scatter' | null>(null);
  const histogramCanvasRef = useRef<HTMLCanvasElement>(null);
  const scatterCanvasRef = useRef<HTMLCanvasElement>(null);

  const API_BASE = typeof window !== 'undefined' ? window.location.origin : '';

  // Draw histogram
  useEffect(() => {
    if (visualizationType === 'histogram' && histogramData && histogramCanvasRef.current) {
      const canvas = histogramCanvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      const width = rect.width || 800;
      const height = rect.height || 500;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';

      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = '#0a192f';
      ctx.fillRect(0, 0, width, height);

      const padding = 60;
      const chartWidth = width - padding * 2;
      const chartHeight = height - padding * 2;
      const maxCount = Math.max(...histogramData.counts);

      // Draw axes
      ctx.strokeStyle = '#64ffda';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(padding, padding);
      ctx.lineTo(padding, height - padding);
      ctx.lineTo(width - padding, height - padding);
      ctx.stroke();

      // Draw bars
      const barWidth = chartWidth / histogramData.counts.length;
      ctx.fillStyle = '#64ffda';
      
      histogramData.counts.forEach((count, i) => {
        const barHeight = (count / maxCount) * chartHeight;
        const x = padding + i * barWidth;
        const y = height - padding - barHeight;
        
        ctx.fillRect(x, y, barWidth - 2, barHeight);
      });

      // Draw labels
      ctx.fillStyle = '#8892b0';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      
      histogramData.bin_centers.forEach((center, i) => {
        if (i % Math.ceil(histogramData.bin_centers.length / 8) === 0) {
          const x = padding + i * barWidth + barWidth / 2;
          ctx.fillText(center.toFixed(1), x, height - padding + 5);
        }
      });

      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      for (let i = 0; i <= 5; i++) {
        const value = (maxCount / 5) * i;
        const y = height - padding - (value / maxCount) * chartHeight;
        ctx.fillText(value.toFixed(0), padding - 10, y);
      }
    }
  }, [histogramData, visualizationType]);

  // Draw scatter plot
  useEffect(() => {
    if (visualizationType === 'scatter' && scatterData && scatterCanvasRef.current) {
      const canvas = scatterCanvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      const width = rect.width || 800;
      const height = rect.height || 500;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';

      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = '#0a192f';
      ctx.fillRect(0, 0, width, height);

      const padding = 60;
      const chartWidth = width - padding * 2;
      const chartHeight = height - padding * 2;
      
      const minX = Math.min(...scatterData.x);
      const maxX = Math.max(...scatterData.x);
      const minY = Math.min(...scatterData.y);
      const maxY = Math.max(...scatterData.y);
      
      const rangeX = maxX - minX || 1;
      const rangeY = maxY - minY || 1;

      // Draw axes
      ctx.strokeStyle = '#64ffda';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(padding, padding);
      ctx.lineTo(padding, height - padding);
      ctx.lineTo(width - padding, height - padding);
      ctx.stroke();

      // Draw points
      ctx.fillStyle = '#64ffda';
      scatterData.x.forEach((x, i) => {
        const y = scatterData.y[i];
        const canvasX = padding + ((x - minX) / rangeX) * chartWidth;
        const canvasY = height - padding - ((y - minY) / rangeY) * chartHeight;
        
        ctx.beginPath();
        ctx.arc(canvasX, canvasY, 3, 0, 2 * Math.PI);
        ctx.fill();
      });

      // Draw labels
      ctx.fillStyle = '#8892b0';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(xColumn, width / 2, height - padding + 10);
      
      ctx.save();
      ctx.translate(20, height / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.textAlign = 'center';
      ctx.fillText(yColumn, 0, 0);
      ctx.restore();
    }
  }, [scatterData, visualizationType, xColumn, yColumn]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setCsvData(null);
      setStatistics(null);
      setHistogramData(null);
      setScatterData(null);
      setError(null);
    }
  };

  const uploadCSV = useCallback(async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_BASE}/api/data-science/statlab/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to upload CSV');
      }

      const data: CSVData = await response.json();
      setCsvData(data);
      
      // Auto-select first numeric column if available
      if (data.numeric_columns.length > 0) {
        setSelectedColumn(data.numeric_columns[0]);
        setXColumn(data.numeric_columns[0]);
        if (data.numeric_columns.length > 1) {
          setYColumn(data.numeric_columns[1]);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [file, API_BASE]);

  const computeStatistics = useCallback(async () => {
    if (!file) {
      setError('Please upload a file first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_BASE}/api/data-science/statlab/stats`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to compute statistics');
      }

      const data = await response.json();
      setStatistics(data.statistics);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [file, API_BASE]);

  const generateHistogram = useCallback(async () => {
    if (!file || !selectedColumn) {
      setError('Please upload a file and select a column');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('column', selectedColumn);
      formData.append('bins', bins.toString());

      const response = await fetch(`${API_BASE}/api/data-science/statlab/histogram`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to generate histogram');
      }

      const data: HistogramData = await response.json();
      setHistogramData(data);
      setVisualizationType('histogram');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [file, selectedColumn, bins, API_BASE]);

  const generateScatter = useCallback(async () => {
    if (!file || !xColumn || !yColumn) {
      setError('Please upload a file and select both X and Y columns');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('x_column', xColumn);
      formData.append('y_column', yColumn);

      const response = await fetch(`${API_BASE}/api/data-science/statlab/scatter`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to generate scatter plot');
      }

      const data: ScatterData = await response.json();
      setScatterData(data);
      setVisualizationType('scatter');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [file, xColumn, yColumn, API_BASE]);

  return (
    <div className="min-h-screen bg-[#0a192f] text-[#e6f1ff] p-4 md:p-8">
      <div className="max-w-[1600px] mx-auto">
        <header className="text-center mb-8">
          <Link href="/" className="text-[#64ffda] hover:underline mb-2 inline-block">
            ← Back to Mosaic
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold mb-2 text-white">StatLab</h1>
          <p className="text-lg md:text-xl text-[#8892b0]">Statistics & Data Visualization</p>
        </header>

        {error && (
          <div className="mb-6 bg-red-500/20 border border-red-500 text-red-200 p-4 rounded-lg">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_minmax(350px,450px)] gap-5">
          {/* Main Visualization Area */}
          <div className="bg-[#112240] p-6 rounded-lg border border-[#233554] min-h-[600px]">
            <h2 className="text-2xl mb-4 text-[#64ffda] font-semibold">Visualization</h2>
            
            {!csvData && (
              <div className="flex items-center justify-center h-[500px] text-[#8892b0]">
                <div className="text-center">
                  <p className="text-lg mb-2">Upload a CSV file to get started</p>
                  <p className="text-sm">Visualize your data with histograms and scatter plots</p>
                </div>
              </div>
            )}

            {csvData && visualizationType === 'histogram' && histogramData && (
              <div className="h-[500px]">
                <canvas
                  ref={histogramCanvasRef}
                  className="w-full h-full"
                  style={{ maxHeight: '500px' }}
                />
              </div>
            )}

            {csvData && visualizationType === 'scatter' && scatterData && (
              <div className="h-[500px]">
                <canvas
                  ref={scatterCanvasRef}
                  className="w-full h-full"
                  style={{ maxHeight: '500px' }}
                />
              </div>
            )}
          </div>

          {/* Controls Panel */}
          <div className="flex flex-col gap-5 overflow-y-auto h-[800px] pr-2">
            {/* File Upload */}
            <div className="bg-[#112240] p-5 rounded-lg border border-[#233554]">
              <h2 className="text-xl mb-4 text-[#64ffda] font-semibold">Upload CSV</h2>
              <div className="flex flex-col gap-3">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="text-sm text-[#e6f1ff] file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-[#64ffda] file:text-[#0a192f] hover:file:bg-[#52e0c4] cursor-pointer"
                />
                <button
                  onClick={uploadCSV}
                  disabled={!file || loading}
                  className="p-3 border border-[#64ffda] rounded bg-transparent text-[#64ffda] hover:bg-[rgba(100,255,218,0.1)] transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Uploading...' : 'Upload & Parse'}
                </button>
              </div>
            </div>

            {/* Statistics */}
            {csvData && (
              <div className="bg-[#112240] p-5 rounded-lg border border-[#233554]">
                <h2 className="text-xl mb-4 text-[#64ffda] font-semibold">Statistics</h2>
                <button
                  onClick={computeStatistics}
                  disabled={loading}
                  className="w-full p-3 border border-[#64ffda] rounded bg-transparent text-[#64ffda] hover:bg-[rgba(100,255,218,0.1)] transition disabled:opacity-50 disabled:cursor-not-allowed mb-4"
                >
                  {loading ? 'Computing...' : 'Compute Statistics'}
                </button>
                
                {statistics && (
                  <div className="space-y-4 max-h-[300px] overflow-y-auto">
                    {Object.entries(statistics).map(([col, stats]) => (
                      <div key={col} className="bg-[#0a192f] p-3 rounded border border-[#233554]">
                        <h3 className="font-semibold text-[#64ffda] mb-2">{col}</h3>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-[#8892b0]">Mean:</span>{' '}
                            <span className="text-[#e6f1ff]">{stats.mean.toFixed(2)}</span>
                          </div>
                          <div>
                            <span className="text-[#8892b0]">Median:</span>{' '}
                            <span className="text-[#e6f1ff]">{stats.median.toFixed(2)}</span>
                          </div>
                          <div>
                            <span className="text-[#8892b0]">Std Dev:</span>{' '}
                            <span className="text-[#e6f1ff]">{stats.std.toFixed(2)}</span>
                          </div>
                          <div>
                            <span className="text-[#8892b0]">Count:</span>{' '}
                            <span className="text-[#e6f1ff]">{stats.count}</span>
                          </div>
                          <div>
                            <span className="text-[#8892b0]">Min:</span>{' '}
                            <span className="text-[#e6f1ff]">{stats.min.toFixed(2)}</span>
                          </div>
                          <div>
                            <span className="text-[#8892b0]">Max:</span>{' '}
                            <span className="text-[#e6f1ff]">{stats.max.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Histogram Controls */}
            {csvData && csvData.numeric_columns.length > 0 && (
              <div className="bg-[#112240] p-5 rounded-lg border border-[#233554]">
                <h2 className="text-xl mb-4 text-[#64ffda] font-semibold">Histogram</h2>
                <div className="flex flex-col gap-3">
                  <div>
                    <label className="block text-sm text-[#8892b0] mb-2">Column</label>
                    <select
                      value={selectedColumn}
                      onChange={(e) => setSelectedColumn(e.target.value)}
                      className="w-full p-2 border border-[#233554] rounded bg-[#0a192f] text-[#e6f1ff] focus:outline-none focus:border-[#64ffda]"
                    >
                      {csvData.numeric_columns.map((col) => (
                        <option key={col} value={col}>
                          {col}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-[#8892b0] mb-2">
                      Bins: {bins}
                    </label>
                    <input
                      type="range"
                      min="5"
                      max="50"
                      value={bins}
                      onChange={(e) => setBins(parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  <button
                    onClick={generateHistogram}
                    disabled={loading || !selectedColumn}
                    className="p-3 border border-[#64ffda] rounded bg-transparent text-[#64ffda] hover:bg-[rgba(100,255,218,0.1)] transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Generating...' : 'Generate Histogram'}
                  </button>
                </div>
              </div>
            )}

            {/* Scatter Plot Controls */}
            {csvData && csvData.numeric_columns.length >= 2 && (
              <div className="bg-[#112240] p-5 rounded-lg border border-[#233554]">
                <h2 className="text-xl mb-4 text-[#64ffda] font-semibold">Scatter Plot</h2>
                <div className="flex flex-col gap-3">
                  <div>
                    <label className="block text-sm text-[#8892b0] mb-2">X Column</label>
                    <select
                      value={xColumn}
                      onChange={(e) => setXColumn(e.target.value)}
                      className="w-full p-2 border border-[#233554] rounded bg-[#0a192f] text-[#e6f1ff] focus:outline-none focus:border-[#64ffda]"
                    >
                      {csvData.numeric_columns.map((col) => (
                        <option key={col} value={col}>
                          {col}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-[#8892b0] mb-2">Y Column</label>
                    <select
                      value={yColumn}
                      onChange={(e) => setYColumn(e.target.value)}
                      className="w-full p-2 border border-[#233554] rounded bg-[#0a192f] text-[#e6f1ff] focus:outline-none focus:border-[#64ffda]"
                    >
                      {csvData.numeric_columns.map((col) => (
                        <option key={col} value={col}>
                          {col}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={generateScatter}
                    disabled={loading || !xColumn || !yColumn}
                    className="p-3 border border-[#64ffda] rounded bg-transparent text-[#64ffda] hover:bg-[rgba(100,255,218,0.1)] transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Generating...' : 'Generate Scatter Plot'}
                  </button>
                </div>
              </div>
            )}

            {/* Data Preview */}
            {csvData && (
              <div className="bg-[#112240] p-5 rounded-lg border border-[#233554]">
                <h2 className="text-xl mb-4 text-[#64ffda] font-semibold">Data Preview</h2>
                <div className="text-sm text-[#8892b0] mb-2">
                  Shape: {csvData.shape[0]} rows × {csvData.shape[1]} columns
                </div>
                <div className="overflow-x-auto max-h-[200px] overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-[#233554]">
                        {csvData.columns.map((col) => (
                          <th key={col} className="text-left p-2 text-[#64ffda]">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {csvData.preview.map((row, idx) => (
                        <tr key={idx} className="border-b border-[#233554]/50">
                          {csvData.columns.map((col) => (
                            <td key={col} className="p-2 text-[#e6f1ff]">
                              {row[col]?.toString().substring(0, 20) || '—'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
