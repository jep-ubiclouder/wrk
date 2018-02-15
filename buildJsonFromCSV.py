import csv
import sys
from simple_salesforce import (
    Salesforce,
    SalesforceAPI,
    SFType,
    SalesforceError,
    SalesforceMoreThanOneRecord,
    SalesforceExpiredSession,
    SalesforceRefusedRequest,
    SalesforceResourceNotFound,
    SalesforceGeneralError,
    SalesforceMalformedRequest
)



if __name__ =='__main__':
"""    arbre = {'0':{'Name':'root','children':[]}}
    with open('./categorie.csv','r') as f:
        reader = csv.DictReader(f, delimiter=';')
        for l in reader:
            if l['id'] not in arbre.keys():
                arbre[l['id']] = {'Name':l['Nom'],'children':[]}
            else:
                arbre[l['id']]['Name'] = l['Nom']
            if l['Parent'] not in arbre.keys():
                arbre[l['Parent']]  ={'children':[]}
                
            arbre[l['Parent']]['children'].append(l['id'])
            
    print(arbre)            
    """
    
    sf = Salesforce(username='jep@ubiclouder.com.mm', password='ubi$2017', security_token='Xqr6eOjUX2MrVzoZfKg7Iull', sandbox=True)
    toInsert =[]   ## On utilise l'API bulk
    
    with open('./categorie.csv','r') as f:
        reader = csv.DictReader(f, delimiter=';')
        for l in reader:
            newRec= {'Clef_Statec__c':l['id'],'Clef_Parent__c':l['Parent'],'Name':l['Nom'],'Libelle__c':l['Nom'],'Poids__c':l['Poids']}
            toInsert.append(newRec)
            
    sf.Business_Category__c.bulk.insert(toInsert)
    
    