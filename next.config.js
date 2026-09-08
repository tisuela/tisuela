export default {
  staticPageGenerationTimeout: 300,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'www.notion.so' },
      { protocol: 'https', hostname: 'notion.so' },
      { protocol: 'https', hostname: 'app.notion.com' },
      { protocol: 'https', hostname: 'file.notion.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'abs.twimg.com' },
      { protocol: 'https', hostname: 'pbs.twimg.com' },
      { protocol: 'https', hostname: 's3.us-west-2.amazonaws.com' },
      { protocol: 'https', hostname: 'img.notionusercontent.com' }
    ],
    formats: ['image/avif', 'image/webp'],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;"
  },

  async redirects() {
    return [
      {
        source: '/missions-donate',
        destination: 'https://renewalsv.churchcenter.com/giving/to/nate-tisuela-guatemala-stm-2026',
        permanent: true,
      },
      {
        source: '/missions-subscribe',
        destination: 'https://forms.gle/NZvm9Cbooz3NWkqe7',
        permanent: true,
      },
      {
        source: '/alpha-mixers',
        destination: 'https://forms.gle/2CjNd8pRjuCqjRNh6',
        permanent: true,
      },
      {
        source: '/missions',
        destination: 'https://www.tisuela.com/cobn-missions-2026',
        permanent: true,
      },
    ]
  },

  // See https://react-tweet.vercel.app/next#troubleshooting
  transpilePackages: ['react-tweet']
}
