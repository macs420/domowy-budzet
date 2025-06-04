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
const categorySelect = document.getElementById("category");
const summaryElement = document.getElementById("summary");

let editOperationId = null;

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
  editOperationId = null;
  addOperationBtn.textContent = "Dodaj operację";
};

authBtn.addEventListener("click", async () => {
  const login = document.getElementById("login").value;
  const password = document.getElementById("password").value;

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
  const amount = document.getElementById("amount").value;
  const description = document.getElementById("description").value;
  const category = document.getElementById("category").value;
  const type = document.getElementById("type").value;

  if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) < 0 || !description || !category || !type) {
    alert("Wszystkie pola muszą być wypełnione, a kwota musi być liczbą nieujemną.");
    return;
  }

  const method = editOperationId ? "PUT" : "POST";
  const url = editOperationId ? `/edit-operation/${editOperationId}` : "/add-operation";

  const response = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount, description, category, type }),
    credentials: "include"
  });

  const data = await response.json();
  if (data.success) {
    resetInputs();
    await loadTransactions();
  } else {
    alert((editOperationId ? "Błąd edycji: " : "Błąd dodawania operacji: ") + (data.message || "brak informacji z serwera"));
  }
});

exportBtn.addEventListener("click", () => {
  const rows = transactionsTable.rows;
  let csvContent = "Data,Kwota,Typ,Kategoria,Opis\n";
  for (let i = 0; i < rows.length; i++) {
    const cells = rows[i].cells;
    const rowContent = Array.from(cells).slice(0, 5).map(cell => cell.textContent).join(",");
    csvContent += rowContent + "\n";
  }
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "transakcje.csv";
  link.click();
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
  let byMonth = {};
  transactionsTable.innerHTML = "";

  if (!Array.isArray(data.transactions)) {
    console.warn("Brak tablicy transakcji");
    return;
  }

  data.transactions.forEach(t => {
    const row = document.createElement("tr");
    const date = new Date(t.date || t.createdAt);
    const dateStr = date.toLocaleString();
    row.innerHTML = `
      <td>${dateStr}</td>
      <td>${t.amount}</td>
      <td>${t.type}</td>
      <td>${t.category}</td>
      <td>${t.description}</td>
      <td>
        <button onclick="editOperation(${t.id}, '${t.amount}', '${t.description}', '${t.category}', '${t.type}')">✏️</button>
        <button onclick="deleteOperation(${t.id})">🗑</button>
      </td>
    `;
    transactionsTable.appendChild(row);

    const key = `${date.getFullYear()}-${(date.getMonth()+1).toString().padStart(2, '0')}`;
    if (!byMonth[key]) {
      byMonth[key] = { przychody: 0, wydatki: 0 };
    }

    const amount = parseFloat(t.amount);
    if (t.type === "Przychód") {
      przychody += amount;
      byMonth[key].przychody += amount;
    }
    if (t.type === "Wydatek") {
      wydatki += amount;
      byMonth[key].wydatki += amount;
    }
  });

  const saldo = przychody - wydatki;
  let summaryHtml = `
  <div class="summary-box">
    <h3>💰 Podsumowanie ogólne</h3>
    <p><strong>Przychody:</strong> ${przychody.toFixed(2)} zł</p>
    <p><strong>Wydatki:</strong> ${wydatki.toFixed(2)} zł</p>
    <p><strong>Saldo:</strong> <span class="${saldo >= 0 ? 'saldo-plus' : 'saldo-minus'}">${saldo.toFixed(2)} zł</span></p>
    <h4>📆 Miesięczne zestawienia</h4>
    <ul class="monthly-list">
`;

  Object.entries(byMonth).forEach(([month, values]) => {
    const saldoM = values.przychody - values.wydatki;
    summaryHtml += `<li><strong>${month}:</strong> Przychody: ${values.przychody.toFixed(2)} zł, Wydatki: ${values.wydatki.toFixed(2)} zł, Saldo: <span class="${saldoM >= 0 ? 'saldo-plus' : 'saldo-minus'}">${saldoM.toFixed(2)} zł</span></li>`;
  });

  summaryHtml += `</ul></div>`;

  summaryElement.innerHTML = summaryHtml;
};

function editOperation(id, amount, description, category, type) {
  document.getElementById("amount").value = amount;
  document.getElementById("description").value = description;
  document.getElementById("category").value = category;
  document.getElementById("type").value = type;
  editOperationId = id;
  addOperationBtn.textContent = "Zapisz zmiany";
}

async function deleteOperation(id) {
  const response = await fetch(`/delete-operation/${id}`, { method: "DELETE", credentials: "include" });
  const data = await response.json();
  if (data.success) {
    await loadTransactions();
  } else {
    alert("Nie udało się usunąć operacji");
  }
}

window.editOperation = editOperation;
showSection(authSection);
