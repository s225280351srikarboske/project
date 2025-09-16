const api = window.api // Declare the api variable assuming it's available globally

const cName = document.getElementById("cName")
const cEmail = document.getElementById("cEmail")
const cDue = document.getElementById("cDue")
const cPaid = document.getElementById("cPaid")
const payBox = document.getElementById("payBox")
const paidCheck = document.getElementById("paidCheck")
const markPaidBtn = document.getElementById("markPaidBtn")
const payMsg = document.getElementById("payMsg")
const welcomeUser = document.getElementById("welcomeUser")

// Logout
document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.removeItem("token")
  window.location.href = "/"
})

// Protect page (redirect if no token)
if (!localStorage.getItem("token")) window.location.href = "/"

// ✅ Fetch my customer record
async function loadMyRecord() {
  try {
    const me = await api("/api/customers/me/record")

    // Fill profile
    document.getElementById("cName").textContent = me.name || ""
    document.getElementById("cEmail").textContent = me.email || ""
    document.getElementById("cDue").textContent = (me.dueAmount || 0).toFixed(2)

    // Update pay amount display
    const payAmountEl = document.getElementById("payAmount")
    if (payAmountEl) {
      payAmountEl.textContent = (me.dueAmount || 0).toFixed(2)
    }

    // Welcome text
    const welcomeUserEl = document.getElementById("welcomeUser")
    if (welcomeUserEl) {
      welcomeUserEl.textContent = `Welcome back, ${me.name}! Here's your property overview.`
    }

    // Rent status with enhanced styling
    const cPaidEl = document.getElementById("cPaid")
    const payBoxEl = document.getElementById("payBox")
    const paidStatusEl = document.getElementById("paidStatus")

    if (me.paid) {
      cPaidEl.textContent = "Paid"
      cPaidEl.className = "status-badge status-paid"
      if (payBoxEl) payBoxEl.classList.add("hidden")
      if (paidStatusEl) paidStatusEl.classList.remove("hidden")
    } else {
      cPaidEl.textContent = "Pending"
      cPaidEl.className = "status-badge status-pending"

      if ((me.dueAmount || 0) > 0) {
        if (payBoxEl) payBoxEl.classList.remove("hidden")
        if (paidStatusEl) paidStatusEl.classList.add("hidden")
      }
    }
  } catch (err) {
    const payMsgEl = document.getElementById("payMsg")
    if (payMsgEl) {
      payMsgEl.textContent = err.message || "Could not load record"
    }
  }
}

// ✅ Mark rent as paid
document.getElementById("markPaidBtn").addEventListener("click", async () => {
  const paidCheckEl = document.getElementById("paidCheck")
  const payMsgEl = document.getElementById("payMsg")

  if (!paidCheckEl.checked) {
    payMsgEl.textContent = "Please confirm that you have made the payment."
    payMsgEl.style.color = "#dc2626"
    return
  }

  payMsgEl.textContent = "Processing..."
  payMsgEl.style.color = "#3b82f6"

  try {
    const updated = await api("/api/customers/me/mark-paid", "POST")

    const cPaidEl = document.getElementById("cPaid")
    const payBoxEl = document.getElementById("payBox")
    const paidStatusEl = document.getElementById("paidStatus")

    if (updated.paid) {
      cPaidEl.textContent = "Paid"
      cPaidEl.className = "status-badge status-paid"
      if (payBoxEl) payBoxEl.classList.add("hidden")
      if (paidStatusEl) paidStatusEl.classList.remove("hidden")

      // Show success message
      payMsgEl.textContent = "Payment confirmed successfully!"
      payMsgEl.style.color = "#10b981"

      // Clear message after 3 seconds
      setTimeout(() => {
        payMsgEl.textContent = ""
      }, 3000)
    }
  } catch (err) {
    payMsgEl.textContent = err.message || "Failed to update payment status"
    payMsgEl.style.color = "#dc2626"
  }
})

// Initial load
loadMyRecord()
