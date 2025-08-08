import numpy as np
from sklearn.neighbors import NearestNeighbors
from app import models
from sqlalchemy.orm import Session
from app.schemas import AddMemoryResponse, SearchResponse, Match
from app.routes.memory_store import generate_embedding, get_sentence_embedding_dimension  # ✅ Updated here

DIM = get_sentence_embedding_dimension()

# Global in-memory storage (consider persisting with a real vector DB for production)
stored_embeddings = []
stored_texts = []
stored_ids = []
nn_model = None


def rebuild_index():
    global nn_model
    if stored_embeddings:
        X = np.vstack(stored_embeddings)
        nn_model = NearestNeighbors(n_neighbors=min(3, len(stored_embeddings)), metric='euclidean')
        nn_model.fit(X)
    else:
        nn_model = None


def add_embedding(db: Session, embedding, text: str, owner_id: int) -> AddMemoryResponse:
    global stored_embeddings, stored_texts, stored_ids

    embedding = np.array(embedding, dtype='float32')
    if embedding.ndim == 1:
        vec = embedding.reshape(1, -1)
    elif embedding.ndim == 2 and embedding.shape[0] == 1:
        vec = embedding
    else:
        raise ValueError(f"Unexpected embedding shape: {embedding.shape}")

    if vec.shape[1] != DIM:
        raise ValueError(f"Embedding dimension mismatch: expected {DIM}, got {vec.shape[1]}")

    vec_id = len(stored_embeddings)

    stored_embeddings.append(vec)
    stored_texts.append(text)
    stored_ids.append(vec_id)

    memory = models.MemoryEmbedding(
        faiss_id=vec_id,
        owner_id=owner_id,
        text=text
    )
    db.add(memory)
    db.commit()

    rebuild_index()

    response = AddMemoryResponse(message="Memory added", faiss_id=vec_id)
    print("[DEBUG] Returning from add_embedding:", response.dict())
    return response


def search_embedding(db: Session, embedding, k: int = 3) -> SearchResponse:
    if not stored_embeddings or nn_model is None:
        print("[INFO] Search called but index is empty.")
        return SearchResponse(matches=[])

    embedding = np.array(embedding, dtype='float32')
    if embedding.ndim == 1:
        vec = embedding.reshape(1, -1)
    elif embedding.ndim == 2 and embedding.shape[0] == 1:
        vec = embedding
    else:
        raise ValueError(f"Unexpected embedding shape: {embedding.shape}")

    if vec.shape[1] != DIM:
        raise ValueError(f"Query embedding dimension mismatch: expected {DIM}, got {vec.shape[1]}")

    distances, indices = nn_model.kneighbors(vec, n_neighbors=min(k, len(stored_embeddings)))

    matches = []
    for idx, dist in zip(indices[0], distances[0]):
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
