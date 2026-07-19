import re

with open('src/components/LandingPage.tsx', 'r') as f:
    lines = f.readlines()

new_lines = []
for i, line in enumerate(lines):
    if line.strip() == '}' and lines[i+1].strip() == '});':
        # Skip this '}' because '});' handles it
        continue
    new_lines.append(line)

with open('src/components/LandingPage.tsx', 'w') as f:
    f.writelines(new_lines)
