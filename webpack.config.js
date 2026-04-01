/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = async () => {
  const postcssPresetEnv = (await import('postcss-preset-env')).default;
  const postcssGlobalData = (await import('@csstools/postcss-global-data'))
    .default;

  const getStyleLoaders = (isModule) => [
    'style-loader',
    {
      loader: 'css-loader',
      options: {
        importLoaders: 1,
        sourceMap: true,
        ...(isModule
          ? {
              modules: {
                localIdentName: '[name]__[local]__[hash:base64:5]',
              },
            }
          : {}),
      },
    },
    {
      loader: 'postcss-loader',
      options: {
        sourceMap: true,
        postcssOptions: {
          plugins: [
            postcssGlobalData({
              files: ['./src/styles/breakpoints.css'],
            }),
            postcssPresetEnv({
              stage: 1,
              features: {
                'custom-media-queries': true,
              },
            }),
          ],
        },
      },
    },
  ];

  return {
    entry: './src/index.tsx',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'js/[name].[contenthash].js',
      chunkFilename: 'js/[name].[contenthash].js',
      clean: true,
    },
    module: {
      rules: [
        {
          test: /\.(ts|tsx)$/,
          use: 'babel-loader',
          exclude: /node_modules/,
        },
        {
          test: /\.module\.css$/i,
          use: getStyleLoaders(true),
        },
        {
          test: /\.css$/i,
          exclude: /\.module\.css$/i,
          use: getStyleLoaders(false),
        },
      ],
    },
    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.jsx'],
      alias: {
        '@components': path.resolve(__dirname, 'src/components'),
        '@pages': path.resolve(__dirname, 'src/pages'),
        '@hooks': path.resolve(__dirname, 'src/hooks'),
        '@utils': path.resolve(__dirname, 'src/utils'),
        '@entities': path.resolve(__dirname, 'src/types'),
        '@api': path.resolve(__dirname, 'src/api'),
        '@context': path.resolve(__dirname, 'src/context'),
      },
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: './public/index.html',
        minify: {
          removeComments: true,
          collapseWhitespace: true,
        },
      }),
    ],
    devServer: {
      port: 3000,
      hot: true,
      historyApiFallback: true,
      open: false,
    },
    devtool: 'source-map',
    performance: {
      maxEntrypointSize: 512000,
      maxAssetSize: 512000,
    },
  };
};
