import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    // Elegimos la URI dinámicamente según el entorno
    const dbUri = process.env.NODE_ENV === 'production' 
      ? process.env.MONGO_URI 
      : process.env.MONGO_URI_DEV;

    const conn = await mongoose.connect(dbUri);
    
    console.log(`🔌 MongoDB Conectado en modo [${process.env.NODE_ENV.toUpperCase()}]: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ Error de conexión a la Base de Datos: ${error.message}`);
    process.exit(1); 
  }
};

export default connectDB;