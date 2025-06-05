// Importujemy Sequelize oraz typy danych
const { Sequelize, DataTypes } = require('sequelize');

// Tworzymy połączenie z bazą danych SQLite
const sequelize = new Sequelize({
  dialect: 'sqlite',           // Używamy bazy danych SQLite
  storage: './database.sqlite' // Ścieżka do pliku z bazą danych
});

// Definicja modelu użytkownika
const User = sequelize.define('User', {
  login: {
    type: DataTypes.STRING,    // Login jako tekst
    allowNull: false,          // Pole obowiązkowe
    validate: {
      notEmpty: { msg: "Login nie może być pusty" } // Walidacja: nie może być pusty
    }
  },
  password: {
    type: DataTypes.STRING,    // Hasło jako tekst
    allowNull: false,          // Pole obowiązkowe
    validate: {
      notEmpty: { msg: "Hasło nie może być puste" } // Walidacja: nie może być puste
    }
  }
});

// Definicja modelu operacji finansowej (np. wydatek lub przychód)
const Operation = sequelize.define('Operation', {
  amount: {
    type: DataTypes.FLOAT,     // Kwota jako liczba zmiennoprzecinkowa
    allowNull: false           // Pole obowiązkowe
  },
  description: {
    type: DataTypes.STRING,    // Opis operacji (np. "zakupy")
    allowNull: false
  },
  category: {
    type: DataTypes.STRING,    // Kategoria operacji (np. "jedzenie")
    allowNull: false
  },
  type: {
    type: DataTypes.STRING,    // Typ operacji ("income" lub "expense")
    allowNull: false
  },
  date: {
    type: DataTypes.DATE,      // Data operacji
    defaultValue: DataTypes.NOW // Domyślnie bieżąca data i czas
  }
});

// Relacja: jeden użytkownik może mieć wiele operacji
User.hasMany(Operation);
// Każda operacja należy do jednego użytkownika
Operation.belongsTo(User);

// Synchronizujemy modele z bazą danych (tworzy tabele, jeśli nie istnieją)
sequelize.sync().then(() => console.log("Baza danych zsynchronizowana"));

// Eksportujemy modele, aby można było ich używać w innych plikach
module.exports = { User, Operation };
