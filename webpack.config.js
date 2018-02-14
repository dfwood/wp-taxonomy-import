const webpack = require('webpack');
const autoprefixer = require('autoprefixer');
const mediaQueryPacker = require('css-mqpacker');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

const isProduction = 'production' === process.env.NODE_ENV;

const cssFileExtension = isProduction ? '.min.css' : '.css';
const jsFileExtension = isProduction ? '.min.js' : '.js';

const extractCSS = new ExtractTextPlugin(`assets/css/[name]${cssFileExtension}`);

const config = {
    entry: {
        'wp-taxonomy-import': [
            './source/js/wp-taxonomy-import.js'
        ],
    },
    output: {
        path: __dirname,
        filename: `assets/js/[name]${jsFileExtension}`
    },
    externals: {
        jquery: 'jQuery',
        react: 'React',
        'react-dom': 'ReactDOM'
    },
    resolve: {
        alias: {
            'jquery.filthypillow': `${__dirname}/bower_components/jquery.filthypillow/jquery.filthypillow.js`,
        },
        extensions: ['', '.js', '.jsx', '.json'],
        modulesDirectories: [
            './source/js/modules',
            './node_modules',
        ]
    },
    module: {
        loaders: [
            {
                test: /\.(js|jsx)$/,
                exclude: /(node_modules)/,
                loader: 'babel',
                query: {
                    presets: [
                        'es2015',
                        'stage-0'
                    ],
                    plugins: (function () {
                        if (isProduction) {
                            return [
                                'lodash',
                                'transform-proto-to-assign',
                            ];
                        }
                        return [];
                    }())
                }
            },
            {
                test: /\.json$/,
                exclude: /node_modules/,
                loader: 'json'
            },
            {
                test: /\.css$/,
                loader: extractCSS.extract(['css?-url', 'postcss'])
            },
            {
                test: /\.(scss|sass)$/,
                loader: extractCSS.extract(['css?sourceMap&-url', 'postcss', 'sass?sourceMap'])
            },
            {
                test: /\.svg$/,
                loader: 'svg-inline-loader'
            },
            {
                test: /\.(png|jpg|jpeg|gif|woff|woff2|eot|ttf)$/,
                loader: 'file'
            },
            {
                test: /isotope\-|fizzy\-ui\-utils|desandro\-|masonry|outlayer|get\-size|doc\-ready|eventie|eventemitter/,
                loader: 'imports?define=>false&this=>window'
            }
        ]
    },
    postcss: [
        autoprefixer([
            "last 3 versions",
            ">1%",
            "not ie < 10",
            "not OperaMini all"
        ]),
        mediaQueryPacker()
    ],
    plugins: [
        extractCSS,
        new webpack.optimize.CommonsChunkPlugin({
            names: [],
            filename: `assets/js/[name]${jsFileExtension}`,
            minChunks: Infinity
        }),
        new webpack.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
        }),
        function () {
            this.plugin('run', (watching, callback) => {
                console.log(`Begin compile at ${new Date()}`);
                callback();
            });
            this.plugin('watch-run', (watching, callback) => {
                console.log(`Begin compile at ${new Date()}`);
                callback();
            });
        }
    ],
    devtool: 'source-map'
};

module.exports = config;
