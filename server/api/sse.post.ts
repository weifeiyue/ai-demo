export default defineEventHandler(async (event) => {
  const body = await readBody<{ prompt?: string }>(event)
  const prompt = body?.prompt?.trim() || 'Nuxt SSE'

  setResponseHeaders(event, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive'
  })

  const send = (payload: { event?: string; id?: string; data: string }) => {
    if (payload.id) {
      event.node.res.write(`id: ${payload.id}\n`)
    }

    if (payload.event) {
      event.node.res.write(`event: ${payload.event}\n`)
    }

    for (const line of payload.data.split('\n')) {
      event.node.res.write(`data: ${line}\n`)
    }

    event.node.res.write('\n')
  }

  send({
    event: 'start',
    id: '0',
    data: JSON.stringify({ prompt })
  })

  const chunks = [
    `正在处理：${prompt}`,
    '这是通过 fetch 建立的 SSE 流。',
    '你可以在这里替换成真实的 AI/聊天流式返回。'
  ]

  for (const [index, chunk] of chunks.entries()) {
    await new Promise((resolve) => setTimeout(resolve, 700))
    send({
      event: 'message',
      id: String(index + 1),
      data: chunk
    })
  }

  send({
    event: 'done',
    id: String(chunks.length + 1),
    data: '[DONE]'
  })

  event.node.res.end()
})
