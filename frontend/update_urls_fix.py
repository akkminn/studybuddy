import os
import re

directory = 'src'
pattern1 = r'"http://localhost:8000(.*?)"'
pattern2 = r"'http://localhost:8000(.*?)'"
pattern3 = r"`http://localhost:8000(.*?)`"

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # We messed up earlier, let's restore from original string logic:
    # We need to replace ```${import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}`}/api...```
    # with `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api...`
    # Let's just fix the messed up string globally in the files.
    
    bad_string1 = r"`${import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}`}"
    good_string = r"`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}"
    
    bad_string2 = r"`${import.meta.env.VITE_API_URL || \"`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}`\"}"
    
    new_content = content.replace(bad_string1, good_string).replace(bad_string2, good_string)
    
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Fixed {filepath}")
        return True
    return False

count = 0
for root, dirs, files in os.walk(directory):
    for file in files:
        if file.endswith(('.ts', '.tsx')):
            filepath = os.path.join(root, file)
            if process_file(filepath):
                count += 1

print(f"Total files fixed: {count}")
