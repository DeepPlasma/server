function list(templates, season, division, team, team_player, series, req, res) {
  const season_id = req.params.season_id
  const division_id = req.params.division_id
  const team_id = req.params.team_id
  let wins = 0
  let losses = 0

  season.getSeason(season_id).then(season => {
    return division.getDivision(division_id).then(division => {
      return team.getTeam(team_id).then(team => {
        return team_player.getRoster(team.id).then(players => {
          return series.getSeries({ team_id: team.id }).then(series => {
            const captain = players.filter(player => {
              return player.is_captain
            })[0]
            players = players.filter(player => {
              return !captain || player.id != captain.id
            })
            series = series.map(_series => {
              _series.own = {}
              _series.opp = {}
              if (_series.home_team_id) {
                if (team_id == _series.home_team_id) {
                  wins += _series.home_points
                  losses += _series.away_points
                  _series.own.id = _series.home_team_id
                  _series.own.name = _series.home_team_name
                  _series.own.logo = _series.home_team_logo
                  _series.own.points = _series.home_points

                  _series.opp.id = _series.away_team_id
                  _series.opp.name = _series.away_team_name
                  _series.opp.logo = _series.away_team_logo
                  _series.opp.points = _series.away_points
                }
              }
              if (_series.away_team_id) {
                if (team_id == _series.away_team_id) {
                  wins += _series.away_points
                  losses += _series.home_points
                  _series.own.id = _series.away_team_id
                  _series.own.name = _series.away_team_name
                  _series.own.logo = _series.away_team_logo
                  _series.own.points = _series.away_points

                  _series.opp.id = _series.home_team_id
                  _series.opp.name = _series.home_team_name
                  _series.opp.logo = _series.home_team_logo
                  _series.opp.points = _series.home_points
                }
              }

              return _series
            })
            const html = templates.roster.list({
              user: req.user,
              season: season,
              division: division,
              team: team,
              captain: captain,
              players: players,
              wins: wins,
              losses: losses,
              series: series,
              csrfToken: req.csrfToken()
            })

            res.send(html)
          })
        })
      })
    })
  }).catch(err => {
    console.error(err)
    res.sendStatus(500)
  })
}

function add(templates, season, division, team, team_player, req, res) {
  if (!req.user || !req.user.isAdmin) {
    res.sendStatus(403)
    return
  }

  const season_id = req.params.season_id
  const division_id = req.params.division_id
  const team_id = req.params.team_id

  season.getSeason(season_id).then(season => {
    return division.getDivision(division_id).then(division => {
      return team.getTeam(team_id).then(team => {
        return team_player.getUnassignedPlayers(season.id, division.id).then(players => {
          const html = templates.roster.edit({
            verb: 'Add',
            user: req.user,
            season: season,
            division: division,
            team: team,
            players: players,
            csrfToken: req.csrfToken()
          })

          res.send(html)
        })
      })
    })
  }).catch(err => {
    console.error(err)
    res.sendStatus(500)
  })
}

function post(team_player, req, res) {
  if (!req.user || !req.user.isAdmin) {
    res.sendStatus(403)
    return
  }

  const season_id = req.body.season_id
  const division_id = req.body.division_id
  const team_id = req.body.team_id
  const p = req.body
  if (p.is_captain === 'on') {
    p.is_captain = true
  } else {
    p.is_captain = false
  }

  team_player.addPlayerToTeam(team_id, p.player_id, p.is_captain).then(() => {
    res.redirect(
      '/seasons/' + season_id + '/divisions/' + division_id + '/teams/' + team_id)
  }).catch(err => {
    console.error(err)
    res.sendStatus(500)
  })
}

function remove(team_player, req, res) {
  if (!req.user || !req.user.isAdmin) {
    res.sendStatus(403)
    return
  }

  const season_id = req.body.season_id
  const division_id = req.body.division_id
  const team_id = req.body.team_id
  const player_id = req.body.id

  team_player.removePlayerFromTeam(team_id, player_id).then(() => {
    res.redirect(
      '/seasons/' + season_id + '/divisions/' + division_id + '/teams/' + team_id)
  }).catch(err => {
    console.error(err)
    res.sendStatus(500)
  })
}

module.exports = (templates, season, division, team, team_player, series) => {
  return {
    list: {
      route: '/seasons/:season_id/divisions/:division_id/teams/:team_id',
      handler: list.bind(null, templates, season, division, team, team_player, series)
    },
    add: {
      route: '/seasons/:season_id/divisions/:division_id/teams/:team_id/add',
      handler: add.bind(null, templates, season, division, team, team_player)
    },
    post: {
      route: '/roster/edit',
      handler: post.bind(null, team_player)
    },
    remove: {
      route: '/roster/delete',
      handler: remove.bind(null, team_player)
    }
  }
}
