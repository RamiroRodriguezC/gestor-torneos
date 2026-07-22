import Navbar from './Navbar'
import { tournamentSections } from '../../config/navigation'

function TournamentNavbar({ activeSection, onSectionChange }) {
  return (
    <Navbar
      items={tournamentSections}
      backTo="/dashboard"
      activeItem={activeSection}
      onItemClick={onSectionChange}
      mobileVariant="bottom"
    />
  )
}

export default TournamentNavbar
