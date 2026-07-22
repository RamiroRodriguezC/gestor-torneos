import { useParams, useNavigate } from 'react-router-dom'
import { Container, Typography, Box, Avatar, Stack, Card, CardContent, Chip, IconButton } from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium'
import Navbar from '../components/layout/Navbar'
import TournamentCard from '../components/tournament/TournamentCard'
import { SportsTag } from '../components/Tags'
import { useTeam } from '../hooks/useTeams'
import { useSport } from '../hooks/useSportsConfig'
import { useAuth } from '../hooks/useAuth'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../lib/db'

function Team() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const team = useTeam(id)
  const sport = useSport(team?.discipline)

  const memberIds = team?.members?.map(m => m.userId) ?? []
  const members = useLiveQuery(
    () => (memberIds.length ? db.users.where('_id').anyOf(memberIds).toArray() : []),
    [JSON.stringify(memberIds)],
    [],
  )

  const tournamentIds = team?.tournaments?.map(t => t.tournamentId) ?? []
  const tournaments = useLiveQuery(
    () => (tournamentIds.length ? db.tournaments.where('_id').anyOf(tournamentIds).toArray() : []),
    [JSON.stringify(tournamentIds)],
    [],
  )

  if (!user || !team) return null

  return (
    <>
      <Navbar />
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <IconButton onClick={() => navigate('/dashboard/teams')} sx={{ mb: 1 }}>
          <ArrowBackIcon />
        </IconButton>

        <Stack direction="row" spacing={3} alignItems="center" sx={{ mb: 3 }}>
          <Avatar
            src={team.logoURL || undefined}
            variant="rounded"
            sx={{ width: 100, height: 100, bgcolor: '#333', fontSize: '2.5rem' }}
          >
            {team.name?.charAt(0).toUpperCase()}
          </Avatar>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              {team.name}
            </Typography>
            <SportsTag sport={sport?.name ?? team.discipline} />
          </Box>
        </Stack>

        <Typography variant="h6" sx={{ mb: 1.5, fontWeight: 600 }}>
          Torneo
        </Typography>
        {tournaments.length > 0 ? (
          <Stack spacing={2}>
            {tournaments.map(t => (
              <TournamentCard key={t._id} tournament={t} />
            ))}
          </Stack>
        ) : (
          <Typography variant="body2" color="grey.500">
            Sin torneos activos
          </Typography>
        )}

        <Typography variant="h6" sx={{ mt: 4, mb: 2, fontWeight: 600 }}>
          LineUp ({members.length})
        </Typography>
        <Stack spacing={2}>
          {members.map(member => (
            <Card
              key={member._id}
              onClick={() => navigate(`/user/${member._id}`)}
              sx={{
                bgcolor: '#1a1a1a',
                border: '1px solid',
                borderColor: member._id === team.capitanId ? '#ffd700' : 'divider',
                cursor: 'pointer',
                '&:hover': { borderColor: '#00e676' },
              }}
            >
              <CardContent>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar
                    src={member.url_profile_photo || undefined}
                    sx={{ width: 48, height: 48, bgcolor: '#333' }}
                  >
                    {member.name?.charAt(0).toUpperCase()}
                  </Avatar>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {member.name} {member.lastName}
                    </Typography>
                    <Typography variant="body2" color="grey.500">
                      @{member.username}
                    </Typography>
                  </Box>
                  {member._id === team.capitanId && (
                    <Chip
                      icon={<WorkspacePremiumIcon sx={{ color: '#000' }} />}
                      label="Owner"
                      size="small"
                      sx={{ bgcolor: '#ffd700', color: '#000', fontWeight: 600 }}
                    />
                  )}
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      </Container>
    </>
  )
}

export default Team
