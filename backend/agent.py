import sys
import os
sys.path.append(os.path.dirname(__file__))

from langchain_groq import ChatGroq
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
from ingest import get_vectorstore

llm = ChatGroq(
    model="llama-3.3-70b-versatile",
    temperature=0,
    api_key=os.environ.get("GROQ_API_KEY")
)

prompt_template = """You are an expert electronics engineer analyzing component datasheets.
Answer using ONLY the provided context. Give direct confident answers.

PREVIOUS CONVERSATION:
{chat_history}

Context from datasheets:
{context}

Question: {question}

You MUST respond in exactly this format with both sections:

CHAT_START
Write 2-3 sentences here in plain friendly English. Be direct. Answer immediately. No bullet points. No structured data here.
CHAT_END

PANEL_START
For SINGLE component questions write:
SPECS:
- [spec]: [value] (Page [X])
- [spec]: [value] (Page [X])
RECOMMENDATION: [one sentence]
FLAG_GREEN: [positive feature — specific]
FLAG_YELLOW: [real limitation with numbers — always include]
FLAG_RED: [ONLY if dangerous or incompatible — else skip this line]

For COMPARISON questions write:
COMPARE_HEADERS: Spec | [Component1] | [Component2] | [Component3]
COMPARE_ROW: Vcc min | [val] | [val] | [val]
COMPARE_ROW: Vcc max | [val] | [val] | [val]
COMPARE_ROW: Iq | [val] | [val] | [val]
COMPARE_ROW: Package | [val] | [val] | [val]
COMPARE_ROW: Temp | [val] | [val] | [val]
WINNER: [component] — [one sentence why]
RECOMMENDATION: [one sentence]
FLAG_GREEN: [why winner is best]
FLAG_YELLOW: [real limitation of any component with numbers]
FLAG_RED: [ONLY if any component is dangerous or incompatible — else skip]
PANEL_END
"""

PROMPT = PromptTemplate(
    template=prompt_template,
    input_variables=["context", "question", "chat_history"]
)

RED_FLAG_RULES = [
    {
        "keywords": ["3.3v", "3.3 v", "3.3 volt", "3.3"],
        "components": ["ne555", "ne 555", "555"],
        "message": "NE555 requires minimum 4.5V — incompatible with 3.3V systems"
    },
    {
        "keywords": ["3.3v", "3.3 v", "3.3 volt", "3.3"],
        "components": ["lm317", "lm 317"],
        "message": "LM317 requires minimum 3V input-output differential — borderline at 3.3V input"
    },
    {
        "keywords": ["3.3v", "3.3 v", "3.3 volt", "3.3"],
        "components": ["lm7805", "lm 7805", "7805"],
        "message": "LM7805 requires minimum 7V input — cannot regulate from 3.3V input"
    },
    {
        "keywords": ["5v input", "5 v input", "6v input", "6v"],
        "components": ["lm7805", "lm 7805", "7805"],
        "message": "LM7805 needs at least 7V input — 5V or 6V input will not regulate to 5V output"
    },
    {
        "keywords": ["3v", "3.3v", "arduino", "3.3 volt"],
        "components": ["ne555", "ne 555", "555"],
        "message": "NE555 minimum operating voltage is 4.5V — will not function with 3.3V Arduino"
    },
    {
        "keywords": ["above 36v", "40v", "50v", "48v"],
        "components": ["lm393", "lm 393", "393"],
        "message": "LM393 maximum supply voltage is 36V — exceeding this will damage the IC"
    },
    {
        "keywords": ["above 37v", "40v", "50v", "48v"],
        "components": ["lm7805", "lm 7805", "7805"],
        "message": "LM7805 maximum input voltage is 37V — exceeding this will damage the regulator"
    },
    {
        "keywords": ["above 32v", "above 30v", "40v", "50v"],
        "components": ["lm358", "lm 358"],
        "message": "LM358 maximum supply voltage is 32V — exceeding this will damage the IC"
    },
    {
        "keywords": ["above 40v", "50v", "60v"],
        "components": ["lm317", "lm 317"],
        "message": "LM317 maximum input voltage is 40V — exceeding this will damage the IC"
    },
    {
        "keywords": ["1.5a", "2a", "3a", "high current", "motor"],
        "components": ["lm393", "lm 393", "393"],
        "message": "LM393 is a comparator — output is open collector, cannot directly drive high current loads"
    },
    {
        "keywords": ["negative", "negative supply", "split supply", "-5v", "-12v"],
        "components": ["lm7805", "lm 7805", "7805"],
        "message": "LM7805 only regulates positive voltage — use LM7905 for negative supply"
    },
    {
        "keywords": ["without capacitor", "no capacitor", "without bypass"],
        "components": ["lm7805", "lm 7805", "7805"],
        "message": "LM7805 requires input and output capacitors — unstable without them, may oscillate"
    },
    {
        "keywords": ["short circuit", "overload", "no heatsink", "without heatsink"],
        "components": ["lm7805", "lm 7805", "7805"],
        "message": "LM7805 dissipates high power at large voltage drops — heatsink required above 500mA"
    },
    {
        "keywords": ["direct drive", "relay", "motor", "led direct"],
        "components": ["lm393", "lm 393", "393"],
        "message": "LM393 open-collector output cannot source current — requires pull-up resistor to drive loads"
    },
    {
        "keywords": ["3v", "3.3v", "4v", "below 4.5"],
        "components": ["ne555", "ne 555", "555"],
        "message": "NE555 minimum supply voltage is 4.5V — will not operate below this threshold"
    }
]

