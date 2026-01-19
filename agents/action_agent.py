def take_action(decision):
    if decision == "SPAM":
        return "🚫 Blocked automatically"
    if decision == "REVIEW":
        return "⚠️ Sent for user review"
    return "✅ Delivered"
