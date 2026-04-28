import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  foreignKey,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(),
  email: text("email").unique(),
  username: text("username").notNull().unique(),
  fullName: text("full_name"),
  displayName: text("display_name").notNull(),
  phoneNumber: text("phone_number"),
  avatarUrl: text("avatar_url"),
  appRole: text("app_role").default("user").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const appMetadata = pgTable("app_metadata", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const leagues = pgTable("leagues", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  createdBy: uuid("created_by").references(() => profiles.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const leagueMembers = pgTable(
  "league_members",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    leagueId: uuid("league_id")
      .notNull()
      .references(() => leagues.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    role: text("role").default("member").notNull(),
    usesTwoPredictionRows: boolean("uses_two_prediction_rows")
      .default(false)
      .notNull(),
    joinedAt: timestamp("joined_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("league_members_league_user_unique").on(
      table.leagueId,
      table.userId,
    ),
    index("league_members_user_id_idx").on(table.userId),
  ],
);

export const teams = pgTable(
  "teams",
  {
    code: text("code").primaryKey(),
    fifaTeamId: text("fifa_team_id").unique(),
    footballDataTeamId: integer("football_data_team_id").unique(),
    name: text("name").notNull(),
    shortName: text("short_name"),
    countryCode: text("country_code"),
    confederation: text("confederation"),
    flagUrl: text("flag_url"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("teams_fifa_team_id_idx").on(table.fifaTeamId),
    index("teams_football_data_team_id_idx").on(table.footballDataTeamId),
  ],
);

export const stadiums = pgTable(
  "stadiums",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    fifaStadiumId: text("fifa_stadium_id").unique(),
    name: text("name").notNull(),
    city: text("city"),
    countryCode: text("country_code"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("stadiums_fifa_stadium_id_idx").on(table.fifaStadiumId),
  ],
);

export const matches = pgTable(
  "matches",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    gameId: integer("game_id").unique(),
    fifaMatchId: text("fifa_match_id").unique(),
    fifaMatchNumber: integer("fifa_match_number").unique(),
    footballDataMatchId: integer("football_data_match_id").unique(),
    stage: text("stage").notNull(),
    groupName: text("group_name"),
    stadiumId: uuid("stadium_id").references(() => stadiums.id, {
      onDelete: "set null",
    }),
    venue: text("venue"),
    homeTeamCode: text("home_team_code"),
    awayTeamCode: text("away_team_code"),
    homePlaceholder: text("home_placeholder"),
    awayPlaceholder: text("away_placeholder"),
    scheduledKickoffAt: timestamp("scheduled_kickoff_at", {
      withTimezone: true,
    }),
    kickoffAt: timestamp("kickoff_at", { withTimezone: true }).notNull(),
    lockedAt: timestamp("locked_at", { withTimezone: true }).notNull(),
    status: text("status").default("upcoming").notNull(),
    providerStatus: text("provider_status").default("scheduled").notNull(),
    liveMinute: integer("live_minute"),
    homeScore: integer("home_score"),
    awayScore: integer("away_score"),
    homePenaltyScore: integer("home_penalty_score"),
    awayPenaltyScore: integer("away_penalty_score"),
    resultType: text("result_type"),
    adminNote: text("admin_note"),
    lastProviderSyncAt: timestamp("last_provider_sync_at", {
      withTimezone: true,
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("matches_game_id_idx").on(table.gameId),
    index("matches_kickoff_at_idx").on(table.kickoffAt),
    index("matches_status_idx").on(table.status),
    index("matches_stadium_id_idx").on(table.stadiumId),
  ],
);

export const matchProviderMappings = pgTable(
  "match_provider_mappings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    matchId: uuid("match_id")
      .notNull()
      .references(() => matches.id, { onDelete: "cascade" }),
    provider: text("provider").notNull(),
    providerMatchId: text("provider_match_id").notNull(),
    providerPayload: jsonb("provider_payload"),
    lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("match_provider_mappings_provider_match_unique").on(
      table.provider,
      table.providerMatchId,
    ),
    uniqueIndex("match_provider_mappings_match_provider_unique").on(
      table.matchId,
      table.provider,
    ),
  ],
);

export const providerSyncLog = pgTable(
  "provider_sync_log",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    provider: text("provider").notNull(),
    syncType: text("sync_type").notNull(),
    status: text("status").notNull(),
    message: text("message"),
    payload: jsonb("payload"),
    startedAt: timestamp("started_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
  },
  (table) => [
    index("provider_sync_log_provider_idx").on(table.provider),
    index("provider_sync_log_started_at_idx").on(table.startedAt),
  ],
);

export const adminAuditLog = pgTable(
  "admin_audit_log",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    actorUserId: uuid("actor_user_id").references(() => profiles.id, {
      onDelete: "set null",
    }),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id"),
    beforeData: jsonb("before_data"),
    afterData: jsonb("after_data"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("admin_audit_log_actor_user_id_idx").on(table.actorUserId),
    index("admin_audit_log_entity_idx").on(table.entityType, table.entityId),
  ],
);

export const predictions = pgTable(
  "predictions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    leagueId: uuid("league_id")
      .notNull()
      .references(() => leagues.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    matchId: uuid("match_id")
      .notNull()
      .references(() => matches.id, { onDelete: "cascade" }),
    predictionRow: integer("prediction_row").default(1).notNull(),
    homeScore: integer("home_score").notNull(),
    awayScore: integer("away_score").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("predictions_league_user_match_row_unique").on(
      table.leagueId,
      table.userId,
      table.matchId,
      table.predictionRow,
    ),
    index("predictions_match_id_idx").on(table.matchId),
    check(
      "predictions_prediction_row_check",
      sql`${table.predictionRow} in (1, 2)`,
    ),
    foreignKey({
      name: "predictions_league_user_membership_fk",
      columns: [table.leagueId, table.userId],
      foreignColumns: [leagueMembers.leagueId, leagueMembers.userId],
    }).onDelete("cascade"),
  ],
);

export const specialPredictions = pgTable(
  "special_predictions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    leagueId: uuid("league_id")
      .notNull()
      .references(() => leagues.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    predictionRow: integer("prediction_row").default(1).notNull(),
    championTeamCode: text("champion_team_code").references(() => teams.code, {
      onDelete: "restrict",
    }),
    totalGoals: integer("total_goals"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("special_predictions_league_user_row_unique").on(
      table.leagueId,
      table.userId,
      table.predictionRow,
    ),
    index("special_predictions_user_id_idx").on(table.userId),
    check(
      "special_predictions_prediction_row_check",
      sql`${table.predictionRow} in (1, 2)`,
    ),
    check(
      "special_predictions_total_goals_check",
      sql`${table.totalGoals} is null or ${table.totalGoals} between 0 and 999`,
    ),
    foreignKey({
      name: "special_predictions_league_user_membership_fk",
      columns: [table.leagueId, table.userId],
      foreignColumns: [leagueMembers.leagueId, leagueMembers.userId],
    }).onDelete("cascade"),
  ],
);
