import mongoose from 'mongoose';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import Post from '../models/Post.js';

// Load .env.local manually
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '..', '.env.local');

let MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  try {
    const envContent = readFileSync(envPath, 'utf8');
    const envLines = envContent.split('\n');
    for (const line of envLines) {
      if (line.trim().startsWith('MONGODB_URI=')) {
        MONGODB_URI = line.split('=')[1].trim().replace(/^["']|["']$/g, '');
        break;
      }
    }
  } catch (error) {
    console.error('Could not read .env.local file');
  }
}

if (!MONGODB_URI) {
  console.error('Please set MONGODB_URI environment variable');
  process.exit(1);
}

console.log('MONGODB_URI:', MONGODB_URI);

async function insertPost() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Sample post data - replace with your AI-generated content
    const samplePost = {
      title: "LTC Price Prediction 2025: Expert Analysis for Binance Futures",
      slug: "ltc-price-prediction-2025",
      content: `<h1>LTC Price Prediction 2025: Expert Analysis for Binance Futures</h1>
<p>As a senior crypto analyst, I've been tracking Litecoin (LTC) closely since its inception. In this comprehensive analysis, we'll dive deep into LTC/USDT trading on Binance Futures, exploring market sentiment, technical indicators, and the advantages of automated trading strategies.</p>

<h2>Current Market Sentiment for LTC</h2>
<p>Litecoin has shown remarkable resilience in the volatile crypto market. With its established position as "digital silver" to Bitcoin's "digital gold," LTC continues to maintain strong institutional and retail interest.</p>

<h3>Technical Analysis: Key Indicators</h3>
<p>Our automated bot uses multiple timeframes for optimal entry and exit points:</p>
<ul>
<li><strong>15-minute EMA (200)</strong>: Captures short-term momentum</li>
<li><strong>4-hour EMA (200)</strong>: Filters out market noise</li>
<li><strong>RSI (14)</strong>: Identifies overbought/oversold conditions</li>
<li><strong>ATR (14)</strong>: Measures volatility for position sizing</li>
</ul>

<h2>Funding Rates and Futures Trading</h2>
<p>Binance Futures funding rates for LTCUSDT typically range between -0.02% to +0.02% per 8 hours. Positive funding rates indicate long positions are paying shorts, suggesting bullish sentiment.</p>

<h3>Why Automated Trading Works</h3>
<p>Our LTC trading bot eliminates emotional decision-making and operates 24/7, capitalizing on:</p>
<ul>
<li>Arbitrage opportunities between spot and futures</li>
<li>Funding rate harvesting</li>
<li>Volatility-based position sizing</li>
<li>Trailing stop losses for profit protection</li>
</ul>

<h2>2025 Price Outlook</h2>
<p>Based on current market dynamics, LTC could see significant upside if Bitcoin maintains its bullish trajectory. Our bot has achieved consistent profitability by focusing on LTCUSDT volatility.</p>`,
      excerpt: "Discover the latest Litecoin price trends and how our trading bot capitalizes on LTC/USDT volatility.",
      metaTitle: "LTC Price Prediction 2025 | Real-time Dashboard & Bot",
      metaDesc: "Expert LTC/USDT analysis and automated trading strategies for Binance Futures. Track live prices and funding rates.",
      keywords: "LTC price prediction, Binance futures bot, LTCUSDT, Litecoin trading",
      publishedAt: new Date()
    };

    const post = new Post(samplePost);
    await post.save();

    console.log('✅ Post inserted successfully!');
    console.log('Title:', post.title);
    console.log('Slug:', post.slug);
    console.log('URL: /blog/' + post.slug);

  } catch (error) {
    console.error('❌ Error inserting post:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

insertPost();