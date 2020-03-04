<template>
  <div class="container">
    <h2 class="title">简易做图工具</h2>
    <div class="header">
      <div class="item">
        <span class="demonstration">画笔粗细</span>
        <el-slider v-model="thickness"></el-slider>
      </div>
      <div class="item">
        <span class="demonstration">画笔颜色</span>
        <el-color-picker v-model="color"></el-color-picker>
      </div>
      <div class="item">
        <span class="demonstration">填充颜色</span>
        <el-color-picker v-model="bgColor"></el-color-picker>
      </div>
      <div class="item" v-if="setFontSize">
        <span class="demonstration">字体大小</span>
        <el-slider v-model="fontSize"></el-slider>
      </div>
    </div>
    <div class="center">
      <div class="menu">
        <span v-for="(item,index) in toolsArr" :key="index" @click="chooseTools(item.name,index)" ref="item">{{item.label}}</span>
      </div>
      <div class="canvasBox">
        <canvas id="context" width="1500" height="700"></canvas>
      </div>
    </div>

    <div class="buttonGroup">
      <button @click="addRectangle()" class="marginLeft20">添加图形</button>
      <button @click="andText()" class="marginLeft20">添加文本</button>
      <button @click="loadWebImage()" class="marginLeft20">加载线上平台图片</button>
      <button @click="$refs.file2.click()" class="marginLeft20">加载本地图片url格式</button>
      <button @click="$refs.file1.click()" class="marginLeft20">加载本地图片base64格式</button>
      <button @click="toJSON" class="marginLeft20">toJSON</button>
      <button @click="loadFromJSON" class="marginLeft20">loadFromJSON</button>
      <button @click="save" class="marginLeft20">下载保存</button>
      <input type="file" @change="loadLocalImageByBase64" ref="file1" style="display: none;"/>
      <input type="file" @change="loadLocalImageByUrl" ref="file2" style="display: none;"/>
    </div>
    <div class="showJson">
      <textarea name="" id="" cols="30" rows="10" v-model="jsonValue"></textarea>
    </div>
  </div>
</template>

