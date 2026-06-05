const mysql = require('mysql2/promise');
const fs = require('fs');
const env = fs.readFileSync('.env','utf8');
const pass = env.match(/DB_PASSWORD=(.+)/)[1].trim();
(async () => {
  try {
    const p = mysql.createPool({
      host:'mysql-364674f7-muhamedndiaye00-1360.l.aivencloud.com',port:12444,
      user:'avnadmin',password:pass,database:'defaultdb',
      ssl:{rejectUnauthorized:false}
    });
    const [cols] = await p.query('DESCRIBE acheteur');
    console.log('ACHETEUR columns:');
    cols.forEach(c => console.log(' ', c.Field, c.Type, c.Null, c.Key, c.Default));
    const [rows] = await p.query('SELECT * FROM acheteur');
    console.log('\nExisting acheteurs:', JSON.stringify(rows, null, 2));
    await p.end();
  } catch(e) { console.error(e); }
})();
