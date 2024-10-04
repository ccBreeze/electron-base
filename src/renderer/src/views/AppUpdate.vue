<script setup lang="ts">
import { ref, onMounted } from 'vue'
import appUpdate from '@renderer/utils/appUpdate'

const versions = ref('')

const update = () => {
  appUpdate.launchPageUpdate()
}

onMounted(async () => {
  versions.value = await appUpdate.getCurrentVersion()
})
</script>

<template>
  <h1>{{ versions }}</h1>
  <button @click="update">更新</button>
</template>
