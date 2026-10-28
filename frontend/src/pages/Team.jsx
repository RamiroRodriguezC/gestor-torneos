import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Container,
  Typography,
  Box,
  Avatar,
  Stack,
  Card,
  CardContent,
  Chip,
  IconButton,
  Button,
  Paper,
  Tooltip,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress,
  Alert,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import CheckIcon from '@mui/icons-material/Check'
import RefreshIcon from '@mui/icons-material/Refresh'
import KeyIcon from '@mui/icons-material/Key'
import PersonRemoveIcon from '@mui/icons-material/PersonRemove'
import ExitToAppIcon from '@mui/icons-material/ExitToApp'
import Navbar from '../components/layout/Navbar'
import TournamentCard from '../components/tournament/TournamentCard'
import { SportsTag } from '../components/Tags'
import { useTeam } from '../hooks/useTeams'
import { useSport } from '../hooks/useSportsConfig'
import { useAuth } from '../hooks/useAuth'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../lib/db'
import ErrorDisplay from '../components/ErrorDisplay'
import {
  fetchTeamInviteCode,
  regenerateTeamInviteCode,
  removeMemberFromTeam,
} from '../data/teams'

function Team() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const team = useTeam(id)
  const sport = useSport(team?.discipline)

  const isCaptain =
    Boolean(user) &&
    (String(team?.capitanId?._id || team?.capitanId) === String(user?._id) ||
      user?.globalRole === 'ADMIN')

  const memberIds = team?.members?.map((m) => m.userId) ?? []
  const isMember = Boolean(user) && memberIds.some((uid) => String(uid) === String(user?._id))

  const members = useLiveQuery(
    () => (memberIds.length ? db.users.where('_id').anyOf(memberIds).toArray() : []),
    [JSON.stringify(memberIds)],
    []
  )

  const tournamentIds = team?.tournaments?.map((t) => t.tournamentId) ?? []
  const tournaments = useLiveQuery(
    () => (tournamentIds.length ? db.tournaments.where('_id').anyOf(tournamentIds).toArray() : []),
    [JSON.stringify(tournamentIds)],
    []
  )

  // Estado para el código de invitación
  const [inviteData, setInviteData] = useState(null)
  const [codeLoading, setCodeLoading] = useState(false)
  const [codeError, setCodeError] = useState(null)
  const [copied, setCopied] = useState(false)
  const [snack, setSnack] = useState('')

  // Estado para confirmación de expulsión / salida
  const [memberToRemove, setMemberToRemove] = useState(null)
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  // Cargar el código de invitación si el usuario es capitán o admin
  useEffect(() => {
    if (isCaptain && team?._id) {
      setCodeLoading(true)
      setCodeError(null)
      fetchTeamInviteCode(team._id)
        .then((data) => setInviteData(data))
        .catch((err) => setCodeError(err.message))
        .finally(() => setCodeLoading(false))
    }
  }, [isCaptain, team?._id])

  const handleCopyCode = async () => {
    if (!inviteData?.code) return
    try {
      await navigator.clipboard.writeText(inviteData.code)
      setCopied(true)
      setSnack('¡Código copiado al portapapeles!')
      setTimeout(() => setCopied(false), 2500)
    } catch {
      setSnack(`Código: ${inviteData.code}`)
    }
  }

  const handleRegenerate = async () => {
    if (!team?._id) return
    setCodeLoading(true)
    try {
      const data = await regenerateTeamInviteCode(team._id)
      setInviteData(data)
      setSnack('Nuevo código de invitación generado.')
    } catch (err) {
      setSnack(err.message || 'Error al regenerar código.')
    } finally {
      setCodeLoading(false)
    }
  }

  const handleConfirmRemoveMember = async () => {
    if (!memberToRemove || !team?._id) return
    setActionLoading(true)
    try {
      await removeMemberFromTeam(team._id, memberToRemove._id)
      setSnack(`${memberToRemove.name} ${memberToRemove.lastName} fue removido del equipo.`)
      setMemberToRemove(null)
    } catch (err) {
      setSnack(err.message || 'Error al remover al miembro.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleConfirmLeaveTeam = async () => {
    if (!team?._id || !user?._id) return
    setActionLoading(true)
    try {
      await removeMemberFromTeam(team._id, user._id)
      navigate('/dashboard/teams')
    } catch (err) {
      setSnack(err.message || 'Error al salir del equipo.')
      setActionLoading(false)
      setLeaveDialogOpen(false)
    }
  }

  if (!user) return null
  if (!team) {
    return (
      <>
        <Navbar />
        <Container maxWidth="md">
          <ErrorDisplay type="TEAM_NOT_FOUND" />
        </Container>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <Container maxWidth="md" sx={{ mt: 4, pb: 8 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <IconButton onClick={() => navigate('/dashboard/teams')}>
            <ArrowBackIcon />
          </IconButton>
          {!isCaptain && isMember && (
            <Button
              variant="outlined"
              color="error"
              size="small"
              startIcon={<ExitToAppIcon />}
              onClick={() => setLeaveDialogOpen(true)}
            >
              Abandonar equipo
            </Button>
          )}
        </Box>

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

        {/* Sección de Código de Invitación (Visible para el Capitán) */}
        {isCaptain && (
          <Paper
            variant="outlined"
            sx={{
              p: 2.5,
              mb: 4,
              bgcolor: '#141414',
              borderColor: 'primary.dark',
              borderRadius: 2,
            }}
          >
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }} justifyContent="space-between">
              <Box>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                  <KeyIcon color="primary" sx={{ fontSize: 20 }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    Código de Invitación al Equipo
                  </Typography>
                </Stack>
                <Typography variant="body2" color="grey.400">
                  Compartí este código para que tus compañeros se unan a tu plantel.
                </Typography>
              </Box>

              {codeLoading ? (
                <CircularProgress size={24} color="primary" />
              ) : codeError ? (
                <Alert severity="warning" sx={{ py: 0 }}>{codeError}</Alert>
              ) : (
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Box
                    sx={{
                      px: 2,
                      py: 0.8,
                      bgcolor: '#202020',
                      border: '1px dashed',
                      borderColor: 'primary.main',
                      borderRadius: 1,
                      fontFamily: 'monospace',
                      fontWeight: 800,
                      fontSize: '1.25rem',
                      letterSpacing: '2px',
                      color: 'primary.light',
                    }}
                  >
                    {inviteData?.code || '------'}
                  </Box>

                  <Tooltip title="Copiar código">
                    <Button
                      variant="contained"
                      color={copied ? 'success' : 'primary'}
                      onClick={handleCopyCode}
                      startIcon={copied ? <CheckIcon /> : <ContentCopyIcon />}
                      size="small"
                    >
                      {copied ? 'Copiado' : 'Copiar'}
                    </Button>
                  </Tooltip>

                  <Tooltip title="Generar nuevo código (invalida el actual)">
                    <IconButton
                      onClick={handleRegenerate}
                      disabled={codeLoading}
                      size="small"
                      sx={{ color: 'grey.400', '&:hover': { color: '#fff' } }}
                    >
                      <RefreshIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
              )}
            </Stack>
          </Paper>
        )}

        <Typography variant="h6" sx={{ mb: 1.5, fontWeight: 600 }}>
          Torneos
        </Typography>
        {tournaments.length > 0 ? (
          <Stack spacing={2}>
            {tournaments.map((t) => (
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
          {members.map((member) => {
            const isMemberCaptain =
              String(member._id) === String(team.capitanId?._id || team.capitanId)

            return (
              <Card
                key={member._id}
                sx={{
                  bgcolor: '#1a1a1a',
                  border: '1px solid',
                  borderColor: isMemberCaptain ? '#ffd700' : 'divider',
                  transition: 'border-color 0.2s',
                  '&:hover': { borderColor: '#00e676' },
                }}
              >
                <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar
                      src={member.url_profile_photo || undefined}
                      onClick={() => navigate(`/user/${member._id}`)}
                      sx={{ width: 48, height: 48, bgcolor: '#333', cursor: 'pointer' }}
                    >
                      {member.name?.charAt(0).toUpperCase()}
                    </Avatar>

                    <Box
                      onClick={() => navigate(`/user/${member._id}`)}
                      sx={{ flexGrow: 1, cursor: 'pointer' }}
                    >
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {member.name} {member.lastName}
                      </Typography>
                      <Typography variant="body2" color="grey.500">
                        @{member.username}
                      </Typography>
                    </Box>

                    {isMemberCaptain ? (
                      <Chip
                        icon={<WorkspacePremiumIcon sx={{ color: '#000' }} />}
                        label="Capitán"
                        size="small"
                        sx={{ bgcolor: '#ffd700', color: '#000', fontWeight: 600 }}
                      />
                    ) : (
                      isCaptain && (
                        <Tooltip title="Expulsar del equipo">
                          <IconButton
                            color="error"
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation()
                              setMemberToRemove(member)
                            }}
                          >
                            <PersonRemoveIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )
                    )}
                  </Stack>
                </CardContent>
              </Card>
            )
          })}
        </Stack>
      </Container>

      {/* Diálogo para confirmar expulsión de un miembro */}
      <Dialog
        open={Boolean(memberToRemove)}
        onClose={() => (actionLoading ? undefined : setMemberToRemove(null))}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Expulsar del equipo</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Estás seguro de que deseás expulsar a{' '}
            <strong>
              {memberToRemove?.name} {memberToRemove?.lastName}
            </strong>{' '}
            del equipo? Dejará de pertenecer al plantel y no podrá disputar partidos.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setMemberToRemove(null)} disabled={actionLoading} color="inherit">
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="error"
            disabled={actionLoading}
            onClick={handleConfirmRemoveMember}
          >
            {actionLoading ? 'Expulsando...' : 'Expulsar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo para confirmar abandono de equipo */}
      <Dialog
        open={leaveDialogOpen}
        onClose={() => (actionLoading ? undefined : setLeaveDialogOpen(false))}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Abandonar equipo</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Estás seguro de que deseás abandonar <strong>{team?.name}</strong>? Si deseás volver
            a unirte, necesitarás que el capitán te vuelva a compartir el código de invitación.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setLeaveDialogOpen(false)} disabled={actionLoading} color="inherit">
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="error"
            disabled={actionLoading}
            onClick={handleConfirmLeaveTeam}
          >
            {actionLoading ? 'Saliendo...' : 'Abandonar'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={Boolean(snack)}
        autoHideDuration={3000}
        onClose={() => setSnack('')}
        message={snack}
      />
    </>
  )
}

export default Team
