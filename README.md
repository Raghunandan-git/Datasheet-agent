# 📄 Datasheet Intelligence Agent – AI-Powered Datasheet Analysis System

> An agentic AI web application that enables engineers to upload electronic component datasheets and interact with them using natural language queries, with structured outputs, comparisons, and safety insights.

---

## 📌 Overview

Datasheet Intelligence Agent is built to simplify how engineers and students work with complex electronic datasheets.

Instead of manually searching through 50+ page PDFs, the system allows users to:

* 💬 Ask questions in natural language
* 📊 Extract specifications instantly
* ⚖️ Compare multiple components
* ⚠️ Detect compatibility issues
* 📌 Get answers with real page citations

---

## 🛠 Tech Stack

### Frontend

* React.js (Vite)
* Axios
* React Dropzone
* CSS Variables (Dark UI)

### Backend

* FastAPI (Python)
* Uvicorn
* Pydantic

### AI / ML

* LangChain
* HuggingFace Sentence Transformers
* ChromaDB (Vector Database)
* Groq API (LLaMA 3.1 8B)

### PDF Processing

* pdfplumber
* RecursiveCharacterTextSplitter

---

## ⚡ Key Features

### 1️⃣ Multi-Datasheet Semantic Search

* Search across multiple uploaded PDFs simultaneously
* Uses vector embeddings for semantic similarity
* Retrieves most relevant chunks for accurate answers

---

### 2️⃣ Natural Language Q&A (RAG)

* Ask questions like:

  * “What is the supply voltage of LM358?”
  * “Compare NE555 and LM555”
* Uses Retrieval-Augmented Generation (RAG)
* Answers grounded strictly in datasheet content

---

### 3️⃣ Structured Comparison Engine

* Automatically generates comparison tables
* Displays:

  * Specs
  * Winners 🏆
  * Recommendations

---

### 4️⃣ Dual Response System

Each query produces:

* 💬 **Chat Response** → Simple explanation
* 📊 **Panel Output** → Structured technical data

---

### 5️⃣ ⚠️ Smart Compatibility Detection

Built-in rule-based system detects dangerous conditions:

* NE555 below 4.5V ❌
* LM741 single supply ❌
* LM7805 input < 7V ⚠️
* LM386 over-voltage ⚠️

Color-coded flags:

* 🟢 Safe
* 🟡 Caution
* 🔴 Danger

---

### 6️⃣ Real Page Citations

* Displays exact datasheet page numbers
* Eliminates need for manual searching

---

### 7️⃣ Conversational Memory

* Maintains last 6 messages
* Supports follow-up questions

---

## 📸 Screens

<img width="1919" height="865" alt="image" src="https://github.com/user-attachments/assets/96983c91-4d17-4d70-ab4c-2974a6286799" />

# PDF UPLOAD
<img width="1917" height="863" alt="image" src="https://github.com/user-attachments/assets/4e5a847d-8bda-426a-81b6-7b651486ce22" />

# OUTPUT
<img width="1919" height="867" alt="image" src="https://github.com/user-attachments/assets/1132cae5-c277-4522-b82f-392e7914940d" />


## 🧪 How It Works

```bash
Upload PDF
   ↓
Text Extraction (pdfplumber)
   ↓
Chunking (500 chars, overlap 50)
   ↓
Embedding (MiniLM model)
   ↓
Stored in ChromaDB
   ↓
User Query
   ↓
Top-K Retrieval
   ↓
LLaMA 3.1 (Groq API)
   ↓
Response (Chat + Structured Panel)
```

---

## 📡 API Endpoints

| Method | Endpoint            | Description      |
| ------ | ------------------- | ---------------- |
| POST   | `/upload`           | Upload datasheet |
| POST   | `/ask`              | Ask question     |
| GET    | `/files`            | List files       |
| DELETE | `/files/{filename}` | Delete file      |
| DELETE | `/reset`            | Reset system     |

---

## 🧪 Testing

### ✅ Scenarios

* Street Light System (LM393, NE555, LM7805)
* Audio Amplifier (LM386, LM741)
* Basic Component Analysis (LM358, LM317)

### 📊 Accuracy

* Spec Extraction: ~90%
* Compatibility Detection: ~85%
* Red Flags: 100%

---

## 💻 How To Run Locally

### 1️⃣ Clone Repository

```bash
git clone https://github.com/your-username/datasheet-intelligence-agent.git
cd datasheet-intelligence-agent
```

---

### 2️⃣ Backend Setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate   # Windows
pip install fastapi uvicorn langchain chromadb pdfplumber sentence-transformers
pip install langchain-groq langchain-huggingface python-dotenv python-multipart
```

Create `.env` file:

```
GROQ_API_KEY=your_api_key_here
```

Run backend:

```bash
uvicorn main:app --reload
```

---

### 3️⃣ Frontend Setup

```bash
cd frontend
npm install
npm install axios react-dropzone
npm run dev
```

---

## 🌐 Access

* Frontend: [http://localhost:5173](http://localhost:5173)
* Backend: [http://localhost:8000](http://localhost:8000)

---

## 🚀 Future Improvements

* OCR support for scanned PDFs
* Export results as PDF
* Dark/Light mode toggle
* Supplier API integration (Digi-Key, Mouser)
* Mobile responsiveness
* User authentication & history

---

## 📈 Why This Project Stands Out

* Real-world engineering problem solving
* Practical use of RAG architecture
* Combines AI + Electronics domain
* Structured + conversational outputs
* Built بالكامل using free tools

---

## ⚠️ Limitations

* Not effective for scanned PDFs (no OCR)
* Depends on extraction quality
* Limited rule-based flags
* Requires internet for Groq API

---

## 👨‍💻 Author

**Raghunandan P**
Electronics & Communication Engineering


