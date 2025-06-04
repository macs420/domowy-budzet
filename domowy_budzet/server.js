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
  if (!login || !password) {
    return res.json({ success: false, message: "Login i hasło są wymagane." });
  }
  try {
    const user = await User.create({ login, password });
    res.json({ success: true });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

app.post('/login', async (req, res) => {
  const { login, password } = req.body;
  if (!login || !password) {
    return res.json({ success: false, message: "Login i hasło są wymagane." });
  }
  try {
    const user = await User.findOne({ where: { login, password } });
    if (user) {
      req.session.userId = user.id;
      console.log("Zalogowano użytkownika ID:", user.id);
      res.json({ success: true, user });
    } else {
      res.json({ success: false, message: "Nieprawidłowe dane logowania." });
    }
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

app.post('/logout', (req, res) => {
  req.session.destroy();
  res.sendStatus(200);
});

app.post('/add-operation', async (req, res) => {
  console.log("Dodawanie operacji. Sesja userId:", req.session.userId);
  if (!req.session.userId) {
    return res.status(401).json({ success: false, message: "Zaloguj się!" });
  }

  const { amount, description, category, type } = req.body;
  const parsedAmount = parseFloat(amount);
  if (!amount || isNaN(parsedAmount) || parsedAmount < 0 || !description || !category || !type) {
    return res.json({ success: false, message: "Wszystkie pola są wymagane, a kwota musi być nieujemną liczbą." });
  }
  try {
    const operation = await Operation.create({
      UserId: req.session.userId,
      amount: parsedAmount,
      description,
      category,
      type,
      date: new Date()
    });
    console.log("Dodano operację:", operation.toJSON());
    res.json({ success: true });
  } catch (err) {
    console.error("Błąd przy dodawaniu operacji:", err);
    res.json({ success: false, message: err.message });
  }
});

app.get('/get-transactions', async (req, res) => {
  console.log("Pobieranie transakcji dla userId:", req.session.userId);
  if (!req.session.userId) {
    return res.status(401).json({ success: false, message: "Zaloguj się!" });
  }
  const transactions = await Operation.findAll({ where: { UserId: req.session.userId } });
  console.log("Znalezione transakcje:", transactions.length);
  res.json({ transactions });
});

app.delete('/delete-operation/:id', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ success: false });
  }

  try {
    await Operation.destroy({ where: { id: req.params.id, UserId: req.session.userId } });
    res.json({ success: true });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

app.listen(port, () => {
  console.log(`Aplikacja działa na http://localhost:${port}`);
});
