const UglifyJsPlugin = require('uglifyjs-webpack-plugin')

const env = process.env.VUE_APP_CURRENT_ENV;
// 代码运行在后端项目中,无需区分生产和测试环境，同一个包在在不同环境会自动切换不同的域名
module.exports = {
  publicPath: '/',
  outputDir: '../dist', // 输出文件目录
  devServer: {
    open: true,
    port: 6789,
    host: '0.0.0.0'
  },
  configureWebpack: (config) => {},
  productionSourceMap: false //生产环境不展示源码，禁止调试
}
