import mongoose from 'mongoose';

const FieldSchema = new mongoose.Schema({
  name: { type: String, required: true },
  
  // Estructura GeoJSON estándar para localización geográfica de la cancha
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitud, latitud]
      required: true
    }
  }
}, { 
  timestamps: true 
});

// Indexación geográfica para permitir búsquedas por cercanía física (predios deportivos)
FieldSchema.index({ location: '2dsphere' });

export default mongoose.model('Field', FieldSchema);