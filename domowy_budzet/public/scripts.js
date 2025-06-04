let currentUser = null;
const authSection = document.getElementById("authSection");
const operationSection = document.getElementById("operationSection");
const transactionsSection = document.getElementById("transactionsSection");
const logoutBtn = document.getElementById("logoutBtn");
const transactionsTable = document.getElementById("transactionsTable").getElementsByTagName("tbody")[0];
const addOperationBtn = document.getElementById("addOperationBtn");
const exportBtn = document.getElementById("exportBtn");
const authBtn = document.getElementById("authBtn");
const registerBtn = document.getElementById("registerBtn");

const showSection = (section) => {
  authSection.style.display = "none";
  operationSection.style.display = "none";
  transactionsSection.style.display = "none";
  section.style.display = "block";
};

const resetInputs = () => {
  document.getElementById("amount").value = "";
  document.getElementById("description").value = "";
  document.getElementById("category").value = "Jedzenie";
  document.getElementById("type").value = "Przychód";
};

authBtn.addEventListener("click", async () => {
  const login = document.getElementById("login").value;
  const password = document.getElementById("password").value;
  if (!login || !password) {
    alert("Wprowadź login i hasło.");
    return;
  }
  const response = await fetch("/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ login, password }),
    credentials: "include"
  });

  const data = await response.json();
  if (data.success) {
    currentUser = data.user;
    logoutBtn.style.display = "inline-block";
    await loadTransactions();
    showSection(operationSection);
    transactionsSection.style.display = "block";
  } else {
    alert("Błąd logowania: " + (data.message || "brak informacji z serwera"));
  }
});

registerBtn.addEventListener("click", async () => {
  const login = document.getElementById("login").value;
  const password = document.getElementById("password").value;
  if (!login || !password) {
    alert("Wprowadź login i hasło.");
    return;
  }
  const response = await fetch("/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ login, password }),
    credentials: "include"
  });

  const data = await response.json();
  if (data.success) {
    alert("Rejestracja zakończona sukcesem. Możesz się teraz zalogować.");
  } else {
    alert("Błąd rejestracji: " + (data.message || "brak informacji z serwera"));
  }
});

logoutBtn.addEventListener("click", async () => {
  await fetch("/logout", { method: "POST", credentials: "include" });
  currentUser = null;
  showSection(authSection);
  logoutBtn.style.display = "none";
});

addOperationBtn.addEventListener("click", async () => {
  const amount = document.getElementById("amount").value.trim();
  const description = document.getElementById("description").value.trim();
  const category = document.getElementById("category").value;
  const type = document.getElementById("type").value;

  const parsedAmount = parseFloat(amount);
  if (!amount || isNaN(parsedAmount) || parsedAmount < 0 || !description || !category || !type) {
    alert("Upewnij się, że wszystkie pola są wypełnione, a kwota to liczba nieujemna.");
    return;
  }

  const response = await fetch("/add-operation", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount, description, category, type }),
    credentials: "include"
  });

  const data = await response.json();
  if (data.success) {
    resetInputs();
    await loadTransactions();
  } else {
    alert("Błąd dodawania operacji: " + (data.message || "brak informacji z serwera"));
  }
});

const loadTransactions = async () => {
  const response = await fetch("/get-transactions", { credentials: "include" });
  if (!response.ok) {
    console.error("Błąd pobierania transakcji");
    return;
  }
  const data = await response.json();
  console.log("Odebrane transakcje:", data.transactions);

  let przychody = 0, wydatki = 0;
  transactionsTable.innerHTML = "";

  if (!Array.isArray(data.transactions)) {
    console.warn("Brak tablicy transakcji");
    return;
  }

  data.transactions.forEach(t => {
    const row = document.createElement("tr");
    const date = new Date(t.date || t.createdAt).toLocaleString();
    row.innerHTML = `
      <td>${date}</td>
      <td>${t.amount}</td>
      <td>${t.type}</td>
      <td>${t.category}</td>
      <td>${t.description}</td>
      <td><button onclick="deleteOperation(${t.id})">🗑</button></td>
    `;
    transactionsTable.appendChild(row);
    if (t.type === "Przychód") przychody += parseFloat(t.amount);
    if (t.type === "Wydatek") wydatki += parseFloat(t.amount);
  });

  const saldo = przychody - wydatki;
  document.getElementById("summary").textContent = `Przychody: ${przychody.toFixed(2)} zł, Wydatki: ${wydatki.toFixed(2)} zł, Saldo: ${saldo.toFixed(2)} zł`;
  transactionsSection.style.display = "block";
};

async function deleteOperation(id) {
  const response = await fetch(`/delete-operation/${id}`, { method: "DELETE", credentials: "include" });
  const data = await response.json();
  if (data.success) {
    await loadTransactions();
  } else {
    alert("Nie udało się usunąć operacji");
  }
}

showSection(authSection);
