import csv

# Define the CSV file path and the target column index (0-based)
csv_file = './data/rent_prices/rent_prices.csv'
target_column_index = 4  # Change to the appropriate column index

# Initialize variables to store the minimum and maximum values
min_value = float('inf')  # Initialize to positive infinity
max_value = float('-inf')  # Initialize to negative infinity

# Read the CSV file and find the minimum and maximum values
with open(csv_file, 'r', newline='') as file:
    reader = csv.reader(file)
    next(reader)  # Skip the header row if it exists

    for row in reader:
        if (row[28] == 'pesos'):
            try:
                value = float(row[target_column_index])
                min_value = min(min_value, value)
                max_value = max(max_value, value)
            except ValueError:
                # Handle invalid values or non-numeric data
                pass

print(f"Minimum value: {min_value}")
print(f"Maximum value: {max_value}")
