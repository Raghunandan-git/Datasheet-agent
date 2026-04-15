import { useCallback, useState } from "react"
import { useDropzone } from "react-dropzone"
import axios from "axios"

const defaultSuggestions = [
  "What is the supply voltage range?",
  "What packages are available?",
  "What is the operating temperature?"
]

const fileSuggestions = {
  "lm358": [
    "What is the input offset voltage of LM358?",
    "What is the bandwidth of LM358?",
    "Is LM358 suitable for 3.3V circuits?"
  ],
  "ne555": [
    "What is the supply voltage of NE555?",
    "What frequency range does NE555 support?",
    "What is the output current of NE555?"
  ],
  "lm317": [
    "What is the output voltage range of LM317?",
    "Is LM317 safe with 12V input?",
    "What is the dropout voltage of LM317?"
  ]
}

function getSuggestions(files) {
  if (files.length === 0) return defaultSuggestions
  if (files.length >= 2) return [
    `Compare supply voltage of ${files.map(f => f.replace(".pdf","").toUpperCase()).join(" and ")}`,
    "Which component has lowest quiescent current?",
    "Which is best for battery powered circuits?"
  ]
  const key = files[0].replace(".pdf","").toLowerCase()
  return fileSuggestions[key] || defaultSuggestions
}

function UploadPanel({ files, setFiles, onSuggest }) {
  const [uploading, setUploading] = useState(false)
  const [uploadingName, setUploadingName] = useState("")
  const [progress, setProgress] = useState(0)

  const handleDelete = async (e, filename) => {
    e.stopPropagation() 
    try {
      await axios.delete(`http://localhost:8000/files/${filename}`)
      setFiles(prev => prev.filter(f => f !== filename))
    } catch (err) {
      alert("Failed to delete " + filename)
    }
  }

  const onDrop = useCallback(async (acceptedFiles) => {
    for (const file of acceptedFiles) {
      setUploading(true)
      setUploadingName(file.name)
      setProgress(0)
      const formData = new FormData()
      formData.append("file", file)
      try {
        await axios.post("http://localhost:8000/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (e) => {
            const pct = Math.round((e.loaded * 100) / e.total)
            setProgress(pct)
          }
        })
        setFiles(prev => [...prev, file.name])
      } catch (err) {
        alert("Failed to upload " + file.name)
      }
      setUploading(false)
      setUploadingName("")
      setProgress(0)
    }
  }, [setFiles])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] }
  })

  const suggestions = getSuggestions(files)

  return (
    <div className="left-panel">
      <div className="panel-header">Datasheets</div>

      <div {...getRootProps()} className={`upload-zone ${isDragActive ? "active" : ""} ${uploading ? "uploading" : ""}`}>
        <input {...getInputProps()} />
        {uploading ? (
          <>
            <div className="spinner"></div>
            <div className="upload-text">Processing {uploadingName}...</div>
            <div className="progress-bar-wrap">
              <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
            </div>
            <div className="progress-pct">{progress}%</div>
          </>
        ) : (
          <>
            <div className="upload-icon">⬆</div>
            <div className="upload-text">
              {isDragActive ? "Drop PDFs here..." : "Drag & drop PDFs here"}
            </div>
          </>
        )}
      </div>

      <div className="file-list">
        {files.map((name, i) => (
          <div key={i} className="file-chip">
            <span className="chip-dot"></span>
            <span className="chip-name">{name}</span>
            <button 
              className="chip-delete" 
              onClick={(e) => handleDelete(e, name)}
              title="Remove datasheet"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <div className="suggestions">
        <div className="panel-header">
          {files.length === 0 ? "Try asking" : `Questions for ${files.length} file${files.length > 1 ? "s" : ""}`}
        </div>
        <div className="suggestion-list">
          {suggestions.map((s, i) => (
            <div key={i} className="suggestion-pill" onClick={() => onSuggest(s)}>
              {s}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default UploadPanel