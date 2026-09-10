import os
import re

d = 'd:/ExpTrack/frontend/src/app'

for root, _, files in os.walk(d):
    for f in files:
        if f.endswith('.jsx'):
            p = os.path.join(root, f)
            with open(p, 'r', encoding='utf-8') as file:
                content = file.read()
            
            lucide_import_match = re.search(r'import\s+\{([^}]+)\}\s+from\s+["\']lucide-react["\'];?', content)
            if lucide_import_match:
                imported_icons = [icon.strip() for icon in lucide_import_match.group(1).split(',')]
                imported_icons = [i for i in imported_icons if i]
                
                used_icons = []
                for icon in imported_icons:
                    # Check occurrences of the word
                    occurrences = len(re.findall(r'\b' + icon + r'\b', content))
                    # The import itself counts as 1, so if > 1 it's used elsewhere
                    if occurrences > 1:
                        used_icons.append(icon)
                
                if set(imported_icons) != set(used_icons):
                    print(f'Cleaning up unused icons in {f}')
                    if used_icons:
                        new_import = 'import { ' + ', '.join(used_icons) + ' } from "lucide-react";'
                        content = content.replace(lucide_import_match.group(0), new_import)
                    else:
                        content = content.replace(lucide_import_match.group(0), '')
                    
                    with open(p, 'w', encoding='utf-8') as file:
                        file.write(content)
