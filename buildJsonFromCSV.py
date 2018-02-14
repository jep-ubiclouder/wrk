import csv

import sys


if __name__ =='__main__':
    arbre = {'0':{'Name':'root','children':[]}}
    with open('./categorie.csv','r') as f:
        reader = csv.DictReader(f, delimiter=';')
        for l in reader:
            if l['id'] not in arbre.keys():
                arbre[l['id']] = {'Name':l['Nom'],'children':[]}
            else:
                arbre[l['id']]['Name'] = l['Nom']
            if l['Parent'] not in arbre.keys():
                arbre[l['Parent']]  ={'children':[]}
                
            arbre[l['Parent']]['children'].push(l['id'])
            
    print(arbre)            