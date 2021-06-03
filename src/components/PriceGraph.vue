<template>
  <section class="relative">
    <h3 class="text-lg leading-6 font-medium text-gray-900 my-8">
      {{ selectedTicker.name }} - USD
    </h3>
    <div class="flex items-end border-gray-600 border-b border-l h-64">
      <div
        v-for="(bar, idx) in normalizedGraph"
        :key="idx"
        :style="{ height: `${bar}%` }"
        class="bg-purple-800 border w-10"
      ></div>
    </div>
    <button @click="close" type="button" class="absolute top-0 right-0">
      <close-icon />
    </button>
  </section>
</template>
<script>
import CloseIcon from "./CloseIcon.vue";

export default {
  name: "PriceGraph",

  components: { CloseIcon },

  props: {
    selectedTicker: Object,
    graphData: Array,
  },

  computed: {
    normalizedGraph() {
      const maxValue = Math.max(...this.graphData);
      const minValue = Math.min(...this.graphData);

      if (maxValue === minValue) {
        return this.graphData.map(() => 50);
      }

      return this.graphData.map(
        (price) => 5 + ((price - minValue) * 95) / (maxValue - minValue),
      );
    },
  },

  methods: {
    close() {
      this.$emit("close");
    },
  },
};
</script>
