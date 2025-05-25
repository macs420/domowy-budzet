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

// Funkcje pomocnicze
const showSection = (section) => {
    authSection.style.display = "none";
    operationSection.style.display = "none";
    transactionsSection.style.display = "none";
    section.style.display = "block";
};

const resetInputs = () => {
    document.getElementById("amount").value = "";
    document.getElementById("description").value = "";
    document.getElementById("category").value = "Przychód";
};

// Eventy
authBtn.addEventListener("click", async () => {
    const login = document.getElementById("login").value;
    const password = document.getElementById("password").value;
    
    const response = await fetch("/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login, password })
    });

    const data = await response.json();
    if (data.success) {
        currentUser = data.user;
        showSection(operationSection);
        loadTransactions();
        logoutBtn.style.display = "inline-block";
        authSection.style.display = "none";
    } else {
        alert("Błąd logowania!");
    }
});

registerBtn.addEventListener("click", async () => {
    const login = document.getElementById("login").value;
    const password = document.getElementById("password").value;

    const response = await fetch("/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login, password })
    });

    const data = await response.json();
    if (data.success) {
        alert("Rejestracja zakończona sukcesem. Możesz się teraz zalogować.");
    } else {
        alert("Błąd rejestracji!");
    }
});

logoutBtn.addEventListener("click", async () => {
    const response = await fetch("/logout", { method: "POST" });
    if (response.ok) {
        currentUser = null;
        showSection(authSection);
        logoutBtn.style.display = "none";
    }
});

addOperationBtn.addEventListener("click", async () => {
    const amount = document.getElementById("amount").value;
    const description = document.getElementById("description").value;
    const category = document.getElementById("category").value;

    const response = await fetch("/add-operation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id, amount, description, category })
    });

    const data = await response.json();
    if (data.success) {
        resetInputs();
        loadTransactions();
    } else {
        alert("Błąd dodawania operacji!");
    }
});

exportBtn.addEventListener("click", () => {
    // Eksportowanie danych do CSV
    const rows = transactionsTable.rows;
    let csvContent = "Data, Kwota, Typ, Kategoria, Opis\n";
    
    for (let i = 0; i < rows.length; i++) {
        const cells = rows[i].cells;
        const rowContent = Array.from(cells).map(cell => cell.textContent).join(", ");
        csvContent += rowContent + "\n";
    }

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "transactions.csv";
    link.click();
});

// Ładowanie transakcji
const loadTransactions = async () => {
    const response = await fetch("/get-transactions");
    const data = await response.json();
    const rows = data.transactions.map(transaction => {
        return `<tr>
            <td>${transaction.date}</td>
            <td>${transaction.amount}</td>
            <td>${transaction.type}</td>
            <td>${transaction.category}</td>
            <td>${transaction.description}</td>
        </tr>`;
    });
    transactionsTable.innerHTML = rows.join('');
    showSection(transactionsSection);
};

