const handle = (fn) => async (req, res) => {
  try {
    const data = await fn(req);
    res.json(data);
  } catch (error) {
    if (error.status) {
      res.status(error.status).json({ error: error.message });
    } else if (error.name === 'ValidationError' || error.name === 'CastError') {
      res.status(400).json({ error: error.message });
    } else {
      console.error('Error inesperado:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
};

export default handle;
