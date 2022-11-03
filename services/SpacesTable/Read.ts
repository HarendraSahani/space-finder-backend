import { DynamoDB } from 'aws-sdk'
import { APIGatewayProxyEvent, Context, APIGatewayProxyResult, APIGatewayProxyEventQueryStringParameters } from 'aws-lambda'


const TABLE_NAME = process.env.TABLE_NAME;
const PRIMARY_KEY = process.env.PRIMARY_KEY;
//create a dynamoDB client
const dbClient = new DynamoDB.DocumentClient();


//create a handler to get the event details from apigwproxy and return the proxy result

async function handler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {

    const result: APIGatewayProxyResult = {
        statusCode: 200,
        body: 'Hello from DynamoDB Lambda'
    }

    try {
        if (event.queryStringParameters) {
            if (PRIMARY_KEY! in event.queryStringParameters) {
                result.body = await queryWithPrimaryPartition(event.queryStringParameters);
            }
            else {
                result.body = await queryWithSecondaryPartition(event.queryStringParameters);
            }
        }
        else {

            result.body = await scanTable();
        }

    } catch (error) {
        result.statusCode = 500;
        result.body = error.message;

    }

    return result;
}

async function scanTable() {
    const queryResponse = await dbClient.scan({
        TableName: TABLE_NAME!
    }).promise();
    console.log(JSON.stringify(queryResponse));
    return JSON.stringify(queryResponse?.Items);
}
async function queryWithPrimaryPartition(queryParams: APIGatewayProxyEventQueryStringParameters) {
    const keyValue = queryParams[PRIMARY_KEY!];
    const queryResponse = await dbClient.query({
        TableName: TABLE_NAME!,
        KeyConditionExpression: '#zz = :zzz',         //can be anything
        ExpressionAttributeNames: {
            '#zz': PRIMARY_KEY!
        },
        ExpressionAttributeValues: {
            ':zzz': keyValue
        }
    }).promise();
    return JSON.stringify(queryResponse.Items);
}
async function queryWithSecondaryPartition(queryParams: APIGatewayProxyEventQueryStringParameters) {
    const queryKey = Object.keys(queryParams)[0];
    const queryValue = queryParams[queryKey!];
    const queryResponse = await dbClient.query({
        TableName: TABLE_NAME!,
        IndexName: queryKey,
        KeyConditionExpression: '#zz = :zzz',         //can be anything
        ExpressionAttributeNames: {
            '#zz': queryKey
        },
        ExpressionAttributeValues: {
            ':zzz': queryValue
        }
    }).promise();
    return JSON.stringify(queryResponse.Items);
}
export { handler }
