import { useState, useMemo } from 'react'
import {
  Box, Typography, Card, CardContent, Stack, Tabs, Tab,
  Table, TableContainer, TableHead, TableBody, TableRow, TableCell, Paper, Chip, Avatar,
} from '@mui/material'
import BarChartIcon from '@mui/icons-material/BarChart'
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'
import SportsScoreIcon from '@mui/icons-material/SportsScore'
import PersonIcon from '@mui/icons-material/Person'
import GroupsIcon from '@mui/icons-material/Groups'
import { useMatchesByTournament } from '../../hooks/useMatches'
import { useSport } from '../../hooks/useSportsConfig'
import { computeTournamentStats } from '../../utils/stats'
import CompetitorPhoto from '../shared/CompetitorPhoto'

const TOP_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32']

function TournamentStats({ tournament }) {
  const [tabIndex, setTabIndex] = useState(0)
  const [subTab, setSubTab] = useState(0) // 0: Jugadores, 1: Equipos

  // Obtener partidos locales desde Dexie
  const allMatches = useMatchesByTournament(tournament?._id)

  // Obtener configuración del deporte
  const sportConfigId = typeof tournament?.sportConfigId === 'string'
    ? tournament.sportConfigId
    : tournament?.sportConfigId?._id
  const sport = useSport(sportConfigId)

  // Calcular las estadísticas de forma reactiva
  const stats = useMemo(() => {
    return computeTournamentStats(tournament, allMatches, sport)
  }, [tournament, allMatches, sport])

  if (!tournament) return null

  const {
    scorers, discipline,
    playerScorers, playerDiscipline,
    summary, scoringUnitLabel, hasDiscipline,
  } = stats

  const isTeamSport = sport?.sportProps?.participantType === 'TEAM'

  // Estado cuando no hay partidos finalizados aún
  if (summary.completedMatches === 0) {
    return (
      <Box sx={{ mt: 4 }}>
        <Card sx={{ bgcolor: '#1a1a1a', border: '1px solid', borderColor: 'divider' }}>
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <BarChartIcon sx={{ fontSize: 64, color: 'grey.600', mb: 2 }} />
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 1, color: 'grey.400' }}>
              Estadísticas del Torneo
            </Typography>
            <Typography variant="body1" sx={{ color: 'grey.500', maxWidth: 520, mx: 'auto' }}>
              Aún no hay partidos finalizados en este torneo. A medida que el organizador cargue las planillas de los partidos, las tablas de anotaciones y disciplina se actualizarán automáticamente aquí.
            </Typography>
          </CardContent>
        </Card>
      </Box>
    )
  }

  return (
    <Box sx={{ mt: 4 }}>
      {/* 1. KPIs y Tarjetas de Resumen */}
      <Stack direction="row" spacing={2} sx={{ mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Card sx={{ flex: 1, minWidth: 200, bgcolor: '#1a1a1a', border: '1px solid', borderColor: 'divider' }}>
          <CardContent>
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <SportsScoreIcon sx={{ color: '#00e676', fontSize: 32 }} />
              <Box>
                <Typography variant="caption" sx={{ color: 'grey.500', textTransform: 'uppercase', fontWeight: 600 }}>
                  Total {scoringUnitLabel}
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#fff' }}>
                  {summary.totalScores}
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        <Card sx={{ flex: 1, minWidth: 200, bgcolor: '#1a1a1a', border: '1px solid', borderColor: 'divider' }}>
          <CardContent>
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <BarChartIcon sx={{ color: '#42a5f5', fontSize: 32 }} />
              <Box>
                <Typography variant="caption" sx={{ color: 'grey.500', textTransform: 'uppercase', fontWeight: 600 }}>
                  Promedio por Partido
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#fff' }}>
                  {summary.averageScoresPerMatch}
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        <Card sx={{ flex: 1, minWidth: 200, bgcolor: '#1a1a1a', border: '1px solid', borderColor: 'divider' }}>
          <CardContent>
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <EmojiEventsIcon sx={{ color: '#ffd54f', fontSize: 32 }} />
              <Box>
                <Typography variant="caption" sx={{ color: 'grey.500', textTransform: 'uppercase', fontWeight: 600 }}>
                  Partidos Disputados
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#fff' }}>
                  {summary.completedMatches}
                  <Typography component="span" variant="body2" sx={{ color: 'grey.500', ml: 0.5 }}>
                    / {summary.totalMatches}
                  </Typography>
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Stack>

      {/* 2. Selector de Pestañas Principales */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tabIndex} onChange={(_, i) => setTabIndex(i)}>
          <Tab label={`Anotaciones (${scoringUnitLabel})`} />
          {hasDiscipline && <Tab label="Disciplina y Sanciones" />}
        </Tabs>
      </Box>

      {/* Selector SubTab: Jugadores vs Equipos en deportes colectivos */}
      {isTeamSport && (
        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
          <Chip
            icon={<PersonIcon fontSize="small" />}
            label="Por Jugadores"
            color={subTab === 0 ? 'primary' : 'default'}
            variant={subTab === 0 ? 'filled' : 'outlined'}
            onClick={() => setSubTab(0)}
            clickable
          />
          <Chip
            icon={<GroupsIcon fontSize="small" />}
            label="Por Equipos"
            color={subTab === 1 ? 'primary' : 'default'}
            variant={subTab === 1 ? 'filled' : 'outlined'}
            onClick={() => setSubTab(1)}
            clickable
          />
        </Stack>
      )}

      {/* 3. Pestaña de Anotaciones / Goleadores */}
      {tabIndex === 0 && (
        <TableContainer
          component={Paper}
          sx={{
            bgcolor: '#1a1a1a',
            border: '1px solid',
            borderColor: 'divider',
            '& .MuiTableCell-root': { borderBottomColor: 'divider' },
          }}
        >
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: 50, color: 'grey.400', fontWeight: 600 }}>#</TableCell>
                <TableCell sx={{ color: 'grey.400', fontWeight: 600 }}>
                  {isTeamSport && subTab === 0 ? 'Jugador' : 'Participante / Equipo'}
                </TableCell>
                {isTeamSport && subTab === 0 && (
                  <TableCell sx={{ color: 'grey.400', fontWeight: 600 }}>Equipo</TableCell>
                )}
                {(!isTeamSport || subTab === 1) && (
                  <TableCell align="center" sx={{ color: 'grey.400', fontWeight: 600, width: 60 }}>PJ</TableCell>
                )}
                <TableCell align="center" sx={{ color: '#00e676', fontWeight: 700, width: 110, fontSize: '0.9rem' }}>
                  Total {scoringUnitLabel}
                </TableCell>
                {(!isTeamSport || subTab === 1) && (
                  <TableCell align="center" sx={{ color: 'grey.400', fontWeight: 600, width: 90 }}>
                    Promedio
                  </TableCell>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {isTeamSport && subTab === 0 ? (
                // Vista de Jugadores Goleadores
                playerScorers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 4, color: 'grey.500' }}>
                      No se han registrado anotaciones con jugadores identificados aún. (Pueden figurar en la vista &quot;Por Equipos&quot;).
                    </TableCell>
                  </TableRow>
                ) : (
                  playerScorers.map((row, i) => (
                    <TableRow
                      key={row.playerId}
                      sx={{
                        '&:hover': { bgcolor: '#242424' },
                        '& .MuiTableCell-root': { borderBottomColor: i === playerScorers.length - 1 ? 'transparent' : 'divider' },
                      }}
                    >
                      <TableCell sx={{ color: i < 3 ? TOP_COLORS[i] : 'grey.500', fontWeight: 700 }}>
                        {i + 1}
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={1.5}>
                          <Avatar src={row.photoURL} sx={{ width: 28, height: 28, fontSize: '0.8rem' }}>
                            <PersonIcon fontSize="small" />
                          </Avatar>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {row.displayName}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <CompetitorPhoto logoURL={row.teamLogoURL} displayName={row.teamName} size={20} />
                          <Typography variant="body2" sx={{ color: 'grey.400' }}>
                            {row.teamName}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell align="center" sx={{ color: '#00e676', fontWeight: 700, fontSize: '0.95rem' }}>
                        {row.totalScore}
                      </TableCell>
                    </TableRow>
                  ))
                )
              ) : (
                // Vista de Equipos Goleadores
                scorers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'grey.500' }}>
                      No se han registrado anotaciones todavía.
                    </TableCell>
                  </TableRow>
                ) : (
                  scorers.map((row, i) => (
                    <TableRow
                      key={row.participantId}
                      sx={{
                        '&:hover': { bgcolor: '#242424' },
                        '& .MuiTableCell-root': { borderBottomColor: i === scorers.length - 1 ? 'transparent' : 'divider' },
                      }}
                    >
                      <TableCell sx={{ color: i < 3 ? TOP_COLORS[i] : 'grey.500', fontWeight: 700 }}>
                        {i + 1}
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={1.5}>
                          <CompetitorPhoto logoURL={row.logoURL} displayName={row.displayName} size={28} />
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {row.displayName}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell align="center" sx={{ color: 'grey.400' }}>
                        {row.matchesPlayed}
                      </TableCell>
                      <TableCell align="center" sx={{ color: '#00e676', fontWeight: 700, fontSize: '0.95rem' }}>
                        {row.totalScore}
                      </TableCell>
                      <TableCell align="center" sx={{ color: 'grey.400' }}>
                        {row.averageScore}
                      </TableCell>
                    </TableRow>
                  ))
                )
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* 4. Pestaña de Disciplina / Sanciones */}
      {tabIndex === 1 && hasDiscipline && (
        <TableContainer
          component={Paper}
          sx={{
            bgcolor: '#1a1a1a',
            border: '1px solid',
            borderColor: 'divider',
            '& .MuiTableCell-root': { borderBottomColor: 'divider' },
          }}
        >
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: 50, color: 'grey.400', fontWeight: 600 }}>#</TableCell>
                <TableCell sx={{ color: 'grey.400', fontWeight: 600 }}>
                  {isTeamSport && subTab === 0 ? 'Jugador' : 'Participante / Equipo'}
                </TableCell>
                {isTeamSport && subTab === 0 && (
                  <TableCell sx={{ color: 'grey.400', fontWeight: 600 }}>Equipo</TableCell>
                )}
                <TableCell align="center" sx={{ color: '#ffd54f', fontWeight: 600, width: 80 }}>
                  Amarillas
                </TableCell>
                <TableCell align="center" sx={{ color: '#f44336', fontWeight: 600, width: 80 }}>
                  Rojas
                </TableCell>
                <TableCell align="center" sx={{ color: 'grey.400', fontWeight: 600, width: 80 }}>
                  Faltas
                </TableCell>
                <TableCell align="center" sx={{ color: '#fff', fontWeight: 700, width: 90 }}>
                  Total
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isTeamSport && subTab === 0 ? (
                // Vista de Jugadores Sancionados
                playerDiscipline.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4, color: 'grey.500' }}>
                      No se han registrado sanciones con jugadores identificados todavía.
                    </TableCell>
                  </TableRow>
                ) : (
                  playerDiscipline.map((row, i) => (
                    <TableRow
                      key={row.playerId}
                      sx={{
                        '&:hover': { bgcolor: '#242424' },
                        '& .MuiTableCell-root': { borderBottomColor: i === playerDiscipline.length - 1 ? 'transparent' : 'divider' },
                      }}
                    >
                      <TableCell sx={{ color: 'grey.500', fontWeight: 700 }}>
                        {i + 1}
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={1.5}>
                          <Avatar src={row.photoURL} sx={{ width: 28, height: 28, fontSize: '0.8rem' }}>
                            <PersonIcon fontSize="small" />
                          </Avatar>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {row.displayName}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <CompetitorPhoto logoURL={row.teamLogoURL} displayName={row.teamName} size={20} />
                          <Typography variant="body2" sx={{ color: 'grey.400' }}>
                            {row.teamName}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={row.yellowCards}
                          size="small"
                          sx={{ bgcolor: '#ffd54f22', color: '#ffd54f', fontWeight: 700, minWidth: 32 }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={row.redCards}
                          size="small"
                          sx={{ bgcolor: '#f4433622', color: '#f44336', fontWeight: 700, minWidth: 32 }}
                        />
                      </TableCell>
                      <TableCell align="center" sx={{ color: 'grey.400' }}>
                        {row.fouls}
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700, color: '#fff' }}>
                        {row.totalSanctions}
                      </TableCell>
                    </TableRow>
                  ))
                )
              ) : (
                // Vista de Equipos Sancionados
                discipline.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'grey.500' }}>
                      No se han registrado sanciones ni tarjetas.
                    </TableCell>
                  </TableRow>
                ) : (
                  discipline.map((row, i) => (
                    <TableRow
                      key={row.participantId}
                      sx={{
                        '&:hover': { bgcolor: '#242424' },
                        '& .MuiTableCell-root': { borderBottomColor: i === discipline.length - 1 ? 'transparent' : 'divider' },
                      }}
                    >
                      <TableCell sx={{ color: 'grey.500', fontWeight: 700 }}>
                        {i + 1}
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={1.5}>
                          <CompetitorPhoto logoURL={row.logoURL} displayName={row.displayName} size={28} />
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {row.displayName}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={row.yellowCards}
                          size="small"
                          sx={{ bgcolor: '#ffd54f22', color: '#ffd54f', fontWeight: 700, minWidth: 32 }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={row.redCards}
                          size="small"
                          sx={{ bgcolor: '#f4433622', color: '#f44336', fontWeight: 700, minWidth: 32 }}
                        />
                      </TableCell>
                      <TableCell align="center" sx={{ color: 'grey.400' }}>
                        {row.fouls}
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700, color: '#fff' }}>
                        {row.totalSanctions}
                      </TableCell>
                    </TableRow>
                  ))
                )
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  )
}

export default TournamentStats