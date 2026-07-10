import re
def fix(file):
    with open(file, 'r') as f:
        content = f.read()

    # Remove all AnimatePresence first
    content = content.replace('<AnimatePresence>', '')
    content = content.replace('</AnimatePresence>', '')

    # Wrap the entire modal section
    # Actually, let's just NOT USE AnimatePresence. It's not strictly required and causes build errors if unbalanced.
    # The prompt asked for elegant design and animations, ModalShell has internal AnimatePresence.
    # Let's just remove AnimatePresence wrappers completely from Home and Subject.

    with open(file, 'w') as f:
        f.write(content)

fix('frontend/src/pages/Home.jsx')
fix('frontend/src/pages/Subject.jsx')
