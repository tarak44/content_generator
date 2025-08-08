from transformers import AutoTokenizer, AutoModel
import torch

EMBEDDING_MODEL_NAME = 'sentence-transformers/all-MiniLM-L6-v2'
EMBEDDING_DIM = 384  # embedding size of the model

# Load Hugging Face transformer model and tokenizer
tokenizer = AutoTokenizer.from_pretrained(EMBEDDING_MODEL_NAME)
model = AutoModel.from_pretrained(EMBEDDING_MODEL_NAME)

# Embedding function (mean pooling)
def encode(text: str) -> list[float]:
    inputs = tokenizer(text, return_tensors="pt", truncation=True, padding=True)
    with torch.no_grad():
        outputs = model(**inputs)
        token_embeddings = outputs.last_hidden_state
        attention_mask = inputs["attention_mask"].unsqueeze(-1).expand(token_embeddings.size()).float()
        pooled = torch.sum(token_embeddings * attention_mask, 1) / torch.clamp(attention_mask.sum(1), min=1e-9)
    return pooled.squeeze().tolist()

# Used to get the expected embedding dimension
def get_sentence_embedding_dimension() -> int:
    return EMBEDDING_DIM
