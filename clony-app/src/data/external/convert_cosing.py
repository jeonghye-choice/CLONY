import csv
import json
import os

csv_file = '/Users/jojeonghye/Desktop/CLONY/data/external/cosing_ingredients.csv'
json_file = '/Users/jojeonghye/Desktop/CLONY/data/external/cosing_ingredients.json'

ingredients = []

with open(csv_file, mode='r', encoding='utf-8') as f:
    # Skip the meta headers (sep=,, creation date, etc.)
    # Based on sed output, the real header is at line 10
    lines = f.readlines()
    header_line_index = 0
    for i, line in enumerate(lines):
        if 'COSING Ref No,INCI name' in line:
            header_line_index = i
            break
    
    # Use csv.DictReader on the remaining lines
    reader = csv.DictReader(lines[header_line_index:])
    
    for row in reader:
        # Clean up keys and values
        clean_row = {k.strip(): v.strip() for k, v in row.items() if k}
        
        # Only include if it has an INCI name
        if clean_row.get('INCI name'):
            # Convert numeric fields if possible
            if 'COSING Ref No' in clean_row:
                try:
                    clean_row['COSING Ref No'] = int(clean_row['COSING Ref No'])
                except ValueError:
                    pass
            
            ingredients.append(clean_row)

# Save as JSON
with open(json_file, mode='w', encoding='utf-8') as f:
    json.dump(ingredients, f, ensure_ascii=False, indent=2)

print(f"Successfully converted {len(ingredients)} ingredients to {json_file}")