def check_red_flags(question: str, panel_answer: str) -> str:
    q_lower = question.lower()
    panel_lower = panel_answer.lower()

    already_has_red = "FLAG_RED:" in panel_answer

    for rule in RED_FLAG_RULES:
        keyword_match = any(kw in q_lower for kw in rule["keywords"])
        component_match = any(c in q_lower or c in panel_lower for c in rule["components"])

        if keyword_match and component_match and not already_has_red:
            panel_answer += f"\nFLAG_RED: {rule['message']}"
            break

    return panel_answer

def format_docs(docs):
    return "\n\n".join([
        f"[Source: {doc.metadata.get('source','?')}, Page {doc.metadata.get('page','?')}]\n{doc.page_content}"
        for doc in docs
    ])

def get_answer(question: str, chat_history: list = []) -> dict:
    vectorstore = get_vectorstore()
    
    is_comparison = any(word in question.lower() for word in ["compare", "vs", "versus", "all three", "which", "best", "difference"])
    k_value = 25 if is_comparison else 8
    retriever = vectorstore.as_retriever(search_kwargs={"k": k_value})

    history_text = ""
    for msg in chat_history[-6:]:
        role = "User" if msg["role"] == "user" else "Assistant"
        history_text += f"{role}: {msg['text']}\n"
    if not history_text:
        history_text = "No previous conversation."

    docs = retriever.invoke(question)
    context_text = format_docs(docs)

    chain = PROMPT | llm | StrOutputParser()

    full_answer = chain.invoke({
        "context": context_text,
        "question": question,
        "chat_history": history_text
    })

    chat_answer = ""
    panel_answer = ""

    if "CHAT_START" in full_answer and "CHAT_END" in full_answer:
        try:
            chat_answer = full_answer.split("CHAT_START")[1].split("CHAT_END")[0].strip()
        except Exception:
            chat_answer = ""

    if "PANEL_START" in full_answer and "PANEL_END" in full_answer:
        try:
            panel_answer = full_answer.split("PANEL_START")[1].split("PANEL_END")[0].strip()
        except Exception:
            panel_answer = full_answer

    if not panel_answer and "PANEL_START" in full_answer:
        panel_answer = full_answer.split("PANEL_START")[1].strip()

    if not chat_answer.strip():
        simple_prompt = f"""Answer in 2-3 friendly plain English sentences. Be direct and confident. No bullet points.

Context: {context_text[:2000]}

Question: {question}

Answer:"""
        from langchain_core.messages import HumanMessage
        chat_answer = llm.invoke([HumanMessage(content=simple_prompt)]).content.strip()

    if not panel_answer:
        panel_answer = full_answer

    source_pages = {}
    for doc in docs:
        source = doc.metadata.get("source", "Unknown")
        page = doc.metadata.get("page", "?")
        if source not in source_pages:
            source_pages[source] = set()
        source_pages[source].add(page)

    sources = []
    for source, pages in source_pages.items():
        sorted_pages = sorted(pages, key=lambda x: int(x) if str(x).isdigit() else 0)
        sources.append({
            "file": source,
            "page": sorted_pages[0],
            "all_pages": sorted_pages[:3]
        })

    return {
        "answer": chat_answer,
        "panel": panel_answer,
        "sources": sources
    }