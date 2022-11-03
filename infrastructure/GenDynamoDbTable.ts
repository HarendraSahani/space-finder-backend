import { RemovalPolicy, Stack } from "aws-cdk-lib"
import { AttributeType, Table } from "aws-cdk-lib/aws-dynamodb"
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { isNamedTupleMember } from "typescript"
import { LambdaIntegration } from 'aws-cdk-lib/aws-apigateway';
import { join } from 'path'

export interface TableProps {
    tableName: string,
    primaryKey: string,
    createLambdaPath?: string,
    readLambdaPath?: string,
    updateLambdaPath?: string,
    deleteLambdaPath?: string,
    secondaryIndexes? : string[]

}

export class GenDynamoDbTable {

    private props: TableProps;

    private stack: Stack;
    private table: Table;

    private createLambda: NodejsFunction | undefined;
    private readLambda: NodejsFunction | undefined;
    private updateLambda: NodejsFunction | undefined;
    private deleteLambda: NodejsFunction | undefined;

    public createLambdaIntegration: LambdaIntegration;
    public readLambdaIntegration: LambdaIntegration;
    public updateLambdaIntegration: LambdaIntegration;
    public deleteLambdaIntegration: LambdaIntegration;

    constructor(stack: Stack, props: TableProps) {
        this.stack = stack;
        this.props = props;
        this.initialize()
    }

    private initialize(): void {
        this.createTable();
        this.addSecondaryIndexes();
        this.createLambdas();
        this.grantTableRights();
    }

    private createTable(): void {
        this.table = new Table(this.stack, this.props.tableName, {
            removalPolicy: RemovalPolicy.DESTROY,
            partitionKey: {
                name: this.props.primaryKey,
                type: AttributeType.STRING
            },
            tableName: this.props.tableName
        })
    }
    
    private addSecondaryIndexes(): void {
        if(this.props.secondaryIndexes){
            for(const secondaryIndex of this.props.secondaryIndexes){
                this.table.addGlobalSecondaryIndex({
                    indexName: secondaryIndex,
                    partitionKey: {
                        name: secondaryIndex,
                        type: AttributeType.STRING
                    }
                })
            }
        }
    }
    private createLambdas() {
        if (this.props.createLambdaPath) {
            this.createLambda = this.initializeLambdaObject(this.props.createLambdaPath);
            this.createLambdaIntegration = new LambdaIntegration(this.createLambda);
        }
        if (this.props.updateLambdaPath) {
            this.updateLambda = this.initializeLambdaObject(this.props.updateLambdaPath);
            this.updateLambdaIntegration = new LambdaIntegration(this.updateLambda);
        }
        if (this.props.readLambdaPath) {
            this.readLambda = this.initializeLambdaObject(this.props.readLambdaPath);
            this.readLambdaIntegration = new LambdaIntegration(this.readLambda);
        }
        if (this.props.deleteLambdaPath) {
            this.deleteLambda = this.initializeLambdaObject(this.props.deleteLambdaPath);
            this.deleteLambdaIntegration = new LambdaIntegration(this.deleteLambda);
        }
    }

    private grantTableRights(){
        if(this.createLambda){
            this.table.grantWriteData(this.createLambda!);
        }
        if(this.readLambda){
            this.table.grantReadData(this.readLambda!);
        }
        if(this.updateLambda){
            this.table.grantWriteData(this.updateLambda!);
        }
        if(this.deleteLambda){
            this.table.grantWriteData(this.deleteLambda!);
        }
    
    }

    private initializeLambdaObject(lambdaName: string): NodejsFunction {
        const lambdaId = `${this.props.tableName}-${lambdaName}`;
        return new NodejsFunction(this.stack, lambdaId, {
            entry: (join(__dirname, '..', 'services', 'SpacesTable', `${lambdaName}.ts`)),
            handler: 'handler',
            functionName: lambdaId,
            environment: {
                TABLE_NAME: this.props.tableName,
                PRIMARY_KEY: this.props.primaryKey

            }
        }


        )
    }

}