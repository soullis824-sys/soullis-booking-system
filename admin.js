document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'https://soullis-api.onrender.com';

    // ดึง Element ต่างๆ มาใช้งาน
    const loginScreen = document.getElementById('login-screen');
    const dashboardScreen = document.getElementById('dashboard-screen');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const loginButton = document.getElementById('login-button');
    const logoutButton = document.getElementById('logout-button');
    const bookingsTableBody = document.getElementById('bookings-table-body');
    const availabilityDateInput = document.getElementById('availability-date');
    const setUnavailableBtn = document.getElementById('set-unavailable-btn');
    const setAvailableBtn = document.getElementById('set-available-btn');
    const welcomeMessage = document.getElementById('welcome-message');
    const statusMessage = document.getElementById('status-message');

    let loggedInConsultant = null;

    // --- ฟังก์ชันใหม่: สำหรับแสดงข้อความแจ้งเตือน ---
    function showStatusMessage(message, isError = false) {
        statusMessage.textContent = message;
        statusMessage.classList.remove(isError ? 'bg-green-500' : 'bg-red-500');
        statusMessage.classList.add(isError ? 'bg-red-500' : 'bg-green-500');
        statusMessage.classList.remove('opacity-0');
        setTimeout(() => {
            statusMessage.classList.add('opacity-0');
        }, 3000); // ข้อความจะหายไปใน 3 วินาที
    }

    // --- 1. จัดการการ Login ---
    loginButton.addEventListener('click', async () => {
        const username = usernameInput.value;
        const password = passwordInput.value;
        try {
            const response = await fetch(`${API_URL}/admin-login`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const result = await response.json();
            if (result.status === 'success') {
                loggedInConsultant = result.consultant;
                showDashboard();
            } else {
                showStatusMessage('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง', true);
            }
        } catch (error) { showStatusMessage('เกิดข้อผิดพลาดในการเชื่อมต่อ', true); }
    });

    // --- 2. แสดง Dashboard และดึงข้อมูล ---
    function showDashboard() {
        welcomeMessage.textContent = `สวัสดี, ${loggedInConsultant.name}`;
        loginScreen.classList.add('hidden');
        dashboardScreen.classList.remove('hidden');
        fetchAndDisplayBookings();
    }

    async function fetchAndDisplayBookings() {
        try {
            const response = await fetch(`${API_URL}/get-all-bookings`);
            const bookings = await response.json();
            
            bookingsTableBody.innerHTML = '';
            if (bookings.length === 0) {
                const tr = document.createElement('tr');
                tr.innerHTML = `<td colspan="3" class="px-4 py-4 text-center text-gray-500">ยังไม่มีการนัดหมาย</td>`;
                bookingsTableBody.appendChild(tr);
                return;
            }
            
            bookings.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
            
            bookings.forEach(booking => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td class="px-4 py-3 whitespace-nowrap"><div class="text-sm font-medium text-gray-900">${booking.date}</div><div class="text-sm text-gray-500">${booking.time}</div></td>
                    <td class="px-4 py-3 whitespace-nowrap"><div class="text-sm text-gray-900">${booking.name}</div><div class="text-sm text-gray-500">${booking.phone}</div></td>
                    <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500">${booking.consultant_id}</td>
                `;
                bookingsTableBody.appendChild(tr);
            });
        } catch (error) { showStatusMessage('ไม่สามารถโหลดข้อมูลการนัดหมายได้', true); }
    }
    
    // --- 3. จัดการตารางเวลา ---
    setUnavailableBtn.addEventListener('click', () => updateAvailability('unavailable'));
    setAvailableBtn.addEventListener('click', () => updateAvailability('available'));

    async function updateAvailability(status) {
        const date = availabilityDateInput.value;
        if (!date) { showStatusMessage('กรุณาเลือกวันที่ก่อน', true); return; }
        
        const consultantId = loggedInConsultant.id; 
        try {
            const response = await fetch(`${API_URL}/update-availability`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ consultant_id: consultantId, date: date, status: status })
            });
            const result = await response.json();
            if (result.status === 'success') {
                showStatusMessage(`วันที่ ${date} ถูกตั้งค่าเป็น "${status}" เรียบร้อยแล้ว`);
            } else { showStatusMessage('เกิดข้อผิดพลาดในการอัปเดต', true); }
        } catch (error) { showStatusMessage('เกิดข้อผิดพลาดในการเชื่อมต่อ', true); }
    }

    // --- 4. จัดการการ Logout ---
    logoutButton.addEventListener('click', () => { window.location.reload(); });
});