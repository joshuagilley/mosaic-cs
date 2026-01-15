<script setup lang="ts">
import { ref } from "vue";

type Tile = {
  id: number;
  name: string;
  path: string;
  description: string;
  color: string;
  subTopics?: string[];
};

const hoveredTile = ref<number | null>(null);

const tiles: Tile[] = [
  {
    id: 5,
    name: "Algorithms & Theory",
    path: "#",
    description: "Computational theory",
    color: "from-indigo-500 to-indigo-600",
    subTopics: ["Coming Soon", "Coming Soon", "Coming Soon", "Coming Soon", "Coming Soon", "Coming Soon"],
  },
  {
    id: 1,
    name: "Data Science",
    path: "#",
    description: "Data analysis & visualization",
    color: "from-blue-500 to-blue-600",
    subTopics: ["Vektor", "StatLab", "Coming Soon", "Coming Soon", "Coming Soon", "Coming Soon"],
  },
  {
    id: 6,
    name: "Computer Systems",
    path: "#",
    description: "Systems & architecture",
    color: "from-teal-500 to-teal-600",
    subTopics: ["Coming Soon", "Coming Soon", "Coming Soon", "Coming Soon", "Coming Soon", "Coming Soon"],
  },
  {
    id: 0,
    name: "Computer Science",
    path: "#",
    description: "Explore CS Topics",
    color: "from-purple-500 to-purple-600",
  },
  {
    id: 3,
    name: "Software Engineering",
    path: "#",
    description: "Development practices",
    color: "from-yellow-500 to-yellow-600",
    subTopics: ["Coming Soon", "Coming Soon", "Coming Soon", "Coming Soon", "Coming Soon", "Coming Soon"],
  },
  {
    id: 2,
    name: "AI/ML",
    path: "#",
    description: "Artificial Intelligence",
    color: "from-green-500 to-green-600",
    subTopics: ["Coming Soon", "Coming Soon", "Coming Soon", "Coming Soon", "Coming Soon", "Coming Soon"],
  },
  {
    id: 4,
    name: "Cybersecurity",
    path: "#",
    description: "Security & privacy",
    color: "from-red-500 to-red-600",
    subTopics: ["Coming Soon", "Coming Soon", "Coming Soon", "Coming Soon", "Coming Soon", "Coming Soon"],
  },
];
</script>

<template>
  <main
    class="flex min-h-screen flex-col items-center justify-center p-8 md:p-24 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800"
  >
    <div class="w-full max-w-7xl relative">
      <h1
        class="text-5xl md:text-6xl font-black mb-4 text-left text-gray-900 dark:text-white tracking-tight absolute top-0 left-0 z-10"
        :style="{ fontFamily: 'system-ui, -apple-system, sans-serif', letterSpacing: '-0.02em' }"
      >
        MOSAIC CS
      </h1>

      <div class="flex justify-center items-center min-h-[600px] md:min-h-[700px]">
        <div class="hexagon-main">
          <div class="hex-row offset">
            <HexagonTile :tile="tiles[0]" :hovered-tile="hoveredTile" @hover="hoveredTile = $event" />
            <HexagonTile :tile="tiles[1]" :hovered-tile="hoveredTile" @hover="hoveredTile = $event" />
          </div>

          <div class="hex-row">
            <HexagonTile :tile="tiles[2]" :hovered-tile="hoveredTile" @hover="hoveredTile = $event" />
            <HexagonTile :tile="tiles[3]" :hovered-tile="hoveredTile" @hover="hoveredTile = $event" />
            <HexagonTile :tile="tiles[4]" :hovered-tile="hoveredTile" @hover="hoveredTile = $event" />
          </div>

          <div class="hex-row offset">
            <HexagonTile :tile="tiles[5]" :hovered-tile="hoveredTile" @hover="hoveredTile = $event" />
            <HexagonTile :tile="tiles[6]" :hovered-tile="hoveredTile" @hover="hoveredTile = $event" />
          </div>
        </div>
      </div>
    </div>
  </main>
</template>
