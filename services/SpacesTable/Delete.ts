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
        const deleteKey = event?.queryStringParameters?.[PRIMARY_KEY];

        if (deleteKey) {
            const deletedResult = await dbClient.delete({
                TableName: TABLE_NAME!,
                Key: { [PRIMARY_KEY]: deleteKey },
                ReturnValues: 'ALL_OLD'
            }).promise();
            result.body = JSON.stringify(deletedResult)
        }
    } catch (error) {
        result.statusCode = 500;
        result.body = error.message;
    }


    return result;
}
export { handler }
