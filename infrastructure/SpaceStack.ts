import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { AuthorizationType, Cors, LambdaIntegration, MethodOptions, ResourceOptions, RestApi } from 'aws-cdk-lib/aws-apigateway'
//import { GenericTable } from './GenDynamoDbTable';

import { Bucket, HttpMethods } from 'aws-cdk-lib/aws-s3';
import { Code, Function as LambdaFunction, Runtime } from 'aws-cdk-lib/aws-lambda'
import { join } from 'path'
import { HealthCheckProtocol } from 'aws-cdk-lib/aws-globalaccelerator';
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
        
        //integration with Lambda:
        const lambdaIntegration = new LambdaIntegration(helloLambdaNodeJs)
        const helloLambdaResource = this.api.root.addResource('lambdaResource')
        helloLambdaResource.addMethod('GET', lambdaIntegration);
        
        //Spaces API integrations:
        const spaceResource = this.api.root.addResource('spaces');
        spaceResource.addMethod('POST',this.spacesTable.createLambdaIntegration);

        spaceResource.addMethod('GET',this.spacesTable.readLambdaIntegration);
        spaceResource.addMethod('PUT',this.spacesTable.updateLambdaIntegration);
        spaceResource.addMethod('DELETE',this.spacesTable.deleteLambdaIntegration);

    }

}