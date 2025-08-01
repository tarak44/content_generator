# training/rag_indexer.py
import json
import os
import faiss
import numpy as np
from sentence_transformers import SentenceTransformer

DATA_PATH = "training/alpaca_data.jsonl"
INDEX_PATH = "training/faiss_index.index"
TEXTS_PATH = "training/faiss_texts.json"

def load_alpaca_data(path):
    with open(path, "r", encoding="utf-8") as f:
        return [json.loads(line.strip()) for line in f]

def build_faiss_index():
    data = load_alpaca_data(DATA_PATH)
    model = SentenceTransformer("all-MiniLM-L6-v2")

    embeddings = []
    texts = []

    for entry in data:
        query = entry["instruction"]
        if entry["input"]:
            query += " " + entry["input"]

        emb = model.encode(query)
        embeddings.append(emb)
        texts.append(entry["output"])

    embeddings = np.array(embeddings).astype("float32")

    index = faiss.IndexFlatL2(embeddings.shape[1])
    index.add(embeddings)

    faiss.write_index(index, INDEX_PATH)
    with open(TEXTS_PATH, "w", encoding="utf-8") as f:
        json.dump(texts, f, indent=2)

    print(f"✅ FAISS index built with {len(texts)} entries.")

if __name__ == "__main__":
    build_faiss_index()
