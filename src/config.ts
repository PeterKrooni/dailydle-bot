import { config } from 'dotenv';

export const REQUIRED_ENV_VARS: string[] = [
  'DICSORD_BOT_TOKEN',
  'DISCORD_OAUTH2_CLIENT_ID',
  'DISCORD_ENABLED_CHANNEL_IDS',
];

export const OPTIONAL_ENV_VARS: string[] = ['DISCORD_ADMIN_USER_ID'];

const Config = {
  get discord_bot_token() {
    return process.env.DISCORD_BOT_TOKEN!;
  },
  get discord_oauth2_client_id() {
    return process.env.DISCORD_OAUTH2_CLIENT_ID!;
  },
  get enabled_channel_ids() {
    return process.env.DISCORD_ENABLED_CHANNEL_IDS!.split(',');
  },
  get discord_admin_user_id() {
    return process.env.DISCORD_ADMIN_USER_ID;
  },

  load_config: () => {
    // Load config from dotenv
    config();

    // Check required vars
    REQUIRED_ENV_VARS.forEach((v) => {
      let missing_args = [];
      if (!(v in process.env)) {
        missing_args.push(v);
      }

      if (missing_args.length > 0) {
        throw new Error(
          `Missing required environment variables: ${missing_args.join(', ')}`
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
