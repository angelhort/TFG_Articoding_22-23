import os
import json

# Path to directory containing JSON files
directory_path = './_id=60c36c161f7061006ecb515b'

# Output file name
output_file_name = 'trazasJuntas.json'

# Create empty list to hold all JSON data
all_data = []

# Loop through all files in the directory
for file_name in os.listdir(directory_path):
    # Check if file is JSON
    if file_name.endswith('.json'):
        # Open JSON file
        with open(os.path.join(directory_path, file_name)) as f:
            # Load JSON data
            data = json.load(f)
            # Append data to list
            all_data.append(data)

# Write all JSON data to output file
with open(output_file_name, 'w') as f:
    json.dump(all_data, f)