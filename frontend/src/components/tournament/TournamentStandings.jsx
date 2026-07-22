import { Box, Typography, Card, CardContent } from '@mui/material'
import TableChartIcon from '@mui/icons-material/TableChart'

function TournamentStandings({ tournament }) {
  if (!tournament) return null

  return (
    <Box sx={{ mt: 4 }}>
      <Card sx={{ bgcolor: '#1a1a1a', border: '1px solid', borderColor: 'divider' }}>
        <CardContent sx={{ textAlign: 'center', py: 8 }}>
          <TableChartIcon sx={{ fontSize: 64, color: 'grey.600', mb: 2 }} />
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 1, color: 'grey.400' }}>
            Clasificación
          </Typography>
          <Typography variant="body1" sx={{ color: 'grey.500', maxWidth: 500, mx: 'auto' }}>
            Componente polimórfico que se adaptará según el formato del torneo:
          </Typography>
          <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'center' }}>
            <Typography variant="body2" sx={{ color: 'grey.500' }}>
              • <strong style={{ color: '#00e676' }}>ROUND_ROBIN</strong> — Tabla de posiciones (PJ, PG, PE, PP, GF, GC, DG, Pts)
            </Typography>
            <Typography variant="body2" sx={{ color: 'grey.500' }}>
              • <strong style={{ color: '#00e676' }}>PLAYOFF_BRACKET</strong> — Árbol de eliminación con llaves
            </Typography>
            <Typography variant="body2" sx={{ color: 'grey.500' }}>
              • <strong style={{ color: '#00e676' }}>GROUP_STAGE</strong> — Tablas por grupo
            </Typography>
          </Box>
          <Typography variant="caption" sx={{ color: 'grey.600', mt: 3, display: 'block' }}>
            Se implementará a futuro. Los criterios de desempate y puntaje se obtendrán de <code>tournament.rules</code> y <code>sportConfig</code>.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  )
}

export default TournamentStandings
