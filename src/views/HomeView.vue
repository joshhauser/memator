<script setup lang="ts">
import {fabric} from 'fabric';
import {computed, onMounted, ref} from "vue";

const memeCanvas = ref()
const maxWidth: number = 800;
const maxHeight: number = 600;
const canvas = ref(undefined);
const whiteRectangleAdded = ref<boolean>(false)
const uploadedImage = ref(undefined)
const scaleFactor = ref<number>();
const textBoxes = ref<any[]>([])

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
        scaleFactor.value = Math.min(maxWidth / memeTemplate.width, maxHeight / memeTemplate.height);

        uploadedImage.value = new fabric.Image(memeTemplate, {
          scaleX: scaleFactor.value,
          scaleY: scaleFactor.value,
          selectable: false
        })

        canvas.value.setDimensions({
          width: memeTemplate.width * scaleFactor.value,
          height: memeTemplate.height * scaleFactor.value
        })
        setCanvasBoundaries()

        canvas.value.clear();
        canvas.value.add(uploadedImage.value);
      }

      memeTemplate.src = e.target.result;
    }

    reader.readAsDataURL(imageFile)
  }
}

const addWhiteRectangle = () => {
  const rectangleHeight = 150;
  const canvasHeight = canvas.value.getHeight()
  const canvasWidth = canvas.value.getWidth()
  const whiteRect = new fabric.Rect({
    width: canvasWidth,
    height: rectangleHeight,
    top: 0,
    fill: 'white',
    selectable: false,
  });

  canvas.value.setDimensions({width: canvasWidth, height: canvasHeight + rectangleHeight})
  setCanvasBoundaries()
  canvas.value.clear()
  canvas.value.add(whiteRect)

  uploadedImage.value.top = rectangleHeight
  canvas.value.add(uploadedImage.value)
  whiteRectangleAdded.value = true

  textBoxes.value.forEach(textBox => {
    canvas.value.add(textBox)
  })

}

const setCanvasBoundaries = () => {
  const boundary = new fabric.Rect({
    width: canvas.value.width,
    height: canvas.value.height,
    fill: 'transparent',
    strokeWidth: 1,
    stroke: 'black',
    selectable: false,
  });

  canvas.value.on('object:moving', function (e) {
    const obj = e.target;

    if (obj === boundary) return;

    if (
        obj.left < 0 ||
        obj.top < 0 ||
        obj.left + obj.width * obj.scaleX > canvas.value.width ||
        obj.top + obj.height * obj.scaleY > canvas.value.height
    ) {
      const newLeft = Math.min(Math.max(obj.left, 0), canvas.value.width - obj.width * obj.scaleX);
      const newTop = Math.min(Math.max(obj.top, 0), canvas.value.height - obj.height * obj.scaleY);

      obj.set({
        left: newLeft,
        top: newTop,
      });

      obj.setCoords();
    }
  });
}

const downloadMeme = () => {
  const dataUrl = canvas.value.toDataURL({format: 'png'})
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
    width: canvas.value.getWidth(),
    fontsize: 20,
    fill: 'black',
    lockUniScaling: true
  })

  adjustTextboxWidth(text);

  text.on('changed', function () {
    adjustTextboxWidth(text);
  });

  canvas.value.add(text)
  textBoxes.value.push(text)
}

const adjustTextboxWidth = (textbox) => {
  const ctx = canvas.value.getContext('2d');
  ctx.font = textbox.fontSize + 'px ' + textbox.fontFamily;

  const textWidth = ctx.measureText(textbox.text).width;

  textbox.set({
    width: textWidth + 10
  });

  canvas.value.renderAll();
}

const onResize = () => {
  textBoxes.value[0].fontSize = rangeValue.value
  canvas.value.add(textBoxes.value[0])
}

onMounted(() => {
  canvas.value = new fabric.Canvas(memeCanvas.value);
})
</script>

<template>
  <main>
    <div style="display: flex">
      <input id="imageInput" type="file" @change="onImageUpload" accept="image/png, image/jpeg" />
      <input type="button" value="Browse..." onclick="document.getElementById('imageInput').click();"/>
      <button @click="addText">Ajouter un texte</button>
      <button :disabled="disableAddRectangleBtn" @click="addWhiteRectangle">Ajouter rectangle blanc</button>
      <button @click="downloadMeme">Télécharger le meme</button>
      <button @click="textBoxes[0].fontFamily = 'Helvetica';  canvas.add(textBoxes[0]);">Test police</button>
      <input ref="range" type="range" min="1" max="100"  v-model="rangeValue" class="slider" id="myRange" @input="onResize">

      {{ rangeValue }}
    </div>
    <canvas id="memeCanvas" ref="memeCanvas" width="800" height="600"></canvas>
  </main>
</template>

<style>
canvas {
  margin-top: 3rem;
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
