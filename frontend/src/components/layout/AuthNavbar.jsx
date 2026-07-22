import { useNavigate } from 'react-router-dom'
import Navbar from './Navbar'
import { useAuth } from '../../hooks/useAuth'
import { authNavItems, authNavItemsLoggedIn } from '../../config/navigation'

function AuthNavbar() {
  const navigate = useNavigate()
  const { isLoggedIn } = useAuth()

  const handleAction = (action) => {
    if (action === 'logout') {
      localStorage.removeItem('token')
      localStorage.removeItem('currentUserId')
      navigate('/login')
    }
  }

  return (
    <Navbar
      items={isLoggedIn ? authNavItemsLoggedIn : authNavItems}
      onAction={handleAction}
    />
  )
}

export default AuthNavbar
