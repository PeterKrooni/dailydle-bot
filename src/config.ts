import { config } from 'dotenv';

export const REQUIRED_ENV_VARS: string[] = [
  'DISCORD_BOT_TOKEN',
  'DISCORD_ENABLED_CHANNEL_IDS',
  'DATABASE_URI',
];

export const OPTIONAL_ENV_VARS: string[] = ['DISCORD_APPLICATION_ID'];

const Config = {
  get DISCORD_BOT_TOKEN() {
    return process.env.DISCORD_BOT_TOKEN!;
  },
  get DATABASE_URI() {
    return process.env.DATABASE_URI!;
  },
  get ENABLED_CHANNEL_IDS() {
    return process.env
      .DISCORD_ENABLED_CHANNEL_IDS!.split(',')
      .filter((s) => s !== '');
  },

  get DISCORD_APPLICATION_ID() {
    return process.env.DISCORD_APPLICATION_ID;
  },

  /**
   * Loads environment variables and checks if required variables are present.
   */
  load_config: () => {
    // Load config from dotenv
    config();

    // Check required vars
    REQUIRED_ENV_VARS.forEach((v) => {
      const missing_args = [];
      if (!(v in process.env)) {
        missing_args.push(v);
      }

      if (missing_args.length > 0) {
        throw new Error(
          `Missing required environment variables: ${missing_args.join(', ')}`,
        );
      }
    });

    // Validate `DISCORD_ENABLED_CHANNEL_IDS` format
    if (process.env.DISCORD_ENABLED_CHANNEL_IDS!.match(/(\d+),?/g) === null) {
      throw new Error('Invalid DISCORD_ENABLED_CHANNEL_IDS format');
    }
  },
};

export default Config;
