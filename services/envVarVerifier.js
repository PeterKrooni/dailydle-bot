import { config } from 'dotenv'
import { RequiredEnvVarMissingError } from '../errors/RequiredEnvVarMissingError.js'
import { requiredEnvVars } from '../config/requiredEnvVarConfig.js'

config()

export function verifyRequiredEnvVarsAreSet(){
    requiredEnvVars.forEach((envVar) => {
        if (!(envVar in process.env)) {
            throw new RequiredEnvVarMissingError(envVar)        
        }
    })
}