# app/services/rag_retriever.py
import json
import faiss
import numpy as np
from sentence_transformers import SentenceTransformer

INDEX_PATH = "training/faiss_index.index"
TEXTS_PATH = "training/faiss_texts.json"

model = SentenceTransformer("all-MiniLM-L6-v2")
index = faiss.read_index(INDEX_PATH)

with open(TEXTS_PATH, "r", encoding="utf-8") as f:
    texts = json.load(f)

# ✅ Lower = more similar (distance, not cosine similarity directly)
SIMILARITY_THRESHOLD = 0.5  # Adjust this value as needed (typically between 0.3 and 0.8)

def retrieve_similar_passages(query: str, k: int = 3):
    emb = model.encode([query]).astype("float32")
    distances, indices = index.search(emb, k)

    results = []
    for dist, idx in zip(distances[0], indices[0]):
        if dist < SIMILARITY_THRESHOLD:
            results.append(texts[idx]) 
    
    return results
