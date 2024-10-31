import { config } from 'dotenv';

export const REQUIRED_ENV_VARS: string[] = [
  'DISCORD_BOT_TOKEN',
  'DISCORD_ENABLED_CHANNEL_IDS',
  'DATABASE_URI',
  'DISCORD_APPLICATION_ID'
];

export const OPTIONAL_ENV_VARS: string[] = ['BOT_ADMIN_DISCORD_USER_ID'];

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

    const missing_optional_args = OPTIONAL_ENV_VARS.filter(v => !(v in process.env))
    if (missing_optional_args.length > 0) {
      console.warn(`Missing optional environment variable(s) ${missing_optional_args.join(', ')}. Bot might have unexpected behaviour or missing features.`)
    }

    const missing_required_args = REQUIRED_ENV_VARS.filter(v => !(v in process.env))
    if (missing_required_args.length > 0) {
      throw new Error(`Missing required environment variables: ${missing_required_args.join(', ')}`,);
    }

    // Validate `DISCORD_ENABLED_CHANNEL_IDS` format
    if (process.env.DISCORD_ENABLED_CHANNEL_IDS!.match(/(\d+),?/g) === null) {
      throw new Error('Invalid DISCORD_ENABLED_CHANNEL_IDS format');
    }
  },
};

export default Config;
