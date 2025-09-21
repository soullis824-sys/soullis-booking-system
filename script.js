document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'https://soullis-api22.onrender.com'; // <--- URL จาก Render ของคุณ
    const LIFF_ID = 'YOUR_LIFF_ID_HERE'; // <--- LIFF ID ของคุณ
    let lineUserId = 'USER_ID_NOT_FOUND';

    // ... ดึง Element ต่างๆ เหมือนเดิม ...
    const myBookingsSection = document.getElementById('my-bookings-section');
    const myBookingsList = document.getElementById('my-bookings-list');
    const consultantSelection = document.getElementById('consultant-selection');
    const userNameInput = document.getElementById('user-name');
    const submitButton = document.getElementById('submit-button');

    // --- ฟังก์ชันใหม่สำหรับดึงข้อมูลการจองของผู้ใช้ ---
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
                    div.innerHTML = `
                        <p class="font-medium">วันที่: ${booking.date} เวลา: ${booking.time}</p>
                        <p class="text-sm text-gray-600">สถานะ: ${booking.status}</p>
                    `;
                    myBookingsList.appendChild(div);
                });
                myBookingsSection.classList.remove('hidden');
            }
        } catch (error) {
            console.error('Could not fetch my bookings:', error);
        }
    }

    // --- แก้ไขฟังก์ชัน LIFF ---
    async function initializeLiff() {
        try {
            await liff.init({ liffId: LIFF_ID });
            if (!liff.isLoggedIn()) {
                liff.login();
            } else {
                const profile = await liff.getProfile();
                lineUserId = profile.userId;
                userNameInput.value = profile.displayName;
                
                // vvv เรียกใช้ฟังก์ชันใหม่หลังจากได้ User ID แล้ว vvv
                fetchMyBookings(lineUserId);
            }
        } catch (error) {
            console.error('LIFF initialization failed', error);
        }
    }

    // ... (ฟังก์ชันอื่นๆ และ Event Listeners เหมือนเดิม) ...

    async function main() {
        await initializeLiff();
        fetchConsultants();
    }
    main();
});
// หมายเหตุ: โค้ดส่วนอื่นๆ ที่ไม่ได้แสดงไว้คือเหมือนเดิมทั้งหมดครับ