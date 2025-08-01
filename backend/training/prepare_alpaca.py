from datasets import load_dataset
import json

# Load Alpaca dataset (52k entries)
dataset = load_dataset("tatsu-lab/alpaca")["train"]

# Save as JSONL
with open("alpaca_data.jsonl", "w", encoding="utf-8") as f:
    for entry in dataset:
        f.write(json.dumps(entry) + "\n")

print("✅ Alpaca dataset saved as alpaca_data.jsonl")
