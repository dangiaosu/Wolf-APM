const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const app = express();
const { authenticator } = require('otplib'); // Dùng otplib để tạo mã 2FA
const port = 5000;

app.use(cors());
app.use(express.json());

// Kết nối và khởi tạo SQLite DB
const db = new sqlite3.Database('./airdrop.db', (err) => {
  if (err) {
    console.error(err.message);
  } else {
    console.log('Connected to the airdrop database.');
  }
});

// Khởi tạo bảng nếu chưa có
db.run(`
  CREATE TABLE IF NOT EXISTS profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    profile_name TEXT,
    gmail TEXT,
    gmail_password TEXT,
    gmail_2fa TEXT,
    twitter TEXT,
    twitter_password TEXT,
    twitter_2fa TEXT,
    discord TEXT,
    discord_password TEXT,
    discord_2fa TEXT,
    telegram TEXT,
    phone_number TEXT,
    sim_card TEXT,
    galxe TEXT,
    evm_address TEXT,
    ton_address TEXT,
    evm_key TEXT,
    ton_key TEXT
  )
`);

// API lấy danh sách profile (GET request)
app.get('/api/profiles', (req, res) => {
  db.all('SELECT * FROM profiles', [], (err, rows) => {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.json({ data: rows });
  });
});

// API thêm profile mới (POST request)
app.post('/api/profiles', (req, res) => {
  const {
    profile_name, gmail, gmail_password, gmail_2fa, twitter, twitter_password, twitter_2fa,
    discord, discord_password, discord_2fa, telegram, phone_number, sim_card, galxe,
    evm_address, ton_address, evm_key, ton_key
  } = req.body;

  const query = `
    INSERT INTO profiles (profile_name, gmail, gmail_password, gmail_2fa, twitter, twitter_password, twitter_2fa, discord, discord_password, discord_2fa, telegram, phone_number, sim_card, galxe, evm_address, ton_address, evm_key, ton_key)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const params = [profile_name, gmail, gmail_password, gmail_2fa, twitter, twitter_password, twitter_2fa,
    discord, discord_password, discord_2fa, telegram, phone_number, sim_card, galxe,
    evm_address, ton_address, evm_key, ton_key];

  db.run(query, params, function (err) {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.json({ message: 'Profile added successfully', id: this.lastID });
  });
});

// API cập nhật profile (PUT request)
app.put('/api/profiles/:id', (req, res) => {
  const id = req.params.id;
  const {
    profile_name, gmail, gmail_password, gmail_2fa, twitter, twitter_password, twitter_2fa,
    discord, discord_password, discord_2fa, telegram, phone_number, sim_card, galxe,
    evm_address, ton_address, evm_key, ton_key
  } = req.body;

  const query = `
    UPDATE profiles SET 
    profile_name = ?, gmail = ?, gmail_password = ?, gmail_2fa = ?, 
    twitter = ?, twitter_password = ?, twitter_2fa = ?, 
    discord = ?, discord_password = ?, discord_2fa = ?, 
    telegram = ?, phone_number = ?, sim_card = ?, galxe = ?, 
    evm_address = ?, ton_address = ?, evm_key = ?, ton_key = ? 
    WHERE id = ?
  `;

  const params = [
    profile_name, gmail, gmail_password, gmail_2fa, 
    twitter, twitter_password, twitter_2fa, 
    discord, discord_password, discord_2fa, 
    telegram, phone_number, sim_card, galxe, 
    evm_address, ton_address, evm_key, ton_key, id
  ];

  db.run(query, params, function (err) {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.json({ message: 'Profile updated successfully' });
  });
});

// API xóa profile (DELETE request)
app.delete('/api/profiles', (req, res) => {
  const { ids } = req.body;
  const placeholders = ids.map(() => '?').join(',');
  const query = `DELETE FROM profiles WHERE id IN (${placeholders})`;

  db.run(query, ids, function (err) {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.json({ message: `Deleted ${this.changes} profiles` });
  });
});

// API lấy mã 2FA hiện tại và thời gian tồn tại
app.post('/api/get-2fa-code', (req, res) => {
  const { secretKey } = req.body;
  if (!secretKey) {
    return res.status(400).json({ error: 'Secret key is required' });
  }
  try {
    const token = authenticator.generate(secretKey); // Tạo mã 2FA
    const remainingTime = authenticator.timeRemaining(); // Thời gian còn lại trước khi mã hết hạn
    res.json({ token, remainingTime });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate 2FA token' });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
