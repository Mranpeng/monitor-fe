let path = require('path')
const CompressionWebpackPlugin = require('compression-webpack-plugin');

module.exports = {  
    entry: './src/monitor.js',  //入口文件
    output: {  //输出文件路径设置
        path: __dirname,  
        filename: './monitor.min.js',  
    },  
    module: {  
        rules:[
            {
                test:/(\.jsx|\.js)$/,
                use:{
                    loader:"babel-loader",
                    options:{
                        presets:[
                            "env"
                        ]
                    }
                },
                exclude:path.resolve(__dirname,"node_modules"),
                include:path.resolve(__dirname,"src")
            }
        ]
    },
    plugins: [
        new CompressionWebpackPlugin({
            // options
        })
    ]
} 