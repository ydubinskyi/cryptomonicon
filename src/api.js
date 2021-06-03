const API_KEY =
  "967b7766b513824a9374ba704e24821128c203d302684d9fe0632d3023d73523";

const tickersHandlers = new Map();
const tickerBaseCurrency = new Map();
const socket = new WebSocket(
  `wss://streamer.cryptocompare.com/v2?api_key=${API_KEY}`,
);

const AGGREGATE_INDEX = "5";
const INVALID_SUB = "500";

let INTERNAL_BTC_TO_USD_PRICE = 1;

socket.addEventListener("message", (e) => {
  const {
    TYPE: type,
    FROMSYMBOL: currency,
    PRICE: newPrice,
    PARAMETER: errorParam,
    MESSAGE: errorMessage,
  } = JSON.parse(e.data);

  if (type === INVALID_SUB && errorMessage === "INVALID_SUB") {
    const fromCurrencySymbol = errorParam.split("~")[2];
    const toCurrencySymbol = errorParam.split("~")[3];

    if (toCurrencySymbol === "USD") {
      subscribeToTickerOnWs(fromCurrencySymbol, "BTC");
      tickerBaseCurrency.set(fromCurrencySymbol, "BTC");
    } else {
      const handlers = tickersHandlers.get(fromCurrencySymbol) ?? [];
      handlers.forEach((fn) => fn({ price: "-", valid: false }));
    }

    return;
  }

  if (type !== AGGREGATE_INDEX || newPrice === undefined) {
    return;
  }

  const handlers = tickersHandlers.get(currency) ?? [];

  handlers.forEach((fn) =>
    fn({
      price: calculatePriceBaseOnCurrency(newPrice, currency),
      valid: true,
    }),
  );
});

function sendToWebSocket(message) {
  const stringifiedMessage = JSON.stringify(message);

  if (socket.readyState === WebSocket.OPEN) {
    socket.send(stringifiedMessage);
    return;
  }

  socket.addEventListener(
    "open",
    () => {
      socket.send(stringifiedMessage);
    },
    { once: true },
  );
}

function subscribeToTickerOnWs(fromCurrency, toCurrency = "USD") {
  sendToWebSocket({
    action: "SubAdd",
    subs: [`5~CCCAGG~${fromCurrency}~${toCurrency}`],
  });
}

function unsubscribeFromTickerOnWs(fromCurrency, toCurrency = "USD") {
  sendToWebSocket({
    action: "SubRemove",
    subs: [`5~CCCAGG~${fromCurrency}~${toCurrency}`],
  });
}

export const subscribeToTicker = (ticker, cb) => {
  const hasThisSub = tickersHandlers.has(ticker);
  const subscribers = tickersHandlers.get(ticker) || [];
  tickersHandlers.set(ticker, [...subscribers, cb]);
  tickerBaseCurrency.set(ticker, "USD");
  if (!hasThisSub) {
    subscribeToTickerOnWs(ticker);
  }
};

export const unsubscribeFromTicker = (ticker) => {
  const baseCurrency = tickerBaseCurrency.get(ticker);
  unsubscribeFromTickerOnWs(ticker, baseCurrency);
  tickersHandlers.delete(ticker);
  tickerBaseCurrency.delete(ticker);
};

function calculatePriceBaseOnCurrency(price, currencyCode) {
  const baseCurrency = tickerBaseCurrency.get(currencyCode);

  return baseCurrency === "USD" ? price : price * INTERNAL_BTC_TO_USD_PRICE;
}

export const getCoinList = () => {
  return fetch(
    "https://min-api.cryptocompare.com/data/all/coinlist?summary=true",
  )
    .then((data) => data.json())
    .then(({ Data }) =>
      Object.values(Data).map(({ FullName: name, Symbol: symbol }) => ({
        name,
        symbol,
      })),
    );
};

subscribeToTicker("BTC", ({ price }) => {
  INTERNAL_BTC_TO_USD_PRICE = price;
});
