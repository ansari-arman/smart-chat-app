import mysql from 'mysql2/promise';

let pool = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "arman",
    database: "smartChatRegister",
});

export default pool;