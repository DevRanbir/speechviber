module.exports = {
  // ... other webpack configurations
  devtool: 'eval-source-map',
  ignoreWarnings: [
    {
      module: /node_modules\/firebase/,
    },
  ],
  bail: true, 
  stats: {
    errors: true,
    errorDetails: true
  },
  plugins: [
    new webpack.NoEmitOnErrorsPlugin()
  ]
};