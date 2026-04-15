import { useState, useRef } from "react"
import axios from "axios"
import UploadPanel from "./components/UploadPanel"
import ChatPanel from "./components/ChatPanel"
import ComparePanel from "./components/ComparePanel"
import "./App.css"

function App() {
  const [files, setFiles] = useState([])
  const [specs, setSpecs] = useState([])
  const chatRef = useRef(null)

  const handleSuggest = (text) => {
    if (chatRef.current) {
      chatRef.current.setInput(text)
    }
  }

  const addSpec = (spec) => {
    setSpecs(prev => {
      const exists = prev.find(s => s.question === spec.question)
      if (exists) return prev
      return [...prev, spec]
    })
  }

  const handleReset = async () => {
    if (!window.confirm("Reset all datasheets and chat history?")) return
    try {
      await axios.delete("http://localhost:8000/reset")
      setFiles([])
      setSpecs([])
      if (chatRef.current) chatRef.current.resetChat()
    } catch {
      alert("Reset failed. Make sure backend is running.")
    }
  }

  return (
    <div className="app">
      <div className="topbar">
        <span className="topbar-title">Datasheet Intelligence Agent</span>
        {files.length > 0 && (
          <span className="topbar-badge">
            {files.length} datasheet{files.length > 1 ? "s" : ""} loaded
          </span>
        )}
        <button className="reset-btn" onClick={handleReset}>
          Reset
        </button>
      </div>
      <div className="main">
        <UploadPanel files={files} setFiles={setFiles} onSuggest={handleSuggest} />
        <ChatPanel ref={chatRef} files={files} setSpecs={addSpec} />
        <ComparePanel specs={specs} />
      </div>
    </div>
  )
}

export default App