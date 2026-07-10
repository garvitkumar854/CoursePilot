def fix_file(filename):
    with open(filename, 'r') as f:
        content = f.read()

    content = content.replace('<AnimatePresence>', '')
    content = content.replace('</AnimatePresence>', '')

    # Replace open
    content = content.replace('{subjectModalOpen ? (', '<AnimatePresence>{subjectModalOpen ? (')
    content = content.replace('{subjectToDelete ? (', '<AnimatePresence>{subjectToDelete ? (')
    content = content.replace('{assignmentModalOpen ? (', '<AnimatePresence>{assignmentModalOpen ? (')
    content = content.replace('{assignmentToDelete ? (', '<AnimatePresence>{assignmentToDelete ? (')

    # Replace close
    content = content.replace('        </ModalShell>\n      ) : null}', '        </ModalShell>\n      ) : null}\n      </AnimatePresence>')
    content = content.replace('        </ConfirmDialog>\n      ) : null}', '        </ConfirmDialog>\n      ) : null}\n      </AnimatePresence>')

    with open(filename, 'w') as f:
        f.write(content)

fix_file('frontend/src/pages/Home.jsx')
fix_file('frontend/src/pages/Subject.jsx')
