document.addEventListener('DOMContentLoaded', () => {

    // --- การตั้งค่าหลัก ---
    const API_URL = 'https://soullis-api22.onrender.com';
    const LIFF_ID = '2008151095-bAD1RDrq';
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
                fetchBookingsByUserId();
            } else {
                console.log("LIFF is not logged in.");
            }
        } catch (error) {
            console.error('LIFF initialization failed', error);
        }
    }
    
    // ----------------- vvv โค้ดที่แก้ไขล่าสุด vvv -----------------
    function renderConsultants(consultants) {
        consultantSelection.innerHTML = '';
        consultants.forEach(c => {
            const consultantElement = document.createElement('div');
            consultantElement.classList.add('consultant', 'p-4', 'bg-white', 'rounded-lg', 'shadow-sm', 'border-2', 'border-gray-200', 'cursor-pointer', 'transition-all');
            consultantElement.dataset.id = c.consultant_id;
            consultantElement.innerHTML = `
                <h4 class="font-medium text-gray-800">${c.name}</h4>
                <p class="text-sm text-gray-600">${c.details}</p>
            `;
            consultantElement.addEventListener('click', () => {
                document.querySelectorAll('.consultant').forEach(el => el.classList.remove('selected'));
                consultantElement.classList.add('selected');
                selectedConsultantId = c.consultant_id; // <--- แก้ไขจุดนี้
                fetchAvailability(c.consultant_id);
                bookingSection.classList.remove('hidden');
                userInfoSection.classList.add('hidden');
            });
            consultantSelection.appendChild(consultantElement);
        });
    }
    // ----------------- ^^^ โค้ดที่แก้ไขล่าสุด ^^^ -----------------

    async function fetchConsultants() {
        try {
            const response = await fetch(`${API_URL}/get-consultants`);
            const consultants = await response.json();
            renderConsultants(consultants);
        } catch (error) {
            console.error('Error fetching consultants:', error);
            alert('ไม่สามารถโหลดข้อมูลผู้ให้คำปรึกษาได้');
        }
    }

    async function fetchAvailability(consultantId) {
        try {
            const response = await fetch(`${API_URL}/get-availability/${consultantId}`);
            unavailableDates = await response.json();
            console.log('Unavailable Dates:', unavailableDates);
        } catch (error) {
            console.error('Error fetching availability:', error);
        }
    }

    bookingDateInput.addEventListener('change', () => {
        const selectedDate = bookingDateInput.value;
        if (unavailableDates.includes(selectedDate)) {
            alert('วันที่นี้ไม่ว่าง กรุณาเลือกวันอื่น');
            bookingDateInput.value = '';
        }
    });

    submitButton.addEventListener('click', async () => {
        const bookingData = { name: userNameInput.value, phone: userPhoneInput.value, line_user_id: lineUserId, consultant_id: selectedConsultantId, date: bookingDateInput.value, time: bookingTimeInput.value };
        if (!bookingData.name || !bookingData.phone || !bookingData.date || !bookingData.time) {
            alert('กรุณากรอกข้อมูลให้ครบถ้วน');
            return;
        }
        try {
            submitButton.disabled = true;
            submitButton.textContent = 'กำลังบันทึก...';
            const response = await fetch(`${API_URL}/submit-booking`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bookingData),
            });
            const result = await response.json();
            if (result.status === 'success') {
                alert(`การจองสำเร็จ!\nหมายเลขการจองของคุณคือ: ${result.booking_id}`);
                window.location.reload();
            } else {
                alert('เกิดข้อผิดพลาดในการจอง กรุณาลองใหม่อีกครั้ง');
            }
        } catch (error) {
            console.error('Error submitting booking:', error);
            alert('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'ยืนยันการจอง';
        }
    });

    async function fetchBookingsByUserId() {
        try {
            const response = await fetch(`${API_URL}/get-my-bookings?user_id=${lineUserId}`);
            const bookings = await response.json();
            myBookingsList.innerHTML = '';
            if (bookings.length === 0) {
                myBookingsList.innerHTML = '<p class="text-gray-600">คุณยังไม่มีการจอง</p>';
                return;
            }
            bookings.forEach(booking => {
                const bookingItem = document.createElement('div');
                bookingItem.classList.add('bg-white', 'p-4', 'rounded-lg', 'shadow-sm', 'mb-2');
                bookingItem.innerHTML = `<p class="font-medium text-gray-800">${booking.date} / ${booking.time} - ${booking.name}</p>`;
                myBookingsList.appendChild(bookingItem);
            });
            myBookingsSection.classList.remove('hidden');
        } catch (error) {
            console.error('Error fetching my bookings:', error);
        }
    }

    // --- จุดเริ่มต้นการทำงาน ---
    async function main() {
        await initializeLiff();
        if (lineUserId !== 'USER_ID_NOT_FOUND') {
            await fetchConsultants();
        }
    }

    main();
});