import { Avatar, Card, CardContent, Typography, Box, Chip, Stack } from '@mui/material'
import GroupsIcon from '@mui/icons-material/Groups'
import { useSport } from '../hooks/useSportsConfig'

function TeamCard({ team, userId }) {
  const sport = useSport(team.discipline)
  const isCaptain = team.capitanId === userId
  const memberCount = team.members?.length ?? 0

  return (
    <Card
      sx={{
        bgcolor: '#1a1a1a',
        border: '1px solid',
        borderColor: 'divider',
        '&:hover': { borderColor: '#00e676' },
      }}
    >
      <CardContent>
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar
            src={team.logoURL || undefined}
            sx={{ width: 56, height: 56, bgcolor: '#333', fontSize: '1.5rem' }}
          >
            {team.name?.charAt(0).toUpperCase()}
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {team.name}
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
              <GroupsIcon sx={{ fontSize: 16, color: 'grey.500' }} />
              <Typography variant="body2" color="grey.400">
                {memberCount} miembros
              </Typography>
              {sport && (
                <Typography variant="body2" color="grey.500">
                  • {sport.name}
                </Typography>
              )}
            </Stack>
          </Box>
          {isCaptain && (
            <Chip
              label="Capitán"
              size="small"
              sx={{ bgcolor: '#00e676', color: '#000', fontWeight: 600 }}
            />
          )}
        </Stack>
      </CardContent>
    </Card>
  )
}

export default TeamCard
