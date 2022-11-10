import {Amplify,Auth} from 'aws-amplify';

import {config} from './config';
import { CognitoUser } from '@aws-amplify/auth';
import { stringify } from 'querystring';

Amplify.configure({
    Auth : {
        mandatorySignIn: false,
        region: config.REGION,
        userPoolId: config.USER_POOL_ID,
        userPoolWebClientId: config.APP_CLIENT_ID,
        authenticationFlowType: 'USER_PASSWORD_AUTH'

    }
})

export class AuthService {

    public async login (userName: string, password: string){
        const currentConfig = Auth.configure();
        console.log(JSON.stringify(currentConfig))
        const user = await Auth.signIn(userName, password) as CognitoUser;
        return user;

    }

}