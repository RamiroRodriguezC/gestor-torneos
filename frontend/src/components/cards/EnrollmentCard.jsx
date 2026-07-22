import { Card, CardContent, Typography, Avatar, Box, Divider, Button, Stack } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { SportsTag } from './Tags'

function EnrollmentCard({ logo, title, subtitle, info, sport, variant = 'tournament', teamId }) {
  const navigate = useNavigate()

  return (
    <Card sx={{
      bgcolor: '#1a1a1a',
      border: '1px solid',
      borderColor: 'divider',
      '&:hover': { borderColor: '#00e676' },
    }}>
      <CardContent>
        <Stack direction="row" spacing={2}>
          <Avatar
            src={logo || undefined}
            variant="rounded"
            sx={{ width: 64, height: 64, bgcolor: '#333', fontSize: '1.5rem' }}
          >
            {title?.charAt(0)}
          </Avatar>
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }} noWrap>
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
            {info && (
              <Typography variant="body2" color="primary" sx={{ mt: 0.5, fontWeight: 500 }}>
                {info}
              </Typography>
            )}
            <Box sx={{ mt: 1 }}>
              <SportsTag sport={sport} />
            </Box>
          </Box>
        </Stack>
      </CardContent>
      {variant === 'team' && (
        <>
          <Divider />
          <Button
            fullWidth
            onClick={() => navigate(`/dashboard/teams/${teamId}`)}
            sx={{
              color: 'primary.main',
              textTransform: 'none',
              py: 1.5,
              fontWeight: 500,
              '&:hover': { bgcolor: 'rgba(0, 230, 118, 0.08)' },
            }}
          >
            Ver equipo →
          </Button>
        </>
      )}
    </Card>
  )
}

export default EnrollmentCard
