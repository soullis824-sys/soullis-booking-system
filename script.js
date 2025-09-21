document.addEventListener('DOMContentLoaded', () => {
    
    // --- การตั้งค่าหลัก ---
    const API_URL = 'https://soullis-api22.onrender.com'; // URL ของ Render
    const LIFF_ID = '2008151095-bAD1RDrq'; // <--- วาง LIFF ID ที่คัดลอกมาใหม่ตรงนี้
    let lineUserId = 'USER_ID_NOT_FOUND';
    let selectedConsultantId = null;
    let unavailableDates = [];

    // --- ดึง Element จากหน้าเว็บ ---
    const myBookingsSection = document.getElementById('my-bookings-section');
    const myBookingsList = document.getElementById('my-bookings-list');
    const consultantSelection = document.getElementById('consultant-selection');
    const bookingSection = document.getElementById('booking-section');
    const userInfoSection = document.getElementById('user-info-section');
    const bookingDateInput = document.getElementById('booking-date');
    const bookingTimeInput = document.getElementById('booking-time');
    const userNameInput = document.getElementById('user-name');
    const userPhoneInput = document.getElementById('user-phone');
    const submitButton = document.getElementById('submit-button');
    
    // --- ฟังก์ชันหลัก ---
    async function initializeLiff() {
        try {
            await liff.init({ liffId: LIFF_ID });
            if (liff.isLoggedIn()) {
                const profile = await liff.getProfile();
                lineUserId = profile.userId;
                userNameInput.value = profile.displayName;
            } else {
                liff.login();
            }
        } catch (error) {
            console.error('LIFF initialization failed', error);
            consultantSelection.innerHTML = '<p class="text-red-500 col-span-3 text-center">เกิดข้อผิดพลาดในการเชื่อมต่อกับ LINE</p>';
        }
    }

    async function fetchConsultants() {
        try {
            const response = await fetch(`${API_URL}/get-consultants`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const consultants = await response.json();
            
            consultantSelection.innerHTML = '';
            consultants.forEach(c => {
                const div = document.createElement('div');
                div.className = 'consultant bg-white rounded-lg border p-4 text-center cursor-pointer hover:border-purple-500 transition';
                div.innerHTML = `<p class="font-semibold">${c.name}</p><p class="text-sm text-gray-500">${c.specialty}</p>`;
                div.dataset.id = c.consultant_id;
                div.addEventListener('click', () => {
                    document.querySelectorAll('.consultant').forEach(el => el.classList.remove('selected'));
                    div.classList.add('selected');
                    selectedConsultantId = c.consultant_id;
                    fetchAvailability(c.consultant_id);
                });
                consultantSelection.appendChild(div);
            });
        } catch (error) {
            console.error('Error fetching consultants:', error);
            consultantSelection.innerHTML = '<p class="text-red-500 col-span-3 text-center">ไม่สามารถโหลดข้อมูลผู้ให้คำปรึกษาได้</p>';
        }
    }

    async function fetchAvailability(id) {
        bookingSection.classList.remove('hidden');
        userInfoSection.classList.add('hidden');
        bookingDateInput.value = '';
        try {
            const response = await fetch(`${API_URL}/get-availability/${id}`);
            unavailableDates = await response.json();
        } catch (error) {
            console.error('Error fetching availability:', error);
            alert('เกิดข้อผิดพลาดในการโหลดข้อมูลวันที่ว่าง');
        }
    }

    async function fetchMyBookings(userId) {
        if (!userId || userId === 'USER_ID_NOT_FOUND') return;
        try {
            const response = await fetch(`${API_URL}/get-my-bookings?user_id=${userId}`);
            const bookings = await response.json();

            if (bookings.length > 0) {
                myBookingsList.innerHTML = '';
                bookings.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
                bookings.forEach(booking => {
                    const div = document.createElement('div');
                    div.className = 'p-3 bg-gray-100 rounded-md';
                    div.innerHTML = `<p class="font-medium">วันที่: ${booking.date} เวลา: ${booking.time}</p><p class="text-sm text-gray-600">สถานะ: ${booking.status}</p>`;
                    myBookingsList.appendChild(div);
                });
                myBookingsSection.classList.remove('hidden');
            }
        } catch (error) {
            console.error('Could not fetch my bookings:', error);
        }
    }

    // --- Event Listeners ---
    bookingDateInput.addEventListener('change', () => {
        const selectedDate = bookingDateInput.value;
        if (unavailableDates.includes(selectedDate)) {
            alert('วันที่ท่านเลือกไม่ว่าง กรุณาเลือกวันอื่น');
            userInfoSection.classList.add('hidden');
            return;
        }
        userInfoSection.classList.remove('hidden');
    });

    submitButton.addEventListener('click', async () => {
        const bookingData = { name: userNameInput.value, phone: userPhoneInput.value, line_user_id: lineUserId, consultant_id: selectedConsultantId, date: bookingDateInput.value, time: bookingTimeInput.value };
        if (!bookingData.name || !bookingData.phone || !bookingData.date || !bookingData.time) {
            alert('กรุณากรอกข้อมูลให้ครบถ้วน'); return;
        }
        try {
            submitButton.disabled = true;
            submitButton.textContent = 'กำลังบันทึก...';
            const response = await fetch(`${API_URL}/submit-booking`, {
                method: 'POST', headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(bookingData),
            });
            const result = await response.json();
            if (result.status === 'success') {
                alert(`การจองสำเร็จ!\nหมายเลขการจองของคุณคือ: ${result.booking_id}`);
                window.location.reload();
            } else { alert('เกิดข้อผิดพลาดในการจอง กรุณาลองใหม่อีกครั้ง'); }
        } catch (error) {
            console.error('Error submitting booking:', error);
            alert('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'ยืนยันการจอง';
        }
    });

    // --- จุดเริ่มต้นการทำงาน ---
    async function main() {
        await initializeLiff();
        if(lineUserId !== 'USER_ID_NOT_FOUND'){
            await fetchMyBookings(lineUserId);
            await fetchConsultants();
        }
    }

    main();
});