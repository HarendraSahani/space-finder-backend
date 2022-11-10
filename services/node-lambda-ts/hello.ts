
import { APIGatewayProxyEvent } from 'aws-lambda';
//import {S3} from 'aws-sdk';

//const s3Client = new S3();
async function handler (event : APIGatewayProxyEvent, context: any){
    //const buckets = await s3Client.listBuckets().promise();
    console.log('Got an Event: ');
    console.log(JSON.stringify(event));
    if(isAuthorized(event)){
        return {
            statusCode : 200,
            body : 'You are authorized'
        }
    }
    else{
        return {
            statusCode : 403,
            body : 'You are not authrorized'
        }
    }
    
}

function isAuthorized(event : APIGatewayProxyEvent){
    const groups = event.requestContext.authorizer?.claims['cognito:groups'];
    if(groups){
        return (groups as string).includes('admins');
    } else{
        return false;
    }
}
export {handler}