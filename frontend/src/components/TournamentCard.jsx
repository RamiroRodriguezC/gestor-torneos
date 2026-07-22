import { useNavigate } from 'react-router-dom'
import { Card, CardContent, Typography, Box, Chip, Stack } from '@mui/material'
import { useSport } from '../hooks/useSportsConfig'

const STATUS_COLORS = {
  PUBLICADO: '#00e676',
  BORRADOR: 'grey.500',
  FINALIZADO: '#42a5f5',
  CANCELADO: '#ef5350',
}

function TournamentCard({ tournament }) {
  const navigate = useNavigate()
  const sport = useSport(tournament.sportConfigId)

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  return (
    <Card
      onClick={() => navigate(`/tournament/${tournament._id}`)}
      sx={{
        bgcolor: '#1a1a1a',
        border: '1px solid',
        borderColor: 'divider',
        cursor: 'pointer',
        '&:hover': { borderColor: '#00e676' },
      }}
    >
      <CardContent>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          alignItems={{ sm: 'center' }}
        >
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {tournament.title}
            </Typography>
            <Stack
              direction="row"
              spacing={2}
              alignItems="center"
              sx={{ mt: 0.5, flexWrap: 'wrap', gap: 0.5 }}
            >
              {sport && (
                <Typography variant="body2" color="grey.400">
                  ⚽ {sport.name}
                </Typography>
              )}
              {tournament.startDate && (
                <Typography variant="body2" color="grey.500">
                  📅 {formatDate(tournament.startDate)} — {formatDate(tournament.endDate)}
                </Typography>
              )}
              <Typography variant="body2" color="grey.400">
                👥 {tournament.participantes?.length ?? 0} equipos
              </Typography>
            </Stack>
          </Box>
          <Chip
            label={tournament.status}
            size="small"
            sx={{
              bgcolor: STATUS_COLORS[tournament.status] || 'grey.500',
              color: '#000',
              fontWeight: 600,
              alignSelf: { xs: 'flex-start', sm: 'center' },
            }}
          />
        </Stack>
      </CardContent>
    </Card>
  )
}

export default TournamentCard
