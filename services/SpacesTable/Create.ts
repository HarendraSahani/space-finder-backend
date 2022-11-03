import { DynamoDB } from 'aws-sdk'
import { APIGatewayProxyEvent, Context, APIGatewayProxyResult } from 'aws-lambda'
import { MissingRequiredSpaceInfoError, validateSpace } from '../Shared/SpaceInputValidation';
import {Spaces as spaces} from '../Model/Spaces'

const TABLE_NAME = process.env.TABLE_NAME;
//create a dynamoDB client
const dbClient = new DynamoDB.DocumentClient();


//create a handler to get the event details from apigwproxy and return the proxy result

async function handler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {

    const result: APIGatewayProxyResult = {
        statusCode: 200,
        body: 'Hello from DynamoDB Lambda'
    }

    try {
        const item: spaces = typeof event.body == 'object' ? event.body : JSON.parse(event.body);
        item.spaceId = Math.random().toString().slice(2);
        validateSpace(item);
        await dbClient.put({
            TableName: TABLE_NAME!,
            Item: item
        }).promise();
        result.body = JSON.stringify(`Created Item with Id: ${item.spaceId} `)

    } catch (error) {
        if (error instanceof MissingRequiredSpaceInfoError) {
            result.statusCode = 403;
        }
        else {
            result.statusCode = 500;
        }
        result.body = error.message;


    }

    return result;
}
export { handler }
