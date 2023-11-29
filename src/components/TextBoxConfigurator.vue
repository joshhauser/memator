<script setup lang="ts">
  import { ref, watch } from "vue";
  import type { TextBoxConfig } from "@/models/TextBoxConfig";
  import type { PropType } from "vue";

  const props = defineProps({
    index: {
      type: Number,
      required: true,
      default: 0,
    },
    config: {
      type: Object as PropType<TextBoxConfig>,
      default: () => ({}),
    },
  });

  const configuration = ref<TextBoxConfig>({ ...props.config! });

  const emits = defineEmits(["update:config", "delete"]);

  watch(
    () => configuration,
    () => {
      emits("update:config", props.index, configuration.value);
    },
    { deep: true }
  );
</script>

<template>
  <fieldset class="config">
    <legend>Text box n°{{ props.index + 1 }}</legend>
    <input v-model="configuration!.text" type="text" />
    <input v-model="configuration!.fill" type="color" />
    <div class="range">
      <input v-model="configuration!.fontSize" type="range" min="1" max="100" />
      {{ configuration!.fontSize }}
    </div>
    <button @click="emits('delete', props.index)">x</button>
  </fieldset>
</template>

<style scoped>
  .config {
    display: flex;
    gap: 1rem;
    align-items: center;
  }

  .range {
    display: flex;
    align-items: center;
    gap: 5px;
  }
</style>
