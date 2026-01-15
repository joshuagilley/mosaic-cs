<script setup lang="ts">
import { computed } from "vue";

type Tile = {
  id: number;
  name: string;
  path: string;
  description: string;
  color: string;
  subTopics?: string[];
};

const props = defineProps<{
  tile: Tile;
  hoveredTile: number | null;
}>();

const emit = defineEmits<{
  (event: "hover", value: number | null): void;
}>();

const isClickable = computed(() => props.tile.path !== "#");
const isCenter = computed(() => props.tile.id === 0);
const isHovered = computed(() => props.hoveredTile === props.tile.id);
const hasHoveredTile = computed(
  () => props.hoveredTile !== null && props.hoveredTile !== props.tile.id
);
const hasSubTopics = computed(
  () => props.tile.subTopics && props.tile.subTopics.length > 0
);

const hexSize = 160;

const pushScale = computed(() => (hasHoveredTile.value && !isHovered.value ? 0.6 : 1));
const pushOpacity = computed(() => (hasHoveredTile.value && !isHovered.value ? 0.3 : 1));

const calculateHoneycombPositions = (
  centerX: number,
  centerY: number,
  size: number,
  items: string[],
  spacing = 5
) => {
  const hexHeight = size * 1.1547;
  const rowOverlap = hexHeight * 0.2886;
  const horizontalDistance = size + spacing;
  const verticalDistance = hexHeight + spacing;

  const topLeft = {
    x: centerX - horizontalDistance / 2,
    y: centerY - verticalDistance + rowOverlap - spacing,
    name: items[0] || "Coming Soon",
    index: 0,
  };
  const topRight = {
    x: centerX + horizontalDistance / 2,
    y: centerY - verticalDistance + rowOverlap - spacing,
    name: items[1] || "Coming Soon",
    index: 1,
  };
  const middleLeft = {
    x: centerX - horizontalDistance,
    y: centerY,
    name: items[2] || "Coming Soon",
    index: 2,
  };
  const middleRight = {
    x: centerX + horizontalDistance,
    y: centerY,
    name: items[3] || "Coming Soon",
    index: 3,
  };
  const bottomLeft = {
    x: centerX - horizontalDistance / 2,
    y: centerY + verticalDistance - rowOverlap + spacing,
    name: items[4] || "Coming Soon",
    index: 4,
  };
  const bottomRight = {
    x: centerX + horizontalDistance / 2,
    y: centerY + verticalDistance - rowOverlap + spacing,
    name: items[5] || "Coming Soon",
    index: 5,
  };

  return [topLeft, topRight, middleLeft, middleRight, bottomLeft, bottomRight];
};

const subHexPositions = computed(() =>
  hasSubTopics.value
    ? calculateHoneycombPositions(0, 0, hexSize, props.tile.subTopics as string[])
    : []
);

const getSubTopicPath = (name: string) => {
  if (name === "Vektor") return "/data-science/vektor";
  if (name === "StatLab") return "/data-science/statlab";
  return "#";
};

const getSubTopicSubtext = (name: string) => {
  if (name === "Vektor") return "NumPy + Linear Algebra";
  if (name === "StatLab") return "Pandas + Statistics";
  return "";
};
</script>

