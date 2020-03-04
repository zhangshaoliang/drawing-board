const terserPlugin = require('terser-webpack-plugin')

const env = process.env.NODE_ENV;
module.exports = {
  publicPath: '/',
  outputDir: './dist', // 输出文件目录
  devServer: {
    open: true,
    port: 6789,
    host: '0.0.0.0',
  },
  configureWebpack: (config) => {
    if (env === 'production') { // 只有生产环境执行此操作
      config.plugins.push(
        new terserPlugin({
          terserOptions: {
            ecma: undefined,
            warnings: false,
            parse: {},
            compress: {
              drop_debugger: true, // console
              drop_console: true,
              pure_funcs: ['console.log'] // 只要打包就移除console
            },
          },
          sourceMap: false,
          parallel: true,
        }),
      );
    }
    config.externals = {
      'vue': 'Vue',
      'vue-router': 'VueRouter',
      'element-ui': 'ELEMENT'
    };
  },
  productionSourceMap: !(env === 'production') //生产环境不展示源码，禁止调试
}
