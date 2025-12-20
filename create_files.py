#!/usr/bin/env python3
import os
os.chdir("/home/runner/work/exe-decompiler-pro/exe-decompiler-pro")

print("Creating all remaining files...")
print("=" * 80)

# Helper to write files
def wf(path, content):
    with open(path, 'w') as f:
        f.write(content)
    lines = len([l for l in content.split('\n') if l.strip()])
    print(f"✓ {path:45} {lines:4} lines")
    return lines

total = 0

# Test write
test_content = """# Test file
print("Hello")
"""
#total += wf("test.txt", test_content)

print(f"\nTotal: {total} lines created")

