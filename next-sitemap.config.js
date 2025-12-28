/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.SITE_URL || 'https://yourdomain.com',
  generateRobotsTxt: true,
  sitemapSize: 7000,
  changefreq: 'daily',
  priority: 0.7,
  exclude: ['/api/*'],
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/admin/'],
      },
    ],
  },
  additionalPaths: async (config) => {
    const result = [];

    // Add dynamic blog paths
    try {
      const { connectToDatabase } = await import('./lib/mongodb.js');
      const Post = (await import('./models/Post.js')).default;

      await connectToDatabase();
      const posts = await Post.find({}, 'slug publishedAt').sort({ publishedAt: -1 });

      posts.forEach((post) => {
        result.push({
          loc: `/blog/${post.slug}`,
          changefreq: 'weekly',
          priority: 0.8,
          lastmod: post.publishedAt.toISOString(),
        });
      });
    } catch (error) {
      console.error('Error generating sitemap paths:', error);
    }

    return result;
  },
};