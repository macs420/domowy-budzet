// Importujemy potrzebne biblioteki
const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const { User, Operation } = require('./database'); // Importujemy modele z bazy danych

const app = express();
const port = 3000;

// Umożliwia odczyt danych w formacie JSON
app.use(bodyParser.json());

// Konfiguracja sesji użytkownika (przechowuje kto jest zalogowany)
app.use(session({ secret: 'secret', resave: false, saveUninitialized: true }));

// Udostępnianie folderu publicznego (np. z frontendem)
app.use(express.static('public'));

// Rejestracja nowego użytkownika
app.post('/register', async (req, res) => {
  const { login, password } = req.body;

  // Sprawdzamy, czy podano dane
  if (!login || !password) {
    return res.json({ success: false, message: "Login i hasło są wymagane." });
  }

  try {
    // Tworzymy nowego użytkownika w bazie danych
    const user = await User.create({ login, password });
    res.json({ success: true });
  } catch (err) {
    // Obsługa błędu (np. login już istnieje)
    res.json({ success: false, message: err.message });
  }
});

// Logowanie użytkownika
app.post('/login', async (req, res) => {
  const { login, password } = req.body;

  // Sprawdzamy dane wejściowe
  if (!login || !password) {
    return res.json({ success: false, message: "Login i hasło są wymagane." });
  }

  try {
    // Szukamy użytkownika o podanym loginie i haśle
    const user = await User.findOne({ where: { login, password } });
    if (user) {
      // Zapisujemy ID użytkownika w sesji
      req.session.userId = user.id;
      console.log("Zalogowano użytkownika ID:", user.id);
      res.json({ success: true, user });
    } else {
      // Jeśli nie znaleziono użytkownika
      res.json({ success: false, message: "Nieprawidłowe dane logowania." });
    }
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

// Wylogowanie użytkownika
app.post('/logout', (req, res) => {
  // Usuwamy dane z sesji
  req.session.destroy();
  res.sendStatus(200);
});

// Dodawanie nowej operacji (przychód lub wydatek)
app.post('/add-operation', async (req, res) => {
  console.log("Dodawanie operacji. Sesja userId:", req.session.userId);

  // Sprawdzamy, czy użytkownik jest zalogowany
  if (!req.session.userId) {
    return res.status(401).json({ success: false, message: "Zaloguj się!" });
  }

  const { amount, description, category, type } = req.body;
  const parsedAmount = parseFloat(amount);

  // Walidacja danych wejściowych
  if (!amount || isNaN(parsedAmount) || parsedAmount < 0 || !description || !category || !type) {
    return res.json({ success: false, message: "Wszystkie pola są wymagane, a kwota musi być nieujemną liczbą." });
  }

  try {
    // Tworzymy nową operację i przypisujemy ją do użytkownika
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

// Edytowanie istniejącej operacji
app.put('/edit-operation/:id', async (req, res) => {
  // Sprawdzamy, czy użytkownik jest zalogowany
  if (!req.session.userId) {
    return res.status(401).json({ success: false, message: "Brak dostępu." });
  }

  const { amount, description, category, type } = req.body;
  const parsedAmount = parseFloat(amount);

  // Walidacja danych
  if (!amount || isNaN(parsedAmount) || parsedAmount < 0 || !description || !category || !type) {
    return res.json({ success: false, message: "Nieprawidłowe dane wejściowe." });
  }

  try {
    // Aktualizujemy operację należącą do zalogowanego użytkownika
    const updated = await Operation.update(
      { amount: parsedAmount, description, category, type },
      { where: { id: req.params.id, UserId: req.session.userId } }
    );
    res.json({ success: true });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

// Pobieranie wszystkich operacji danego użytkownika
app.get('/get-transactions', async (req, res) => {
  console.log("Pobieranie transakcji dla userId:", req.session.userId);

  // Sprawdzamy, czy użytkownik jest zalogowany
  if (!req.session.userId) {
    return res.status(401).json({ success: false, message: "Zaloguj się!" });
  }

  // Pobieramy wszystkie operacje przypisane do użytkownika
  const transactions = await Operation.findAll({ where: { UserId: req.session.userId } });
  console.log("Znalezione transakcje:", transactions.length);
  res.json({ transactions });
});

// Usuwanie operacji na podstawie jej ID
app.delete('/delete-operation/:id', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ success: false });
  }

  try {
    // Usuwamy operację, ale tylko jeśli należy do aktualnie zalogowanego użytkownika
    await Operation.destroy({ where: { id: req.params.id, UserId: req.session.userId } });
    res.json({ success: true });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

// Uruchamiamy serwer na porcie 3000
app.listen(port, () => {
  console.log(`Aplikacja działa na http://localhost:${port}`);
});
