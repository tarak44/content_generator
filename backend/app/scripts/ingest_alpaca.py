import json
from app.routes.memory_store import embedder
from app.services.memory_service import add_embedding
from app.database import SessionLocal
from app import models

DB = SessionLocal()
OWNER_ID = 1  # Change if using user-specific memory

# Correct relative path to alpaca_data.jsonl
with open("training/alpaca_data.jsonl", "r", encoding="utf-8") as f:
    for line in f:
        try:
            data = json.loads(line)
            instruction = data.get("instruction", "")
            input_text = data.get("input", "")
            output = data.get("output", "")

            prompt = instruction + "\n" + input_text if input_text else instruction
            full_text = f"{prompt}\n\n{output}"

            embedding = embedder.encode(full_text, convert_to_numpy=True)
            add_embedding(DB, embedding, full_text, OWNER_ID)
        except Exception as e:
            print(f"❌ Skipping line due to error: {e}")

DB.commit()
DB.close()
print("✅ Alpaca ingestion complete.")
