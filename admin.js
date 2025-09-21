document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'https://soullis-api22.onrender.com';
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

    function showStatusMessage(message, isError = false) {
        statusMessage.textContent = message;
        statusMessage.classList.remove(isError ? 'bg-green-500' : 'bg-red-500');
        statusMessage.classList.add(isError ? 'bg-red-500' : 'bg-green-500');
        statusMessage.classList.remove('opacity-0');
        setTimeout(() => {
            statusMessage.classList.add('opacity-0');
        }, 3000);
    }

    loginButton.addEventListener('click', async () => {
        const username = usernameInput.value;
        const password = passwordInput.value;
        try {
            const response = await fetch(`${API_URL}/admin-login`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ username, password })
            });
            const result = await response.json();
            if (result.status === 'success') {
                loggedInConsultant = result.consultant;
                welcomeMessage.textContent = `ยินดีต้อนรับ, ${loggedInConsultant.name}!`;
                loginScreen.classList.add('hidden');
                dashboardScreen.classList.remove('hidden');
                fetchBookings();
                showStatusMessage('เข้าสู่ระบบสำเร็จแล้ว');
            } else {
                showStatusMessage(result.message, true);
            }
        } catch (error) {
            showStatusMessage('เกิดข้อผิดพลาดในการเชื่อมต่อ', true);
        }
    });

    logoutButton.addEventListener('click', () => {
        loggedInConsultant = null;
        loginScreen.classList.remove('hidden');
        dashboardScreen.classList.add('hidden');
        showStatusMessage('ออกจากระบบแล้ว');
    });

    async function fetchBookings() {
        bookingsTableBody.innerHTML = '<tr><td colspan="3" class="text-center p-4">กำลังโหลดข้อมูล...</td></tr>';
        
        if (!loggedInConsultant || !loggedInConsultant.id) {
            showStatusMessage('ไม่พบข้อมูลผู้ให้คำปรึกษา', true);
            bookingsTableBody.innerHTML = '<tr><td colspan="3" class="text-center p-4">ไม่พบข้อมูลผู้ให้คำปรึกษา กรุณาล็อกอินใหม่</td></tr>';
            return;
        }

        try {
            const consultantId = loggedInConsultant.id;
            const response = await fetch(`${API_URL}/get-all-bookings?consultant_id=${consultantId}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const bookings = await response.json();
            
            bookingsTableBody.innerHTML = '';
            if (bookings.length === 0) {
                bookingsTableBody.innerHTML = '<tr><td colspan="3" class="text-center p-4">ไม่มีรายการนัดหมาย</td></tr>';
                return;
            }
            
            bookings.forEach(booking => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td class="px-4 py-3">${booking.date} / ${booking.time}</td>
                    <td class="px-4 py-3">${booking.name} (${booking.phone})</td>
                    <td class="px-4 py-3">${booking.consultant_id}</td>
                `;
                bookingsTableBody.appendChild(row);
            });
            
        } catch (error) { 
            console.error('Fetch Bookings Error:', error);
            showStatusMessage('ไม่สามารถโหลดข้อมูลการนัดหมายได้', true); 
        }
    }

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
                showStatusMessage(`วันที่ ${date} ถูกตั้งค่าเป็น \"${status}\" เรียบร้อยแล้ว`);
            } else { showStatusMessage('เกิดข้อผิดพลาดในการอัปเดต', true); }
        } catch (error) { showStatusMessage('เกิดข้อผิดพลาดในการเชื่อมต่อ', true); }
    }
});