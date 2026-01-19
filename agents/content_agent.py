import pickle
import re

# Load trained model
model, vectorizer = pickle.load(open("model/spam_model.pkl", "rb"))

def analyze_email(text):
    text = text.lower()
    text = re.sub(r'\W+', ' ', text)

    vector = vectorizer.transform([text])
    prediction = model.predict(vector)[0]
    probability = model.predict_proba(vector).max()

    return prediction, probability
