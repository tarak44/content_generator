import faiss
import numpy as np
from app import models
from sqlalchemy.orm import Session
from app.schemas import AddMemoryResponse, SearchResponse, Match
from app.routes.memory_store import embedder  # Import your embedder

INDEX_PATH = "memory_index.faiss"

# Globals
index = None
DIM = embedder.get_sentence_embedding_dimension()

def initialize_index(db: Session):
    """
    Initialize or load FAISS index. If loading fails, create fresh index and clear DB.
    """
    global index
    try:
        index = faiss.read_index(INDEX_PATH)
        if index.d != DIM:
            print(f"[WARN] Dimension mismatch in saved FAISS index. Expected {DIM}, got {index.d}. Resetting index.")
            index = faiss.IndexFlatL2(DIM)
            db.query(models.MemoryEmbedding).delete()
            db.commit()
        else:
            print(f"[INFO] FAISS index loaded from disk with dimension {DIM}.")
    except:
        print("[INFO] No FAISS index found. Creating new index and clearing DB to sync.")
        index = faiss.IndexFlatL2(DIM)
        db.query(models.MemoryEmbedding).delete()
        db.commit()

def add_embedding(db: Session, embedding, text: str, owner_id: int) -> AddMemoryResponse:
    global index

    embedding = np.array(embedding, dtype='float32')
    if embedding.ndim == 1:
        vec = embedding.reshape(1, -1)
    elif embedding.ndim == 2 and embedding.shape[0] == 1:
        vec = embedding
    else:
        raise ValueError(f"Unexpected embedding shape: {embedding.shape}")
    
    print(f"[DEBUG] Add embedding shape: {vec.shape}")

    if index is None:
        initialize_index(db)

    if vec.shape[1] != DIM:
        raise ValueError(f"Embedding dimension mismatch: expected {DIM}, got {vec.shape[1]}")

    faiss_id = index.ntotal
    index.add(vec)

    memory = models.MemoryEmbedding(
        faiss_id=faiss_id,
        owner_id=owner_id,
        text=text
    )
    db.add(memory)
    db.commit()

    faiss.write_index(index, INDEX_PATH)

    # Debug print
    response = AddMemoryResponse(message="Memory added", faiss_id=faiss_id)
    print("[DEBUG] Returning from add_embedding:", response.dict())
    return response

def search_embedding(db: Session, embedding, k: int = 3) -> SearchResponse:
    global index

    if index is None or index.ntotal == 0:
        print("[INFO] Search called but index is empty.")
        return SearchResponse(matches=[])

    embedding = np.array(embedding, dtype='float32')
    if embedding.ndim == 1:
        vec = embedding.reshape(1, -1)
    elif embedding.ndim == 2 and embedding.shape[0] == 1:
        vec = embedding
    else:
        raise ValueError(f"Unexpected embedding shape: {embedding.shape}")

    print(f"[DEBUG] Search embedding shape: {vec.shape}")

    if vec.shape[1] != DIM:
        raise ValueError(f"Query embedding dimension mismatch: expected {DIM}, got {vec.shape[1]}")

    distances, indices = index.search(vec, k)

    matches = []
    for idx, dist in zip(indices[0], distances[0]):
        if idx == -1:
            continue
        memory = db.query(models.MemoryEmbedding).filter_by(faiss_id=idx).first()
        if memory:
            match = Match(
                faiss_id=memory.faiss_id,
                text=memory.text,
                distance=float(dist)
            )
            matches.append(match)

    response = SearchResponse(matches=matches)
    print("[DEBUG] Returning from search_embedding:", response.dict())
    return response
