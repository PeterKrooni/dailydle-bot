import { config } from 'dotenv'
import { RequiredEnvVarMissingError } from '../errors/RequiredEnvVarMissingError.js'
import { requiredEnvVars, optionalEnvVars } from '../config/envVarConstants.js'

config()

export function verifyEnvVars() {
    verifyRequiredEnvVarsAreSet()
    verifyOptionalEnvVars()
}

function verifyRequiredEnvVarsAreSet(){
    requiredEnvVars.forEach((envVar) => {
        if (!(envVar in process.env)) {
            throw new RequiredEnvVarMissingError(envVar)        
        }
    })
}

function verifyOptionalEnvVars() {
    return optionalEnvVars.forEach(envVar => {
        if (!(envVar in process.env)) {
            console.warn(`Missing optional environment variable ${envVar}`)
        }
    })
}