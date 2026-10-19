import Navbar from './Navbar'
import { tournamentSections } from '../../config/navigation'
import SettingsIcon from '@mui/icons-material/Settings'
import Button from '@mui/material/Button'

function TournamentNavbar({ activeSection, onSectionChange, isOrganizer }) {
  const isAdminActive = activeSection === 'admin'

  return (
    <Navbar
      items={tournamentSections}
      backTo="/dashboard/tournaments"
      activeItem={activeSection}
      onItemClick={onSectionChange}
      mobileVariant="bottom"
      rightAction={
        isOrganizer ? (
          <Button
            size="small"
            startIcon={<SettingsIcon />}
            onClick={() => onSectionChange(isAdminActive ? 'fixture' : 'admin')}
            variant={isAdminActive ? 'contained' : 'outlined'}
            color={isAdminActive ? 'primary' : 'inherit'}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.82rem',
              borderRadius: 2,
              px: 1.5,
              py: 0.4,
              ...(isAdminActive
                ? {
                    bgcolor: '#00e676',
                    color: '#0a0a0a',
                    '&:hover': { bgcolor: '#00c853' },
                  }
                : {
                    color: 'grey.300',
                    borderColor: 'grey.700',
                    '&:hover': {
                      borderColor: '#00e676',
                      color: '#00e676',
                      bgcolor: 'rgba(0, 230, 118, 0.08)',
                    },
                  }),
            }}
          >
            Ajustes
          </Button>
        ) : null
      }
    />
  )
}

export default TournamentNavbar
