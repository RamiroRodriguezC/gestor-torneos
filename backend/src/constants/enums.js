// |------------------------------ GLOBALES (compartidos) ------------------------------|
/** Modalidad de ejecución del partido: VERSUS (uno contra uno) o LEADERBOARD (todos contra todos, ej: golf). Usado en: SportsConfig + Match */
export const MATCH_EXECUTION = ['VERSUS', 'LEADERBOARD'];
/** Estado de las solicitudes de inscripción al torneo. Usado en: Tournament + Application */
export const APPLICATION_STATUS = ['PENDIENTE', 'APROBADA', 'RECHAZADA'];

// |------------------------------ DEPORTE (SportsConfig) ------------------------------|
/** Tipo de participante: INDIVIDUAL (ej: tenis) o TEAM (ej: fútbol) */
export const PARTICIPANT_TYPE = ['INDIVIDUAL', 'TEAM'];
/** Unidad de puntuación del deporte */
export const SCORING_UNIT = ['GOLES', 'POINTS', 'STROKES', 'TIME'];
/** Orden de puntuación: ASC gana el que menos acumula (ej: golf), DESC gana el que más acumula (ej: fútbol) */
export const SCORE_ORDER = ['ASC', 'DESC'];
/** Condición de finalización del partido: FIRST_TO_SCORE, TIME_LIMIT o SET_NUMBER */
export const FINISH_CONDITION = ['FIRST_TO_SCORE', 'TIME_LIMIT', 'SET_NUMBER'];
/** A quién se aplica un evento: al equipo (COMPETITOR) o a un jugador (PLAYER) */
export const EVENT_TARGET = ['COMPETITOR', 'PLAYER'];

// |----------------------------- TORNEO (Tournament) -----------------------------|
/** Criterio de finalizacion del partido */
export const FINISHING_CRITERIA_TYPE = ['POINTS', 'GOAL_DIFFERENCE', 'GOALS_SCORED'];
/** Unidad de medida del criterio de finalización */
export const FINISHING_CRITERIA_UNIT = ['POINTS', 'GOALS', 'OTHER'];
/** Formato de competencia del torneo */
export const TOURNAMENT_FORMAT = ['SINGLE_ELIMINATION', 'DOUBLE_ELIMINATION', 'ROUND_ROBIN', 'SWISS'];
/** Ciclo de vida del torneo */
export const TOURNAMENT_STATUS = ['BORRADOR', 'PUBLICADO', 'EN_CURSO', 'FINALIZADO'];

// |---------------------------- PARTIDO (Match) ----------------------------|
/** Lado del competidor en un partido: local (HOME), visitante (AWAY) o neutral (NONE) */
export const COMPETITOR_SIDE = ['HOME', 'AWAY', 'NONE'];
/** Ciclo de vida del partido */
export const MATCH_STATUS = ['PROGRAMADO', 'EN_CURSO', 'FINALIZADO'];

// |------------------------------ USUARIO (User) ------------------------------|
/** Rol que cumple un usuario dentro de un torneo específico */
export const USER_TOURNAMENT_ROLE = ['ORGANIZADOR', 'COORDINADOR', 'JUGADOR'];
/** Rol que cumple un usuario dentro de un equipo */
export const TEAM_ROLE = ['CAPITAN', 'MIEMBRO'];
/** Rol global del usuario en la plataforma */
export const GLOBAL_ROLE = ['ADMIN', 'USER'];
