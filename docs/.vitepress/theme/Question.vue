<template>
  <div class="question">
    <div class="title">{{ title }}
      <button @click="onClick" :class="open ? 'active': ''">
        <svg v-if="open" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
          <path d="M5 11V13H19V11H5Z"></path>
        </svg>
        <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
          <path d="M11 11V5H13V11H19V13H13V19H11V13H5V11H11Z"></path>
        </svg>
      </button>
    </div>
    <transition name="fade">
      <div v-if="open" class="content">
        <slot/>
      </div>
    </transition>
  </div>
</template>


<script lang="ts" setup>
import {ref} from 'vue';

defineProps(['title'])
const open = ref(false);

const onClick = () => {
  open.value = !open.value
}
</script>

<style scoped>

.fade-enter-active, .fade-leave-active {
  transition: all .2s;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
  transform: translateY(-3%);
}

.question {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 5px;
}

.title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #000000;
  font-weight: bold;
  font-size: 16px;
}

button {
  background: #eee;
  display: flex;
  justify-content: center;
  align-content: center;
  width: 26px;
  height: 26px;
  border-radius: 6px;
  transition: all .3s;
}

.active {
  background: #000;
}

.active svg {
  fill: #fff;
}

svg {
  height: 26px;
  width: 26px;
  fill: #999;
}

.content {
  color: #999;
  margin: 10px 30px 0 0;
}
</style>