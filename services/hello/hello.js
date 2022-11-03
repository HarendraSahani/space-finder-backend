 /** exports.main = async function(event,context){
    return {
        statusCode : 200,
        body : 'Hello from Lambda!!'
    }
 }  */

import { DynamoDB, config } from 'aws-sdk';
const dynamodbClient = new DynamoDB.DocumentClient();

export async function handler(event, context, callback) {

    config.update({
        region:  "us-west-1",
    });

    let putRequest = {
        TableName: 'SpaceTable',
        Item: {
            "spaceId": new Date().toString()
        }
    };

    await dynamodbClient.put(putRequest).promise()
    .then((data) => {
        console.info('successfully update to dynamodb', data)
    })
    .catch((err) => {
        console.info('failed adding data dynamodb', err)
    });

}