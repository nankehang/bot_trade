import crypto from 'crypto';
import mongoose from 'mongoose';
import { EMA, RSI, ATR } from 'technicalindicators';

mongoose.set('strictQuery', false);

const CONFIG = {
    SYMBOLS: ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'LTCUSDT'],
    PRECISION: { 'BTCUSDT': 3, 'ETHUSDT': 3, 'BNBUSDT': 2, 'LTCUSDT': 3 },
    LEVERAGE: 5,
    ORDER_USDT_SIZE: 5,  // Small size for testing
    EMA_PERIOD: 200,
    RSI_PERIOD: 14,
    RSI_OVERBOUGHT: 50,  // Temporarily lowered for testing short LTC
    RSI_OVERSOLD: 35,
    USE_BIG_TREND: true,
    USE_ATR_FILTER: true,
    ATR_PERIOD: 14,
    ATR_THRESHOLD: { 'BTCUSDT': 15.0, 'ETHUSDT': 1.5, 'BNBUSDT': 0.3, 'LTCUSDT': 0.08 },
    USE_TRAILING_STOP: true,
    TS_TRIGGER_1: 5.0, TS_TRIGGER_2: 12.0, TS_TRIGGER_3: 20.0,
    TS_CALLBACK_ATR_MULTIPLIER: 2.5,
    TP_PERCENT: 100, SL_PERCENT: -20,
};

const Trade = mongoose.models.Trade || mongoose.model('Trade', new mongoose.Schema({
    date: String, symbol: String, type: String, entryPrice: Number, closePrice: Number, profit: Number, roe: Number, reason: String
}));

const Position = mongoose.models.Position || mongoose.model('Position', new mongoose.Schema({
    symbol: { type: String, required: true, unique: true },
    type: String, entryPrice: Number, quantity: Number, highestPnL: { type: Number, default: 0 }, trailingLevel: { type: Number, default: 0 }
}));

const BINANCE_BASE_URL = process.env.DEMO === 'true' ? 'https://testnet.binancefuture.com' : 'https://fapi.binance.com';

const sendTelegram = async (message) => {
    if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_CHAT_ID) return;
    const url = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;
    await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: process.env.TELEGRAM_CHAT_ID, text: message })
    });
};

const binanceRequest = async (endpoint, method = 'GET', params = {}) => {
    const timestamp = Date.now();
    const queryString = new URLSearchParams({ ...params, timestamp, recvWindow: 60000 }).toString();
    const signature = crypto.createHmac('sha256', process.env.BINANCE_API_SECRET).update(queryString).digest('hex');
    const url = `${BINANCE_BASE_URL}${endpoint}?${queryString}&signature=${signature}`;
    const response = await fetch(url, { method, headers: { 'X-MBX-APIKEY': process.env.BINANCE_API_KEY } });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(`Binance API error: ${error.msg || response.statusText}`);
    }
    return await response.json();
};

