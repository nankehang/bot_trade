import Head from 'next/head';
import Link from 'next/link';
import connectToDatabase from '../../lib/mongodb';
import Post from '../../models/Post';

export default function BlogPost({ post }) {
  if (!post) {
    return (
      <div className="min-h-screen bg-[#0f172a] text-white p-4 font-sans">
        <div className="max-w-4xl mx-auto text-center py-10">
          <h1 className="text-4xl font-bold text-red-500 mb-4">Post Not Found</h1>
          <Link href="/blog" className="text-yellow-500 hover:text-yellow-400 transition">
            ← Back to Blog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-4 font-sans">
      <div className="max-w-4xl mx-auto">
        <Head>
          <title>{post.metaTitle}</title>
          <meta name="description" content={post.metaDesc} />
          <meta name="keywords" content={post.keywords} />
          <meta property="og:title" content={post.title} />
          <meta property="og:description" content={post.metaDesc} />
          <meta property="og:url" content={`https://yourdomain.com/blog/${post.slug}`} />
          <meta property="og:type" content="article" />
        </Head>

        <article className="bg-[#1e293b] p-6 rounded-xl border border-gray-700 shadow-lg">
          <header className="mb-8">
            <h1 className="text-4xl font-bold text-yellow-500 mb-4">{post.title}</h1>
            <p className="text-gray-400 text-sm">
              Published on {new Date(post.publishedAt).toLocaleDateString()}
            </p>
          </header>

          <div
            className="prose prose-invert prose-lg max-w-none mb-10"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* Call to Action */}
          <div className="mt-10 p-6 bg-yellow-100 rounded-lg text-center">
            <h2 className="text-2xl font-bold text-yellow-800">Trade LTC on Binance with 20% Discount</h2>
            <p className="text-yellow-700 mb-4">Start using our automated trading bot for LTC/USDT</p>
            <a
              href="YOUR_BINANCE_AFFILIATE_LINK"
              className="inline-block bg-black text-white px-8 py-3 rounded-full font-bold hover:bg-gray-800 transition"
              target="_blank"
              rel="noopener noreferrer"
            >
              Get Started Now
            </a>
          </div>

          <footer className="mt-8 pt-6 border-t border-gray-700">
            <Link href="/blog" className="text-yellow-500 hover:text-yellow-400 transition">
              ← Back to Blog
            </Link>
          </footer>
        </article>
      </div>
    </div>
  );
}

export async function getStaticPaths() {
  try {
    await connectToDatabase();
    const posts = await Post.find({}, 'slug').lean();

    const paths = posts.map((post) => ({
      params: { slug: post.slug },
    }));

    return {
      paths,
      fallback: 'blocking', // ISR: generate on-demand
    };
  } catch (error) {
    console.error('Error generating paths:', error);
    return {
      paths: [],
      fallback: 'blocking',
    };
  }
}

export async function getStaticProps({ params }) {
  try {
    await connectToDatabase();
    const post = await Post.findOne({ slug: params.slug }).lean();

    if (!post) {
      return {
        notFound: true,
      };
    }

    return {
      props: {
        post: {
          ...post,
          _id: post._id.toString(),
          publishedAt: post.publishedAt.toISOString(),
        },
      },
      revalidate: 3600, // Revalidate every hour
    };
  } catch (error) {
    console.error('Error fetching post:', error);
    return {
      notFound: true,
    };
  }
}