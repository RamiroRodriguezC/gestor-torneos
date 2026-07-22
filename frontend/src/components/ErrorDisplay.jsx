import { Box, Typography } from '@mui/material'
import { FRONTEND_ERRORS, GENERIC_ERROR } from '../config/errors'

export default function ErrorDisplay({ error, type, message, code, imageUrl, size = 'md' }) {
  const resolved = (type && FRONTEND_ERRORS[type]) || GENERIC_ERROR
  const Icon = resolved.icon
  const color = resolved.color
  const displayImage = imageUrl || resolved.imageUrl || null
  const displayMessage = message || error?.message || resolved.defaultMessage || 'Ocurrió un error inesperado.'
  const displayCode = code ?? error?.code ?? null

  const sizes = {
    sm: { iconSize: 48, spacing: 2, py: 4, fontSize: '1rem', subSize: '0.75rem', imgWidth: 120 },
    md: { iconSize: 72, spacing: 3, py: 6, fontSize: '1.25rem', subSize: '0.85rem', imgWidth: 180 },
    lg: { iconSize: 96, spacing: 4, py: 8, fontSize: '1.5rem', subSize: '1rem', imgWidth: 240 },
  }

  const s = sizes[size] || sizes.md

  return (
    <Box
      sx={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        py: s.py, px: 2, textAlign: 'center',
      }}
    >
      {displayImage ? (
        <Box
          component="img"
          src={imageUrl}
          alt="error illustration"
          sx={{ width: s.imgWidth, maxWidth: '100%', height: 'auto', mb: s.spacing }}
        />
      ) : (
        <Icon sx={{ fontSize: s.iconSize, color, mb: s.spacing }} />
      )}

      {displayCode != null && displayCode !== 0 && (
        <Typography
          variant="caption"
          sx={{ color: 'grey.600', fontWeight: 700, fontSize: '0.75rem', letterSpacing: 2, mb: 0.5 }}
        >
          ERROR {displayCode}
        </Typography>
      )}

      <Typography variant="h6" sx={{ fontWeight: 600, fontSize: s.fontSize, color: 'grey.300' }}>
        {displayMessage}
      </Typography>
    </Box>
  )
}