export default async function handler(req, res) {
    if (!process.env.MONGODB_URI) return res.status(500).json({ error: 'MONGODB_URI is not set' });
    try {
        if (mongoose.connection.readyState !== 1) await mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    } catch (connErr) {
        console.error('Mongo connection error:', connErr);
        return res.status(500).json({ error: 'MongoDB connection failed', details: connErr.message });
    }

    const results = [];
    try {
        const rawPositions = await binanceRequest('/fapi/v2/positionRisk');
        const activeBinancePos = Array.isArray(rawPositions) ? rawPositions.filter(p => parseFloat(p.positionAmt) !== 0) : [];

        const symbolDataList = await Promise.all(CONFIG.SYMBOLS.map(async (symbol) => {
            try {
                const [k15, k4h] = await Promise.all([
                    fetch(`https://fapi.binance.com/fapi/v1/klines?symbol=${symbol}&interval=15m&limit=210`).then(r => r.json()),
                    fetch(`https://fapi.binance.com/fapi/v1/klines?symbol=${symbol}&interval=4h&limit=210`).then(r => r.json())
                ]);
                const closes = k15.map(k => parseFloat(k[4]));
                const currentPrice = closes[closes.length - 1];
                return {
                    symbol, currentPrice,
                    ema: EMA.calculate({ values: closes, period: CONFIG.EMA_PERIOD }).pop(),
                    rsi: RSI.calculate({ values: closes, period: CONFIG.RSI_PERIOD }).pop(),
                    atr: ATR.calculate({ high: k15.map(k => parseFloat(k[2])), low: k15.map(k => parseFloat(k[3])), close: closes, period: CONFIG.ATR_PERIOD }).pop(),
                    ema4h: EMA.calculate({ values: k4h.map(k => parseFloat(k[4])), period: CONFIG.EMA_PERIOD }).pop(),
                    success: true
                };
            } catch (e) { return { symbol, success: false }; }
        }));

        for (const data of symbolDataList) {
            if (!data.success) continue;
            const { symbol, currentPrice, ema, rsi, atr, ema4h } = data;
            let dbPos = await Position.findOne({ symbol });
            const realPos = activeBinancePos.find(p => p.symbol === symbol);
            const realAmt = realPos ? parseFloat(realPos.positionAmt) : 0;

            // --- Logic Sync & Trade Management ---
            if (dbPos && Math.abs(realAmt) === 0) {
                const diff = dbPos.type === 'BUY' ? (currentPrice - dbPos.entryPrice) : (dbPos.entryPrice - currentPrice);
                const roe = (diff / dbPos.entryPrice) * 100 * CONFIG.LEVERAGE;
                await Trade.create({ date: new Date().toISOString(), symbol, type: dbPos.type, entryPrice: dbPos.entryPrice, closePrice: currentPrice, profit: diff * Math.abs(dbPos.quantity), roe, reason: "🙌 Manual Close" });
                await Position.deleteOne({ symbol });
                await sendTelegram(`🚀 Closed ${symbol} ${dbPos.type} | Profit: $${(diff * Math.abs(dbPos.quantity)).toFixed(2)} (${roe.toFixed(2)}%) | Reason: Manual Close`);
                dbPos = null;
            }

            let actionLog = 'Wait ⏳';
            if (dbPos) {
                const diff = dbPos.type === 'BUY' ? (currentPrice - dbPos.entryPrice) : (dbPos.entryPrice - currentPrice);
                const roe = (diff / dbPos.entryPrice) * 100 * CONFIG.LEVERAGE;
                if (roe > dbPos.highestPnL) { dbPos.highestPnL = roe; await dbPos.save(); }

                let closeReason = '';
                if (roe <= CONFIG.SL_PERCENT) closeReason = "⛔ SL";
                else if (roe >= CONFIG.TP_PERCENT) closeReason = "✅ TP";
                else if (CONFIG.USE_TRAILING_STOP) {
                    const cb = (atr / currentPrice) * 100 * CONFIG.TS_CALLBACK_ATR_MULTIPLIER;
                    if (roe >= CONFIG.TS_TRIGGER_1 && dbPos.trailingLevel < 1) { dbPos.trailingLevel = 1; await dbPos.save(); }
                    if (dbPos.trailingLevel === 1 && roe <= 2) closeReason = "🛡️ Lock 2%";
                    else if (dbPos.trailingLevel >= 1 && roe <= (dbPos.highestPnL - cb)) closeReason = "📉 Trailing";
                }

                if (closeReason) {
                    await binanceRequest('/fapi/v1/order', 'POST', { symbol, side: dbPos.type === 'BUY' ? 'SELL' : 'BUY', type: 'MARKET', quantity: Math.abs(dbPos.quantity) });
                    await Trade.create({ date: new Date().toISOString(), symbol, type: dbPos.type, entryPrice: dbPos.entryPrice, closePrice: currentPrice, profit: diff * Math.abs(dbPos.quantity), roe, reason: closeReason });
                    await Position.deleteOne({ symbol });
                    await sendTelegram(`🚀 Closed ${symbol} ${dbPos.type} | Profit: $${(diff * Math.abs(dbPos.quantity)).toFixed(2)} (${roe.toFixed(2)}%) | Reason: ${closeReason}`);
                    actionLog = `Closed: ${closeReason}`;
                } else { actionLog = `Holding (${roe.toFixed(2)}%)`; }
            } else {
                let signal = (currentPrice > ema && rsi < CONFIG.RSI_OVERSOLD) ? 'BUY' : (currentPrice < ema && rsi > CONFIG.RSI_OVERBOUGHT) ? 'SELL' : 'NONE';
                // Temporary test: force SELL for LTC
                if (symbol === 'LTCUSDT' && signal === 'NONE') signal = 'SELL';
                if (signal !== 'NONE' && CONFIG.USE_BIG_TREND && ((signal === 'BUY' && currentPrice < ema4h) || (signal === 'SELL' && currentPrice > ema4h))) signal = 'NONE';
                if (signal !== 'NONE' && CONFIG.USE_ATR_FILTER && atr < (CONFIG.ATR_THRESHOLD[symbol] || 0)) signal = 'NONE';

                if (signal !== 'NONE') {
                    const qty = (CONFIG.ORDER_USDT_SIZE / currentPrice).toFixed(CONFIG.PRECISION[symbol]);
                    const order = await binanceRequest('/fapi/v1/order', 'POST', { symbol, side: signal, type: 'MARKET', quantity: qty });
                    if (order.orderId) {
                        await Position.create({ symbol, type: signal, entryPrice: currentPrice, quantity: parseFloat(qty) });
                        await sendTelegram(`🚀 Opened ${signal} ${symbol} | Qty: ${qty} | Price: $${currentPrice.toFixed(2)}`);
                        actionLog = `Opened ${signal}`;
                    }
                }
            }

            results.push({ 
                symbol, price: currentPrice, action: actionLog, 
                ema: ema?.toFixed(2), rsi: rsi?.toFixed(2), atr: atr?.toFixed(4), ema4h: ema4h?.toFixed(2) 
            });
        }

        const allTrades = await Trade.find().sort({ _id: -1 });
        const balances = await binanceRequest('/fapi/v2/balance');
        const usdt = balances.find(b => b.asset === 'USDT');

        res.status(200).json({
            success: true,
            data: results,
            tradeHistory: allTrades.slice(0, 15), // ส่ง 15 รายการล่าสุด
            totalProfitLoss: allTrades.reduce((s, t) => s + (t.profit || 0), 0),
            winRate: allTrades.length > 0 ? (allTrades.filter(t => t.profit > 0).length / allTrades.length) * 100 : 0,
            balance: usdt ? parseFloat(usdt.availableBalance) : 0
        });
    } catch (err) { res.status(500).json({ error: err.message }); }
}