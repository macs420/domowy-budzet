## Autorzy

- Polina Rybachuk – 53556
- Maksymilian Majek – 51323
- Karolina Karczewska – 53835

# Domowy Budżet

Aplikacja internetowa umożliwiająca zarządzanie finansami domowymi. Pozwala użytkownikom na rejestrowanie kont, logowanie się oraz dodawanie własnych operacji finansowych (przychody i wydatki). Dane są przechowywane lokalnie w bazie danych SQLite.

## Funkcjonalności

- Rejestracja i logowanie użytkowników
- Dodawanie, edytowanie i usuwanie operacji (przychody/wydatki)
- Przypisywanie kategorii i opisów
- Historia transakcji w tabeli
- Obliczanie salda i miesięcznych zestawień
- Eksport danych do pliku CSV

## Technologie

- Node.js + Express (backend)
- Sequelize (ORM)
- SQLite (baza danych)
- JavaScript, HTML, CSS (frontend - do dodania)

## Uruchamianie projektu

1. Zainstaluj zależności:

npm install

2. Uruchom serwer:

npm start

Aplikacja domyślnie nasłuchuje na porcie `3000`. Frontend powinien znajdować się w katalogu `public/`.

## Struktura plików

- `server.js` – serwer Express z logiką logowania, rejestracji i dodawania operacji
- `database.js` – konfiguracja bazy danych SQLite i definicje modeli
- `database.sqlite` – lokalna baza danych
- `public/` – frontend (jeśli zostanie dodany)
