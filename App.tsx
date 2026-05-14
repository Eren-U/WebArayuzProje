import { useEffect, useState, useCallback } from "react";

// --- TYPES ---
interface Rates {
  USD: number;
  EUR: number;
  TRY: number;
  GBP: number;
  JPY: number;
  AUD: number;
}

interface CurrencyInfo {
  code: keyof Rates;
  name: string;
  flag: string;
  symbol: string;
}

// --- CURRENCY CONFIG ---
const CURRENCIES: CurrencyInfo[] = [
  { code: "USD", name: "Amerikan Doları", flag: "🇺🇸", symbol: "$" },
  { code: "EUR", name: "Euro", flag: "🇪🇺", symbol: "€" },
  { code: "TRY", name: "Türk Lirası", flag: "🇹🇷", symbol: "₺" },
  { code: "GBP", name: "İngiliz Sterlini", flag: "🇬🇧", symbol: "£" },
  { code: "JPY", name: "Japon Yeni", flag: "🇯🇵", symbol: "¥" },
  { code: "AUD", name: "Avustralya Doları", flag: "🇦🇺", symbol: "A$" },
];

// --- HELPERS ---
function formatNumber(num: number, code: string): string {
  if (code === "JPY") return num.toLocaleString("tr-TR", { maximumFractionDigits: 0 });
  return num.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 4 });
}

function getSymbol(code: string) {
  return CURRENCIES.find((c) => c.code === code)?.symbol ?? code;
}

