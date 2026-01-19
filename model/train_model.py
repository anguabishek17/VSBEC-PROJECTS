# model/train_model.py

import pandas as pd
import pickle
import re
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from nltk.corpus import stopwords

def clean_text(text):
    text = text.lower()
    text = re.sub(r'\W+', ' ', text)
    return text

# Load base dataset
data = pd.read_csv("data/spam.csv")
data["text"] = data["text"].apply(clean_text)

# 🔁 Load feedback data if exists
try:
    feedback = pd.read_csv("data/feedback.csv")
    feedback["text"] = feedback["text"].apply(clean_text)
    data = pd.concat([data, feedback], ignore_index=True)
except FileNotFoundError:
    pass

# Vectorization
vectorizer = TfidfVectorizer(stop_words=stopwords.words("english"))
X = vectorizer.fit_transform(data["text"])
y = data["label"]

# Train model
model = MultinomialNB()
model.fit(X, y)

# Save updated model
pickle.dump((model, vectorizer), open("model/spam_model.pkl", "wb"))

print("✅ Model trained successfully using user feedback")
