import pdfplumber
import os
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma

CHROMA_DIR = "./chroma_db"

embeddings = HuggingFaceEmbeddings(
    model_name="all-MiniLM-L6-v2"
)

def extract_text_from_pdf(pdf_path: str):
    chunks_with_pages = []
    with pdfplumber.open(pdf_path) as pdf:
        for i, page in enumerate(pdf.pages):
            page_text = page.extract_text()
            if page_text:
                chunks_with_pages.append({
                    "text": page_text,
                    "page": i + 1
                })
    return chunks_with_pages

def ingest_pdf(pdf_path: str, filename: str):
    pages = extract_text_from_pdf(pdf_path)

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=500,
        chunk_overlap=50
    )

    all_chunks = []
    all_metadatas = []

    for page_data in pages:
        page_chunks = splitter.split_text(page_data["text"])
        for chunk in page_chunks:
            all_chunks.append(chunk)
            all_metadatas.append({
                "source": filename,
                "page": page_data["page"]
            })

    vectorstore = Chroma(
        collection_name="datasheets",
        embedding_function=embeddings,
        persist_directory=CHROMA_DIR
    )
    vectorstore.add_texts(texts=all_chunks, metadatas=all_metadatas)

    return len(all_chunks)

def get_vectorstore():
    return Chroma(
        collection_name="datasheets",
        embedding_function=embeddings,
        persist_directory=CHROMA_DIR
    )

def delete_file_from_vectorstore(filename: str):
    try:
        vectorstore = Chroma(
            collection_name="datasheets",
            embedding_function=embeddings,
            persist_directory=CHROMA_DIR
        )
        vectorstore._collection.delete(where={"source": filename})
        return True
    except Exception as e:
        print(f"Error deleting from chroma: {e}")
        return False