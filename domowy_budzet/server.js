const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const { User, Operation } = require('./database');

const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(session({ secret: 'secret', resave: false, saveUninitialized: true }));
app.use(express.static('public'));

app.post('/register', async (req, res) => {
  const { login, password } = req.body;
  try {
    const user = await User.create({ login, password });
    res.json({ success: true });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

app.post('/login', async (req, res) => {
  const { login, password } = req.body;
  try {
    const user = await User.findOne({ where: { login, password } });
    if (user) {
      req.session.userId = user.id;
      res.json({ success: true, user });
    } else {
      res.json({ success: false });
    }
  } catch (err) {
    res.json({ success: false });
  }
});

app.post('/logout', (req, res) => {
  req.session.destroy();
  res.sendStatus(200);
});

app.post('/add-operation', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ success: false, message: "Zaloguj się!" });
  }

  const { amount, description, category, type } = req.body;
  try {
    const operation = await Operation.create({
      userId: req.session.userId,
      amount,
      description,
      category,
      type,
      date: new Date()
    });
    res.json({ success: true });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

app.get('/get-transactions', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ success: false, message: "Zaloguj się!" });
  }
  const transactions = await Operation.findAll({ where: { userId: req.session.userId } });
  res.json({ transactions });
});

app.delete('/delete-operation/:id', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ success: false });
  }

  try {
    await Operation.destroy({ where: { id: req.params.id, userId: req.session.userId } });
    res.json({ success: true });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

app.listen(port, () => {
  console.log(`Aplikacja działa na http://localhost:${port}`);
});