const express = require('express');
const nodemailer = require('nodemailer');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 4000;

// Middleware
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(express.static(__dirname));

// Connect to otp_demo
const otpDb = mysql.createConnection({
 host: "bfyv1gkzzmsm0fiypghl-mysql.services.clever-cloud.com",
  user: "uiyjzcq9hipagnqc",
  password: "21gQTjNOa7TwuU03fTnt",
  database: "bfyv1gkzzmsm0fiypghl",// Database for file details

});

// Connect to roomlisting
const roomDb = mysql.createConnection({


 host: "b7zil8smhphiickbwt8k-mysql.services.clever-cloud.com",
  user: "uy9bym8ht3eqep9s",
  password: "fVB3LNXTI82Qymt4ckLX",
  database: "b7zil8smhphiickbwt8k",// Database for file details

});

otpDb.connect(err => {
  if (err) throw err;
  console.log('✅ OTP MySQL connected');
});

roomDb.connect(err => {
  if (err) throw err;
  console.log('✅ Room MySQL connected');
});

// Serve HTML
app.get('/', (_, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/verify.html', (_, res) => res.sendFile(path.join(__dirname, 'verify.html')));

// OTP Routes
app.post('/send-otp', (req, res) => {
  const email = req.body.email;
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); 

  otpDb.query(
    'INSERT INTO users (email, otp, otp_expires_at) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE otp = ?, otp_expires_at = ?, is_verified = 0',
    [email, otp, expiresAt, otp, expiresAt],
    (err) => {
      if (err) return res.send('DB Error');

      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'eravikumar383@gmail.com',
          pass: 'owot kxob fizb qdum'
        }
      });

      transporter.sendMail({
        from: 'OTP System <your-email@gmail.com>',
        to: email,
        subject: 'Your OTP Code',
        html: `<p>Your OTP is <b>${otp}</b>. It expires in 5 minutes.</p>`
      }, err => {
        if (err) return res.send('Email error');
        res.redirect('/verify.html');
      });
    }
  );
});

app.post('/verify-otp', (req, res) => {
  const { email, otp } = req.body;

  otpDb.query(
    'SELECT * FROM users WHERE email = ? AND otp = ? AND otp_expires_at > NOW()',
    [email, otp],
    (err, results) => {
      if (err) return res.send('DB error');

      if (results.length === 0) {
        return res.send('<h2 style="color:red;text-align:center;">❌ Invalid or expired OTP</h2>');
      }

      otpDb.query('UPDATE users SET is_verified = 1 WHERE email = ?', [email], (err) => {
        if (err) return res.send('DB update error');
        res.send(`<h2 style="color:green;text-align:center;">✅ OTP  verified successfully!</h2>`);
      });
    }
  );
});

// Room upload
app.post('/upload', (req, res) => {
  const { area_name, address, contact, map_url, images } = req.body;
  const sql = `INSERT INTO rooms (area_name, address, contact, map_url, images) VALUES (?, ?, ?, ?, ?)`;
  roomDb.query(sql, [area_name, address, contact, map_url, JSON.stringify(images)], err => {
    if (err) return res.status(500).send('DB error');
    res.sendStatus(200);
  });
});

// View rooms
app.get('/rooms', (req, res) => {
  roomDb.query('SELECT * FROM rooms ORDER BY id DESC', (err, results) => {
    if (err) return res.status(500).send('DB error');
    res.json(results);
  });
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
