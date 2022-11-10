import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { LambdaIntegration, RestApi,LambdaRestApi, MethodOptions, AuthorizationType } from 'aws-cdk-lib/aws-apigateway'
//import { GenericTable } from './GenDynamoDbTable';
import {AuthorizerWrapper} from './auth/AuthorizerWrapper';
 
//import { Code, Function as LambdaFunction, Runtime } from 'aws-cdk-lib/aws-lambda'
import { join } from 'path'

import { GenDynamoDbTable } from './GenDynamoDbTable';
import {NodejsFunction} from 'aws-cdk-lib/aws-lambda-nodejs'
import {PolicyStatement} from 'aws-cdk-lib/aws-iam'

export class SpaceStack extends Stack {

    private api = new RestApi(this, 'spaceApi');
    
    /** 
     * private spacesTable = new GenDynamoDbTable(
        'SpaceTable',
        'spaceId',
        this)
   */
    
        //creating gateway api using latest library 
    private authorizer : AuthorizerWrapper;
    
    private spacesTable = new GenDynamoDbTable(this,{
        tableName : 'SpacesTable',
        primaryKey : 'spaceId',
        createLambdaPath : 'Create',
        readLambdaPath : 'Read',
        updateLambdaPath : 'Update',
        deleteLambdaPath: 'Delete',
        secondaryIndexes: ['location']
    })
     
    //creating a new object for scanning

    
    constructor(scope: Construct, id: string, props: StackProps) {
        super(scope, id, props)

         /**  const helloLambda = new LambdaFunction(this, 'helloLambda', {
            runtime: Runtime.NODEJS_16_X,
            code: Code.fromAsset(join(__dirname, '..', 'services', 'hello')),
            handler: 'hello.main'
        }) 

        const helloLambdaNodeJs = new NodejsFunction(this,'helloLambdaNodeJs',{
            entry : (join(__dirname,'..','services','node-lambda-ts','hello.ts')),
            handler : 'handler'
        })
        const putTableDynamo = new NodejsFunction(this,'putTableDynamoJs',{
            entry : (join(__dirname,'..', 'services', 'SpacesTable','Create.ts')),
            handler : 'handler'
        }) 
        */
       this.authorizer = new AuthorizerWrapper(this,this.api);
        const helloLambdaNodeJs = new NodejsFunction(this,'helloLambdaNodeJs',{
            entry : (join(__dirname,'..','services','node-lambda-ts','hello.ts')),
            handler : 'handler'
        })
        const s3ListPolicy = new PolicyStatement();
        s3ListPolicy.addActions('s3:ListAllMyBuckets');
       // s3ListPolicy.addActions('dynamodb:*');
        s3ListPolicy.addResources('*');
        helloLambdaNodeJs.addToRolePolicy(s3ListPolicy);
        //putTableDynamo.addToRolePolicy(s3ListPolicy)
        
        //this way we don't have to use LambdaIntegration to attach the lambda to gateway api separately
        const awsGWApi = new LambdaRestApi(this, 'spaceGWApi',{
            handler: helloLambdaNodeJs,
            proxy: false
          })

          const items = awsGWApi.root.addResource('items');
          items.addMethod('GET');


        //adding authorizer to 'lambdaresource' api
        // step 1 : create optionObject to be attached to rest api
        ///** 
        const optionsWithAuthorizer : MethodOptions = {
            authorizationType : AuthorizationType.COGNITO,
            authorizer : {
                authorizerId : this.authorizer.cognitoAuthorizer.authorizerId
            }
        } //*/
        //integration with Lambda:
        const lambdaIntegration = new LambdaIntegration(helloLambdaNodeJs)
        const helloLambdaResource = this.api.root.addResource('lambdaResource')
        //without any authorization
        //helloLambdaResource.addMethod('GET', lambdaIntegration);
        //with authorizer
        helloLambdaResource.addMethod('GET', lambdaIntegration,optionsWithAuthorizer);
        //Spaces API integrations:
        const spaceResource = this.api.root.addResource('spaces');
        spaceResource.addMethod('POST',this.spacesTable.createLambdaIntegration);

        spaceResource.addMethod('GET',this.spacesTable.readLambdaIntegration);
        spaceResource.addMethod('PUT',this.spacesTable.updateLambdaIntegration);
        spaceResource.addMethod('DELETE',this.spacesTable.deleteLambdaIntegration);

    }

}