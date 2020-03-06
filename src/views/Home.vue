<template>
  <div class="container">
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
      <div class="canvasBox" ref="canvasBox">
        <canvas id="context" width="100%" height="100%"></canvas>
      </div>
    </div>

    <div class="buttonGroup">
      <button @click="loadWebImage()" class="marginLeft20">添加网络图片</button>
      <button @click="$refs.file2.click()" class="marginLeft20">加载本地图片url格式</button>
      <button @click="$refs.file1.click()" class="marginLeft20">加载本地图片base64格式</button>
      <button @click="toJSON" class="marginLeft20" v-if="!isMobile">toJSON</button>
      <button @click="loadFromJSON" class="marginLeft20" v-if="!isMobile">loadFromJSON</button>
      <button @click="save" class="marginLeft20">下载保存</button>
      <input type="file" @change="loadLocalImageByBase64" ref="file1" style="display: none;"/>
      <input type="file" @change="loadLocalImageByUrl" ref="file2" style="display: none;"/>
    </div>
    <div class="showJson" v-if="!isMobile">
      <textarea v-model="jsonValue" style="height: 121px;resize: none;width: 100%;box-sizing: border-box;"></textarea>
    </div>
  </div>
</template>

<script>
  export default {
    name: 'Home',
    data () {
      return {
        setFontSize:false,
        fontSize:40,
        thickness: 10,  // 画笔粗细
        color: '#000',  // 画笔颜色
        bgColor: '#fff',  // 填充颜色
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
            label: '橡皮'
          },
          {
            name: 'del',
            label: '删除'
          },
          {
            name: 'clear',
            label: '清空'
          }
        ],
        chooseToolsName:"",
        canvas: null,
        redo:null,  // 记录动作
        doDrawing: false,
        offsetX: 0,
        offsetY: 0,
        jsonValue: "",
        isMobile:false
      }
    },
    watch: {
      thickness: {
        handler (val, oldVal) {
          const o = this.canvas.getActiveObject()
          if (o) {
            o.set('strokeWidth', val)
            this.canvas.renderAll()
          }
        }
      },
      color: {
        handler (val, oldVal) {
          const o = this.canvas.getActiveObject()
          if (o) {
            o.set('stroke', val)
            this.canvas.renderAll()
          }
        }
      },
      fontSize: {
        handler (val, oldVal) {
          const o = this.canvas.getActiveObject()
          if (o) {
            o.set('fontSize', val)
            this.canvas.renderAll()
          }
        }
      },
      bgColor: {
        handler (val, oldVal) {
          const o = this.canvas.getActiveObject()
          if (o) {
            o.set('fill', val)
            this.canvas.renderAll()
          }
        }
      },
    },
    mounted () {
      if(/Android|webOS|iPhone|iPod|BlackBerry/i.test(navigator.userAgent)) {
        this.isMobile=true
      }
      this.canvas = new fabric.Canvas('context', {
        isDrawingMode: false,   //设置是否可以绘制
        selectable: false,     //设置是否可以选中拖动  fabric提供的
        selection: false,   // 设置这两个属性没有任何反应
        backgroundColor: '#fff'
      })
      this.$nextTick(()=>{
        this.canvas.setWidth(this.$refs.canvasBox.offsetWidth)     //设置画布的宽度
        this.canvas.setHeight(this.$refs.canvasBox.offsetHeight)   //设置画布的高度
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

        if (name === 'clear') {   //清空单独处理
          this.resetObj()                //重置的方法
          this.canvas.clear()         //清空画布
          this.canvas.renderAll()     //重新渲染
        } else if (name === 'text') {   //文字也单独处理 因为在选择到文字的时候 有一个改变文字大小的range
          this.setFontSize = true      //文字大小range是否显示  是
          this.drawing()

        } else {
          this.setFontSize = false    //否
          this.drawing()            //调用drawing方法
        }
      },
      resetObj(){
        this.canvas.isDrawingMode = false
        this.canvas.selectable = false
        this.canvas.selection = false
        this.canvas.skipTargetFind = true
      },
      drawing(){
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
            canvasObject = new fabric.Line([110, 110, 210, 210], {
              stroke: this.color,   //画笔颜色
              strokeWidth: this.thickness   //画笔宽度
            })
            this.drag()
            break;
          case "arrow":
            this.resetObj()
            canvasObject = new fabric.Path(this.drawArrow(100, 100, 200, 200, 17.5, 17.5), {
              stroke: this.color,
              fill: this.bgColor,
              strokeWidth: this.thickness
            })
            this.drag()
            break;
          case "rectangle":
            this.resetObj()
            canvasObject = new fabric.Rect({
              left: 100,
              top: 100,
              width: 100,
              height: 100,
              stroke: this.color,
              strokeWidth: this.thickness,
              fill: this.bgColor
            })
            this.drag()
            break;
          case "circle":
            this.resetObj()
            canvasObject = new fabric.Circle({
              left: 150,
              top: 150,
              radius: 80,   //圆的半径
              stroke: this.color,
              strokeWidth: this.thickness,
              fill: this.bgColor
            })
            this.drag()
            break;
          case "ellipse":
            this.resetObj()
            canvasObject = new fabric.Ellipse({
              left: 150,
              top: 150,
              fill: this.bgColor,
              originX: 'center',    //从X轴中心点绘制
              originY: 'center',    //从Y轴中心点绘制
              rx: 80,  //x轴半径
              ry: 40,   //y轴半径   math.abs返回绝对值
              stroke: this.color,
              strokeWidth: this.thickness
            })
            this.drag()
            break;
          case "equilateral":
            this.resetObj()
            canvasObject = new fabric.Triangle({
              top: 130,
              left: 130,
              width: 120,
              height: Math.sqrt(3)*60,
              stroke: this.color,
              strokeWidth: this.thickness,
              fill: this.bgColor
            })
            this.drag()
            break;
          case "text":
            this.resetObj()
            let textbox = new fabric.Textbox('示例文字', {
              borderColor: '#ff0000', // 激活状态时的边框颜色
              editingBorderColor: '#ff0000', // 文本对象的边框颜色，当它处于编辑模式时
              left: 160,
              top: 160,
              width: 150,
              fontSize: this.fontSize,
              fill: this.color,   // 文字颜色
              hasControls: true
            })

            this.canvas.add(textbox).setActiveObject(textbox)
            textbox.enterEditing()
            // this.drag()

            break;
          case "drag":
            this.drag()
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
          case "del":
            var el = this.canvas.getActiveObject();
            this.canvas.remove(el);
            break;
          default:
            break;
        }
        if (canvasObject) {
          this.canvas.add(canvasObject)   //把要绘制的内容添加到画布中
          this.canvas.renderAll()
        }
      },
      drag(){
        this.canvas.isDrawingMode = false
        this.canvas.skipTargetFind = false
        this.canvas.selectable = true
        this.canvas.selection = true
      },
      loadWebImage () {  // 加载当前线上平台的图片
        fabric.Image.fromURL('/static/images/beauty.jpg', oImg => {
          oImg.scale(0.5)  //图片缩小
          this.canvas.add(oImg)
          this.drag()
        })
      },
      loadLocalImageByUrl (event) {   //  文件流加载
        var file = event.target.files[0]
        var img = window.URL.createObjectURL(file)
        fabric.Image.fromURL(img, oImg => {
          oImg.scale(0.5)  //缩放
          this.canvas.add(oImg)
          this.drag()
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
          this.drag()
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
      drawArrow (fromX, fromY, toX, toY, theta, headlen) { // 绘画箭头的函数
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
  @media (min-width: 1000px) {
    .container {
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
            font-size: 20px;
            &.active {
              border-color: red;
            }
          }
        }

        .canvasBox {
          flex: 1;
          margin-right: 10px;
          height: 700px;
          background-color: #fff;
        }
      }
    }
  }



  @media (max-width: 1000px) {
    .container {
      font-size: 26px;
      display: flex;
      width: 100%;
      height: 100%;
      position: fixed;
      left: 0;
      top: 0;
      flex-direction: column;
      .header {
        display: flex;
        margin-bottom: 10px;
        flex-wrap: wrap;
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
        flex-direction: column;
        flex: 1;
        .menu {
          margin: 0 10px;
          display: flex;
          flex-wrap: wrap;
          margin-bottom: 10px;
          span {
            padding: 10px 25px;
            border: 1px solid black;
            &.active {
              border-color: red;
            }
          }
        }

        .canvasBox {
          width: 100%;
          flex: 1;
          box-sizing: border-box;
        }
      }
      .buttonGroup {
        margin-top: 20px;

        > button {
          font-size: 26px;
          display: inline-block;
          padding: 10px 20px;
          margin-bottom: 10px;
        }
      }
    }
  }
</style>
