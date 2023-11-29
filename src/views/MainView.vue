<script setup lang="ts">
  import { computed, onMounted, ref, toRaw } from "vue";
  import { fabric } from "fabric";

  import TextBoxConfigurator from "@/components/TextBoxConfigurator.vue";

  import type { TextBoxConfig } from "@/models/TextBoxConfig";

  const maxWidth: number = 800;
  const maxHeight: number = 600;
  let canvas = undefined;
  let scaleFactor = undefined;

  const memeCanvas = ref();
  const whiteRectangleAdded = ref<boolean>(false);
  const textBoxes = ref<any[]>([]);
  const uploadedImage = ref(undefined);

  const disableAddRectangleBtn = computed(() => {
    return !uploadedImage.value || whiteRectangleAdded.value;
  });

  const disableDownloadBtn = computed(() => {
    return !uploadedImage.value;
  });

  /**
   * Programmatically do the click action
   * on the file input
   */
  const openUploadWindow = () => {
    document.getElementById("imageInput").click();
  };

  /**
   * Handle image upload
   * @param event file uplaod event
   */
  const onImageUpload = (event: any) => {
    const imageFile = event.target.files[0];

    if (imageFile) {
      const reader = new FileReader();

      reader.onload = (e) => {
        const memeTemplate = new Image();
        memeTemplate.onload = () => {
          scaleFactor = Math.min(maxWidth / memeTemplate.width, maxHeight / memeTemplate.height);

          uploadedImage.value = new fabric.Image(memeTemplate, {
            scaleX: scaleFactor,
            scaleY: scaleFactor,
            selectable: false,
          });

          canvas.setDimensions({
            width: memeTemplate.width * scaleFactor,
            height: memeTemplate.height * scaleFactor,
          });
          setCanvasBoundaries();

          canvas.clear();
          canvas.add(uploadedImage.value);
        };

        memeTemplate.src = e.target.result as string;
      };

      reader.readAsDataURL(imageFile);
    }
  };

  /**
   * Add white rectangle above the image
   */
  const addWhiteRectangle = () => {
    const rectangleHeight = 150;
    const canvasHeight = canvas.getHeight();
    const canvasWidth = canvas.getWidth();
    const whiteRect = new fabric.Rect({
      width: canvasWidth,
      height: rectangleHeight,
      top: 0,
      fill: "white",
      selectable: false,
    });

    canvas.setDimensions({ width: canvasWidth, height: canvasHeight + rectangleHeight });
    setCanvasBoundaries();
    canvas.clear();
    canvas.add(whiteRect);

    uploadedImage.value.top = rectangleHeight;
    canvas.add(uploadedImage.value);
    whiteRectangleAdded.value = true;

    textBoxes.value.forEach((textBox) => {
      canvas.add(textBox);
    });
  };

  /**
   * Set canvas boundaries to prevent elements from
   * moving out of the visible rectangle
   */
  const setCanvasBoundaries = () => {
    const boundary = new fabric.Rect({
      width: canvas.width,
      height: canvas.height,
      fill: "transparent",
      strokeWidth: 1,
      stroke: "black",
      selectable: false,
    });

    canvas.on("object:moving", function (e) {
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
  };

  /**
   * Download the meme as a PNG
   */
  const downloadMeme = () => {
    const dataUrl = canvas.toDataURL({ format: "png" });
    const link = document.createElement("a");

    link.href = dataUrl;
    link.download = "meme.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const addText = () => {
    const text = new fabric.Textbox("New text", {
      left: 0,
      top: 0,
      width: canvas.getWidth(),
      fontSize: 30,
      fill: "#000000",
      lockUniScaling: true,
    });

    adjustTextboxWidth(text);

    text.on("changed", function () {
      adjustTextboxWidth(text);
    });

    canvas.add(text);
    textBoxes.value.push(text);
  };

  /**
   * Handle text box configuration update
   * @param index the index of the text box
   * @param config the new configuration
   */
  const onTextBoxConfigUpdate = (index: number, config: TextBoxConfig) => {
    textBoxes.value[index].set("text", config.text);
    textBoxes.value[index].set("fill", config.fill);
    textBoxes.value[index].set("fontSize", config.fontSize);
    textBoxes.value[index].set("fontFamily", config.fontFamily);

    canvas.renderAll();
  };

  /**
   * Adjust text box with to its content
   * @param textBox the text box to adjust
   */
  const adjustTextboxWidth = (textBox) => {
    const ctx = canvas.getContext("2d");
    ctx.font = textBox.fontSize + "px " + textBox.fontFamily;

    const textWidth = ctx.measureText(textBox.text).width;

    textBox.set({
      width: textWidth + 10,
    });
  };

  /**
   * Handle text box delete event
   * @param index the index of the deleted text box
   */
  const onTextBoxDelete = (index: number) => {
    const removedTextBox = textBoxes.value.splice(index, 1)[0];
    canvas.remove(toRaw(removedTextBox));
  };

  onMounted(() => {
    canvas = new fabric.Canvas(memeCanvas.value);
  });
</script>

<template>
  <main>
    <div class="header">
      <h2>Memator</h2>
    </div>
    <div class="content">
      <div class="left">
        <div class="buttons">
          <input id="imageInput" type="file" accept="image/png, image/jpeg" @change="onImageUpload" />
          <button @click="openUploadWindow">Browse</button>
          <button @click="addText">Add text</button>
          <button :disabled="disableAddRectangleBtn" @click="addWhiteRectangle">Add white rectangle</button>
          <button :disabled="disableDownloadBtn" @click="downloadMeme">Download</button>
        </div>

        <div id="textboxes-container">
          <template v-for="(textBox, index) in textBoxes" :key="index">
            <TextBoxConfigurator
              :index="index"
              :config="{
                fontSize: textBox.fontSize,
                fill: textBox.fill,
                fontFamily: textBox.fontFamily,
                text: textBox.text,
              }"
              @update:config="onTextBoxConfigUpdate"
              @delete="onTextBoxDelete"
            />
          </template>
        </div>
      </div>

      <div class="right">
        <canvas id="memeCanvas" ref="memeCanvas" width="800" height="600"></canvas>
      </div>
    </div>
  </main>
</template>

<style scoped lang="scss">
  main {
    display: flex;
    width: 100%;
    flex-direction: column;
    padding-top: 1rem;
    padding-bottom: 1rem;
    height: 100%;

    .header {
      height: 3rem;

      h2 {
        margin: 0;
        padding: 0;
        text-align: center;
      }
    }

    .content {
      display: flex;

      .left,
      .right {
        width: 50%;
        height: 100%;
      }

      .left {
        display: flex;
        flex-direction: column;
        gap: 2rem;
        padding-left: 2rem;
        max-height: 100vh;

        .buttons {
          display: flex;
          gap: 3rem;
          height: fit-content;
        }

        #imageInput {
          display: none;
        }
      }

      .right {
        canvas {
          border: 2px solid #000;
          min-height: 200px;
          min-width: 300px;
          height: fit-content;
          width: fit-content;
        }

        #textboxes-container {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          overflow-y: auto;
        }
      }
    }
  }
</style>
