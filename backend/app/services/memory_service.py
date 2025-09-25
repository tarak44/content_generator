import numpy as np
from sklearn.neighbors import NearestNeighbors
from app import models
from sqlalchemy.orm import Session
from app.schemas import AddMemoryResponse, SearchResponse, Match
from app.routes.memory_store import generate_embedding, get_sentence_embedding_dimension

DIM = get_sentence_embedding_dimension()

# Global in-memory storage
stored_embeddings = []  # List[np.ndarray]
stored_texts = []       # List[str]
stored_ids = []         # List[int]
nn_model = None


def rebuild_index():
    """Rebuilds the k-NN index whenever embeddings are updated."""
    global nn_model
    if stored_embeddings:
        try:
            X = np.vstack(stored_embeddings)
            n_neighbors = min(3, len(stored_embeddings))
            nn_model = NearestNeighbors(n_neighbors=n_neighbors, metric='euclidean')
            nn_model.fit(X)
            print(f"[DEBUG] Rebuilt k-NN index with {len(stored_embeddings)} embeddings.")
        except Exception as e:
            print("[ERROR] Failed to rebuild k-NN index:", e)
            nn_model = None
    else:
        nn_model = None
        print("[INFO] No embeddings to build index.")


def load_embeddings_from_db(db: Session):
    """Load all embeddings from DB into memory (call at app startup)."""
    global stored_embeddings, stored_texts, stored_ids
    stored_embeddings.clear()
    stored_texts.clear()
    stored_ids.clear()

    memories = db.query(models.MemoryEmbedding).all()
    for memory in memories:
        embedding = np.array(generate_embedding(memory.text), dtype='float32').reshape(1, -1)
        stored_embeddings.append(embedding)
        stored_texts.append(memory.text)
        stored_ids.append(memory.faiss_id or 0)  # fallback if faiss_id is None

    rebuild_index()
    print(f"[INFO] Loaded {len(stored_embeddings)} embeddings from DB.")


def add_embedding(db: Session, embedding, text: str, owner_id: int) -> AddMemoryResponse:
    """Adds a new embedding to memory and DB."""
    global stored_embeddings, stored_texts, stored_ids

    embedding = np.array(embedding, dtype='float32')

    # Ensure embedding is 2D
    if embedding.ndim == 1:
        vec = embedding.reshape(1, -1)
    elif embedding.ndim == 2 and embedding.shape[0] == 1:
        vec = embedding
    else:
        raise ValueError(f"Unexpected embedding shape: {embedding.shape}")

    if vec.shape[1] != DIM:
        raise ValueError(f"Embedding dimension mismatch: expected {DIM}, got {vec.shape[1]}")

    # Persist in DB
    memory = models.MemoryEmbedding(
        owner_id=owner_id,
        text=text
    )
    db.add(memory)
    db.commit()
    db.refresh(memory)  # <-- ensures memory.faiss_id is populated

    # Ensure faiss_id is valid integer
    faiss_id = memory.faiss_id
    if faiss_id is None:
        faiss_id = 0  # fallback to 0 to prevent validation error

    # Add to in-memory storage
    stored_embeddings.append(vec)
    stored_texts.append(text)
    stored_ids.append(faiss_id)

    rebuild_index()

    response = AddMemoryResponse(message="Memory added", faiss_id=faiss_id)
    print("[DEBUG] Added embedding:", response.dict())
    return response


def search_embedding(db: Session, embedding, k: int = 3) -> SearchResponse:
    """Searches for nearest embeddings in memory."""
    global nn_model

    if not stored_embeddings or nn_model is None:
        print("[INFO] Search called but index is empty.")
        return SearchResponse(matches=[])

    embedding = np.array(embedding, dtype='float32')

    # Ensure embedding is 2D
    if embedding.ndim == 1:
        vec = embedding.reshape(1, -1)
    elif embedding.ndim == 2 and embedding.shape[0] == 1:
        vec = embedding
    else:
        raise ValueError(f"Unexpected embedding shape: {embedding.shape}")

    if vec.shape[1] != DIM:
        raise ValueError(f"Query embedding dimension mismatch: expected {DIM}, got {vec.shape[1]}")

    n_neighbors = min(k, len(stored_embeddings))
    distances, indices = nn_model.kneighbors(vec, n_neighbors=n_neighbors)

    matches = []
    for idx, dist in zip(indices[0], distances[0]):
        faiss_id = stored_ids[idx] or 0  # fallback if None
        memory = db.query(models.MemoryEmbedding).filter_by(faiss_id=faiss_id).first()
        if memory:
            matches.append(Match(
                faiss_id=memory.faiss_id,
                text=memory.text,
                distance=float(dist)
            ))

    response = SearchResponse(matches=matches)
    print("[DEBUG] Search results:", response.dict())
    return response
