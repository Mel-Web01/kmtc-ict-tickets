import { db } from "./firebase-config.js";

import { 
  getAuth, 
  signInWithEmailAndPassword, 
  onAuthStateChanged, 
  signOut,
  reauthenticateWithCredential,
  EmailAuthProvider,
  updatePassword
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import { 
  collection, 
  getDocs, 
  addDoc,
  doc, 
  updateDoc, 
  deleteDoc,
  orderBy, 
  query 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const auth = getAuth();

const loginSection = document.getElementById("loginSection");
const dashboardSection = document.getElementById("dashboardSection");
const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");
const logoutBtn = document.getElementById("logoutBtn");
const sortSelect = document.getElementById("sortSelect");
const viewSelect = document.getElementById("viewSelect");
const campusSelect = document.getElementById("campusSelect");
const ticketsContainer = document.getElementById("ticketsContainer");
const recentTicketsContainer = document.getElementById("recentTicketsContainer");
const officersList = document.getElementById("officersList");

const showAddOfficerBtn = document.getElementById("showAddOfficerBtn");
const addOfficerForm = document.getElementById("addOfficerForm");
const saveOfficerBtn = document.getElementById("saveOfficerBtn");
const cancelOfficerBtn = document.getElementById("cancelOfficerBtn");
const officerFormMessage = document.getElementById("officerFormMessage");

const statTotal = document.getElementById("statTotal");
const statOpen = document.getElementById("statOpen");
const statResolved = document.getElementById("statResolved");
const statOverdue = document.getElementById("statOverdue");

const topbarGreeting = document.getElementById("topbarGreeting");
const notifBadge = document.getElementById("notifBadge");
const userMenuTrigger = document.getElementById("userMenuTrigger");
const userMenuDropdown = document.getElementById("userMenuDropdown");
const profileMenuBtn = document.getElementById("profileMenuBtn");

const profileAvatarLarge = document.getElementById("profileAvatarLarge");
const profileNameDisplay = document.getElementById("profileNameDisplay");
const submitPasswordBtn = document.getElementById("submitPasswordBtn");
const passwordChangeMessage = document.getElementById("passwordChangeMessage");

let allTickets = [];
let allOfficers = [];
let currentOfficerName = null;

const OVERDUE_THRESHOLDS_HOURS = { high: 24, medium: 72, low: 168 };

userMenuTrigger.addEventListener("click", (event) => {
  event.stopPropagation();
  userMenuDropdown.style.display = userMenuDropdown.style.display === "none" ? "flex" : "none";
});

document.addEventListener("click", () => {
  userMenuDropdown.style.display = "none";
});

const navItems = document.querySelectorAll(".nav-item");
const contentViews = document.querySelectorAll(".content-view");

function showView(targetId) {
  navItems.forEach(i => i.classList.remove("active"));
  const matchingNavItem = document.querySelector(`.nav-item[data-section="${targetId}"]`);
  if (matchingNavItem) matchingNavItem.classList.add("active");

  contentViews.forEach(view => {
    view.style.display = view.id === targetId ? "block" : "none";
  });
}

navItems.forEach(item => {
  item.addEventListener("click", () => {
    showView(item.getAttribute("data-section"));
  });
});

profileMenuBtn.addEventListener("click", () => {
  showView("profileView");
  userMenuDropdown.style.display = "none";
});

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    loginMessage.textContent = "Incorrect email or password.";
    loginMessage.style.color = "red";
    console.error("Login error:", error);
  }
});

logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
});

onAuthStateChanged(auth, async (user) => {
  if (user) {
    loginSection.style.display = "none";
    dashboardSection.style.display = "flex";

    await loadOfficers();

    const matchedOfficer = allOfficers.find(o => o.email.toLowerCase() === user.email.toLowerCase());
    currentOfficerName = matchedOfficer ? matchedOfficer.name : user.email;

    topbarGreeting.textContent = "Hi, Melvin";
    profileNameDisplay.textContent = currentOfficerName;

    const initials = currentOfficerName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
    profileAvatarLarge.textContent = initials;

    loadTickets();
  } else {
    loginSection.style.display = "flex";
    dashboardSection.style.display = "none";
    currentOfficerName = null;
  }
});

