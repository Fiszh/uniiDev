import os from "os";
import path from "path";

import { Database } from "bun:sqlite";

const db_path = path.join(os.homedir(), "chatStatsData", "data.sqlite");
const db = new Database(db_path, { readonly: true, strict: true });

export const categories = [
  "message_count_online",
  "message_count_offline",
  "message_count_overall",
  "top_linkers",
  "top_emoters",
  "at_streamer",
];

export const channelQuery = db.query(`SELECT * FROM channelsIndex LIMIT ?`);

export const channelIdQ = db.query(
  `SELECT channel_id FROM channelsIndex WHERE username = ? COLLATE NOCASE`
);

function exprFor(col: string) {
  switch (col) {
    case "message_count_overall":
      return "(u.message_count_online + u.message_count_offline)";
    default:
      return `u.${col}`;
  }
}

export const topQ = Object.fromEntries(
  categories.map((col) => [
    col,
    db.query(`
      SELECT
        i.username,
        SUM(${exprFor(col)}) AS value
      FROM users u
      JOIN usersIndex i ON i.user_id = u.user_id
      WHERE u.channel_id = ? AND u.day BETWEEN ? AND ?
      GROUP BY u.user_id
      HAVING value > 0
      ORDER BY value DESC
      LIMIT ?
    `),
  ])
);

export const emoteQuery = db.query(`
    SELECT DISTINCT e.type 
    FROM emotes e
`);

export const topEmotesQ = db.query(`
    SELECT
      x.name,
      e.emote_id,
      CASE e.type
          WHEN '7TV' THEN 'https://cdn.7tv.app/emote/' || e.emote_id || '/2x.webp'
          WHEN 'BTTV' THEN 'https://cdn.betterttv.net/emote/' || e.emote_id || '/2x'
          WHEN 'FFZ' THEN 'https://cdn.frankerfacez.com/emote/' || e.emote_id || '/2'
          WHEN 'TTV' THEN 'https://static-cdn.jtvnw.net/emoticons/v2/' || e.emote_id || '/default/dark/2.0'
      END AS url,
      SUM(e.uses) AS uses
    FROM emotes e
    JOIN emotesIndex x
      ON x.channel_id = e.channel_id AND x.emote_id = e.emote_id AND x.type = e.type
    WHERE e.channel_id = ? AND e.type = ? AND e.day BETWEEN ? AND ?
    GROUP BY e.emote_id
    ORDER BY uses DESC
    LIMIT ?
`);

export const statsQuery = db.query(`
    SELECT
        x.username AS streamer_name,
        CAST(x.channel_id AS INTEGER) AS streamer_id,
        (SELECT SUM(new_chatters)
         FROM channels
         WHERE channel_id = $id AND day BETWEEN $from AND $to) AS new_chatters,
        c.unique_chatters,
        c.online_messages,
        c.offline_messages,
        c.overall_messages,
        c.avg_messages_per_chatter
    FROM channelsIndex x
    CROSS JOIN (
        SELECT
            COUNT(DISTINCT user_id) AS unique_chatters,
            SUM(message_count_online) AS online_messages,
            SUM(message_count_offline) AS offline_messages,
            SUM(message_count_online + message_count_offline) AS overall_messages,
            ROUND(
                CAST(SUM(message_count_online + message_count_offline) AS REAL)
                    / COUNT(DISTINCT user_id),
                1
            ) AS avg_messages_per_chatter
        FROM users
        WHERE channel_id = $id AND day BETWEEN $from AND $to
    ) c
    WHERE x.channel_id = $id
`);

export async function getMonths(channel: string): Promise<String[] | false> {
  const monthsQuery = db.query(`
    SELECT DISTINCT substr(c.day, 1, 7) AS month
    FROM channels c
    JOIN channelsIndex i ON i.channel_id = c.channel_id
    WHERE i.username = ? COLLATE NOCASE
      AND substr(c.day, 1, 7) < strftime('%Y-%m', 'now')
    ORDER BY month DESC
  `);

  const results = await Promise.resolve(monthsQuery);

  if (results) return monthsQuery.values(channel).flat() as string[];

  return false;
}
