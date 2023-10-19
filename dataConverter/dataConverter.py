import csv
import json

# Read CSV data from a file
csv_file = './data/rent_prices/rent_prices.csv'

# Initialize an empty list to store JSON data
json_data = []

# Open the CSV file and read the data
with open(csv_file, mode='r', newline='') as file:
    csv_reader = csv.DictReader(file)
    for row in csv_reader:
        json_data.append(row)

# Define the output JSON file
json_file = './data/rent_prices/rent_prices.json'

# Write the JSON data to the output file
with open(json_file, mode='w', newline='') as file:
    json.dump(json_data, file, indent=2)

print(f'CSV data has been converted and saved to {json_file}.')
