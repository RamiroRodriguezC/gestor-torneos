import { Typography, Chip } from '@mui/material'

export function UsernameTag({ username, ...props }) {
  return (
    <Typography sx={{ color: 'primary.main' }} {...props}>
      @{username}
    </Typography>
  )
}

export function SportsTag({ sport, ...props }) {
  return (
    <Chip
      label={sport}
      variant="outlined"
      color="primary"
      size="small"
      {...props}
    />
  )
}
