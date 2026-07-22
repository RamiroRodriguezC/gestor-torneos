import Error from '@mui/icons-material/Error'
import PersonOff from '@mui/icons-material/PersonOff'
import GroupOff from '@mui/icons-material/GroupOff'
import EventBusy from '@mui/icons-material/EventBusy'
import Explore from '@mui/icons-material/Explore'
import SearchOff from '@mui/icons-material/SearchOff'
import SportsEsports from '@mui/icons-material/SportsEsports'

export const FRONTEND_ERRORS = {
  USER_NOT_FOUND:       { icon: PersonOff,    color: '#ff6d00', defaultMessage: 'El usuario no existe o no está disponible.',    imageUrl: null },
  TEAM_NOT_FOUND:       { icon: GroupOff,     color: '#ff6d00', defaultMessage: 'El equipo no fue encontrado.',                  imageUrl: null },
  TOURNAMENT_NOT_FOUND: { icon: EventBusy,    color: '#ff6d00', defaultMessage: 'El torneo no existe.',                         imageUrl: null },
  SPORT_NOT_FOUND:      { icon: SportsEsports, color: '#ff6d00', defaultMessage: 'El deporte no fue encontrado.',               imageUrl: null },
  MATCH_NOT_FOUND:      { icon: SearchOff,    color: '#ff6d00', defaultMessage: 'El partido no existe.',                        imageUrl: null },
  APPLICATION_NOT_FOUND: { icon: SearchOff,   color: '#ff6d00', defaultMessage: 'La solicitud no fue encontrada.',              imageUrl: null },
  FIELD_NOT_FOUND:      { icon: Explore,      color: '#ff6d00', defaultMessage: 'La cancha no fue encontrada.',                 imageUrl: null },
  PAGE_NOT_FOUND:       { icon: Explore,      color: '#ff6d00', defaultMessage: 'La página que buscas no existe.',              imageUrl: null },
  VALIDATION_ERROR:     { icon: Error,        color: '#f44336', defaultMessage: 'Datos inválidos.',                             imageUrl: null },
  INVALID_CREDENTIALS:  { icon: Error,        color: '#f44336', defaultMessage: 'Credenciales inválidas.',                     imageUrl: null },
  UNAUTHORIZED:         { icon: Error,        color: '#f44336', defaultMessage: 'Acceso denegado.',                             imageUrl: null },
  FORBIDDEN:            { icon: Error,        color: '#f44336', defaultMessage: 'No tienes permisos.',                          imageUrl: null },
  CONFLICT:             { icon: Error,        color: '#ff6d00', defaultMessage: 'El recurso ya existe.',                        imageUrl: null },
}

export const GENERIC_ERROR = { icon: Error, color: '#f44336', defaultMessage: 'Ocurrió un error inesperado.', imageUrl: null }
