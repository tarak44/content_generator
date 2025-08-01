from sentence_transformers import SentenceTransformer
from app.utils.faiss_utils import FaissMemory

EMBEDDING_MODEL_NAME = 'all-MiniLM-L6-v2'
EMBEDDING_DIM = 384  # all-MiniLM-L6-v2 produces 384-dim vectors

embedder = SentenceTransformer(EMBEDDING_MODEL_NAME)
memory = FaissMemory(dimension=EMBEDDING_DIM)
