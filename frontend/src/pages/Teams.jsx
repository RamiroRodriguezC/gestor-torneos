import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Container, Typography, Stack, Button, Box, Paper } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import GroupsIcon from '@mui/icons-material/Groups'
import Navbar from '../components/layout/Navbar'
import TeamCard from '../components/cards/TeamCard'
import CreateTeamModal from '../components/modals/CreateTeamModal'
import { useAuth } from '../hooks/useAuth'
import { useTeamsByUser } from '../hooks/useTeams'

function Teams() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const teams = useTeamsByUser(user?._id)
  const [createOpen, setCreateOpen] = useState(false)

  if (!user) return null

  const handleCreated = (newTeam) => {
    if (newTeam?._id) {
      navigate(`/dashboard/teams/${newTeam._id}`)
    }
  }

  return (
    <>
      <Navbar />
      <Container sx={{ pb: 8 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 8, mb: 4, flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="h3">
            Mis Equipos
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => setCreateOpen(true)}
          >
            Crear Equipo
          </Button>
        </Box>

        <Stack spacing={2} useFlexGap>
          {teams.map((team) => (
            <TeamCard key={team._id} team={team} userId={user._id} />
          ))}

          {teams.length === 0 && (
            <Paper
              variant="outlined"
              sx={{
                p: 6,
                textAlign: 'center',
                bgcolor: '#141414',
                borderColor: 'divider',
                borderRadius: 2,
              }}
            >
              <GroupsIcon sx={{ fontSize: 48, color: 'grey.600', mb: 1.5 }} />
              <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                Aún no pertenecés a ningún equipo
              </Typography>
              <Typography variant="body2" color="grey.500" sx={{ mb: 3, maxWidth: 450, mx: 'auto' }}>
                Creá tu propio equipo como capitán para competir en torneos y armar tu plantel de jugadores.
              </Typography>
              <Button
                variant="outlined"
                color="primary"
                startIcon={<AddIcon />}
                onClick={() => setCreateOpen(true)}
              >
                Crear mi primer equipo
              </Button>
            </Paper>
          )}
        </Stack>
      </Container>

      <CreateTeamModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={handleCreated}
      />
    </>
  )
}

export default Teams
