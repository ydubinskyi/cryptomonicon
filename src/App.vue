<template>
  <div class="container mx-auto flex flex-col items-center bg-gray-100 p-4">
    <app-preloader v-if="!isCoinListLoaded" />

    <div class="container">
      <add-ticker :coinList="coinList" :tickers="tickers" @add-ticker="add" />

      <template v-if="tickers.length">
        <hr class="w-full border-t border-gray-600 my-4" />
        <div>
          <button
            class="my-4 mx-2 inline-flex items-center py-2 px-4 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-full text-white bg-gray-600 hover:bg-gray-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            v-if="page > 1"
            @click="page = page - 1"
          >
            Назад
          </button>
          <button
            class="my-4 mx-2 inline-flex items-center py-2 px-4 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-full text-white bg-gray-600 hover:bg-gray-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            @click="page = page + 1"
            v-if="hasNextPage"
          >
            Вперед
          </button>
          <div>Фильтр: <input v-model="filter" /></div>
        </div>
        <hr class="w-full border-t border-gray-600 my-4" />
        <dl class="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
          <ticker-item
            v-for="t in paginatedTickers"
            :key="t.name"
            :ticker="t"
            :selected="selectedTicker === t"
            @select="select"
            @delete="handleDelete"
          />
        </dl>
        <hr class="w-full border-t border-gray-600 my-4" />
      </template>

      <price-graph
        ref="graph"
        v-if="selectedTicker"
        :selectedTicker="selectedTicker"
        :graphData="graph"
        @close="selectedTicker = null"
      />
    </div>
  </div>
</template>

<script>
import { subscribeToTicker, unsubscribeFromTicker, getCoinList } from "./api";

import AppPreloader from "./components/AppPreloader.vue";
import AddTicker from "./components/AddTicker.vue";
import PriceGraph from "./components/PriceGraph.vue";
import TickerItem from "./components/TickerItem.vue";

export default {
  name: "App",

  components: { AppPreloader, AddTicker, PriceGraph, TickerItem },

  data() {
    return {
      ticker: "",
      filter: "",

      coinList: [],
      tickers: [],
      selectedTicker: null,

      graph: [],
      maxGraphElements: 10,

      page: 1,
    };
  },

  created() {
    const windowData = Object.fromEntries(
      new URL(window.location).searchParams.entries(),
    );

    const VALID_KEYS = ["filter", "page"];

    VALID_KEYS.forEach((key) => {
      if (windowData[key]) {
        this[key] = windowData[key];
      }
    });

    const tickersData = localStorage.getItem("cryptonomicon-list");

    if (tickersData) {
      this.tickers = JSON.parse(tickersData);
      this.tickers.forEach((ticker) => {
        subscribeToTicker(ticker.name, ({ price, valid }) =>
          this.updateTicker(ticker.name, price, valid),
        );
      });
    }
  },

  computed: {
    startIndex() {
      return (this.page - 1) * 6;
    },

    endIndex() {
      return this.page * 6;
    },

    filteredTickers() {
      return this.filter
        ? this.tickers.filter((ticker) => ticker.name.includes(this.filter))
        : this.tickers;
    },

    paginatedTickers() {
      return this.filteredTickers.slice(this.startIndex, this.endIndex);
    },

    hasNextPage() {
      return this.filteredTickers.length > this.endIndex;
    },

    pageStateOptions() {
      return {
        filter: this.filter,
        page: this.page,
      };
    },

    isCoinListLoaded() {
      return this.coinList?.length > 0;
    },
  },

  async mounted() {
    window.addEventListener("resize", this.calculateMaxGraphElements);

    this.coinList = await getCoinList();
  },

  beforeUnmount() {
    window.removeEventListener("resize", this.calculateMaxGraphElements);
  },

  methods: {
    calculateMaxGraphElements() {
      if (!this.$refs.graph) {
        return;
      }

      this.maxGraphElements = this.$refs.graph.clientWidth / 38;
    },

    updateTicker(tickerName, price, valid) {
      this.tickers
        .filter((t) => t.name === tickerName)
        .forEach((t) => {
          if (t === this.selectedTicker) {
            this.graph.push(price);

            if (this.graph.length > this.maxGraphElements) {
              this.graph.splice(0, this.graph.length - this.maxGraphElements);
            }
          }
          t.price = price;
          t.valid = valid;
        });
    },

    formatPrice(price) {
      if (price === "-") {
        return price;
      }
      return price > 1 ? price.toFixed(2) : price.toPrecision(2);
    },

    add(ticker) {
      const newTicker = {
        name: ticker,
        price: "-",
        valid: true,
      };

      this.tickers = [...this.tickers, newTicker];
      this.ticker = "";
      this.filter = "";
      subscribeToTicker(newTicker.name, ({ price, valid }) =>
        this.updateTicker(newTicker.name, price, valid),
      );
    },

    select(ticker) {
      this.selectedTicker = ticker;
    },

    handleDelete(tickerToRemove) {
      this.tickers = this.tickers.filter((t) => t !== tickerToRemove);
      if (this.selectedTicker === tickerToRemove) {
        this.selectedTicker = null;
      }
      unsubscribeFromTicker(tickerToRemove.name);
    },
  },

  watch: {
    selectedTicker() {
      this.graph = [];

      this.$nextTick(() => this.calculateMaxGraphElements());
    },

    tickers() {
      localStorage.setItem("cryptonomicon-list", JSON.stringify(this.tickers));
    },

    paginatedTickers() {
      if (this.paginatedTickers.length === 0 && this.page > 1) {
        this.page -= 1;
      }
    },

    filter() {
      this.page = 1;
    },

    pageStateOptions(value) {
      window.history.pushState(
        null,
        document.title,
        `${window.location.pathname}?filter=${value.filter}&page=${value.page}`,
      );
    },
  },
};
</script>
