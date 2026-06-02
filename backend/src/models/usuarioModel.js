import mongoose from 'mongoose';

// Subdocumento para registrar el historial de torneos del usuario (Extended Reference)
const TorneoUsuarioSchema = new mongoose.Schema({
  tournamentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tournaments', required: true },
  title: { type: String, required: true },
  role: { type: String, enum: ['JUGADOR', 'CAPITAN', 'ORGANIZADOR', 'COORDINADOR'], required: true },
  status: { type: String, enum: ['ACTIVO', 'ELIMINADO', 'PENDIENTE'], default: 'ACTIVO' },
  photoURL: { type: String }
}, { _id: false });

// Subdocumento para registrar los equipos a los que pertenece el usuario (Extended Reference)
const EquipoUsuarioSchema = new mongoose.Schema({
  teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
  name: { type: String, required: true },
  photo: { type: String }
}, { _id: false });

const UsuarioSchema = new mongoose.Schema({
  name: { type: String, required: true },
  lastname: { type: String, required: true },
  
  // Campo desnormalizado para búsquedas rápidas de jugadores en el arbitraje
  fullName: { type: String, required: true },
  
  mail: { type: String, required: true, unique: true, lowercase: true },
  hashedPasword: { type: String, required: true }, // Se conserva el nombre de tu .mml
  
  // Rol del usuario a nivel global en el sistema
  roleSystem: { 
    type: String, 
    enum: ['ADMIN', 'ORGANIZADOR', 'COORDINADOR', 'JUGADOR'], 
    default: 'JUGADOR',
    required: true 
  },
  url_profile_photo: { type: String },
  dateOfBirth: { type: String, required: true }, // Se conserva como string según tu .mml
  phone: { type: String },
  bio: { type: String },

  // Arrays embebidos para evitar populates complejos en pantallas rápidas
  tournaments: [TorneoUsuarioSchema],
  teams: [EquipoUsuarioSchema],
  
  isDeleted: { type: Boolean, default: false }
}, { 
  timestamps: true // Crea automáticamente createdAt y updatedAt
});

// Middleware para asegurar que fullName siempre esté actualizado antes de guardar
UsuarioSchema.pre('save', function(next) {
  if (this.isModified('name') || this.isModified('lastname')) {
    this.fullName = `${this.name} ${this.lastname}`;
  }
  next();
});

export default mongoose.model('Usuario', UsuarioSchema);