import app from './app.js';
import dotenv from 'dotenv';
dotenv.config();

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', (err) => {
   if (err) throw err;
   console.log(`Running at address http://localhost:${PORT}/login`);
});
