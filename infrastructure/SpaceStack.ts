import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { AuthorizationType, Cors, LambdaIntegration, MethodOptions, ResourceOptions, RestApi } from 'aws-cdk-lib/aws-apigateway'
//import { GenericTable } from './GenDynamoDbTable';
import { AuthorizerWrapper } from './auth/AuthorizerWrapper';
import { Bucket, HttpMethods } from 'aws-cdk-lib/aws-s3';
import { WebAppDeployment } from './WebAppDeployment';
import { Policies } from './Policies';
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
    /**
     private api = new RestApi(this, 'SpaceApi');
     private authorizer: AuthorizerWrapper;
     private suffix: string;
     private spacesPhotosBucket: Bucket;
     private profilePhotosBucket: Bucket;
     private policies: Policies;
 
     private spacesTable = new GenericTable(this, {
         tableName: 'SpacesTable',
         primaryKey: 'spaceId',
         createLambdaPath: 'Create',
         readLambdaPath: 'Read',
         updateLambdaPath: 'Update',
         deleteLambdaPath: 'Delete',
         secondaryIndexes: ['location']
     })
 
     private reservationsTable = new GenericTable(this, {
         tableName: 'ReservationsTable',
         primaryKey: 'reservationId',
         createLambdaPath: 'Create',
         readLambdaPath: 'Read',
         updateLambdaPath: 'Update',
         deleteLambdaPath: 'Delete',
         secondaryIndexes: ['user']
     })
 
     constructor(scope: Construct, id: string, props: StackProps) {
         super(scope, id, props)
 
         this.initializeSuffix();
         this.initializeSpacesPhotosBucket();
         this.initializeProfilePhotosBucket();
         this.policies = new Policies(this.spacesPhotosBucket, this.profilePhotosBucket);
         this.authorizer = new AuthorizerWrapper(
             this,
             this.api,
             this.policies);
         new WebAppDeployment(this, this.suffix);
 
 
         const optionsWithAuthorizer: MethodOptions = {
             authorizationType: AuthorizationType.COGNITO,
             authorizer: {
                 authorizerId: this.authorizer.authorizer.authorizerId
             }
         }
         const optionsWithCors: ResourceOptions = {
             defaultCorsPreflightOptions: {
                 allowOrigins: Cors.ALL_ORIGINS,
                 allowMethods: Cors.ALL_METHODS
             }
         }
 
         //Spaces API integrations:
         const spaceResource = this.api.root.addResource('spaces', optionsWithCors);
         spaceResource.addMethod('POST', this.spacesTable.createLambdaIntegration, optionsWithAuthorizer);
         spaceResource.addMethod('GET', this.spacesTable.readLambdaIntegration, optionsWithAuthorizer);
         spaceResource.addMethod('PUT', this.spacesTable.updateLambdaIntegration, optionsWithAuthorizer);
         spaceResource.addMethod('DELETE', this.spacesTable.deleteLambdaIntegration, optionsWithAuthorizer);
 
         //Reservations API integrations:
         const reservationResource = this.api.root.addResource('reservations', optionsWithCors);
         reservationResource.addMethod('POST', this.reservationsTable.createLambdaIntegration, optionsWithAuthorizer);
         reservationResource.addMethod('GET', this.reservationsTable.readLambdaIntegration, optionsWithAuthorizer);
         reservationResource.addMethod('PUT', this.reservationsTable.updateLambdaIntegration, optionsWithAuthorizer);
         reservationResource.addMethod('DELETE', this.reservationsTable.deleteLambdaIntegration, optionsWithAuthorizer);
     }
 
     private initializeSuffix() {
         const shortStackId = Fn.select(2, Fn.split('/', this.stackId));
         const Suffix = Fn.select(4, Fn.split('-', shortStackId));
         this.suffix = Suffix;
     }
     private initializeSpacesPhotosBucket() {
         this.spacesPhotosBucket = new Bucket(this, 'spaces-photos', {
             bucketName: 'spaces-photos-' + this.suffix,
             cors: [{
                 allowedMethods: [
                     HttpMethods.HEAD,
                     HttpMethods.GET,
                     HttpMethods.PUT
                 ],
                 allowedOrigins: ['*'],
                 allowedHeaders: ['*']
             }]
         });
         new CfnOutput(this, 'spaces-photos-bucket-name', {
             value: this.spacesPhotosBucket.bucketName
         })
     }
 
     private initializeProfilePhotosBucket() {
         this.profilePhotosBucket = new Bucket(this, 'profile-photos', {
             bucketName: 'profile-photos-' + this.suffix,
             cors: [{
                 allowedMethods: [
                     HttpMethods.HEAD,
                     HttpMethods.GET,
                     HttpMethods.PUT
                 ],
                 allowedOrigins: ['*'],
                 allowedHeaders: ['*']
             }]
         });
         new CfnOutput(this, 'profile-photos-bucket-name', {
             value: this.profilePhotosBucket.bucketName
         })
     }
 
  */

}