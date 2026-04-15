import os
import sys
import shutil
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

sys.path.append(os.path.dirname(__file__))

from ingest import ingest_pdf
from agent import get_answer

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "./uploaded_pdfs"
os.makedirs(UPLOAD_DIR, exist_ok=True)

uploaded_files = []

class QuestionRequest(BaseModel):
    question: str
    chat_history: list = []

@app.get("/")
def root():
    return {"status": "Datasheet Agent is running"}

@app.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    chunks = ingest_pdf(file_path, file.filename)
    uploaded_files.append(file.filename)

    return {
        "message": f"Successfully processed {file.filename}",
        "chunks": chunks,
        "filename": file.filename
    }

@app.get("/files")
def get_files():
    return {"files": uploaded_files}

@app.delete("/files/{filename}")
def delete_single_file(filename: str):
    global uploaded_files
    
    if filename in uploaded_files:
        uploaded_files.remove(filename)

    from ingest import delete_file_from_vectorstore
    delete_file_from_vectorstore(filename)

    file_path = os.path.join(UPLOAD_DIR, filename)
    if os.path.exists(file_path):
        os.remove(file_path)

    return {"message": f"Successfully deleted {filename}"}

@app.post("/ask")
async def ask_question(request: QuestionRequest):
    result = get_answer(request.question, request.chat_history)
    return result

@app.delete("/reset")
def reset():
    global uploaded_files
    uploaded_files = []

    try:
        from ingest import embeddings
        import chromadb
        client = chromadb.PersistentClient(path="./chroma_db")
        try:
            client.delete_collection("datasheets")
        except Exception:
            pass
    except Exception:
        pass

    import gc
    gc.collect()

    import time
    time.sleep(0.5)

    try:
        if os.path.exists("./chroma_db"):
            shutil.rmtree("./chroma_db", ignore_errors=True)
    except Exception:
        pass

    if os.path.exists(UPLOAD_DIR):
        shutil.rmtree(UPLOAD_DIR, ignore_errors=True)
    os.makedirs(UPLOAD_DIR, exist_ok=True)

    return {"message": "Reset successful"}