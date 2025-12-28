import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Script from 'next/script';
import { motion, AnimatePresence } from 'framer-motion';

const Home = () => {
  const [data, setData] = useState({
    coinsData: [], winRate: 0, totalProfitLoss: 0, balance: 0, tradeHistory: [], success: true
  });
  const [latestPosts, setLatestPosts] = useState([]);
  const [prevPrices, setPrevPrices] = useState({});

  const fetchData = async () => {
    try {
      const res = await fetch('/api/bot');
      const result = await res.json();
      if (result.success) {
        // Update previous prices for animation detection
        const newPrevPrices = {};
        result.data?.forEach(coin => {
          newPrevPrices[coin.symbol] = coin.price;
        });
        setPrevPrices(prev => ({ ...prev, ...newPrevPrices }));
        setData(result);
      }
    } catch (e) { console.error("Fetch Error"); }
  };

  const fetchLatestPosts = async () => {
    try {
      const res = await fetch('/api/posts');
      const result = await res.json();
      if (result.success) {
        setLatestPosts(result.data.slice(0, 3)); // Show only 3 latest posts
      }
    } catch (e) { console.error("Posts Fetch Error"); }
  };

  useEffect(() => {
    fetchData();
    fetchLatestPosts();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const formatNum = (val, d = 2) => parseFloat(val || 0).toFixed(d);

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-4 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="bg-gradient-to-r from-[#1e293b] to-[#0f172a] p-6 rounded-2xl border-l-4 border-yellow-500 shadow-2xl">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-black text-yellow-500 italic uppercase tracking-tighter">🚀 LTCusdt.com Intelligence</h1>
              <p className="text-gray-400 text-sm">Automated Binance Futures Bot <span className="text-yellow-500/50">|</span> 20% Fee Rebate Active</p>
            </div>
            <div className="flex gap-2">
               <a href="https://www.binance.com/referral/earn-together/refer2earn-usdc/claim?hl=en&ref=GRO_28502_D63UZ&utm_source=default" target="_blank" rel="noopener noreferrer" className="bg-yellow-500 hover:bg-yellow-400 text-black px-6 py-2 rounded-full font-black transition-all transform hover:scale-105 shadow-lg shadow-yellow-500/20">
                 TRADE ON BINANCE
               </a>
               <a href="https://youtu.be/TYYyUvJYuH0" target="_blank" rel="noopener noreferrer" className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-bold text-sm transition">
                 📺 YouTube
               </a>
            </div>
          </div>
        </header>

        {/* TradingView LTC/USDT Chart */}
        <div className="bg-[#1e293b] p-2 rounded-2xl border border-gray-700 h-[400px] overflow-hidden">
          <iframe
            src={`https://s.tradingview.com/widgetembed/?frameElementId=tradingview_76d06&symbol=BINANCE:LTCUSDT&interval=15&hidesidetoolbar=1&symboledit=1&saveimage=1&toolbarbg=f1f3f6&studies=[]&theme=dark&style=1&timezone=Etc%2FUTC&studies_overrides={}&overrides={}&enabled_features=[]&disabled_features=[]&locale=en`}
            width="100%"
            height="100%"
            frameBorder="0"
            allowFullScreen
          ></iframe>
        </div>

        {/* LTC Analysis Section */}
        {latestPosts.length > 0 && (
          <div className="bg-[#1e293b] p-6 rounded-2xl border border-yellow-500/30 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-yellow-500">📊 LTC Analysis & Insights</h2>
              <Link href="/blog" className="text-yellow-500 hover:text-yellow-400 transition text-sm">
                View All →
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {latestPosts.map((post) => (
                <div key={post._id} className="bg-[#0f172a] p-4 rounded-lg border border-gray-700">
                  <h3 className="text-lg font-bold text-yellow-500 mb-2 line-clamp-2">
                    <Link href={`/blog/${post.slug}`} className="hover:text-yellow-400 transition">
                      {post.title}
                    </Link>
                  </h3>
                  <p className="text-gray-400 text-sm mb-3 line-clamp-3">{post.excerpt}</p>
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span>{new Date(post.publishedAt).toLocaleDateString()}</span>
                    <Link href={`/blog/${post.slug}`} className="text-yellow-500 hover:text-yellow-400 transition">
                      Read →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Market Overview & Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Market Cards */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.data?.map((coin, i) => {
                const isPriceUp = parseFloat(coin.price) > parseFloat(prevPrices[coin.symbol] || coin.price);
                const isPriceDown = parseFloat(coin.price) < parseFloat(prevPrices[coin.symbol] || coin.price);

                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: i * 0.1 }}
                    className="relative bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20 shadow-2xl overflow-hidden"
                  >
                    {/* Glassmorphism background effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-transparent"></div>

                    <div className="relative z-10">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-2xl font-bold text-yellow-500">{coin.symbol.replace('USDT','')}</h3>
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center justify-center space-x-2">
                            <span className="relative flex h-3 w-3">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                            </span>
                            <span className="text-emerald-400 font-bold uppercase tracking-wider">{coin.action}</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Price:</span>
                          <motion.span
                            key={coin.price}
                            initial={{ scale: 1 }}
                            animate={{ scale: isPriceUp || isPriceDown ? 1.1 : 1 }}
                            className={`text-white font-mono text-lg ${isPriceUp ? 'text-green-400' : isPriceDown ? 'text-red-400' : ''}`}
                          >
                            ${formatNum(coin.price)}
                          </motion.span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-blue-400">EMA15:</span>
                          <span className="text-white font-mono">{coin.ema}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-cyan-400">EMA4H:</span>
                          <span className="text-white font-mono">{coin.ema4h}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-purple-400">ATR:</span>
                          <span className="text-white font-mono">{coin.atr}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">RSI:</span>
                          <span className={`font-mono ${parseFloat(coin.rsi) > 65 ? 'text-red-400' : parseFloat(coin.rsi) < 35 ? 'text-green-400' : 'text-white'}`}>
                            {coin.rsi}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Live Chart */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white/10 backdrop-blur-lg p-4 rounded-2xl border border-white/20 shadow-2xl h-96"
            >
              <h3 className="text-lg font-bold text-yellow-500 mb-4 text-center">📈 LTC/USDT Live Chart</h3>
              <div className="w-full h-full">
                <iframe
                  src="https://www.tradingview.com/widgetembed/?frameElementId=tradingview_chart&symbol=BINANCE%3ALTCUSDT&interval=15&hidesidetoolbar=1&symboledit=1&saveimage=1&toolbarbg=f1f3f6&studies=%5B%5D&theme=dark&style=1&timezone=Etc%2FUTC&withdateranges=1&showpopupbutton=1&studies_overrides=%7B%7D&overrides=%7B%7D&enabled_features=%5B%5D&disabled_features=%5B%5D&locale=en&utm_source=yourwebsite&utm_medium=widget&utm_campaign=chart&utm_term=BINANCE%3ALTCUSDT"
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  allowFullScreen
                  className="rounded-lg"
                ></iframe>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Stat Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard title="Total P/L" value={`$${formatNum(data.totalProfitLoss)}`} color={data.totalProfitLoss >= 0 ? 'text-emerald-400' : 'text-red-400'} />
          <StatCard title="Win Rate" isProgress={true} progressValue={parseFloat(data.winRate)} />
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
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');
        `}
      </Script>
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