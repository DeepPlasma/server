const sql = require('pg-sql').sql

function getDivisions(db, criteria) {
  let select = sql`
  SELECT
    division.id,
    division.name,
    division.active,
    division.discord_url,
    division.start_time,
    division.draft_sheet_url
  FROM
    division
  WHERE
    1 = 1
  `
  if (criteria) {
    if (criteria.active !== undefined) {
      select = sql.join([select, sql`
      AND
        division.active = ${criteria.active}
      `])
    }
  }
  select = sql.join([select, sql`
  ORDER BY
    name ASC
  `])
  return db.query(select).then(result => {
    return result.rows
  })
}

function getDivision(db, id) {
  const select = sql`
  SELECT
    division.id,
    division.name,
    division.active,
    division.discord_url,
    division.start_time,
    division.draft_sheet_url
  FROM
    division
  WHERE
    division.id = ${id}
  `
  return db.query(select).then(result => {
    return result.rows[0]
  })
}

function saveDivision(db, division) {
  const upsert = sql`
  INSERT INTO
    division(
      id,
      name,
      active,
      discord_url,
      start_time,
      draft_sheet_url
    ) VALUES (
      ${division.id},
      ${division.name},
      ${division.active},
      ${division.discord_url},
      ${division.start_time},
      ${division.draft_sheet_url}
    ) ON CONFLICT (
      id
    ) DO UPDATE SET (
      name,
      active,
      discord_url,
      start_time,
      draft_sheet_url
    ) = (
      ${division.name},
      ${division.active},
      ${division.discord_url},
      ${division.start_time},
      ${division.draft_sheet_url}
    )
  `
  return db.query(upsert)
}

function deleteDivision(db, id) {
  const query = sql`
  DELETE FROM
    division
  WHERE
    id = ${id}
  `
  return db.query(query)
}

module.exports = db => {
  return {
    getDivisions: getDivisions.bind(null, db),
    getDivision: getDivision.bind(null, db),
    saveDivision: saveDivision.bind(null, db),
    deleteDivision: deleteDivision.bind(null, db)
  }
}
