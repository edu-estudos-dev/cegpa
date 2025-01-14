import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const db_config = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE
};

const connection = mysql.createPool(db_config);

const testConnection = async () => {
    try {
        const [rows] = await connection.query('SELECT 1');
        console.log(`Connected to database: ${process.env.DB_DATABASE}`);
    } catch (err) {
        console.error(`Error connecting to database: ${process.env.DB_DATABASE}`, err);
    }
};

testConnection();

export default connection;
