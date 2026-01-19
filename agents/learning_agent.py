# agents/learning_agent.py

import csv
import os

FEEDBACK_FILE = "data/feedback.csv"

def learn_from_feedback(label, email_text):
    """
    Stores user feedback for future learning.
    label -> 'spam' or 'ham'
    email_text -> full email content
    """

    # Ensure directory exists
    os.makedirs("data", exist_ok=True)

    # Append feedback safely
    with open(FEEDBACK_FILE, "a", newline="", encoding="utf-8") as file:
        writer = csv.writer(file)
        writer.writerow([label, email_text])

    return "📘 Feedback saved successfully"
