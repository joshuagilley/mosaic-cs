<script setup lang="ts">
import { ref, watch, onMounted } from "vue";

interface CSVData {
  columns: string[];
  shape: number[];
  preview: Record<string, unknown>[];
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

const file = ref<File | null>(null);
const csvData = ref<CSVData | null>(null);
const statistics = ref<Statistics | null>(null);
const histogramData = ref<HistogramData | null>(null);
const scatterData = ref<ScatterData | null>(null);
const selectedColumn = ref("");
const xColumn = ref("");
const yColumn = ref("");
const bins = ref(20);
const loading = ref(false);
const error = ref<string | null>(null);
const visualizationType = ref<"histogram" | "scatter" | null>(null);

const histogramCanvasRef = ref<HTMLCanvasElement | null>(null);
const scatterCanvasRef = ref<HTMLCanvasElement | null>(null);

const getApiBase = () => (import.meta.client ? window.location.origin : "");

const handleFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    file.value = target.files[0];
    csvData.value = null;
    statistics.value = null;
    histogramData.value = null;
    scatterData.value = null;
    error.value = null;
  }
};

const uploadCSV = async () => {
  if (!file.value) {
    error.value = "Please select a file first";
    return;
  }

  loading.value = true;
  error.value = null;

  try {
    const formData = new FormData();
    formData.append("file", file.value);

    const response = await fetch(`${getApiBase()}/api/data-science/statlab/upload`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to upload CSV");
    }

    const data: CSVData = await response.json();
    csvData.value = data;

    if (data.numeric_columns.length > 0) {
      selectedColumn.value = data.numeric_columns[0];
      xColumn.value = data.numeric_columns[0];
      if (data.numeric_columns.length > 1) {
        yColumn.value = data.numeric_columns[1];
      }
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : "Unknown error";
  } finally {
    loading.value = false;
  }
};

const computeStatistics = async () => {
  if (!file.value) {
    error.value = "Please upload a file first";
    return;
  }

  loading.value = true;
  error.value = null;

  try {
    const formData = new FormData();
    formData.append("file", file.value);

    const response = await fetch(`${getApiBase()}/api/data-science/statlab/stats`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to compute statistics");
    }

    const data = await response.json();
    statistics.value = data.statistics;
  } catch (err) {
    error.value = err instanceof Error ? err.message : "Unknown error";
  } finally {
    loading.value = false;
  }
};

const generateHistogram = async () => {
  if (!file.value || !selectedColumn.value) {
    error.value = "Please upload a file and select a column";
    return;
  }

  loading.value = true;
  error.value = null;

  try {
    const formData = new FormData();
    formData.append("file", file.value);
    formData.append("column", selectedColumn.value);
    formData.append("bins", bins.value.toString());

    const response = await fetch(`${getApiBase()}/api/data-science/statlab/histogram`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to generate histogram");
    }

    const data: HistogramData = await response.json();
    histogramData.value = data;
    visualizationType.value = "histogram";
  } catch (err) {
    error.value = err instanceof Error ? err.message : "Unknown error";
  } finally {
    loading.value = false;
  }
};

const generateScatter = async () => {
  if (!file.value || !xColumn.value || !yColumn.value) {
    error.value = "Please upload a file and select both X and Y columns";
    return;
  }

  loading.value = true;
  error.value = null;

  try {
    const formData = new FormData();
    formData.append("file", file.value);
    formData.append("x_column", xColumn.value);
    formData.append("y_column", yColumn.value);

    const response = await fetch(`${getApiBase()}/api/data-science/statlab/scatter`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to generate scatter plot");
    }

    const data: ScatterData = await response.json();
    scatterData.value = data;
    visualizationType.value = "scatter";
  } catch (err) {
    error.value = err instanceof Error ? err.message : "Unknown error";
  } finally {
    loading.value = false;
  }
};

const drawHistogram = () => {
  if (!histogramData.value || !histogramCanvasRef.value) return;
  const canvas = histogramCanvasRef.value;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const width = rect.width || 800;
  const height = rect.height || 500;

  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx.scale(dpr, dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#0a192f";
  ctx.fillRect(0, 0, width, height);

  const padding = 60;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;
  const maxCount = Math.max(...histogramData.value.counts);

  ctx.strokeStyle = "#64ffda";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(padding, padding);
  ctx.lineTo(padding, height - padding);
  ctx.lineTo(width - padding, height - padding);
  ctx.stroke();

  const barWidth = chartWidth / histogramData.value.counts.length;
  ctx.fillStyle = "#64ffda";
  histogramData.value.counts.forEach((count, i) => {
    const barHeight = (count / maxCount) * chartHeight;
    const x = padding + i * barWidth;
    const y = height - padding - barHeight;
    ctx.fillRect(x, y, barWidth - 2, barHeight);
  });

  ctx.fillStyle = "#8892b0";
  ctx.font = "12px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  histogramData.value.bin_centers.forEach((center, i) => {
    if (i % Math.ceil(histogramData.value.bin_centers.length / 8) === 0) {
      const x = padding + i * barWidth + barWidth / 2;
      ctx.fillText(center.toFixed(1), x, height - padding + 5);
    }
  });

  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  for (let i = 0; i <= 5; i++) {
    const value = (maxCount / 5) * i;
    const y = height - padding - (value / maxCount) * chartHeight;
    ctx.fillText(value.toFixed(0), padding - 10, y);
  }
};

