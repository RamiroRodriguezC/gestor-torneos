import { Schema, model } from 'mongoose';

// Embebido de torneos en el equipo para mostrar info básica sin necesidad de hacer populate
const TournamentSchema = new Schema({
  tournamentId: { type: Schema.Types.ObjectId, ref: 'Tournament', required: true },
  title: { type: String, required: true },
  photoURL: { type: String, default: '' },
}, { _id: false });

// Embebido de los usuarios miembros del equipo para mostrar info básica sin necesidad de hacer populate
const TeamMemberSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  fullName: { type: String, required: true },
  url_profile_photo: { type: String, default: '' }
}, { _id: false });

// Schema principal del equipo
const TeamSchema = new Schema({
  name: { type: String, required: true },
  logoURL: { type: String, default: '' },
  discipline: { type: String, required: true }, // id o string a sportConfig?
  capitanId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  members: [TeamMemberSchema],
  tournaments: [TournamentSchema],
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

export default model('Team', TeamSchema);