<template>
  <div
    class="relative"
    :style="{
      transform: isHovered && hasSubTopics ? 'scale(1.2)' : `scale(${pushScale})`,
      zIndex: isHovered ? 100 : (isClickable ? 10 : 1),
      opacity: isHovered ? 1 : pushOpacity,
    }"
    @mouseenter="hasSubTopics && emit('hover', tile.id)"
    @mouseleave="emit('hover', null)"
  >
    <div
      class="hexagon-item transition-all duration-700 ease-out flex flex-col items-center justify-center"
      :class="[
        isClickable
          ? 'cursor-pointer'
          : hasSubTopics
            ? 'cursor-default'
            : isCenter
              ? 'opacity-80'
              : 'opacity-50',
      ]"
    >
      <div
        class="w-full h-full flex flex-col items-center justify-center p-4 md:p-6 transition-all duration-700"
        :class="[
          isClickable || hasSubTopics
            ? `bg-gradient-to-br ${tile.color} dark:${tile.color} text-white shadow-lg ${
                isHovered ? 'shadow-2xl' : ''
              }`
            : isCenter
              ? 'bg-gradient-to-br from-gray-400 to-gray-500 dark:from-gray-600 dark:to-gray-700 text-white'
              : 'bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-700 dark:to-gray-800 text-gray-700 dark:text-gray-300',
        ]"
      >
        <h3
          class="font-bold mb-1 md:mb-2 text-center transition-all duration-700"
          :class="[
            isCenter ? 'text-xl md:text-2xl' : 'text-base md:text-lg',
            isHovered ? 'scale-110' : '',
          ]"
        >
          {{ tile.name }}
        </h3>
        <p class="text-xs md:text-sm text-center opacity-90 transition-all duration-700">
          {{ tile.description }}
        </p>
      </div>
    </div>

    <div
      v-if="isHovered && hasSubTopics && subHexPositions.length > 0"
      class="absolute"
      :style="{
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        width: 0,
        height: 0,
      }"
    >
      <div v-for="(subHex, subIndex) in subHexPositions" :key="subIndex">
        <NuxtLink v-if="getSubTopicPath(subHex.name) !== '#'" :to="getSubTopicPath(subHex.name)">
          <div
            class="absolute transition-all duration-500 ease-out cursor-pointer"
            :style="{
              left: `${subHex.x}px`,
              top: `${subHex.y}px`,
              transform: 'translate(-50%, -50%)',
              width: `${hexSize}px`,
              height: `${Math.round(hexSize * 1.1547)}px`,
              clipPath: 'polygon(0% 25%, 0% 75%, 50% 100%, 100% 75%, 100% 25%, 50% 0%)',
              WebkitClipPath: 'polygon(0% 25%, 0% 75%, 50% 100%, 100% 75%, 100% 25%, 50% 0%)',
              opacity: 0,
              animation: `fadeIn 0.4s ease-out ${subIndex * 80}ms forwards`,
            }"
          >
            <div
              class="w-full h-full flex flex-col items-center justify-center p-4 md:p-6 text-sm md:text-base font-semibold shadow-lg hover:scale-110"
              :class="[
                subHex.name === 'Coming Soon'
                  ? 'bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-700 dark:to-gray-800 text-gray-700 dark:text-gray-300 border border-gray-400 dark:border-gray-600'
                  : `bg-gradient-to-br ${tile.color} dark:${tile.color} text-white border border-white/60 dark:border-white/50 backdrop-blur-md`,
              ]"
            >
              <div class="text-center">
                <div>{{ subHex.name }}</div>
                <div v-if="getSubTopicSubtext(subHex.name)" class="text-xs mt-1 opacity-80 font-normal">
                  {{ getSubTopicSubtext(subHex.name) }}
                </div>
              </div>
            </div>
          </div>
        </NuxtLink>
        <div
          v-else
          class="absolute transition-all duration-500 ease-out"
          :style="{
            left: `${subHex.x}px`,
            top: `${subHex.y}px`,
            transform: 'translate(-50%, -50%)',
            width: `${hexSize}px`,
            height: `${Math.round(hexSize * 1.1547)}px`,
            clipPath: 'polygon(0% 25%, 0% 75%, 50% 100%, 100% 75%, 100% 25%, 50% 0%)',
            WebkitClipPath: 'polygon(0% 25%, 0% 75%, 50% 100%, 100% 75%, 100% 25%, 50% 0%)',
            opacity: 0,
            animation: `fadeIn 0.4s ease-out ${subIndex * 80}ms forwards`,
          }"
        >
          <div
            class="w-full h-full flex flex-col items-center justify-center p-4 md:p-6 text-sm md:text-base font-semibold shadow-lg"
            :class="[
              subHex.name === 'Coming Soon'
                ? 'bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-700 dark:to-gray-800 text-gray-700 dark:text-gray-300 border border-gray-400 dark:border-gray-600'
                : `bg-gradient-to-br ${tile.color} dark:${tile.color} text-white border border-white/60 dark:border-white/50 backdrop-blur-md`,
            ]"
          >
            <div class="text-center">
              <div>{{ subHex.name }}</div>
              <div v-if="getSubTopicSubtext(subHex.name)" class="text-xs mt-1 opacity-80 font-normal">
                {{ getSubTopicSubtext(subHex.name) }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
