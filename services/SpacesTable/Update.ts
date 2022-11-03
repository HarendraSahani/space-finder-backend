import { DynamoDB } from 'aws-sdk'
import { APIGatewayProxyEvent, Context, APIGatewayProxyResult } from 'aws-lambda'

const TABLE_NAME = process.env.TABLE_NAME;
const PRIMARY_KEY = process.env.PRIMARY_KEY as string;
//create a dynamoDB client
const dbClient = new DynamoDB.DocumentClient();

//create a handler to get the event details from apigwproxy and return the proxy result

async function handler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {

    const result: APIGatewayProxyResult = {
        statusCode: 200,
        body: 'Hello from DynamoDB Lambda'
    }

    try {
        let updateBody = typeof event.body == 'object' ? event.body : JSON.parse(event.body);
        const updateKey = event?.queryStringParameters?.[PRIMARY_KEY];
        if (updateBody && updateKey) {
            const requestBodyKey = Object.keys(updateBody)[0];
            const requestBodyValue = updateBody[requestBodyKey];
            const updatedResult = await dbClient.update({
                TableName: TABLE_NAME!,
                Key: { [PRIMARY_KEY]: updateKey },
                UpdateExpression: 'set #aa = :eve',
                ExpressionAttributeValues: {
                    ':eve': requestBodyValue
                },
                ExpressionAttributeNames: {
                    '#aa': requestBodyKey
                },
                ReturnValues: 'UPDATED_NEW'
            }).promise();
            result.body = JSON.stringify(updatedResult)
        }

    } catch (error) {
        result.statusCode = 500;
        result.body = error.message;
    }
    return result;
}
export { handler }
