<template>
  <section>
    <div class="flex">
      <div class="max-w-xs">
        <label for="wallet" class="block text-sm font-medium text-gray-700"
          >Тикер</label
        >
        <div class="mt-1 relative rounded-md shadow-md">
          <input
            v-model="ticker"
            @keydown.enter="add()"
            type="text"
            name="wallet"
            id="wallet"
            class="block w-full pr-10 border-gray-300 text-gray-900 focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm rounded-md"
            placeholder="Например DOGE"
          />
        </div>
        <div
          v-if="coinListAutosuggetions.length > 0"
          class="flex bg-white shadow-md p-1 rounded-md shadow-md flex-wrap"
        >
          <span
            v-for="c in coinListAutosuggetions"
            :key="c.symbol"
            @click="add(c.symbol)"
            class="inline-flex items-center px-2 m-1 rounded-md text-xs font-medium bg-gray-300 text-gray-800 cursor-pointer"
          >
            {{ c.symbol }}
          </span>
        </div>
        <div v-if="isTickerInvalid" class="text-sm text-red-600">
          Такой тикер уже добавлен
        </div>
      </div>
    </div>

    <add-button @click="add" class="my-4" />
  </section>
</template>
<script>
import AddButton from "./AddButton";

export default {
  name: "AddTicker",

  components: {
    AddButton,
  },

  props: {
    coinList: Array,
    tickers: Array,
  },

  data() {
    return {
      ticker: "",
      isTickerInvalid: false,
    };
  },

  computed: {
    coinListAutosuggetions() {
      return this.ticker
        ? this.coinList
            .filter(
              (c) =>
                c.name.toLowerCase().includes(this.ticker.toLowerCase()) ||
                c.symbol.toLowerCase().includes(this.ticker.toLowerCase()),
            )
            .slice(0, 4)
        : [];
    },
  },

  methods: {
    add(suggestion) {
      if (suggestion && typeof suggestion === "string") {
        this.ticker = suggestion;
      }

      if (
        this.tickers.findIndex(
          (tickerItem) =>
            tickerItem.name.toLowerCase() === this.ticker.toLowerCase(),
        ) > -1
      ) {
        this.isTickerInvalid = true;

        return;
      }

      this.$emit("add-ticker", this.ticker.toUpperCase());

      this.ticker = "";
    },
  },

  watch: {
    ticker() {
      if (this.isTickerInvalid) {
        this.isTickerInvalid = false;
      }
    },
  },
};
</script>
