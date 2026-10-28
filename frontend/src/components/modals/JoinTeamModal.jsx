import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Alert,
  Stack,
  Typography,
  CircularProgress,
  Box,
} from '@mui/material'
import GroupAddIcon from '@mui/icons-material/GroupAdd'
import { useAuth } from '../../hooks/useAuth'
import { joinTeamByCode } from '../../data/teams'

function JoinTeamModal({ open, onClose, onSuccess }) {
  const { user } = useAuth()
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (open) {
      setCode('')
      setError(null)
    }
  }, [open])

  const handleSubmit = async (e) => {
    e.preventDefault()
    const cleanCode = code.trim().toUpperCase()
    if (!cleanCode) {
      setError('Por favor, ingresá el código de invitación.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const team = await joinTeamByCode(cleanCode, user?._id)
      if (onSuccess) onSuccess(team)
      onClose()
    } catch (err) {
      setError(err.message || 'Código inválido o error al unirse al equipo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ pb: 1, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <GroupAddIcon color="primary" />
        Unirme a un Equipo
      </DialogTitle>

      <Box component="form" onSubmit={handleSubmit} noValidate>
        <DialogContent dividers sx={{ pt: 2 }}>
          <Stack spacing={2.5}>
            <Typography variant="body2" color="grey.400">
              Ingresá el código de invitación que te compartió el capitán de tu equipo para sumarte al plantel.
            </Typography>

            {error && <Alert severity="error">{error}</Alert>}

            <TextField
              label="Código de Invitación"
              required
              fullWidth
              autoFocus
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase())
                if (error) setError(null)
              }}
              placeholder="Ej: TF-8K3P"
              inputProps={{
                style: {
                  textAlign: 'center',
                  fontSize: '1.4rem',
                  letterSpacing: '3px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                },
              }}
              helperText="El código no distingue mayúsculas de minúsculas"
            />
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} disabled={loading} color="inherit">
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={loading || !code.trim()}
            startIcon={loading ? <CircularProgress size={18} color="inherit" /> : null}
          >
            {loading ? 'Uniéndose...' : 'Unirme'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  )
}

export default JoinTeamModal
