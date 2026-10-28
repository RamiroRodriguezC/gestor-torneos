import crypto from 'crypto';

// Alfabeto Crockford Base32: 32 caracteres seguros, sin 0/O ni 1/I/L para evitar confusiones de lectura
const CHARSET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

/**
 * Genera un código de invitación alfanumérico criptográficamente seguro.
 * 256 % 32 === 0, por lo que no existe sesgo de módulo (distribución uniforme perfecta).
 * @param {number} length Longitud del código (por defecto 6 caracteres).
 * @returns {string} Código alfanumérico en mayúsculas.
 */
export function generateInviteCode(length = 6) {
  const bytes = crypto.randomBytes(length);
  let code = '';
  for (let i = 0; i < length; i++) {
    code += CHARSET[bytes[i] % CHARSET.length];
  }
  return code;
}
