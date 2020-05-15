import path from 'path';

import { Configuration } from 'webpack';

const config: Configuration = {
  context: path.join(__dirname, 'src'),
  entry: './index.tsx',
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'bundle.js',
    publicPath: '/assets',
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'awesome-typescript-loader',
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', 'jsx'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  devServer: {
    contentBase: path.join(__dirname, 'static'),
    host: '0.0.0.0',
    disableHostCheck: true,
  },
};

export default config;