submitPasswordBtn.addEventListener("click", async () => {
  const currentPassword = document.getElementById("currentPassword").value;
  const newPassword = document.getElementById("newPassword").value;
  const confirmPassword = document.getElementById("confirmPassword").value;

  passwordChangeMessage.textContent = "";

  if (!currentPassword || !newPassword || !confirmPassword) {
    passwordChangeMessage.textContent = "Please fill in all fields.";
    passwordChangeMessage.style.color = "red";
    return;
  }

  if (newPassword !== confirmPassword) {
    passwordChangeMessage.textContent = "New password and confirmation do not match.";
    passwordChangeMessage.style.color = "red";
    return;
  }

  if (newPassword.length < 6) {
    passwordChangeMessage.textContent = "New password must be at least 6 characters.";
    passwordChangeMessage.style.color = "red";
    return;
  }

  try {
    const user = auth.currentUser;
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);
    await updatePassword(user, newPassword);

    passwordChangeMessage.textContent = "Password updated successfully.";
    passwordChangeMessage.style.color = "green";
    document.getElementById("currentPassword").value = "";
    document.getElementById("newPassword").value = "";
    document.getElementById("confirmPassword").value = "";
  } catch (error) {
    if (error.code === "auth/wrong-password" || error.code === "auth/invalid-credential") {
      passwordChangeMessage.textContent = "Current password is incorrect.";
    } else {
      passwordChangeMessage.textContent = "Failed to update password. Please try again.";
    }
    passwordChangeMessage.style.color = "red";
    console.error("Password change error:", error);
  }
});

async function loadOfficers() {
  try {
    const officersRef = collection(db, "officers");
    const querySnapshot = await getDocs(officersRef);
    allOfficers = [];
    querySnapshot.forEach((docSnapshot) => {
      allOfficers.push({ id: docSnapshot.id, ...docSnapshot.data() });
    });
    renderOfficersList();
  } catch (error) {
    console.error("Error loading officers:", error);
  }
}

function renderOfficersList() {
  if (allOfficers.length === 0) {
    officersList.innerHTML = "<p>No officers added yet.</p>";
    return;
  }

  officersList.innerHTML = "";
  allOfficers.forEach(officer => {
    const initials = officer.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
    officersList.innerHTML += `
      <div class="officer-card">
        <div class="officer-avatar">${initials}</div>
        <div class="officer-info">
          <p>${officer.name}</p>
          <p>${officer.email}</p>
        </div>
        <button class="remove-officer-btn" data-id="${officer.id}">Remove</button>
      </div>
    `;
  });

  document.querySelectorAll(".remove-officer-btn").forEach(btn => {
    btn.addEventListener("click", async (event) => {
      const officerId = event.target.getAttribute("data-id");
      if (confirm("Remove this officer from the list? (Their login will still exist in Firebase Authentication separately.)")) {
        try {
          await deleteDoc(doc(db, "officers", officerId));
          await loadOfficers();
        } catch (error) {
          alert("Failed to remove officer.");
          console.error(error);
        }
      }
    });
  });
}

showAddOfficerBtn.addEventListener("click", () => {
  addOfficerForm.style.display = addOfficerForm.style.display === "none" ? "block" : "none";
});

cancelOfficerBtn.addEventListener("click", () => {
  addOfficerForm.style.display = "none";
  document.getElementById("newOfficerName").value = "";
  document.getElementById("newOfficerEmail").value = "";
  officerFormMessage.textContent = "";
});

saveOfficerBtn.addEventListener("click", async () => {
  const name = document.getElementById("newOfficerName").value.trim();
  const email = document.getElementById("newOfficerEmail").value.trim();

  if (!name || !email) {
    officerFormMessage.textContent = "Please enter both name and email.";
    officerFormMessage.style.color = "red";
    return;
  }

  try {
    await addDoc(collection(db, "officers"), { name, email });
    officerFormMessage.textContent = "Officer added! Remember to also create their login in Firebase Authentication.";
    officerFormMessage.style.color = "green";
    document.getElementById("newOfficerName").value = "";
    document.getElementById("newOfficerEmail").value = "";
    await loadOfficers();
  } catch (error) {
    officerFormMessage.textContent = "Failed to add officer. Please try again.";
    officerFormMessage.style.color = "red";
    console.error(error);
  }
});

async function loadTickets() {
  ticketsContainer.innerHTML = "<p style='padding:16px;'>Loading tickets...</p>";

  try {
    const ticketsRef = collection(db, "tickets");
    const q = query(ticketsRef, orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);

    allTickets = [];
    querySnapshot.forEach((docSnapshot) => {
      allTickets.push({ id: docSnapshot.id, ...docSnapshot.data() });
    });

    updateStats();
    applyFiltersAndRender();
    renderRecentTickets();

  } catch (error) {
    ticketsContainer.innerHTML = "<p style='padding:16px;'>Error loading tickets.</p>";
    console.error("Error loading tickets:", error);
  }
}

function isOverdue(ticket) {
  if (ticket.status !== "Submitted") return false;
  if (!ticket.createdAt) return false;
  const submittedDate = ticket.createdAt.toDate();
  const hoursSinceSubmitted = (new Date() - submittedDate) / (1000 * 60 * 60);
  const threshold = OVERDUE_THRESHOLDS_HOURS[ticket.urgency] || 72;
  return hoursSinceSubmitted > threshold;
}

