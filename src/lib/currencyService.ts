
export interface CurrencyData {
  lastFetched: string;
  data: {
    result: string;
    base_code: string;
    conversion_rates: Record<string, number>;
  };
}

export const fetchCurrencies = async (): Promise<CurrencyData> => {
  const res = await fetch("https://coinmarketcapcryptolisting.onrender.com/currency");
  if (!res.ok) throw new Error("Failed to fetch currency data");
  const data = await res.json();
  return data;
};
