import faiss
import numpy as np

class FaissMemory:
    def __init__(self, dimension: int):
        self.dimension = dimension
        self.index = faiss.IndexFlatL2(dimension)

    def add_embedding(self, embedding: np.ndarray):
        if embedding.shape != (self.dimension,):
            raise ValueError(f"Expected embedding of shape ({self.dimension},), got {embedding.shape}")
        self.index.add(np.expand_dims(embedding, axis=0))

    def search(self, query: np.ndarray, k: int = 3):
        if query.shape != (self.dimension,):
            raise ValueError(f"Expected query of shape ({self.dimension},), got {query.shape}")
        distances, indices = self.index.search(np.expand_dims(query, axis=0), k)
        return distances[0], indices[0]
