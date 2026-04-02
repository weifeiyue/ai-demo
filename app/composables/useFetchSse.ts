type FetchSseMessage = {
  event?: string
  id?: string
  data: string
}

type UseFetchSseOptions = Omit<RequestInit, 'signal'> & {
  signal?: AbortSignal
  onOpen?: (response: Response) => void | Promise<void>
  onMessage?: (message: FetchSseMessage) => void
  onError?: (error: Error) => void
}

function createSseParser(onMessage?: (message: FetchSseMessage) => void) {
  let buffer = ''
  let event = ''
  let data = ''
  let id = ''

  const emit = () => {
    if (!data) {
      event = ''
      id = ''
      return
    }

    onMessage?.({
      event: event || undefined,
      id: id || undefined,
      data: data.endsWith('\n') ? data.slice(0, -1) : data
    })

    event = ''
    data = ''
    id = ''
  }

  const processLine = (line: string) => {
    if (!line) {
      emit()
      return
    }

    if (line.startsWith(':')) {
      return
    }

    const separatorIndex = line.indexOf(':')
    const field = separatorIndex === -1 ? line : line.slice(0, separatorIndex)
    const rawValue = separatorIndex === -1 ? '' : line.slice(separatorIndex + 1)
    const value = rawValue.startsWith(' ') ? rawValue.slice(1) : rawValue

    if (field === 'event') {
      event = value
      return
    }

    if (field === 'data') {
      data += `${value}\n`
      return
    }

    if (field === 'id') {
      id = value
    }
  }

  return {
    feed(chunk: string) {
      buffer += chunk

      const normalized = buffer.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
      const lines = normalized.split('\n')

      buffer = lines.pop() ?? ''

      for (const line of lines) {
        processLine(line)
      }
    },
    flush() {
      if (buffer) {
        processLine(buffer)
      }
      emit()
      buffer = ''
    }
  }
}

export async function useFetchSse(
  input: RequestInfo | URL,
  options: UseFetchSseOptions = {}
) {
  const { signal, onOpen, onMessage, onError, ...fetchOptions } = options
  const response = await fetch(input, {
    ...fetchOptions,
    headers: {
      Accept: 'text/event-stream',
      ...fetchOptions.headers
    },
    signal
  })

  if (!response.ok) {
    const error = new Error(`SSE request failed with status ${response.status}`)
    onError?.(error)
    throw error
  }

  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.includes('text/event-stream')) {
    const error = new Error(`Expected text/event-stream but received ${contentType || 'unknown content type'}`)
    onError?.(error)
    throw error
  }

  await onOpen?.(response)

  if (!response.body) {
    const error = new Error('ReadableStream is not available on this response')
    onError?.(error)
    throw error
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  const parser = createSseParser(onMessage)

  try {
    while (true) {
      const { done, value } = await reader.read()

      if (done) {
        parser.flush()
        break
      }

      parser.feed(decoder.decode(value, { stream: true }))
    }
  } catch (error) {
    const normalizedError = error instanceof Error ? error : new Error('Unknown SSE error')
    onError?.(normalizedError)
    throw normalizedError
  } finally {
    reader.releaseLock()
  }
}