const drawScatter = () => {
  if (!scatterData.value || !scatterCanvasRef.value) return;
  const canvas = scatterCanvasRef.value;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const width = rect.width || 800;
  const height = rect.height || 500;

  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx.scale(dpr, dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#0a192f";
  ctx.fillRect(0, 0, width, height);

  const padding = 60;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const minX = Math.min(...scatterData.value.x);
  const maxX = Math.max(...scatterData.value.x);
  const minY = Math.min(...scatterData.value.y);
  const maxY = Math.max(...scatterData.value.y);

  const rangeX = maxX - minX || 1;
  const rangeY = maxY - minY || 1;

  ctx.strokeStyle = "#64ffda";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(padding, padding);
  ctx.lineTo(padding, height - padding);
  ctx.lineTo(width - padding, height - padding);
  ctx.stroke();

  ctx.fillStyle = "#64ffda";
  scatterData.value.x.forEach((x, i) => {
    const y = scatterData.value?.y[i] ?? 0;
    const canvasX = padding + ((x - minX) / rangeX) * chartWidth;
    const canvasY = height - padding - ((y - minY) / rangeY) * chartHeight;
    ctx.beginPath();
    ctx.arc(canvasX, canvasY, 3, 0, 2 * Math.PI);
    ctx.fill();
  });

  ctx.fillStyle = "#8892b0";
  ctx.font = "12px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText(xColumn.value, width / 2, height - padding + 10);

  ctx.save();
  ctx.translate(20, height / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = "center";
  ctx.fillText(yColumn.value, 0, 0);
  ctx.restore();
};

watch(
  () => histogramData.value,
  () => {
    if (import.meta.client) drawHistogram();
  }
);

watch(
  () => scatterData.value,
  () => {
    if (import.meta.client) drawScatter();
  }
);

onMounted(() => {
  if (histogramData.value) drawHistogram();
  if (scatterData.value) drawScatter();
});
</script>

<template>
  <div class="min-h-screen bg-[#0a192f] text-[#e6f1ff] p-4 md:p-8">
    <div class="max-w-[1600px] mx-auto">
      <header class="text-center mb-8">
        <NuxtLink to="/" class="text-[#64ffda] hover:underline mb-2 inline-block">
          ← Back to Mosaic
        </NuxtLink>
        <h1 class="text-4xl md:text-5xl font-bold mb-2 text-white">StatLab</h1>
        <p class="text-lg md:text-xl text-[#8892b0]">Statistics & Data Visualization</p>
      </header>

      <div v-if="error" class="mb-6 bg-red-500/20 border border-red-500 text-red-200 p-4 rounded-lg">
        {{ error }}
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-[1fr_minmax(350px,450px)] gap-5">
        <div class="bg-[#112240] p-6 rounded-lg border border-[#233554] min-h-[600px]">
          <h2 class="text-2xl mb-4 text-[#64ffda] font-semibold">Visualization</h2>

          <div v-if="!csvData" class="flex items-center justify-center h-[500px] text-[#8892b0]">
            <div class="text-center">
              <p class="text-lg mb-2">Upload a CSV file to get started</p>
              <p class="text-sm">Visualize your data with histograms and scatter plots</p>
            </div>
          </div>

          <div v-if="csvData && visualizationType === 'histogram' && histogramData" class="h-[500px]">
            <canvas ref="histogramCanvasRef" class="w-full h-full" style="max-height: 500px;" />
          </div>

          <div v-if="csvData && visualizationType === 'scatter' && scatterData" class="h-[500px]">
            <canvas ref="scatterCanvasRef" class="w-full h-full" style="max-height: 500px;" />
          </div>
        </div>

        <div class="flex flex-col gap-5 overflow-y-auto h-[800px] pr-2">
          <div class="bg-[#112240] p-5 rounded-lg border border-[#233554]">
            <h2 class="text-xl mb-4 text-[#64ffda] font-semibold">Upload CSV</h2>
            <div class="flex flex-col gap-3">
              <input
                type="file"
                accept=".csv"
                @change="handleFileChange"
                class="text-sm text-[#e6f1ff] file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-[#64ffda] file:text-[#0a192f] hover:file:bg-[#52e0c4] cursor-pointer"
              />
              <button
                class="p-3 border border-[#64ffda] rounded bg-transparent text-[#64ffda] hover:bg-[rgba(100,255,218,0.1)] transition disabled:opacity-50 disabled:cursor-not-allowed"
                :disabled="!file || loading"
                @click="uploadCSV"
              >
                {{ loading ? "Uploading..." : "Upload & Parse" }}
              </button>
            </div>
          </div>

          <div v-if="csvData" class="bg-[#112240] p-5 rounded-lg border border-[#233554]">
            <h2 class="text-xl mb-4 text-[#64ffda] font-semibold">Statistics</h2>
            <button
              class="w-full p-3 border border-[#64ffda] rounded bg-transparent text-[#64ffda] hover:bg-[rgba(100,255,218,0.1)] transition disabled:opacity-50 disabled:cursor-not-allowed mb-4"
              :disabled="loading"
              @click="computeStatistics"
            >
              {{ loading ? "Computing..." : "Compute Statistics" }}
            </button>

            <div v-if="statistics" class="space-y-4 max-h-[300px] overflow-y-auto">
              <div
                v-for="(stats, col) in statistics"
                :key="col"
                class="bg-[#0a192f] p-3 rounded border border-[#233554]"
              >
                <h3 class="font-semibold text-[#64ffda] mb-2">{{ col }}</h3>
                <div class="grid grid-cols-2 gap-2 text-sm">
                  <div><span class="text-[#8892b0]">Mean:</span> <span class="text-[#e6f1ff]">{{ stats.mean.toFixed(2) }}</span></div>
                  <div><span class="text-[#8892b0]">Median:</span> <span class="text-[#e6f1ff]">{{ stats.median.toFixed(2) }}</span></div>
                  <div><span class="text-[#8892b0]">Std Dev:</span> <span class="text-[#e6f1ff]">{{ stats.std.toFixed(2) }}</span></div>
                  <div><span class="text-[#8892b0]">Count:</span> <span class="text-[#e6f1ff]">{{ stats.count }}</span></div>
                  <div><span class="text-[#8892b0]">Min:</span> <span class="text-[#e6f1ff]">{{ stats.min.toFixed(2) }}</span></div>
                  <div><span class="text-[#8892b0]">Max:</span> <span class="text-[#e6f1ff]">{{ stats.max.toFixed(2) }}</span></div>
                </div>
              </div>
            </div>
          </div>

          <div v-if="csvData && csvData.numeric_columns.length > 0" class="bg-[#112240] p-5 rounded-lg border border-[#233554]">
            <h2 class="text-xl mb-4 text-[#64ffda] font-semibold">Histogram</h2>
            <div class="flex flex-col gap-3">
              <div>
                <label class="block text-sm text-[#8892b0] mb-2">Column</label>
                <select
                  v-model="selectedColumn"
                  class="w-full p-2 border border-[#233554] rounded bg-[#0a192f] text-[#e6f1ff] focus:outline-none focus:border-[#64ffda]"
                >
                  <option v-for="col in csvData.numeric_columns" :key="col" :value="col">{{ col }}</option>
                </select>
              </div>
              <div>
                <label class="block text-sm text-[#8892b0] mb-2">Bins: {{ bins }}</label>
                <input type="range" min="5" max="50" v-model.number="bins" class="w-full" />
              </div>
              <button
                class="p-3 border border-[#64ffda] rounded bg-transparent text-[#64ffda] hover:bg-[rgba(100,255,218,0.1)] transition disabled:opacity-50 disabled:cursor-not-allowed"
                :disabled="loading || !selectedColumn"
                @click="generateHistogram"
              >
                {{ loading ? "Generating..." : "Generate Histogram" }}
              </button>
            </div>
          </div>

          <div v-if="csvData && csvData.numeric_columns.length >= 2" class="bg-[#112240] p-5 rounded-lg border border-[#233554]">
            <h2 class="text-xl mb-4 text-[#64ffda] font-semibold">Scatter Plot</h2>
            <div class="flex flex-col gap-3">
              <div>
                <label class="block text-sm text-[#8892b0] mb-2">X Column</label>
                <select
                  v-model="xColumn"
                  class="w-full p-2 border border-[#233554] rounded bg-[#0a192f] text-[#e6f1ff] focus:outline-none focus:border-[#64ffda]"
                >
                  <option v-for="col in csvData.numeric_columns" :key="col" :value="col">{{ col }}</option>
                </select>
              </div>
              <div>
                <label class="block text-sm text-[#8892b0] mb-2">Y Column</label>
                <select
                  v-model="yColumn"
                  class="w-full p-2 border border-[#233554] rounded bg-[#0a192f] text-[#e6f1ff] focus:outline-none focus:border-[#64ffda]"
                >
                  <option v-for="col in csvData.numeric_columns" :key="col" :value="col">{{ col }}</option>
                </select>
              </div>
              <button
                class="p-3 border border-[#64ffda] rounded bg-transparent text-[#64ffda] hover:bg-[rgba(100,255,218,0.1)] transition disabled:opacity-50 disabled:cursor-not-allowed"
                :disabled="loading || !xColumn || !yColumn"
                @click="generateScatter"
              >
                {{ loading ? "Generating..." : "Generate Scatter Plot" }}
              </button>
            </div>
          </div>

          <div v-if="csvData" class="bg-[#112240] p-5 rounded-lg border border-[#233554]">
            <h2 class="text-xl mb-4 text-[#64ffda] font-semibold">Data Preview</h2>
            <div class="text-sm text-[#8892b0] mb-2">
              Shape: {{ csvData.shape[0] }} rows × {{ csvData.shape[1] }} columns
            </div>
            <div class="overflow-x-auto max-h-[200px] overflow-y-auto">
              <table class="w-full text-xs">
                <thead>
                  <tr class="border-b border-[#233554]">
                    <th v-for="col in csvData.columns" :key="col" class="text-left p-2 text-[#64ffda]">
                      {{ col }}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(row, idx) in csvData.preview" :key="idx" class="border-b border-[#233554]/50">
                    <td v-for="col in csvData.columns" :key="col" class="p-2 text-[#e6f1ff]">
                      {{ row[col]?.toString().substring(0, 20) || "—" }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
