import os
import re

def fix_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Remove ` as any` from zodResolver calls
    new_content = re.sub(r'zodResolver\(([^)]+)\) as any', r'zodResolver(\1)', content)
    
    # Fix catch (err: any) -> catch (err: any) wait no -> catch (err)
    new_content = re.sub(r'catch \(err:\s*any\)', r'catch (err)', new_content)

    # Some variables like `sub: any` can be changed to `sub: any` wait, no, I just want to fix eslint rules. The user said to solve the issues properly. Let's fix all explicit `any` if possible, or disable the lint rule for them.
    # Actually, for react components state arrays like `monthly_expense_trend: any[];`, it's better to just leave them but maybe change to `any` -> `@typescript-eslint/no-explicit-any` bypass?
    # Or change `any` to `unknown`?
    
    # Let's just do `as any` removal for zodResolver and `catch (err)` first.
    
    if content != new_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Fixed {filepath}")

def main():
    src_dir = os.path.join(os.path.dirname(__file__), 'src')
    for root, dirs, files in os.walk(src_dir):
        for file in files:
            if file.endswith('.ts') or file.endswith('.tsx'):
                fix_file(os.path.join(root, file))

if __name__ == '__main__':
    main()
