import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react"
import axios from "axios"

const ChatPanel = forwardRef(({ files, setSpecs }, ref) => {
  const [messages, setMessages] = useState([
    {
      role: "bot",
      text: "Hi! I'm your Datasheet Intelligence Agent. Upload your component datasheets and I'll help you analyze specs, compare components, and make recommendations."
    }
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  useImperativeHandle(ref, () => ({
    setInput: (text) => setInput(text),
    resetChat: () => {
      setMessages([{
        role: "bot",
        text: "Hi! I'm your Datasheet Intelligence Agent. Upload your component datasheets and I'll help you analyze specs, compare components, and make recommendations."
      }])
      setInput("")
    }
  }))

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, loading])

  useEffect(() => {
    if (files.length === 0) return
    if (files.length === 1) {
      setMessages(prev => [...prev, {
        role: "bot",
        text: `✅ I've successfully processed **${files[0]}**! All content has been extracted and indexed. Feel free to ask me anything about this component.`
      }])
    } else {
      setMessages(prev => [...prev, {
        role: "bot",
        text: `✅ **${files[files.length - 1]}** added! I now have **${files.length} datasheets** ready. You can now ask comparison questions across all components.`
      }])
    }
  }, [files])

  const sendMessage = async (customInput) => {
    const question = customInput || input
    if (!question.trim()) return
    if (files.length === 0) {
      alert("Please upload at least one datasheet first!")
      return
    }

    const historyPayload = messages
      .filter(m => m.role !== 'bot' || !m.text.includes("Hi! I'm your Datasheet"))
      .map(m => ({
        role: m.role,
        text: m.rawText || m.text
      }))

    setMessages(prev => [...prev, { role: "user", text: question }])
    setInput("")
    setLoading(true)

    try {
      const res = await axios.post("http://localhost:8000/ask", {
        question: question,
        chat_history: historyPayload
      })

      setMessages(prev => [...prev, {
        role: "bot",
        text: res.data.answer,
        rawText: res.data.answer,
        sources: res.data.sources
      }])

      if (res.data.sources?.length > 0) {
        setSpecs({
          question,
          answer: res.data.panel,
          sources: res.data.sources
        })
      }
    } catch {
      setMessages(prev => [...prev, {
        role: "bot",
        text: "Sorry, something went wrong. Make sure the backend is running!"
      }])
    }

    setLoading(false)
  }

  const formatText = (text) => {
  const lines = text.split("\n")
  const cleanLines = lines.filter(line => {
    const t = line.trim()
    return !t.startsWith("COMPARE_HEADERS:") &&
           !t.startsWith("COMPARE_ROW:") &&
           !t.startsWith("WINNER:") &&
           !t.startsWith("RECOMMENDATION:") &&
           !t.startsWith("FLAG_GREEN:") &&
           !t.startsWith("FLAG_YELLOW:") &&
           !t.startsWith("FLAG_RED:") &&
           !t.startsWith("SPECS:") &&
           !t.startsWith("CHAT_START") &&
           !t.startsWith("CHAT_END") &&
           !t.startsWith("PANEL_START") &&
           !t.startsWith("PANEL_END") &&
           !t.startsWith("===")
  })
  return cleanLines.join("\n")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/^[-•]\s*GREEN:\s*(.+)$/gm, '<span class="inline-flag green">✓ $1</span>')
    .replace(/^[-•]\s*YELLOW:\s*(.+)$/gm, '<span class="inline-flag yellow">⚠ $1</span>')
    .replace(/^[-•]\s*RED:\s*(.+)$/gm, '<span class="inline-flag red">✕ $1</span>')
    .replace(/^[-•]\s*(.+)$/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>)/gs, "<ul>$1</ul>")
    .replace(/\n/g, "<br/>")
}

  return (
    <div className="chat-panel">
      <div className="panel-header">Chat</div>
      <div className="chat-messages">
        {messages.map((msg, i) => (
          <div key={i} className={`message ${msg.role}`}>
            <div className="message-text" dangerouslySetInnerHTML={{ __html: formatText(msg.text) }} />
            {msg.sources?.length > 0 && (
              <div className="message-sources">
                {msg.sources.map((s, j) => (
                  <span key={j} className="source-pill">
                    📄 {s.file} · p.{s.all_pages ? s.all_pages.join(", ") : s.page}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="message bot">
            <div className="message-text loading-dots">
              <span></span><span></span><span></span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <div className="chat-input-row">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && sendMessage()}
          placeholder={files.length === 0 ? "Upload a datasheet first..." : "Ask about your components..."}
          disabled={loading || files.length === 0}
        />
        <button onClick={() => sendMessage()} disabled={loading || files.length === 0}>
          {loading ? "..." : "Send"}
        </button>
      </div>
    </div>
  )
})

export default ChatPanel