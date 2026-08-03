// Import the database connection
import { db } from "./firebase-config.js";

// Import the Firestore functions we need to search for documents
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Grab the elements we need from the HTML
const statusForm = document.getElementById("statusForm");
const statusMessage = document.getElementById("statusMessage");
const ticketDetails = document.getElementById("ticketDetails");

statusForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const checkBtn = document.getElementById("checkBtn");
  checkBtn.disabled = true;
  checkBtn.textContent = "Checking...";

  // Hide any previous result while we search
  ticketDetails.style.display = "none";
  statusMessage.textContent = "";

  try {
    // Get what the person typed, and remove extra spaces
    const enteredRef = document.getElementById("referenceNumber").value.trim();

    // Build a query: "look in the 'tickets' collection,
    // where the field 'referenceNumber' equals what was typed"
    const ticketsRef = collection(db, "tickets");
    const q = query(ticketsRef, where("referenceNumber", "==", enteredRef));

    // Actually run that search against Firestore
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      // No ticket found with that reference number
      statusMessage.textContent = "No ticket found with that reference number. Please check and try again.";
      statusMessage.style.color = "red";
    } else {
      // Found it — there should only ever be one match
      const ticket = querySnapshot.docs[0].data();

      // Fill in the details section
      document.getElementById("detailRef").textContent = ticket.referenceNumber;
      document.getElementById("detailStatus").textContent = ticket.status;
      document.getElementById("detailIssueType").textContent = ticket.issueType;
      document.getElementById("detailUrgency").textContent = ticket.urgency;
      document.getElementById("detailDescription").textContent = ticket.description;

      // Firestore timestamps need to be converted to a readable date
      const dateObj = ticket.createdAt ? ticket.createdAt.toDate() : null;
      document.getElementById("detailDate").textContent = dateObj ? dateObj.toLocaleString() : "Unknown";

      // Show the details section
      ticketDetails.style.display = "block";
      statusMessage.textContent = "";
    }

  } catch (error) {
    statusMessage.textContent = "Something went wrong. Please try again.";
    statusMessage.style.color = "red";
    console.error("Error checking status: ", error);
  }

  checkBtn.disabled = false;
  checkBtn.textContent = "Check Status";
});