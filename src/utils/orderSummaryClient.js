import SummaryApi from "../common";

let cache = null;
let cacheAt = 0;
let request = null;
const CACHE_MS = 30 * 1000;

export const getOrderSummary = async ({ force = false } = {}) => {
  if (!force && cache && Date.now() - cacheAt < CACHE_MS) return cache;
  if (!force && request) return request;

  request = fetch(SummaryApi.ordersList.url, {
    method: SummaryApi.ordersList.method,
    credentials: "include",
  })
    .then(async (response) => {
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || "Failed to load orders");
      cache = Array.isArray(data.data) ? data.data : [];
      cacheAt = Date.now();
      return cache;
    })
    .finally(() => { request = null; });

  return request;
};

export const clearOrderSummary = () => { cache = null; cacheAt = 0; };
