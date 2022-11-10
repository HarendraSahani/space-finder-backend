import { CfnOutput } from "aws-cdk-lib";
import { CfnAuthorizer, CognitoUserPoolsAuthorizer, RestApi } from "aws-cdk-lib/aws-apigateway";
import { CfnUserPoolGroup, UserPool, UserPoolClient } from "aws-cdk-lib/aws-cognito";
import { Construct } from "constructs";




/**
 * 1. Create a userpool
 * 2. create a user
 * 3. create a app client/UserPool client
 * 4. create a authorizer
 * 5. assign the authorizer which provide authentication services to an Api using cognito userpool
 */
export class AuthorizerWrapper {

    private scope: Construct;
    private api: RestApi

    //variable for userPool - step 1
    private userPool: UserPool;
    //variable for Userpool App Client
    private userPoolClient: UserPoolClient;
    //variable for authorizer
    public cognitoAuthorizer: CognitoUserPoolsAuthorizer;

    constructor(scope: Construct, api: RestApi) {
        this.scope = scope;
        this.api = api;
        this.initialize();

    }

    private initialize() {
        this.createUserPool();
        this.addUserPoolClient();
        this.createAuthorizer();
        this.createAdminGroup();
    }

    private createUserPool() {
        this.userPool = new UserPool(this.scope, 'SpaceUserPool', {
            userPoolName: 'SpaceUserPool',
            selfSignUpEnabled: true,
            signInAliases: {
                username: true,
                email: true
            }
        });

        //getting the userPoolId created:
        //generic way of getting the output

        new CfnOutput(this.scope, 'userPoolId', {
            value: this.userPool.userPoolId
        })
    }

    private addUserPoolClient() {
        this.userPoolClient = this.userPool.addClient('SpaceUserPool-client', {
            authFlows: {
                adminUserPassword: true,
                custom: true,
                userPassword: true,
                userSrp: true
            },
            generateSecret: false
        });
        new CfnOutput(this.scope, 'UserPoolClientId', {
            value: this.userPoolClient.userPoolClientId
        })
    }

    private createAuthorizer() {
        this.cognitoAuthorizer = new CognitoUserPoolsAuthorizer(this.scope, 'SpaceUserAuthorizer', {
            cognitoUserPools: [this.userPool],
            authorizerName: 'SpaceUserAuthorizer',
            identitySource: 'method.request.header.Authorization',


        });
        this.cognitoAuthorizer._attachToApi(this.api);

        //const a = new CfnAuthorizer(this.scope, 'sdfdsf',{})
    }

    private createAdminGroup() {
        new CfnUserPoolGroup(this.scope, 'admins', {
            groupName: 'admins',
            userPoolId: this.userPool.userPoolId
        })
    }



}