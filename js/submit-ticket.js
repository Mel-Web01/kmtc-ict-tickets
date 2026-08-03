import { db } from "./firebase-config.js";
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const ticketForm = document.getElementById("ticketForm");
const formMessage = document.getElementById("formMessage");

ticketForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const submitBtn = document.getElementById("submitBtn");
  submitBtn.disabled = true;
  submitBtn.textContent = "Submitting...";

  try {
    const referenceNumber = "TCK-" + Math.floor(1000 + Math.random() * 9000);

    const ticketData = {
      referenceNumber: referenceNumber,
      name: document.getElementById("name").value,
      email: document.getElementById("email").value,
      phone: document.getElementById("phone").value,
      location: document.getElementById("location").value,
      campus: document.getElementById("campus").value,
      issueType: document.getElementById("issueType").value,
      urgency: document.getElementById("urgency").value,
      description: document.getElementById("description").value,
      status: "Submitted",
      createdAt: serverTimestamp()
    };

    await addDoc(collection(db, "tickets"), ticketData);

    formMessage.textContent = `Ticket submitted! Your reference number is ${referenceNumber}. Please save it to check your status later.`;
    formMessage.style.color = "green";

    ticketForm.reset();

  } catch (error) {
    formMessage.textContent = "Something went wrong. Please try again.";
    formMessage.style.color = "red";
    console.error("Error adding ticket: ", error);
  }

  submitBtn.disabled = false;
  submitBtn.textContent = "Submit Ticket";
});