// --- MAIN APP ---
export default function App() {
  const [rates, setRates] = useState<Rates | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdate, setLastUpdate] = useState("");

  const [amount, setAmount] = useState("1");
  const [fromCurrency, setFromCurrency] = useState<keyof Rates>("USD");
  const [toCurrency, setToCurrency] = useState<keyof Rates>("TRY");
  const [result, setResult] = useState<number | null>(null);
  const [converted, setConverted] = useState(false);

  // Fetch rates from ExchangeRate-API (free, no key needed)
  const fetchRates = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        "https://open.er-api.com/v6/latest/USD"
      );
      const data = await res.json();
      if (data.result === "success") {
        setRates({
          USD: data.rates.USD,
          EUR: data.rates.EUR,
          TRY: data.rates.TRY,
          GBP: data.rates.GBP,
          JPY: data.rates.JPY,
          AUD: data.rates.AUD,
        });
        // Format date
        const d = new Date(data.time_last_update_utc);
        setLastUpdate(
          d.toLocaleString("tr-TR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
        );
      } else {
        setError("Kur verisi alınamadı. Lütfen tekrar deneyin.");
      }
    } catch {
      setError("İnternet bağlantınızı kontrol edin.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRates();
  }, [fetchRates]);

  // Convert
  const handleConvert = () => {
    if (!rates) return;
    const val = parseFloat(amount.replace(",", "."));
    if (isNaN(val) || val <= 0) {
      setError("Lütfen geçerli bir miktar girin.");
      return;
    }
    setError("");
    // Convert: fromCurrency → USD → toCurrency
    const inUSD = val / rates[fromCurrency];
    const resultVal = inUSD * rates[toCurrency];
    setResult(resultVal);
    setConverted(true);
  };

  // Swap currencies
  const handleSwap = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
    setResult(null);
    setConverted(false);
  };

  const fromInfo = CURRENCIES.find((c) => c.code === fromCurrency)!;
  const toInfo = CURRENCIES.find((c) => c.code === toCurrency)!;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* HEADER */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">💱</span>
            <div>
              <h1 className="text-xl font-bold text-slate-800 leading-tight">
                Para Birimi Dönüştürücü
              </h1>
              <p className="text-xs text-slate-400">Güncel Döviz Kurları</p>
            </div>
          </div>
          {lastUpdate && (
            <div className="text-right hidden sm:block">
              <p className="text-xs text-slate-400">Son güncelleme</p>
              <p className="text-xs font-medium text-slate-600">{lastUpdate}</p>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8 flex flex-col gap-6">

        {/* CONVERTER CARD */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-5">
            Dönüştür
          </h2>

          {/* Amount Input */}
          <div className="mb-5">
            <label className="block text-xs font-medium text-slate-500 mb-1">
              Miktar
            </label>
            <input
              type="number"
              min="0"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setConverted(false);
                setResult(null);
              }}
              onKeyDown={(e) => e.key === "Enter" && handleConvert()}
              placeholder="0"
              className="w-full text-2xl font-bold text-slate-800 border-b-2 border-slate-200 focus:border-blue-500 focus:outline-none pb-2 bg-transparent transition-colors"
            />
          </div>

          {/* Currency Selectors */}
          <div className="flex items-center gap-3">
            {/* From */}
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-500 mb-1">
                Kaynak Para Birimi
              </label>
              <select
                value={fromCurrency}
                onChange={(e) => {
                  setFromCurrency(e.target.value as keyof Rates);
                  setConverted(false);
                  setResult(null);
                }}
                className="w-full border border-slate-200 rounded-xl px-3 py-3 text-sm font-medium text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer"
              >
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.code} – {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Swap Button */}
            <button
              onClick={handleSwap}
              title="Para birimlerini değiştir"
              className="mt-5 w-11 h-11 flex items-center justify-center rounded-full bg-blue-50 hover:bg-blue-100 text-blue-600 text-xl transition-colors border border-blue-100 flex-shrink-0"
            >
              ⇄
            </button>

            {/* To */}
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-500 mb-1">
                Hedef Para Birimi
              </label>
              <select
                value={toCurrency}
                onChange={(e) => {
                  setToCurrency(e.target.value as keyof Rates);
                  setConverted(false);
                  setResult(null);
                }}
                className="w-full border border-slate-200 rounded-xl px-3 py-3 text-sm font-medium text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer"
              >
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.code} – {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mt-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
              ⚠️ {error}
            </div>
          )}

          {/* Convert Button */}
          <button
            onClick={handleConvert}
            disabled={loading}
            className="mt-5 w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold rounded-xl transition-colors text-sm tracking-wide shadow-sm"
          >
            {loading ? "⏳ Kurlar Yükleniyor..." : "Dönüştür"}
          </button>

          {/* Result */}
          {converted && result !== null && (
            <div className="mt-5 p-5 bg-blue-50 border border-blue-100 rounded-xl text-center">
              <p className="text-sm text-slate-500 mb-1">
                {amount} {fromInfo.flag} {fromInfo.code} =
              </p>
              <p className="text-3xl font-bold text-blue-700">
                {getSymbol(toCurrency)} {formatNumber(result, toCurrency)}
              </p>
              <p className="text-sm text-slate-500 mt-1">
                {toInfo.flag} {toInfo.name}
              </p>
              <hr className="my-3 border-blue-100" />
              <p className="text-xs text-slate-400">
                1 {fromInfo.code} = {getSymbol(toCurrency)}{" "}
                {rates
                  ? formatNumber(
                      rates[toCurrency] / rates[fromCurrency],
                      toCurrency
                    )
                  : "-"}{" "}
                {toCurrency}
              </p>
            </div>
          )}
        </div>

        {/* RATES TABLE CARD */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              📊 Güncel Kurlar
            </h2>
            <button
              onClick={fetchRates}
              disabled={loading}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium disabled:text-slate-400 transition-colors"
            >
              {loading ? "Yükleniyor..." : "🔄 Yenile"}
            </button>
          </div>

          {loading ? (
            <div className="flex flex-col gap-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="h-10 bg-slate-100 rounded-lg animate-pulse"
                />
              ))}
            </div>
          ) : rates ? (
            <div className="divide-y divide-slate-100">
              {CURRENCIES.map((c) => {
                // Show rate relative to USD
                const rateFromUSD = rates[c.code];
                return (
                  <div
                    key={c.code}
                    className="flex items-center justify-between py-3 hover:bg-slate-50 px-2 rounded-lg transition-colors cursor-default"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{c.flag}</span>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          {c.code}
                        </p>
                        <p className="text-xs text-slate-400">{c.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-800">
                        {c.symbol} {formatNumber(rateFromUSD, c.code)}
                      </p>
                      <p className="text-xs text-slate-400">1 USD başına</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-red-500 text-center py-4">
              Veriler yüklenemedi.
            </p>
          )}
        </div>

        {/* INFO CARD */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
            ℹ️ Nasıl Kullanılır?
          </h2>
          <ol className="list-decimal list-inside space-y-1.5 text-sm text-slate-600">
            <li>Dönüştürmek istediğiniz <strong>miktarı</strong> girin</li>
            <li><strong>Kaynak para birimini</strong> seçin (örn. USD)</li>
            <li><strong>Hedef para birimini</strong> seçin (örn. TRY)</li>
            <li><strong>"Dönüştür"</strong> butonuna tıklayın</li>
            <li>Para birimlerini <strong>⇄</strong> butonuyla yer değiştirebilirsiniz</li>
          </ol>
        </div>

      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 bg-white py-4">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <p className="text-xs text-slate-400">
            Veriler <strong>open.er-api.com</strong> üzerinden anlık olarak alınmaktadır.
          </p>
          {lastUpdate && (
            <p className="text-xs text-slate-400 mt-1 sm:hidden">
              Son güncelleme: {lastUpdate}
            </p>
          )}
        </div>
      </footer>
    </div>
  );
}
