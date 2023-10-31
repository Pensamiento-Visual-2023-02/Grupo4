import csv
import json

csv_file = './data/rent_prices/rent_prices.csv'

json_data = []



with open(csv_file, mode='r', newline='') as file:
    csv_reader = csv.DictReader(file)
    for row in csv_reader:
        if row['divisa'] == 'pesos':
            json_data.append(row)

json_file = './data/rent_prices/rent_prices.json'

with open(json_file, mode='w', newline='') as file:
    json.dump(json_data, file, indent=2)

print(f'CSV data has been converted and saved to {json_file}.')
