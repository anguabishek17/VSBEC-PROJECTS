memory = {}

def remember(sender, decision):
    if sender not in memory:
        memory[sender] = []
    memory[sender].append(decision)
    return memory[sender]
