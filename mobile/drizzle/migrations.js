// This file is required for Expo/React Native SQLite migrations - https://orm.drizzle.team/quick-sqlite/expo

import journal from './meta/_journal.json';
import m0000 from './0000_dry_prism.sql';
import m0001 from './0001_eminent_slipstream.sql';
import m0002 from './0002_app_settings.sql';
import m0003 from './0003_app_settings_system.sql';
import m0004 from './0004_notifications_device_id.sql';
import m0005 from './0005_past_landau.sql';
import m0006 from './0006_sync_revision.sql';
import m0007 from './0007_app_icon_url_opt_in.sql';

  export default {
    journal,
    migrations: {
      m0000,
m0001,
m0002,
m0003,
m0004,
m0005,
m0006,
m0007
    }
  }
