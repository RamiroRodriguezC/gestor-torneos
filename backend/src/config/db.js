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
  // No se hace process.exit(1) — el servidor sigue vivo para
  // que el health-check responda y los endpoints devuelvan 500 descriptivo
  }
};

export const requireDB = () => {
  // Si la base de datos no esta disponible, se cayo al momento de la peticion o algo, se devuelve un error previsible en lugar de crashear la App
  if (mongoose.connection.readyState !== 1) {
    throw new Error('Base de datos no disponible');
  }
};

export default connectDB;

