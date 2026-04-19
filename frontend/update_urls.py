import os
import re

directory = 'src'
pattern1 = r'"http://localhost:8000(/.*?)"'
pattern2 = r"'http://localhost:8000(/.*?)'"

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if 'http://localhost:8000' not in content:
        return False
        
    has_env_import = "const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';" in content
    
    # Needs API_URL injected?
    if not has_env_import:
        # Find first inner function or after imports and insert it.
        # simpler: just inline it in Template literal: `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}\1`
        
        new_content = re.sub(pattern1, r"`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}\1`", content)
        new_content = re.sub(pattern2, r"`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}\1`", new_content)
        
        # for strings without trailing slash or path just in case
        new_content = new_content.replace('"http://localhost:8000"', "`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}`")
        new_content = new_content.replace("'http://localhost:8000'", "`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}`")

        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {filepath}")
        return True

count = 0
for root, dirs, files in os.walk(directory):
    for file in files:
        if file.endswith(('.ts', '.tsx')):
            filepath = os.path.join(root, file)
            if process_file(filepath):
                count += 1

print(f"Total files updated: {count}")
