import { Schema, model } from 'mongoose';
import { USER_TOURNAMENT_ROLE, TEAM_ROLE, GLOBAL_ROLE } from '../constants/enums.js';

const UserTournamentsSchema = new Schema({
  tournamentId: { type: Schema.Types.ObjectId, ref: 'Tournament', required: true },
  title: { type: String, required: true },
  photoURL: { type: String, default: '' },
  status: { type: String, default: ''},
  role: { type: String, enum: USER_TOURNAMENT_ROLE, required: true }
}, { _id: false });

const UserTeamsSchema = new Schema({
  teamId: { type: Schema.Types.ObjectId, ref: 'Team', required: true },
  name: { type: String, required: true },
  logoURL: { type: String, default: '' },
  role: { type: String, enum: TEAM_ROLE, required: true }
}, { _id: false });

const UserSchema = new Schema({
  name: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  hashedPassword: { type: String, required: true },
  globalRole: { type: String, enum: GLOBAL_ROLE, default: 'USER' },
  url_profile_photo: { type: String, default: '' },
  dateOfBirth: { type: Date },
  phoneNumber: { type: String, default: '' },
  bio: { type: String, default: '' },
  tournaments: [UserTournamentsSchema],
  teams: [UserTeamsSchema],
  applications: [{ type: Schema.Types.ObjectId, ref: 'Application' }],
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

export default model('User', UserSchema);