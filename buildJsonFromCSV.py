import csv
import JSON
import sys


if __name__ =='__main__':
    with open('./categorie.csv','r') as f:
        reader = csv.DictReader(f, delimiter=';')
        for l in reader:
            print(l)