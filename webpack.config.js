/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require('fs');
const path = require('path');
const webpack = require('webpack');
const dotenv = require('dotenv');
const HtmlWebpackPlugin = require('html-webpack-plugin');

class CopyPublicAssetsPlugin {
  apply(compiler) {
    compiler.hooks.afterEmit.tap('CopyPublicAssetsPlugin', () => {
      const publicDir = path.resolve(__dirname, 'public');
      const outputDir = compiler.options.output.path;

      if (!fs.existsSync(publicDir) || !outputDir) return;

      fs.readdirSync(publicDir).forEach((entry) => {
        if (entry === 'index.html') return;

        fs.cpSync(path.join(publicDir, entry), path.join(outputDir, entry), {
          recursive: true,
        });
      });
    });
  }
}

module.exports = async (env, argv) => {
  const mode = argv.mode || 'development';
  const envFile =
    mode === 'production'
      ? path.resolve(__dirname, '.env.production')
      : path.resolve(__dirname, '.env.development');
  if (fs.existsSync(envFile)) {
    dotenv.config({ path: envFile });
  }
  const apiBaseUrl =
    process.env.API_BASE_URL ||
    (mode === 'development' ? 'http://localhost:8081' : undefined);

  if (!apiBaseUrl) {
    throw new Error(`API_BASE_URL is required for webpack mode "${mode}"`);
  }
  const devServerPort = Number(process.env.PORT, 10) || 3000;
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
      publicPath: '/',
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
      new CopyPublicAssetsPlugin(),
      new webpack.DefinePlugin({
        'process.env.API_BASE_URL': JSON.stringify(apiBaseUrl),
      }),
    ],
    devServer: {
      port: devServerPort,
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
