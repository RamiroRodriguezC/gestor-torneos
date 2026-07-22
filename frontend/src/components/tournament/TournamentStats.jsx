import { Box, Typography, Card, CardContent } from '@mui/material'
import BarChartIcon from '@mui/icons-material/BarChart'

function TournamentStats({ tournament }) {
  if (!tournament) return null

  return (
    <Box sx={{ mt: 4 }}>
      <Card sx={{ bgcolor: '#1a1a1a', border: '1px solid', borderColor: 'divider' }}>
        <CardContent sx={{ textAlign: 'center', py: 8 }}>
          <BarChartIcon sx={{ fontSize: 64, color: 'grey.600', mb: 2 }} />
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 1, color: 'grey.400' }}>
            Estadísticas
          </Typography>
          <Typography variant="body1" sx={{ color: 'grey.500', maxWidth: 500, mx: 'auto' }}>
            Componente polimórfico que se adaptará según los eventos válidos del deporte configurado en <code>sportConfig.validEvents</code>.
          </Typography>
          <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'center' }}>
            <Typography variant="body2" sx={{ color: 'grey.500' }}>
              • <strong style={{ color: '#00e676' }}>Fútbol</strong> — Goleadores, asistencias, tarjetas
            </Typography>
            <Typography variant="body2" sx={{ color: 'grey.500' }}>
              • <strong style={{ color: '#00e676' }}>Básquet</strong> — Puntos, rebotes, asistencias
            </Typography>
            <Typography variant="body2" sx={{ color: 'grey.500' }}>
              • <strong style={{ color: '#00e676' }}>Handball</strong> — Goles, exclusiones
            </Typography>
          </Box>
          <Typography variant="caption" sx={{ color: 'grey.600', mt: 3, display: 'block' }}>
            Se implementará a futuro. Los datos se obtendrán de <code>match.keyEvents</code> agregados por torneo.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  )
}

export default TournamentStats
