# agents/decision_agent.py

def decide(content_label, probability, sender_status):
    """
    Combines ML prediction and sender reputation
    """

    # High confidence spam
    if content_label == "spam" and probability >= 0.6:
        return "SPAM"

    # Unknown or suspicious sender with moderate confidence
    if sender_status == "suspicious" and probability >= 0.4:
        return "SPAM"

    # Otherwise allow
    return "HAM"
