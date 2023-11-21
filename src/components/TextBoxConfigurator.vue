<script setup lang="ts">

import type {TextBoxConfig} from "@/models/TextBoxConfig";
import type {PropType} from "vue";
import { ref, watch} from "vue";

const props = defineProps({
  index: {
    type: Number,
    required: true,
    default: 0
  },
  config: {
    type: Object as PropType<TextBoxConfig>,
    default: () => ({
      fontSize: 20,
      fontFamily: "Arial",
      fill: "black",
      text: "New text"
    })
  }
})

const configuration = ref<TextBoxConfig>({...props.config!})

const emits = defineEmits(["update:config"])


watch(() => configuration,
    () => {
      emits("update:config", props.index, configuration.value)
    },
    { deep: true })


</script>

<template>
  <input v-model="configuration!.text" type="text"/>
</template>

<style scoped>

</style>