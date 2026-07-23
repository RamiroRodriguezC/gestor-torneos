import { Box, Table, TableContainer, TableHead, TableBody, TableRow, TableCell, Typography, Paper } from '@mui/material'
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'
import CompetitorPhoto from '../../shared/CompetitorPhoto'
import { computeStandings } from '../../../utils/standings'

const TOP_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32']

function StandingsTable({ tournament, matches, myTeamId }) {
  const standings = computeStandings(tournament, matches)

  if (standings.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <EmojiEventsIcon sx={{ fontSize: 64, color: 'grey.600', mb: 2 }} />
        <Typography variant="h6" sx={{ color: 'grey.500' }}>
          No hay partidos finalizados para mostrar clasificación
        </Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ mt: 4 }}>
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
              <TableCell sx={{ width: 40, color: 'grey.400', fontWeight: 600 }}>#</TableCell>
              <TableCell sx={{ color: 'grey.400', fontWeight: 600 }}>Equipo</TableCell>
              <TableCell align="center" sx={{ color: 'grey.400', fontWeight: 600, width: 40 }}>PJ</TableCell>
              <TableCell align="center" sx={{ color: 'grey.400', fontWeight: 600, width: 40 }}>PG</TableCell>
              <TableCell align="center" sx={{ color: 'grey.400', fontWeight: 600, width: 40 }}>PE</TableCell>
              <TableCell align="center" sx={{ color: 'grey.400', fontWeight: 600, width: 40 }}>PP</TableCell>
              <TableCell align="center" sx={{ color: 'grey.400', fontWeight: 600, width: 45 }}>GF</TableCell>
              <TableCell align="center" sx={{ color: 'grey.400', fontWeight: 600, width: 45 }}>GC</TableCell>
              <TableCell align="center" sx={{ color: 'grey.400', fontWeight: 600, width: 50 }}>DG</TableCell>
              <TableCell align="center" sx={{ color: '#00e676', fontWeight: 700, width: 50, fontSize: '0.9rem' }}>Pts</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {standings.map((row, i) => {
              const isMyTeam = String(row.teamId) === String(myTeamId)
              return (
                <TableRow
                  key={row.teamId}
                  sx={{
                    bgcolor: isMyTeam ? '#1a2a1a' : 'transparent',
                    '&:hover': { bgcolor: isMyTeam ? '#1a2a1a' : '#242424' },
                    '& .MuiTableCell-root': { borderBottomColor: i === standings.length - 1 ? 'transparent' : 'divider' },
                  }}
                >
                  <TableCell sx={{ color: i < 3 ? TOP_COLORS[i] : 'grey.500', fontWeight: 600 }}>
                    {i + 1}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <CompetitorPhoto logoURL={row.logoURL} displayName={row.displayName} />
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: isMyTeam ? 700 : 400,
                          color: isMyTeam ? '#00e676' : 'text.primary',
                        }}
                      >
                        {row.displayName}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="center">{row.pj}</TableCell>
                  <TableCell align="center" sx={{ color: '#00e676' }}>{row.pg}</TableCell>
                  <TableCell align="center" sx={{ color: '#ffc107' }}>{row.pe}</TableCell>
                  <TableCell align="center" sx={{ color: '#ef5350' }}>{row.pp}</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>{row.gf}</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>{row.gc}</TableCell>
                  <TableCell
                    align="center"
                    sx={{
                      fontWeight: 700,
                      color: row.dg > 0 ? '#00e676' : row.dg < 0 ? '#ef5350' : 'grey.400',
                    }}
                  >
                    {row.dg > 0 ? `+${row.dg}` : row.dg}
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, fontSize: '1rem', color: '#00e676' }}>
                    {row.pts}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}

export default StandingsTable
