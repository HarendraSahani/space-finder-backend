import {v4} from 'uuid';
import {S3} from 'aws-sdk';

const s3Client = new S3();
async function handler (event : any, context: any){
    const buckets = await s3Client.listBuckets().promise();
    console.log('Got an Event: ');
    console.log(event);
    return {
        statusCode : 200,
        body : 'Hello from lambda and here are your buckets:\n '+JSON.stringify(buckets.Buckets)
    }
}

export {handler}