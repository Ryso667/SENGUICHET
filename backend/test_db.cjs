const mysql = require("mysql2/promise");
async function run() {
  const pool = mysql.createPool({
    host: "gateway01.eu-central-1.prod.aws.tidbcloud.com",
    port: 4000,
    user: "3Xf3xDmifk7jajp.root",
    password: "q3rO4ldBB11NfcDR",
    database: "test",
    ssl: { rejectUnauthorized: false },
  });
  try {
    const [tables] = await pool.query("SHOW TABLES LIKE 'acheteur'");
    console.log("Found:", tables.length);
    if (tables.length) {
      const [desc] = await pool.query("DESCRIBE acheteur");
      for (const c of desc) console.log(c.Field, c.Type, c.Null, c.Default, c.Key, c.Extra);
    }
  } catch (err) {
    console.error("ERROR:", err.message);
  }
  await pool.end();
}
run();