<script>
  // import { fabric } from 'fabricjs'
  // var canvas = new fabric.Canvas('context')
  export default {
    name: 'Home',
    data () {
      return {
        setFontSize:false,
        fontSize:40,
        thickness: 10,  // 画笔粗细
        color: '#000',  // 画笔颜色
        bgColor: '#000',  // 填充颜色
        mouseFrom: { x: 0, y: 0 },
        mouseTo: { x: 0, y: 0 },
        toolsArr: [
          {
            name: 'pencil',
            label: '铅笔'
          },
          {
            name: 'line',
            label: '直线'
          },
          {
            name: 'arrow',
            label: '箭头'
          },
          {
            name: 'rectangle',
            label: '矩形'
          },
          {
            name: 'circle',
            label: '圆形'
          },
          {
            name: 'ellipse',
            label: '椭圆'
          },
          {
            name: 'equilateral',
            label: '三角'
          },
          {
            name: 'text',
            label: '文字'
          },
          {
            name: 'drag',
            label: '移动'
          },
          {
            name: 'undo',
            label: '撤回'
          },
          {
            name: 'redo',
            label: '前进'
          },
          {
            name: 'eraser',
            label: '橡皮擦'
          },
          {
            name: 'delete',
            label: '删除'
          }
        ],
        chooseToolsName:"",
        drawingObject:null,
        canvas: null,
        redo:null,  // 记录动作
        doDrawing: false,
        offsetX: 0,
        offsetY: 0,
        jsonValue: ""
      }
    },
    watch: {
      thickness: {
        handler (val, oldVal) {
          this.drawing()
        }
      },
      color: {
        handler (val, oldVal) {
          this.drawing()
        }
      },
      fontSize: {
        handler (val, oldVal) {
          this.drawing()
        }
      },
    },
    mounted () {
      this.canvas = new fabric.Canvas('context', {
        isDrawingMode: true,   //设置是否可以绘制
        selectable: false,     //设置是否可以选中拖动  fabric提供的
        selection: false,   // 设置这两个属性没有任何反应
        backgroundColor: '#fff'
      })
      this.init()
    },
    methods: {
      chooseTools (name, index) {
        this.$refs.item.forEach((item, _index) => {
          item.className = ''
        })
        this.$refs.item[index].className = 'active';
        this.chooseToolsName=name;

        if (name === 'delete') {   //清空单独处理
          this.resetObj()                //重置的方法
          this.canvas.clear()         //清空画布
          this.canvas.renderAll()     //重新渲染
        } else if (name === 'text') {   //文字也单独处理 因为在选择到文字的时候 有一个改变文字大小的range
          this.canvas.isDrawingMode = true
          this.drawing()
          this.setFontSize = true      //文字大小range是否显示  是
        } else {
          this.drawing()            //调用drawing方法
          this.setFontSize = false    //否
        }
      },
      resetObj(){
        this.canvas.isDrawingMode = false
        this.canvas.selectable = false
        this.canvas.selection = false
        this.canvas.skipTargetFind = true
      },
      drawing(){
        if (this.drawingObject) {
          this.canvas.remove(this.drawingObject)
        }
        let canvasObject = null
        switch (this.chooseToolsName) {
          case "pencil":
            this.resetObj()
            this.canvas.isDrawingMode = true
            this.canvas.freeDrawingBrush.color = this.color   //画笔颜色
            this.canvas.freeDrawingBrush.width = this.thickness  //画笔宽度
            break;
          case "line":
            this.resetObj()
            canvasObject = new fabric.Line([this.mouseFrom.x, this.mouseFrom.y, this.mouseTo.x, this.mouseTo.y], {
              //fabric.Line是fabric封装的方法 直接用就好了
              stroke: this.color,   //画笔颜色
              strokeWidth: this.thickness   //画笔宽度
            })
            break;
          case "arrow":
            this.resetObj()
            canvasObject = new fabric.Path(this.drawArrow(this.mouseFrom.x, this.mouseFrom.y, this.mouseTo.x, this.mouseTo.y, 17.5, 17.5), {
              stroke: this.color,
              fill: this.bgColor,
              strokeWidth: this.thickness
            })
            break;
          case "rectangle":
            this.resetObj()
            canvasObject = new fabric.Rect({
              left: this.mouseFrom.x,
              top: this.mouseFrom.y,
              width: this.mouseTo.x - this.mouseFrom.x,
              height: this.mouseTo.y - this.mouseFrom.y,
              stroke: this.color,
              strokeWidth: this.thickness,
              fill: this.bgColor
            })
            break;
          case "circle":
            this.resetObj()
            let radius = Math.sqrt((this.mouseTo.x - this.mouseFrom.x) * (this.mouseTo.x - this.mouseFrom.x) + (this.mouseTo.y - this.mouseFrom.y) * (this.mouseTo.y - this.mouseFrom.y)) / 2;
            //Math.sqrt 这个方法是返回平方根  计算圆的半径时用的是勾股定理
            canvasObject = new fabric.Circle({
              left: this.mouseFrom.x,
              top: this.mouseFrom.y,
              radius: radius,   //圆的半径
              stroke: this.color,
              strokeWidth: this.thickness,
              fill: this.bgColor
            })
            break;
          case "ellipse":
            this.resetObj()
            let left = this.mouseFrom.x
            let top = this.mouseFrom.y
            canvasObject = new fabric.Ellipse({
              left: left,
              top: top,
              fill: this.bgColor,
              originX: 'center',    //从X轴中心点绘制
              originY: 'center',    //从Y轴中心点绘制
              rx: Math.abs(left - this.mouseTo.x),  //x轴半径
              ry: Math.abs(top - this.mouseTo.y),   //y轴半径   math.abs返回绝对值
              stroke: this.color,
              strokeWidth: this.thickness
            })
            break;
          case "equilateral":
            this.resetObj()
            let height = this.mouseTo.y - this.mouseFrom.y
            canvasObject = new fabric.Triangle({
              top: this.mouseFrom.y,
              left: this.mouseFrom.x,
              width: Math.sqrt(Math.pow(height, 2) + Math.pow(height / 2.0, 2)),
              height: height,
              stroke: this.color,
              strokeWidth: this.thickness,
              fill: this.bgColor
            })
            break;
          case "text":
            this.resetObj()
            let textbox = new fabric.Textbox('', {
              left: this.mouseFrom.x,
              top: this.mouseFrom.y,
              width: 150,
              fontSize: this.fontSize,
              fill: this.bgColor,
              hasControls: false
            })
            this.canvas.add(textbox)
            textbox.enterEditing()
            break;
          case "drag":
            this.canvas.isDrawingMode = false
            this.canvas.skipTargetFind = false
            this.canvas.selectable = true
            this.canvas.selection = true
            break;
          case "undo":
            this.resetObj()
            if (this.canvas._objects.length > 0) {
              this.redo.push(this.canvas._objects.pop())
              this.canvas.renderAll()
            }
            break;
          case "redo":
            this.resetObj()
            if (this.redo.length > 0) {
              this.controlFlag = true
              this.canvas.add(this.redo.pop())
              this.canvas.renderAll()
            }
            break;
          case "eraser":
            this.resetObj()
            this.canvas.isDrawingMode = true
            this.canvas.freeDrawingBrush.color = '#ffffff'   //画笔颜色
            this.canvas.freeDrawingBrush.width = this.thickness  //画笔宽度
            break;
          default:
            break;
        }
        if (canvasObject) {
          this.canvas.add(canvasObject)   //把要绘制的内容添加到画布中
          this.canvas.renderAll()
          this.drawingObject = canvasObject
        }
      },
      addRectangle () {   // 添加图形
        console.log(this.canvas)
        var rect = new fabric.Rect({
          left: 100,
          top: 100,
          fill: 'blue',
          width: 150,
          height: 150
        })
        this.canvas.add(rect)
      },
      andText () {   // 添加文本// Itext // 可编辑
        var text = new fabric.IText('Hello World', {  // 绘制文本
          borderColor: '#ff0000', // 激活状态时的边框颜色
          editingBorderColor: '#ff0000', // 文本对象的边框颜色，当它处于编辑模式时
          transparentCorners: true,
          fill: '#ff0000',
          fontSize: 30,
          color: 'yellow',
          originX: 'center',
          originY: 'center',
          left: 200,
          top: 300,
          fontFamily: 'Comic Sans'
        })
        text.on('selected', function (e) {//选中监听事件
          console.log('selected a rectangle')
        })

        this.canvas.add(text)
        text.enterEditing()  // 将文字置为编辑状态（可进行文字编辑）
        // text.hiddenTextarea.focus();
      },
      loadWebImage () {  // 加载当前线上平台的图片
        fabric.Image.fromURL('/static/images/beauty.jpg', oImg => {
          oImg.scale(0.5)  //图片缩小
          this.canvas.add(oImg)
        })
      },
      loadLocalImageByUrl (event) {   //  文件流加载
        var file = event.target.files[0]
        var img = window.URL.createObjectURL(file)
        fabric.Image.fromURL(img, oImg => {
          oImg.scale(0.5)  //缩放
          this.canvas.add(oImg)
        })
      },
      loadLocalImageByBase64 (event) {   // base64
        let _this = this
        var imgFile = new FileReader()
        imgFile.readAsDataURL(event.target.files[0])
        imgFile.onload = function () {
          var imgData = this.result
          var img = document.createElement("img")
          img.src = imgData
          var img = new fabric.Image(img, {
            left: 100,
            top: 100,
            width: 200,
            height: 200
          })
          _this.canvas.add(img)
        }
      },
      toJSON () {
        var json = this.canvas.toJSON()
        this.jsonValue = JSON.stringify(json)
      },
      loadFromJSON () {
        var json = JSON.parse(this.jsonValue)
        this.canvas.clear()
        this.canvas.loadFromJSON(json, this.canvas.renderAll.bind(this.canvas))
      },
      saveFile (data, filename) {
        var save_link = document.createElementNS('http://www.w3.org/1999/xhtml', 'a')
        save_link.href = data
        save_link.download = filename

        var event = document.createEvent('MouseEvents')
        event.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null)
        save_link.dispatchEvent(event)
      },
      save () {
        var dataURL = this.canvas.toDataURL("image/png")
        this.saveFile(dataURL, 'test.jpg')
      },
      init () {
        this.canvas.on({
          'mouse:down': (o) => {
            //鼠标在画布上按下事件(起点)
            //mouseFrom.x 和 mouseFrom.y 是在data中定义的数据 可以打印这个o看看
            this.mouseFrom.x = o.e.offsetX   //鼠标按下的X的起点
            this.mouseFrom.y = o.e.offsetY   //鼠标按下的y的起点
            this.doDrawing = true            //绘制设为true
          },
          'mouse:up': (o) => {
            //鼠标抬起的事件(终点)
            //mouseTo.x 和 mouseTo.y 也是在data中定义的数据
            this.mouseTo.x = o.e.offsetX
            this.mouseTo.y = o.e.offsetY
            this.drawingObject = null
            if(this.chooseToolsName==='line'||this.chooseToolsName==='arrow'||this.chooseToolsName==='rectangle'||this.chooseToolsName==='circle'||this.chooseToolsName==='ellipse'){
              this.drawing()
            }
            this.doDrawing = false    //停止绘制
          },
          'mouse:move': (o) => {
            //鼠标在移动中的事件
            this.offsetX = o.e.offsetX.toFixed(0)   //因为是小数，所以我给取整
            this.offsetY = o.e.offsetY.toFixed(0)

            if (!this.doDrawing) {
              return
            }
            this.mouseTo.x = o.e.offsetX
            this.mouseTo.y = o.e.offsetY
            if (this.sineNum === 1) {   //这个if是我的项目里有自定义图片的功能
              this.drawing()
            } else if (this.sineNum === 2) {
              this.diy()
            }
          },
          'object:move': (e) => {
            e.target.opacity = 0.5  //你绘画在画布上对象，移动它们的时候，让它们的透明度变成0.5
          },
          'object:added': (e) => {
            if (!this.controlFlag) {
              this.redo = []  //撤回用的
            }
            this.controlFlag = false
          },
          'object:modified': (e) => {
            e.target.opacity = 1
          }
        })
      },
      drawArrow (fromX, fromY, toX, toY, theta, headlen) {
        theta = typeof theta !== 'undefined' ? theta : 30
        headlen = typeof theta !== 'undefined' ? headlen : 10
        // 计算各角度和对应的P2,P3坐标
        let angle = Math.atan2(fromY - toY, fromX - toX) * 180 / Math.PI,
          angle1 = (angle + theta) * Math.PI / 180,
          angle2 = (angle - theta) * Math.PI / 180,
          topX = headlen * Math.cos(angle1),
          topY = headlen * Math.sin(angle1),
          botX = headlen * Math.cos(angle2),
          botY = headlen * Math.sin(angle2)
        let arrowX = fromX - topX,
          arrowY = fromY - topY
        let path = ' M ' + fromX + ' ' + fromY
        path += ' L ' + toX + ' ' + toY
        arrowX = toX + topX
        arrowY = toY + topY
        path += ' M ' + arrowX + ' ' + arrowY
        path += ' L ' + toX + ' ' + toY
        arrowX = toX + botX
        arrowY = toY + botY
        path += ' L ' + arrowX + ' ' + arrowY
        return path
      }
    }
  }
</script>
<style lang="scss" scoped>
  .container {
    .title {
      text-align: center;
    }

    .header {
      display: flex;

      .item {
        display: flex;
        align-items: center;
        margin-right: 20px;

        .demonstration {
          margin-right: 15px;
        }

        .el-slider {
          width: 200px;
        }
      }
    }

    .center {
      display: flex;

      .menu {
        width: 200px;
        display: flex;
        flex-direction: column;

        span {
          margin: 0 10px;
          display: inline-block;
          padding: 10px 10px;
          border: 1px solid black;

          &.active {
            border-color: red;
          }
        }
      }

      .canvasBox {
        width: 1500px;
        background-color: #fff;
      }
    }
  }

  .marginLeft20 {
    margin-left: 20px
  }

  #context {
    border: 1px solid;
  }

  .buttonGroup {
    margin-top: 20px;

    > button {
      display: inline-block;
      padding: 10px 20px;
    }
  }
</style>
