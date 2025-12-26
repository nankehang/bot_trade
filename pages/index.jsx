import React, { useState, useEffect } from 'react';

const Home = () => {
  const [data, setData] = useState({
    coinsData: [], winRate: 0, totalProfitLoss: 0, balance: 0, tradeHistory: [], success: true
  });

  const fetchData = async () => {
    try {
      const res = await fetch('/api/bot');
      const result = await res.json();
      if (result.success) setData(result);
    } catch (e) { console.error("Fetch Error"); }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const formatNum = (val, d = 2) => parseFloat(val || 0).toFixed(d);

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-4 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="bg-[#1e293b] p-6 rounded-2xl border border-yellow-500/30 shadow-2xl">
          <h1 className="text-3xl font-black text-yellow-500 italic uppercase">🚀 Multi-Coin Bot Dashboard</h1>
          <p className="text-gray-400 text-xs mt-1">BTC, ETH, BNB, LTC | 15m Trend + 4h Filter + Trailing Stop</p>
        </header>

        {/* Market Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {data.data?.map((coin, i) => (
            <div key={i} className="bg-[#1e293b] p-4 rounded-xl border border-gray-700 shadow-lg">
              <h3 className="text-xl font-bold text-yellow-500 border-b border-gray-700 pb-2 mb-2">{coin.symbol.replace('USDT','')}</h3>
              <div className="space-y-1 text-sm font-mono">
                <div className="flex justify-between"><span>Price:</span> <span className="text-white">${formatNum(coin.price)}</span></div>
                <div className="flex justify-between text-blue-400"><span>EMA15:</span> <span>{coin.ema}</span></div>
                <div className="flex justify-between text-cyan-400"><span>EMA4H:</span> <span>{coin.ema4h}</span></div>
                <div className="flex justify-between text-purple-400"><span>ATR:</span> <span>{coin.atr}</span></div>
                <div className="flex justify-between"><span>RSI:</span> <span className={parseFloat(coin.rsi) > 65 ? 'text-red-400' : parseFloat(coin.rsi) < 35 ? 'text-green-400' : ''}>{coin.rsi}</span></div>
                <div className="mt-2 pt-2 border-t border-gray-800 text-center">
                   <span className="text-[10px] text-gray-500 uppercase block">Status</span>
                   <span className="text-emerald-400 font-bold">{coin.action}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Stat Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard title="Total P/L" value={`$${formatNum(data.totalProfitLoss)}`} color={data.totalProfitLoss >= 0 ? 'text-emerald-400' : 'text-red-400'} />
          <StatCard title="Win Rate" value={`${formatNum(data.winRate)}%`} />
          <StatCard title="Today Trades" value={data.tradeHistory?.filter(t => new Date(t.date).toDateString() === new Date().toDateString()).length} />
          <StatCard title="Balance" value={`$${formatNum(data.balance)}`} />
        </div>

        {/* Table */}
        <div className="bg-[#1e293b] rounded-2xl overflow-hidden border border-gray-700 shadow-xl">
          <div className="p-4 bg-gray-800/50 font-bold text-yellow-500 border-b border-gray-700">📜 RECENT TRADES</div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs md:text-sm">
              <thead className="bg-gray-900 text-gray-500 uppercase">
                <tr>
                  <th className="p-4">Date/Time</th>
                  <th className="p-4">Symbol</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Profit</th>
                  <th className="p-4">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {data.tradeHistory?.map((t, i) => (
                  <tr key={i} className="hover:bg-gray-700/20 transition">
                    <td className="p-4 text-gray-500">{new Date(t.date).toLocaleString('th-TH', {hour12:false})}</td>
                    <td className="p-4 font-bold">{t.symbol.replace('USDT','')}</td>
                    <td className={`p-4 font-bold ${t.type==='BUY'?'text-emerald-400':'text-red-400'}`}>{t.type}</td>
                    <td className={`p-4 font-mono ${t.profit>=0?'text-emerald-400':'text-red-400'}`}>${formatNum(t.profit)}</td>
                    <td className="p-4 text-gray-400 italic">{t.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, color="text-white" }) => (
  <div className="bg-[#1e293b] p-4 rounded-xl border border-gray-700">
    <p className="text-[10px] text-gray-500 uppercase font-bold">{title}</p>
    <p className={`text-xl font-black ${color}`}>{value}</p>
  </div>
);

export default Home;