import Head from 'next/head';
import Link from 'next/link';
import connectToDatabase from '../../lib/mongodb';
import Post from '../../models/Post';

export default function Blog({ posts }) {
  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-4 font-sans">
      <div className="max-w-4xl mx-auto">
        <Head>
          <title>Price Prediction & Analysis Blog | LTC/USDT Trading Insights</title>
          <meta name="description" content="Expert analysis and price predictions for LTC/USDT trading on Binance Futures. Learn about automated trading strategies and market insights." />
          <meta name="keywords" content="LTC price prediction, Binance futures, Litecoin trading, LTCUSDT analysis" />
        </Head>

        <header className="text-center mb-10">
          <h1 className="text-4xl font-bold text-yellow-500 mb-4">Price Prediction & Analysis</h1>
          <p className="text-gray-400">Expert insights and automated trading strategies for LTC/USDT</p>
        </header>

        <div className="space-y-6">
          {posts.map((post) => (
            <article key={post._id} className="bg-[#1e293b] p-6 rounded-xl border border-gray-700 shadow-lg">
              <h2 className="text-2xl font-bold text-yellow-500 mb-2">
                <Link href={`/blog/${post.slug}`} className="hover:text-yellow-400 transition">
                  {post.title}
                </Link>
              </h2>
              <p className="text-gray-400 text-sm mb-4">{post.excerpt}</p>
              <div className="flex justify-between items-center text-sm text-gray-500">
                <span>{new Date(post.publishedAt).toLocaleDateString()}</span>
                <Link href={`/blog/${post.slug}`} className="text-yellow-500 hover:text-yellow-400 transition">
                  Read More →
                </Link>
              </div>
            </article>
          ))}
        </div>

        {posts.length === 0 && (
          <div className="text-center py-10">
            <p className="text-gray-400">No articles available yet. Check back soon!</p>
          </div>
        )}
      </div>
    </div>
  );
}

export async function getServerSideProps() {
  try {
    await connectToDatabase();
    const posts = await Post.find({}).sort({ publishedAt: -1 }).lean();

    return {
      props: {
        posts: posts.map(post => ({
          ...post,
          _id: post._id.toString(),
          publishedAt: post.publishedAt.toISOString(),
        })),
      },
    };
  } catch (error) {
    console.error('Error fetching posts:', error);
    return {
      props: {
        posts: [],
      },
    };
  }
}