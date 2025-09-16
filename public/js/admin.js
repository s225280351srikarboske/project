import { Chart } from "@/components/ui/chart"

const showDeleted = document.getElementById("showDeleted")
const tableBody = document.querySelector("#customersTable tbody")
const tableMsg = document.getElementById("tableMsg")
const form = document.getElementById("customerForm")
const formMsg = document.getElementById("formMsg")
const formTitle = document.getElementById("formTitle")
const cancelEdit = document.getElementById("cancelEdit")

// Dashboard navigation
const navItems = document.querySelectorAll(".nav-item")
const dashboardContent = document.querySelector(".dashboard-content")
const customerManagement = document.querySelector(".customer-management")

// Protect page
if (!localStorage.getItem("token")) window.location.href = "/"

// Initialize dashboard
document.addEventListener("DOMContentLoaded", () => {
  initializeCharts()
  loadCustomers()
  setupNavigation()

  // Event listeners
  document.getElementById("logoutBtn").addEventListener("click", logout)
  showDeleted?.addEventListener("change", loadCustomers)
  form?.addEventListener("submit", handleFormSubmit)
  cancelEdit?.addEventListener("click", resetForm)
  tableBody?.addEventListener("click", handleTableActions)
})

// Navigation setup
function setupNavigation() {
  navItems.forEach((item) => {
    item.addEventListener("click", (e) => {
      e.preventDefault()
      const target = item.getAttribute("href")

      // Remove active class from all items
      navItems.forEach((nav) => nav.classList.remove("active"))
      // Add active class to clicked item
      item.classList.add("active")

      // Show/hide content based on navigation
      if (target === "#dashboard") {
        dashboardContent.style.display = "block"
        customerManagement.style.display = "none"
      } else if (target === "#tenants") {
        dashboardContent.style.display = "none"
        customerManagement.style.display = "block"
      }
    })
  })
}

// Initialize charts
function initializeCharts() {
  // Revenue Chart
  const revenueCtx = document.getElementById("revenueChart")
  if (revenueCtx) {
    new Chart(revenueCtx, {
      type: "bar",
      data: {
        labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
        datasets: [
          {
            label: "Revenue",
            data: [45000, 52000, 48000, 61000, 55000, 67000],
            backgroundColor: "#3b82f6",
            borderRadius: 8,
            borderSkipped: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: "#f1f5f9",
            },
            ticks: {
              callback: (value) => "$" + value / 1000 + "K",
            },
          },
          x: {
            grid: {
              display: false,
            },
          },
        },
      },
    })
  }

  // Status Chart
  const statusCtx = document.getElementById("statusChart")
  if (statusCtx) {
    new Chart(statusCtx, {
      type: "doughnut",
      data: {
        labels: ["Occupied", "Vacant", "Maintenance"],
        datasets: [
          {
            data: [85, 12, 3],
            backgroundColor: ["#10b981", "#3b82f6", "#f59e0b"],
            borderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
        },
        cutout: "70%",
      },
    })
  }
}

// Form handling
function resetForm() {
  if (form) {
    form.reset()
    document.getElementById("customerId").value = ""
    formTitle.textContent = "Add / Edit Customer"
    cancelEdit.style.display = "none"
    formMsg.textContent = ""
  }
}

async function handleFormSubmit(e) {
  e.preventDefault()
  formMsg.textContent = ""

  const id = document.getElementById("customerId").value
  const payload = {
    name: document.getElementById("name").value.trim(),
    email: document.getElementById("email").value.trim(),
    phone: document.getElementById("phone").value.trim(),
    company: document.getElementById("company").value.trim(),
    status: document.getElementById("status").value,
    dueAmount: Number(document.getElementById("dueAmount").value || 0),
    paid: document.getElementById("paid").value === "true",
  }

  try {
    const path = "/api/customers" + (id ? "/" + id : "")
    const method = id ? "PUT" : "POST"
    await api(path, method, payload)
    formMsg.textContent = id ? "Customer updated successfully!" : "Customer created successfully!"
    formMsg.style.color = "#10b981"
    await loadCustomers()
    resetForm()
  } catch (err) {
    formMsg.textContent = err.message
    formMsg.style.color = "#ef4444"
  }
}