function updateStats() {
  const total = allTickets.length;
  const resolved = allTickets.filter(t => t.status === "Resolved").length;
  const open = total - resolved;
  const overdue = allTickets.filter(t => isOverdue(t)).length;

  statTotal.textContent = total;
  statOpen.textContent = open;
  statResolved.textContent = resolved;
  statOverdue.textContent = overdue;

  if (overdue > 0) {
    notifBadge.textContent = overdue;
    notifBadge.style.display = "inline-block";
  } else {
    notifBadge.style.display = "none";
  }

  renderCharts();
}

let statusChartInstance = null;
let urgencyChartInstance = null;

function renderCharts() {
  const statusCanvas = document.getElementById("statusChart");
  const urgencyCanvas = document.getElementById("urgencyChart");
  if (!statusCanvas || !urgencyCanvas || typeof Chart === "undefined") return;

  const submittedCount = allTickets.filter(t => t.status === "Submitted").length;
  const inProgressCount = allTickets.filter(t => t.status === "In Progress").length;
  const resolvedCount = allTickets.filter(t => t.status === "Resolved").length;

  const highCount = allTickets.filter(t => t.urgency === "high").length;
  const mediumCount = allTickets.filter(t => t.urgency === "medium").length;
  const lowCount = allTickets.filter(t => t.urgency === "low").length;

  if (statusChartInstance) statusChartInstance.destroy();
  if (urgencyChartInstance) urgencyChartInstance.destroy();

  statusChartInstance = new Chart(statusCanvas, {
    type: "doughnut",
    data: {
      labels: ["Submitted", "In Progress", "Resolved"],
      datasets: [{
        data: [submittedCount, inProgressCount, resolvedCount],
        backgroundColor: ["#b3261e", "#b06000", "#1a7d3a"]
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { position: "bottom", labels: { font: { size: 11 } } } }
    }
  });

  urgencyChartInstance = new Chart(urgencyCanvas, {
    type: "bar",
    data: {
      labels: ["High", "Medium", "Low"],
      datasets: [{
        label: "Tickets",
        data: [highCount, mediumCount, lowCount],
        backgroundColor: ["#b3261e", "#b06000", "#1a7d3a"]
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
    }
  });
}

function buildOfficerOptions(selectedName) {
  let options = `<option value="" ${!selectedName ? "selected" : ""}>Unassigned</option>`;
  allOfficers.forEach(officer => {
    options += `<option value="${officer.name}" ${selectedName === officer.name ? "selected" : ""}>${officer.name}</option>`;
  });
  return options;
}

function statusBadgeClass(status) {
  return "status-" + status.replace(/\s+/g, "");
}

function renderRecentTickets() {
  const recent = allTickets.slice(0, 5);
  if (recent.length === 0) {
    recentTicketsContainer.innerHTML = "<p style='padding:16px;'>No tickets yet.</p>";
    return;
  }
  let html = `
    <table class="tickets-table">
      <thead><tr><th>Reference</th><th>Name</th><th>Issue</th><th>Urgency</th><th>Status</th></tr></thead>
      <tbody>
  `;
  recent.forEach(ticket => {
    html += `
      <tr>
        <td>${ticket.referenceNumber}</td>
        <td>${ticket.name}</td>
        <td>${ticket.issueType}</td>
        <td class="urgency-${ticket.urgency}">${ticket.urgency}</td>
        <td><span class="status-badge ${statusBadgeClass(ticket.status)}">${ticket.status}</span></td>
      </tr>
    `;
  });
  html += "</tbody></table>";
  recentTicketsContainer.innerHTML = html;
}

function renderTickets(ticketsArray) {
  if (ticketsArray.length === 0) {
    ticketsContainer.innerHTML = "<p style='padding:16px;'>No tickets match this view.</p>";
    return;
  }

  let tableHTML = `
    <table class="tickets-table">
      <thead>
        <tr>
          <th>Reference</th><th>Name</th><th>Location</th><th>Office</th>
          <th>Issue</th><th>Urgency</th><th>Description</th><th>Assigned To</th><th>Status</th><th>Action</th>
        </tr>
      </thead>
      <tbody>
  `;

  ticketsArray.forEach((ticket) => {
    const overdue = isOverdue(ticket);
    tableHTML += `
      <tr>
        <td>${ticket.referenceNumber}</td>
        <td>${ticket.name}<br><small>${ticket.phone}</small></td>
        <td>${ticket.location}</td>
        <td>${ticket.campus || "—"}</td>
        <td>${ticket.issueType}</td>
        <td class="urgency-${ticket.urgency}">
          ${ticket.urgency}
          ${overdue ? '<br><span class="overdue-badge">⚠ Overdue</span>' : ''}
        </td>
        <td>${ticket.description}</td>
        <td>
          <select class="assignedSelect" data-id="${ticket.id}">
            ${buildOfficerOptions(ticket.assignedTo)}
          </select>
        </td>
        <td>
          <select data-id="${ticket.id}" class="statusSelect">
            <option value="Submitted" ${ticket.status === "Submitted" ? "selected" : ""}>Submitted</option>
            <option value="In Progress" ${ticket.status === "In Progress" ? "selected" : ""}>In Progress</option>
            <option value="Resolved" ${ticket.status === "Resolved" ? "selected" : ""}>Resolved</option>
          </select>
        </td>
        <td>
          <button class="delete-ticket-btn" data-id="${ticket.id}">Delete</button>
        </td>
      </tr>
    `;
  });

  tableHTML += "</tbody></table>";
  ticketsContainer.innerHTML = tableHTML;

  document.querySelectorAll(".statusSelect").forEach((selectEl) => {
    selectEl.addEventListener("change", async (event) => {
      const ticketId = event.target.getAttribute("data-id");
      const newStatus = event.target.value;
      try {
        await updateDoc(doc(db, "tickets", ticketId), { status: newStatus });
        const t = allTickets.find(t => t.id === ticketId);
        if (t) t.status = newStatus;
        updateStats();
        renderRecentTickets();
      } catch (error) {
        alert("Failed to update status. Please try again.");
        console.error("Update error:", error);
      }
    });
  });

  document.querySelectorAll(".assignedSelect").forEach((selectEl) => {
    selectEl.addEventListener("change", async (event) => {
      const ticketId = event.target.getAttribute("data-id");
      const newAssignedTo = event.target.value;
      try {
        await updateDoc(doc(db, "tickets", ticketId), { assignedTo: newAssignedTo });
        const t = allTickets.find(t => t.id === ticketId);
        if (t) t.assignedTo = newAssignedTo;
      } catch (error) {
        alert("Failed to update assignment. Please try again.");
        console.error("Assign error:", error);
      }
    });
  });

  document.querySelectorAll(".delete-ticket-btn").forEach((btnEl) => {
    btnEl.addEventListener("click", async (event) => {
      const ticketId = event.target.getAttribute("data-id");
      if (confirm("Permanently delete this ticket? This cannot be undone.")) {
        try {
          await deleteDoc(doc(db, "tickets", ticketId));
          allTickets = allTickets.filter(t => t.id !== ticketId);
          updateStats();
          applyFiltersAndRender();
          renderRecentTickets();
        } catch (error) {
          alert("Failed to delete ticket. Please try again.");
          console.error("Delete error:", error);
        }
      }
    });
  });
}

function applyFiltersAndRender() {
  let workingSet = [...allTickets];

  if (viewSelect.value === "mine") {
    workingSet = workingSet.filter(t => t.assignedTo === currentOfficerName);
  }
  if (campusSelect.value !== "all") {
    workingSet = workingSet.filter(t => t.campus === campusSelect.value);
  }
  if (sortSelect.value === "urgency") {
    const urgencyRank = { high: 3, medium: 2, low: 1 };
    workingSet.sort((a, b) => urgencyRank[b.urgency] - urgencyRank[a.urgency]);
  }

  renderTickets(workingSet);
}

sortSelect.addEventListener("change", applyFiltersAndRender);
viewSelect.addEventListener("change", applyFiltersAndRender);
campusSelect.addEventListener("change", applyFiltersAndRender);

function exportTicketsToCSV() {
  if (allTickets.length === 0) {
    alert("No tickets to export.");
    return;
  }

  const headers = ["Reference", "Name", "Email", "Phone", "Location", "Office", "Issue Type", "Urgency", "Description", "Assigned To", "Status"];
  let csvContent = headers.join(",") + "\n";

  allTickets.forEach(ticket => {
    const row = [
      ticket.referenceNumber,
      `"${ticket.name}"`,
      ticket.email,
      ticket.phone,
      `"${ticket.location}"`,
      `"${ticket.campus || ''}"`,
      ticket.issueType,
      ticket.urgency,
      `"${(ticket.description || '').replace(/"/g, '""')}"`,
      `"${ticket.assignedTo || 'Unassigned'}"`,
      ticket.status
    ];
    csvContent += row.join(",") + "\n";
  });

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `kmtc-tickets-${new Date().toISOString().slice(0,10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

const exportCsvBtn = document.getElementById("exportCsvBtn");
if (exportCsvBtn) {
  exportCsvBtn.addEventListener("click", exportTicketsToCSV);
}