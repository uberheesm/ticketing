module.exports = {
    webpackDevMiddleware: config => {
        config.watchOptions.poll = 300;
        return config;
    }
}

// 예1
// module.exports = {
//     webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
//       // Note: we provide webpack above so you should not `require` it
//       // Perform customizations to webpack config
//       // Important: return the modified config
//       config.plugins.push(new webpack.IgnorePlugin(/\/__tests__\//))
//       return config
//     },
//     webpackDevMiddleware: config => {
//       // Perform customizations to webpack dev middleware config
//       // Important: return the modified config
//       return config
//     },
//   }

// 예2
// const withCSS = require("@zeit/next-css");
// require('dotenv').config()
// const path = require('path')
// const Dotenv = require('dotenv-webpack')
//
// const withImages = require('next-images')
//
// module.exports = withCSS(withImages({
//     inlineImageLimit: 16384,
//     webpack(config, options) {
//         config.plugins = config.plugins || [];
//         config.plugins = [
//             ...config.plugins,
//
//             // Read the .env file
//             new Dotenv({
//                 path: path.join(__dirname, '.env'),
//                 systemvars: true
//             })
//         ];
//         return config
//     }
// }));

//  예3
//  / ** @type {import('next').NextConfig} */
//  const withBundleAnalyzer = require("@next/bundle-analyzer")({
//      enabled: process.env.ANALYZE === "true",
//    });
//  
//   const withAntdLess = require("next-plugin-antd-less");
//   
//   module.exports = withBundleAnalyzer(
//     withAntdLess({
//       // Or better still you can specify a path to a file
//       lessVarsFilePath: "./styles/variables.less",
//       // optional
//       lessVarsFilePathAppendToEndOfContent: false,
//       // optional https://github.com/webpack-contrib/css-loader#object
//       cssLoaderOptions: {},
//   
//       // Other Config Here...
//   
//       webpack(config) {
//         return config;
//       },
//   
//       // ONLY for Next.js 10, if you use Next.js 11, delete this block
//       future: {
//         webpack5: true,
//       },
//       reactStrictMode: true
//     })
//   );