import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Container, Typography, Stack, Box, Card, CardContent, Chip, Button,
  Alert, Snackbar, Tabs, Tab, Dialog, DialogTitle, DialogContent,
  DialogContentText, DialogActions, TextField, Avatar,
} from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty'
import Navbar from '../components/layout/Navbar'
import ErrorDisplay from '../components/ErrorDisplay'
import { useAuth } from '../hooks/useAuth'
import { useTournament } from '../hooks/useTournaments'
import { useApplicationsByTournament } from '../hooks/useApplications'
import { useTeamsByDiscipline } from '../hooks/useTeams'
import { updateApplication, bulkPutApplications } from '../data/applications'
import { fetchTournament } from '../data/tournaments'
import { apiFetch } from '../utils/apiFetch'

const STATUS_META = {
  PENDIENTE: { label: 'Pendiente', color: '#ffb300', icon: HourglassEmptyIcon },
  APROBADA: { label: 'Aprobada', color: '#00e676', icon: CheckCircleIcon },
  RECHAZADA: { label: 'Rechazada', color: '#ef5350', icon: CancelIcon },
}

// Pantalla del organizador: gestiona las solicitudes de inscripción del torneo.
// Solo el organizador (tournament.organizerId === user._id) puede entrar.
function TournamentApplicationsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const tournament = useTournament(id)
  const [tab, setTab] = useState('PENDIENTE')
  const [apps, setApps] = useState([])
  const [error, setError] = useState('')
  const [decisionApp, setDecisionApp] = useState(null) // solicitud sobre la que se abre el dialog
  const [decision, setDecision] = useState('') // 'APROBADA' | 'RECHAZADA'
  const [organizerNote, setOrganizerNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [snack, setSnack] = useState('')

  const teamsByDiscipline = useTeamsByDiscipline(tournament?.sportConfigId)
  const teamMap = useMemo(() => {
    const map = {}
    for (const t of teamsByDiscipline || []) map[t._id] = t
    return map
  }, [teamsByDiscipline])

  // Refrescar desde el backend al montar (y al volver de aprobar).
  const refresh = async () => {
    if (!tournament?._id) return
    try {
      const json = await apiFetch(`/tournaments/${tournament._id}/applications`)
      const list = json.data || []
      await bulkPutApplications(list)
      setApps(list)
      setError('')
    } catch (err) {
      setError(err.message)
    }
  }

  const tournamentId = tournament?._id
  useEffect(() => {
    if (tournamentId) refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tournamentId])

  // Fuente reactiva local mientras tanto (useLiveQuery).
  const liveApps = useApplicationsByTournament(id)

  const displayed = useMemo(() => {
    const source = apps.length ? apps : (liveApps || [])
    return (tab ? source.filter((a) => a.status === tab) : source)
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
  }, [apps, liveApps, tab])

  if (!user || !tournament) return null
  if (String(tournament.organizerId) !== String(user._id)) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Navbar />
        <Container maxWidth="md" sx={{ py: 8 }}>
          <ErrorDisplay type="FORBIDDEN" size="lg" />
        </Container>
      </Box>
    )
  }

  const participantLabel = (a) => {
    const team = teamMap[a.participantId]
    return team?.name || a.displayNameSnapshot || a.participantId
  }

  const openDecision = (a, status) => {
    setDecisionApp(a)
    setDecision(status)
    setOrganizerNote('')
  }

  const confirmDecision = async () => {
    if (!decisionApp) return
    setSaving(true)
    try {
      const updated = await updateApplication(decisionApp._id, {
        status: decision,
        ...(organizerNote ? { notesOrganizador: organizerNote } : {}),
      })
      setApps((prev) => prev.map((a) => (a._id === updated._id ? updated : a)))
      setSnack(decision === 'APROBADA' ? 'Inscripción aprobada: el participante ya forma parte del torneo.' : 'Solicitud rechazada.')
      setDecisionApp(null)
      // Refrescar el torneo para que participantes/useLiveQuery reflejen el alta.
      await fetchTournament(tournament._id).catch(() => {})
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const pendingCount = (liveApps || []).filter((a) => a.status === 'PENDIENTE').length

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar backTo={`/tournament/${tournament._id}`} />
      <Container maxWidth="md" sx={{ pb: 8 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 6, mb: 1, flexWrap: 'wrap', gap: 1 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>Solicitudes de inscripción</Typography>
            <Typography variant="body2" color="grey.500">{tournament.title}</Typography>
          </Box>
          <Button variant="outlined" onClick={() => navigate(`/tournament/${tournament._id}`)}>
            Volver al torneo
          </Button>
        </Stack>

        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{
            mb: 2,
            '& .MuiTab-root': { color: 'grey.500', textTransform: 'none', fontWeight: 500 },
            '& .Mui-selected': { color: '#00e676 !important' },
            '& .MuiTabs-indicator': { bgcolor: '#00e676' },
          }}
        >
          <Tab value="PENDIENTE" label={`Pendientes${pendingCount ? ` (${pendingCount})` : ''}`} />
          <Tab value="APROBADA" label="Aprobadas" />
          <Tab value="RECHAZADA" label="Rechazadas" />
        </Tabs>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {displayed.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <HourglassEmptyIcon sx={{ fontSize: 64, color: 'grey.600', mb: 2 }} />
            <Typography variant="h6" color="grey.500">No hay solicitudes {tab === 'PENDIENTE' ? 'pendientes' : tab.toLowerCase()}es</Typography>
          </Box>
        ) : (
          <Stack spacing={1.5}>
            {displayed.map((a) => {
              const meta = STATUS_META[a.status] || STATUS_META.PENDIENTE
              const Icon = meta.icon
              return (
                <Card key={a._id} sx={{ bgcolor: '#1a1a1a', border: '1px solid', borderColor: 'divider' }}>
                  <CardContent>
                    <Stack direction="row" spacing={2} alignItems="flex-start">
                      <Avatar sx={{ bgcolor: '#333', color: '#00e676' }}>
                        {String(participantLabel(a)).charAt(0).toUpperCase()}
                      </Avatar>
                      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Stack direction="row" alignItems="center" spacing={1} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                            {participantLabel(a)}
                          </Typography>
                          <Chip
                            icon={<Icon sx={{ fontSize: 16 }} />}
                            label={meta.label}
                            size="small"
                            sx={{ bgcolor: `${meta.color}22`, color: meta.color, fontWeight: 600 }}
                          />
                        </Stack>
                        {a.notesCapitan && (
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}>
                            Nota del capitán: {a.notesCapitan}
                          </Typography>
                        )}
                        {a.notesOrganizador && (
                          <Typography variant="caption" color="grey.500" sx={{ display: 'block', mt: 0.5 }}>
                            Tu nota: {a.notesOrganizador}
                          </Typography>
                        )}
                        {a.createdAt && (
                          <Typography variant="caption" color="grey.600" sx={{ display: 'block', mt: 0.5 }}>
                            {new Date(a.createdAt).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </Typography>
                        )}
                      </Box>
                      {a.status === 'PENDIENTE' && (
                        <Stack direction="row" spacing={1}>
                          <Button size="small" variant="contained" color="primary" startIcon={<CheckCircleIcon />} onClick={() => openDecision(a, 'APROBADA')}>
                            Aprobar
                          </Button>
                          <Button size="small" variant="outlined" color="error" startIcon={<CancelIcon />} onClick={() => openDecision(a, 'RECHAZADA')}>
                            Rechazar
                          </Button>
                        </Stack>
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              )
            })}
          </Stack>
        )}
      </Container>

      <Dialog open={!!decisionApp} onClose={() => setDecisionApp(null)} maxWidth="xs" fullWidth>
        <DialogTitle>
          {decision === 'APROBADA' ? 'Aprobar inscripción' : 'Rechazar inscripción'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            {decision === 'APROBADA'
              ? `Al aprobar, ${participantLabel(decisionApp)} pasa a formar parte del torneo.`
              : `La solicitud de ${participantLabel(decisionApp)} quedará rechazada.`}
          </DialogContentText>
          <TextField
            label="Nota para el capitán (opcional)"
            value={organizerNote}
            onChange={(e) => setOrganizerNote(e.target.value)}
            size="small"
            fullWidth
            multiline
            minRows={2}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDecisionApp(null)}>Cancelar</Button>
          <Button
            variant="contained"
            color={decision === 'APROBADA' ? 'primary' : 'error'}
            disabled={saving}
            onClick={confirmDecision}
          >
            {saving ? 'Guardando...' : decision === 'APROBADA' ? 'Aprobar' : 'Rechazar'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!snack}
        autoHideDuration={2500}
        onClose={() => setSnack('')}
        message={snack}
      />
    </Box>
  )
}

export default TournamentApplicationsPage
