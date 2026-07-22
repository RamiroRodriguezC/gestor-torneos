import { Box, Typography, Container, Stack, Link } from '@mui/material'

function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        bgcolor: '#050505',
        py: 4,
        borderTop: '1px solid rgba(0, 230, 118, 0.08)',
      }}
    >
      <Container maxWidth="lg">
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          sx={{
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Typography variant="body2" color="#00e676" sx={{ fontWeight: 600 }}>
            TourneyFy
          </Typography>
          <Stack direction="row" spacing={3}>
            <Link href="#" color="grey.500" underline="hover" variant="body2">
              Términos
            </Link>
            <Link href="#" color="grey.500" underline="hover" variant="body2">
              Privacidad
            </Link>
            <Link href="#" color="grey.500" underline="hover" variant="body2">
              Contacto
            </Link>
          </Stack>
          <Typography variant="body2" color="grey.600">
            &copy; {new Date().getFullYear()} TourneyFy. Todos los derechos reservados.
          </Typography>
        </Stack>
      </Container>
    </Box>
  )
}

export default Footer
