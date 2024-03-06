export class RequiredEnvVarMissingError extends Error {
    constructor(envVar) {
      super(`Missing required env var: ${envVar}`);
    }
  }