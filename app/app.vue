<script setup lang="ts">
const prompt = ref('帮我生成一段关于 SSE 的介绍')
const messages = ref<string[]>([])
const status = ref<'idle' | 'connecting' | 'streaming' | 'done' | 'error'>('idle')
const errorMessage = ref('')

let controller: AbortController | null = null

const stopStream = () => {
  controller?.abort()
  controller = null

  if (status.value === 'connecting' || status.value === 'streaming') {
    status.value = 'idle'
  }
}

const startStream = async () => {
  stopStream()
  controller = new AbortController()
  messages.value = []
  errorMessage.value = ''
  status.value = 'connecting'

  try {
    await useFetchSse('/api/sse', {
      method: 'POST',
      body: JSON.stringify({ prompt: prompt.value }),
      headers: {
        'Content-Type': 'application/json'
      },
      signal: controller.signal,
      onOpen() {
        status.value = 'streaming'
      },
      onMessage(message) {
        if (message.event === 'done') {
          status.value = 'done'
          controller = null
          return
        }

        messages.value.push(message.data)
      }
    })
  } catch (error) {
    if (controller?.signal.aborted) {
      return
    }

    status.value = 'error'
    errorMessage.value = error instanceof Error ? error.message : '请求失败'
  }
}

onBeforeUnmount(() => {
  stopStream()
})
</script>

<template>
  <main class="page">
    <section class="panel">
      <p class="eyebrow">Nuxt + Fetch SSE</p>
      <h1>使用 fetch 建立 SSE 请求</h1>
      <p class="description">
        这个实现不依赖 <code>EventSource</code>，支持自定义 method、body 和 headers，适合对接聊天流式接口。
      </p>

      <label class="field">
        <span>请求内容</span>
        <textarea
          v-model="prompt"
          rows="4"
          placeholder="输入需要流式处理的内容"
        />
      </label>

      <div class="actions">
        <button type="button" @click="startStream">
          开始请求
        </button>
        <button
          type="button"
          class="ghost"
          :disabled="status !== 'connecting' && status !== 'streaming'"
          @click="stopStream"
        >
          停止
        </button>
      </div>

      <p class="status">
        当前状态：<strong>{{ status }}</strong>
      </p>
      <p v-if="errorMessage" class="error">
        {{ errorMessage }}
      </p>
    </section>

    <section class="panel">
      <h2>流式输出</h2>
      <div class="stream">
        <p v-if="messages.length === 0" class="placeholder">
          暂无数据
        </p>
        <p v-for="(message, index) in messages" :key="`${index}-${message}`">
          {{ message }}
        </p>
      </div>
    </section>
  </main>
</template>

<style scoped>
.page {
  min-height: 100vh;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px;
  padding: 48px;
  background:
    radial-gradient(circle at top left, rgba(255, 196, 128, 0.4), transparent 30%),
    linear-gradient(135deg, #fff8ef 0%, #f2f5f9 100%);
  color: #1e293b;
}

.panel {
  padding: 28px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.78);
  box-shadow: 0 18px 45px rgba(15, 23, 42, 0.08);
  backdrop-filter: blur(12px);
}

.eyebrow {
  margin: 0 0 8px;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #c2410c;
}

h1,
h2 {
  margin: 0;
}

.description {
  margin: 16px 0 0;
  line-height: 1.6;
}

.field {
  display: grid;
  gap: 8px;
  margin-top: 24px;
}

.field span {
  font-size: 14px;
  font-weight: 600;
}

textarea {
  width: 100%;
  border: 1px solid #cbd5e1;
  border-radius: 16px;
  padding: 14px 16px;
  font: inherit;
  resize: vertical;
  background: #fff;
}

.actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}

button {
  border: 0;
  border-radius: 999px;
  padding: 12px 20px;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
  color: #fff;
  background: linear-gradient(135deg, #ea580c 0%, #f97316 100%);
}

button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.ghost {
  color: #334155;
  background: #e2e8f0;
}

.status,
.error {
  margin: 16px 0 0;
}

.error {
  color: #b91c1c;
}

.stream {
  margin-top: 20px;
  display: grid;
  gap: 12px;
  min-height: 240px;
  padding: 18px;
  border-radius: 18px;
  background: #0f172a;
  color: #e2e8f0;
}

.stream p {
  margin: 0;
  line-height: 1.6;
}

.placeholder {
  color: #94a3b8;
}

@media (max-width: 900px) {
  .page {
    grid-template-columns: 1fr;
    padding: 20px;
  }
}
</style>
