import { createServer } from "node:http"

const port = 8799

function fieldsFrom(raw) {
  const email = raw.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] ?? ""
  const name =
    raw
      .match(/name is ([A-Za-z][A-Za-z .'-]{0,80}?)(?: and |\\"|")/i)?.[1]
      ?.trim() ?? ""
  return { email, name }
}

function response(body) {
  const raw = JSON.stringify(body)
  const toolResults = raw.match(/function_call_output/g)?.length ?? 0
  if (toolResults >= 2) return text("Thanks, you're all set.")
  if (toolResults === 1) return toolCall("submitForm", "{}")
  const { email, name } = fieldsFrom(raw)
  return toolCall(
    "fillForm",
    JSON.stringify({
      values: [
        { fieldId: "name", value: name },
        { fieldId: "email", value: email },
      ],
    }),
  )
}

function toolCall(name, argumentsJson) {
  return {
    id: `resp_${name}`,
    output: [
      {
        type: "function_call",
        id: `fc_${name}`,
        call_id: `call_${name}`,
        name,
        arguments: argumentsJson,
      },
    ],
  }
}

function text(value) {
  return {
    id: "resp_text",
    output: [
      {
        type: "message",
        role: "assistant",
        id: "msg_text",
        content: [
          {
            type: "output_text",
            text: value,
            annotations: [],
          },
        ],
      },
    ],
  }
}

const server = createServer((req, res) => {
  if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200, { "content-type": "application/json" })
    res.end('{"ok":true}')
    return
  }
  if (req.method === "POST" && req.url?.startsWith("/v1/responses")) {
    const chunks = []
    req.on("data", (chunk) => chunks.push(chunk))
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8")
      const body = raw ? JSON.parse(raw) : {}
      res.writeHead(200, { "content-type": "application/json" })
      res.end(JSON.stringify(response(body)))
    })
    return
  }
  res.writeHead(404, { "content-type": "application/json" })
  res.end('{"error":"not found"}')
})

server.listen(port, "127.0.0.1")
