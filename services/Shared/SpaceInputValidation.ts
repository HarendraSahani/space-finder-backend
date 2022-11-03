import {Spaces as spaces} from '../Model/Spaces'
export class MissingRequiredSpaceInfoError extends Error {}

export function validateSpace ( input : any){
    if( !(input as spaces).spaceId){
        throw new MissingRequiredSpaceInfoError('Required Space Id Is Missing!');
    }
    if( !(input as spaces).name){
        throw new MissingRequiredSpaceInfoError('Required Name Is Missing!');
    }
    if( !(input as spaces).location){
        throw new MissingRequiredSpaceInfoError('Required Location Is Missing!');
    }
}
