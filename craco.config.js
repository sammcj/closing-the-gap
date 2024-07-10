module.exports = {
  babel: {
    loaderOptions: {
      presets: [
        ['@babel/preset-env', { loose: true }],
        ['@babel/preset-react', { runtime: 'automatic' }]
      ],
      plugins: [
        ['@babel/plugin-proposal-class-properties', { loose: true }],
        ['@babel/plugin-proposal-private-methods', { loose: true }],
        ['@babel/plugin-proposal-private-property-in-object', { loose: true }]
      ]
    }
  },
  style: {
    postcss: {
      plugins: [
        require('tailwindcss'),
        require('autoprefixer'),
      ],
    },
  },
}