// Load customers
async function loadCustomers() {
  if (!tableBody || !tableMsg) return

  tableMsg.textContent = "Loading customers..."
  tableBody.innerHTML = ""

  try {
    const includeDeleted = showDeleted?.checked ? "true" : "false"
    const list = await api("/api/customers?includeDeleted=" + includeDeleted)

    tableMsg.textContent = list.length ? "" : "No customers found."

    list.forEach((customer) => {
      const tr = document.createElement("tr")
      if (customer.isDeleted) tr.classList.add("muted")

      tr.innerHTML = `
                <td>${customer.name || ""}</td>
                <td>${customer.email || ""}</td>
                <td>${customer.phone || ""}</td>
                <td>${customer.company || ""}</td>
                <td>
                    <span class="status-badge ${customer.status?.toLowerCase() === "active" ? "paid" : "overdue"}">
                        ${customer.status || "Active"}
                    </span>
                </td>
                <td>$${(customer.dueAmount || 0).toFixed(2)}</td>
                <td>
                    <span class="status-badge ${customer.paid ? "paid" : "due-soon"}">
                        ${customer.paid ? "Paid" : "Due"}
                    </span>
                </td>
                <td>
                    <button data-id="${customer._id}" class="editBtn" ${customer.isDeleted ? "disabled" : ""}>
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button data-id="${customer._id}" class="delBtn" ${customer.isDeleted ? "disabled" : ""}>
                        <i class="fas fa-trash"></i> Delete
                    </button>
                    <button data-id="${customer._id}" class="dueBtn" ${customer.isDeleted ? "disabled" : ""}>
                        <i class="fas fa-dollar-sign"></i> Set Due
                    </button>
                </td>
            `
      tableBody.appendChild(tr)
    })
  } catch (err) {
    tableMsg.textContent = err.message
    tableMsg.style.color = "#ef4444"
  }
}

// Handle table actions
async function handleTableActions(e) {
  const btn = e.target.closest("button")
  if (!btn) return

  const id = btn.getAttribute("data-id")

  if (btn.classList.contains("editBtn")) {
    try {
      const customer = await api("/api/customers/" + id)
      document.getElementById("customerId").value = customer._id
      document.getElementById("name").value = customer.name || ""
      document.getElementById("email").value = customer.email || ""
      document.getElementById("phone").value = customer.phone || ""
      document.getElementById("company").value = customer.company || ""
      document.getElementById("status").value = customer.status || "Active"
      document.getElementById("dueAmount").value = customer.dueAmount || 0
      document.getElementById("paid").value = customer.paid ? "true" : "false"
      formTitle.textContent = "Edit Customer"
      cancelEdit.style.display = "inline-flex"

      // Switch to customer management view
      dashboardContent.style.display = "none"
      customerManagement.style.display = "block"
      navItems.forEach((nav) => nav.classList.remove("active"))
      document.querySelector('[href="#tenants"]').classList.add("active")

      window.scrollTo({ top: 0, behavior: "smooth" })
    } catch (err) {
      tableMsg.textContent = err.message
      tableMsg.style.color = "#ef4444"
    }
  }

  if (btn.classList.contains("delBtn")) {
    if (!confirm("Are you sure you want to delete this customer?")) return
    try {
      await api("/api/customers/" + id, "DELETE")
      await loadCustomers()
    } catch (err) {
      tableMsg.textContent = err.message
      tableMsg.style.color = "#ef4444"
    }
  }

  if (btn.classList.contains("dueBtn")) {
    const amount = prompt("Enter due amount ($):", "0")
    if (amount === null) return
    try {
      await api(`/api/customers/${id}/set-due`, "POST", { amount })
      await loadCustomers()
    } catch (err) {
      alert(err.message)
    }
  }
}

// Quick action functions
function showAddPropertyModal() {
  alert("Add Property functionality - Coming soon!")
}

function showAddTenantModal() {
  // Switch to customer management and show form
  dashboardContent.style.display = "none"
  customerManagement.style.display = "block"
  navItems.forEach((nav) => nav.classList.remove("active"))
  document.querySelector('[href="#tenants"]').classList.add("active")
  resetForm()
  window.scrollTo({ top: 0, behavior: "smooth" })
}

function generateBills() {
  alert("Generate Bills functionality - Coming soon!")
}

function broadcastMessage() {
  alert("Broadcast Message functionality - Coming soon!")
}

// Logout function
function logout() {
  if (confirm("Are you sure you want to logout?")) {
    localStorage.removeItem("token")
    window.location.href = "/"
  }
}

// API helper function (assuming it exists in common.js)
async function api(path, method = "GET", body = null) {
  const token = localStorage.getItem("token")
  const options = {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  }

  if (body) {
    options.body = JSON.stringify(body)
  }

  const response = await fetch(path, options)
  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || "Something went wrong")
  }

  return data
}
