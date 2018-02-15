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
   
    sf = Salesforce(username='jep@ubiclouder.com.mm', password='ubi$2017', security_token='Xqr6eOjUX2MrVzoZfKg7Iull', sandbox=True)
    toInsert =[]   ## On utilise l'API bulk
    
    with open('./categorie.csv','r') as f:
        reader = csv.DictReader(f, delimiter=';')
        for l in reader:
            newRec= {'Clef_Statec__c':l['id'],'Clef_Parent__c':l['Parent'],'Name':l['Nom'],'Libelle__c':l['Nom']}
            toInsert.append(newRec)
            
    sf.Business_Category__c.bulk.insert(toInsert)
    
    ## print(toInsert,len(toInsert))