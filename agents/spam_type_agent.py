def classify_spam_type(text, links):
    """
    Classifies the type of spam based on email content and links.

    Possible return values:
    - PHISHING
    - PROMOTION
    - SCAM
    - NEWSLETTER
    - GENERAL_SPAM
    """

    if not text:
        return "GENERAL_SPAM"

    text = text.lower()

    # 🎣 Phishing detection
    phishing_keywords = [
        "verify your account",
        "reset password",
        "login immediately",
        "confirm your identity",
        "security alert",
        "unusual activity"
    ]
    for keyword in phishing_keywords:
        if keyword in text:
            return "PHISHING"

    # 📢 Promotional / marketing spam
    promo_keywords = [
        "unsubscribe",
        "offer",
        "discount",
        "deal",
        "limited time",
        "sale",
        "subscribe"
    ]
    if any(word in text for word in promo_keywords) and len(links) >= 2:
        return "PROMOTION"

    # 🎰 Scam / lottery spam
    scam_keywords = [
        "lottery",
        "winner",
        "won",
        "claim prize",
        "free money",
        "jackpot"
    ]
    for keyword in scam_keywords:
        if keyword in text:
            return "SCAM"

    # 📰 Newsletter / informational spam
    newsletter_keywords = [
        "newsletter",
        "this week",
        "weekly",
        "monthly",
        "community",
        "resources"
    ]
    for keyword in newsletter_keywords:
        if keyword in text:
            return "NEWSLETTER"

    # ❓ Default fallback
    return "GENERAL_SPAM"
