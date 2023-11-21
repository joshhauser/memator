<script setup lang="ts">
import {fabric} from 'fabric';
import {computed, onMounted, ref} from "vue";
import type {TextBoxConfig} from "@/models/TextBoxConfig";
import TextBoxConfigurator from "@/components/TextBoxConfigurator.vue";

const memeCanvas = ref()
const maxWidth: number = 800;
const maxHeight: number = 600;
const whiteRectangleAdded = ref<boolean>(false)
const textBoxes = ref<any[]>([])
const uploadedImage = ref(undefined)
let canvas = undefined
let scaleFactor = undefined

const disableAddRectangleBtn = computed(() => {
  return !uploadedImage.value || whiteRectangleAdded.value
})

const rangeValue = ref(0)

const onImageUpload = (event: any) => {
  const imageFile = event.target.files[0];

  if (imageFile) {
    const reader = new FileReader()

    reader.onload = (e) => {
      const memeTemplate = new Image()
      memeTemplate.onload = () => {
        scaleFactor = Math.min(maxWidth / memeTemplate.width, maxHeight / memeTemplate.height);

        uploadedImage.value = new fabric.Image(memeTemplate, {
          scaleX: scaleFactor,
          scaleY: scaleFactor,
          selectable: false
        })

        canvas.setDimensions({
          width: memeTemplate.width * scaleFactor,
          height: memeTemplate.height * scaleFactor
        })
        setCanvasBoundaries()

        canvas.clear();
        canvas.add(uploadedImage.value);
      }

      memeTemplate.src = e.target.result as string;
    }

    reader.readAsDataURL(imageFile)
  }
}

const addWhiteRectangle = () => {
  const rectangleHeight = 150;
  const canvasHeight = canvas.getHeight()
  const canvasWidth = canvas.getWidth()
  const whiteRect = new fabric.Rect({
    width: canvasWidth,
    height: rectangleHeight,
    top: 0,
    fill: 'white',
    selectable: false,
  });

  canvas.setDimensions({width: canvasWidth, height: canvasHeight + rectangleHeight})
  setCanvasBoundaries()
  canvas.clear()
  canvas.add(whiteRect)

  uploadedImage.value.top = rectangleHeight
  canvas.add(uploadedImage.value)
  whiteRectangleAdded.value = true

  textBoxes.value.forEach(textBox => {
    canvas.add(textBox)
  })
}

const setCanvasBoundaries = () => {
  const boundary = new fabric.Rect({
    width: canvas.width,
    height: canvas.height,
    fill: 'transparent',
    strokeWidth: 1,
    stroke: 'black',
    selectable: false,
  });

  canvas.on('object:moving', function (e) {
    const obj = e.target;

    if (obj === boundary) return;

    if (
        obj.left < 0 ||
        obj.top < 0 ||
        obj.left + obj.width * obj.scaleX > canvas.width ||
        obj.top + obj.height * obj.scaleY > canvas.height
    ) {
      const newLeft = Math.min(Math.max(obj.left, 0), canvas.width - obj.width * obj.scaleX);
      const newTop = Math.min(Math.max(obj.top, 0), canvas.height - obj.height * obj.scaleY);

      obj.set({
        left: newLeft,
        top: newTop,
      });

      obj.setCoords();
    }
  });
}

const downloadMeme = () => {
  const dataUrl = canvas.toDataURL({format: 'png'})
  const link = document.createElement("a")
  link.href = dataUrl
  link.download = "meme.png"
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

const addText = () => {
  const text = new fabric.Textbox("New text", {
    left: 0,
    top: 0,
    width: canvas.getWidth(),
    fontsize: 20,
    fill: 'black',
    lockUniScaling: true,
  })

  adjustTextboxWidth(text);

  text.on('changed', function () {
    adjustTextboxWidth(text);
  });

  canvas.add(text).setActiveObject(text);

  textBoxes.value.push(text)
}

const onTextBoxUpdate = (index: number, config: TextBoxConfig) => {
  textBoxes.value[index].set('text', config.text)
  textBoxes.value[index].set('fill', config.fill)
  textBoxes.value[index].set('fontSize', config.fontSize)
  textBoxes.value[index].set('fontFamily', config.fontFamily)

  canvas.renderAll()
}

const adjustTextboxWidth = (textbox) => {
  const ctx = canvas.getContext('2d');
  ctx.font = textbox.fontSize + 'px ' + textbox.fontFamily;

  const textWidth = ctx.measureText(textbox.text).width;

  textbox.set({
    width: textWidth + 10
  });

  canvas.renderAll();
}

const onResize = () => {
  textBoxes.value[0].fontSize = rangeValue.value
  canvas.add(textBoxes.value[0])
}

onMounted(() => {
  canvas = new fabric.Canvas(memeCanvas.value);

})
</script>

<template>
  <main>
    <div id="left">
      <canvas id="memeCanvas" ref="memeCanvas" width="800" height="600"></canvas>
    </div>

    <div id="right">
      <div id="buttons">
        <input id="imageInput" type="file" accept="image/png, image/jpeg" @change="onImageUpload"/>
        <input type="button" value="Browse..." onclick="document.getElementById('imageInput').click();"/>
        <button @click="addText">Add text</button>
        <button :disabled="disableAddRectangleBtn" @click="addWhiteRectangle">Add white rectangle</button>
        <button @click="downloadMeme">Download</button>
        <button @click="textBoxes[0].fontFamily = 'Helvetica';  canvas.add(textBoxes[0]);">Test police</button>
        <input id="myRange" ref="range" v-model="rangeValue" type="range" min="1" max="100" class="slider"
               @input="onResize">
      </div>
      <div id="textboxes-container">
        <template v-for="(textBox, index) in textBoxes" :key="index">
          <TextBoxConfigurator
              :index="index"
              @update:config="onTextBoxUpdate"
          />
        </template>
      </div>
    </div>
  </main>
</template>

<style>

main {
  display: flex;
}

#right {
  display: flex;
  flex-direction: column;
  gap: 5rem;
}

#buttons {
  margin-left: 2rem;
  display: flex;
  gap: 3rem;
  height: fit-content;
}

canvas {
  border: 2px solid #000;
  min-height: 200px;
  min-width: 300px;
  height: fit-content;
  width: fit-content;
}

#imageInput {
  display: none;
}

</style>
