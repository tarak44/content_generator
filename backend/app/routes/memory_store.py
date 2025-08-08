from transformers import AutoTokenizer, AutoModel
import torch

EMBEDDING_MODEL_NAME = "microsoft/MiniLM-L12-H384-uncased"

tokenizer = AutoTokenizer.from_pretrained(EMBEDDING_MODEL_NAME)
model = AutoModel.from_pretrained(EMBEDDING_MODEL_NAME)

def generate_embedding(text: str):
    inputs = tokenizer(text, return_tensors="pt", padding=True, truncation=True)
    with torch.no_grad():
        outputs = model(**inputs)
    return outputs.last_hidden_state.mean(dim=1).squeeze().numpy()

def get_sentence_embedding_dimension() -> int:
    return 384  # for MiniLM-L12-H384
