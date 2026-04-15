import { useRef, useEffect } from "react"

function parseAnswer(text) {
  const specs = []
  const flags = []
  const compareHeaders = []
  const compareRows = []
  let recommendation = null
  let winner = null
  let isComp = false

  const skipValues = ["none", "n/a", "na", "-", ""]
  const seenFlagTypes = { green: false, yellow: false, red: false }

  const lines = text.split("\n")
  for (const line of lines) {
    const trimmed = line.trim()

    if (trimmed.startsWith("COMPARE_HEADERS:")) {
      isComp = true
      const headers = trimmed.replace("COMPARE_HEADERS:", "").trim().split("|").map(h => h.trim())
      compareHeaders.push(...headers)
    } else if (trimmed.startsWith("COMPARE_ROW:")) {
      const cells = trimmed.replace("COMPARE_ROW:", "").trim().split("|").map(c => c.trim())
      compareRows.push(cells)
    } else if (trimmed.startsWith("FLAG_GREEN:") && !seenFlagTypes.green) {
      const msg = trimmed.replace("FLAG_GREEN:", "").trim()
      if (!skipValues.includes(msg.toLowerCase())) {
        flags.push({ type: "green", msg })
        seenFlagTypes.green = true
      }
    } else if (trimmed.startsWith("FLAG_YELLOW:") && !seenFlagTypes.yellow) {
      const msg = trimmed.replace("FLAG_YELLOW:", "").trim()
      if (!skipValues.includes(msg.toLowerCase())) {
        flags.push({ type: "yellow", msg })
        seenFlagTypes.yellow = true
      }
    } else if (trimmed.startsWith("FLAG_RED:") && !seenFlagTypes.red) {
  const msg = trimmed.replace("FLAG_RED:", "").trim()
  const invalidRed = [
    "none", "n/a", "na", "-", "",
    "none of", "no critical", "no safety", "not inherently"
  ]
  const isInvalid = invalidRed.some(v => msg.toLowerCase().startsWith(v))
  if (!isInvalid) {
    flags.push({ type: "red", msg })
    seenFlagTypes.red = true
  }
    } else if (trimmed.startsWith("RECOMMENDATION:") && !recommendation) {
      recommendation = trimmed.replace("RECOMMENDATION:", "").trim()
    } else if (trimmed.startsWith("WINNER:") && !winner) {
      winner = trimmed.replace("WINNER:", "").trim()
      isComp = true
    } else if (trimmed.startsWith("-")) {
      specs.push(trimmed.replace(/^-\s*/, "").trim())
    }
  }

  return { specs, flags, compareHeaders, compareRows, recommendation, winner, isComp }
}

function isComparisonQuestion(question) {
  return /compare|vs|versus|difference|which|best|better/i.test(question)
}

function ComparePanel({ specs }) {
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [specs])

  return (
    <div className="right-panel">
      <div className="panel-header">Comparison & Analysis</div>

      {specs.length === 0 ? (
        <div className="empty-state">
          Ask questions in the chat — structured analysis, tables and flags will appear here.
        </div>
      ) : (
        <div className="specs-list">
          {specs.map((spec, i) => {
            const { specs: bullets, flags, compareHeaders, compareRows, recommendation, winner, isComp } = parseAnswer(spec.answer)
            const showTable = isComp || isComparisonQuestion(spec.question)

            return (
              <div key={i} className="spec-card">
                <div className="spec-question">{spec.question}</div>

                {showTable && compareHeaders.length > 0 && compareRows.length > 0 ? (
                  <>
                    <div className="table-wrap">
                      <table className="spec-table">
                        <thead>
                          <tr>
                            {compareHeaders.map((h, j) => (
                              <th key={j} className={j === 0 ? "spec-table-key" : "spec-table-col"}>
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {compareRows.map((row, j) => (
                            <tr key={j}>
                              {row.map((cell, k) => (
                                <td key={k} className={k === 0 ? "spec-table-key" : "spec-table-val"}>
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {winner && (
                      <div className="spec-winner">🏆 {winner}</div>
                    )}
                  </>
                ) : (
                  bullets.length > 0 && (
                    <ul className="spec-bullets">
                      {bullets.slice(0, 5).map((s, j) => <li key={j}>{s}</li>)}
                    </ul>
                  )
                )}

                {recommendation && (
                  <div className="spec-recommendation">💡 {recommendation}</div>
                )}

                {flags.length > 0 && (
                  <div className="flags-list">
                    {flags.map((f, j) => (
                      <div key={j} className={`flag flag-${f.type}`}>
                        {f.type === "green" ? "✓" : f.type === "yellow" ? "⚠" : "✕"} {f.msg}
                      </div>
                    ))}
                  </div>
                )}

                {spec.sources?.length > 0 && (
                  <div className="spec-sources">
                    {spec.sources.map((s, j) => (
                      <span key={j} className="source-tag">
                        {s.file} · p.{s.all_pages ? s.all_pages.join(", ") : s.page}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>
      )}
    </div>
  )
}

export default ComparePanel