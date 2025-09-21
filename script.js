document.addEventListener('DOMContentLoaded', () => {

    const API_URL = 'https://soullis-api.onrender.com';

    // ดึง Element ต่างๆ จากหน้า HTML
    const consultantSelection = document.getElementById('consultant-selection');
    const bookingSection = document.getElementById('booking-section');
    const userInfoSection = document.getElementById('user-info-section');
    const bookingDateInput = document.getElementById('booking-date');
    const bookingTimeInput = document.getElementById('booking-time'); // เปลี่ยนชื่อตัวแปรเพื่อความชัดเจน
    const userNameInput = document.getElementById('user-name');
    const userPhoneInput = document.getElementById('user-phone');
    const submitButton = document.getElementById('submit-button');

    let selectedConsultantId = null;
    let unavailableDates = [];

    // --- 1. เริ่มต้น: ดึงรายชื่อผู้ให้คำปรึกษา ---
    async function fetchConsultants() {
        try {
            const response = await fetch(`${API_URL}/get-consultants`);
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
            consultantSelection.innerHTML = '<p class="text-red-500 col-span-3">เกิดข้อผิดพลาด: ไม่สามารถโหลดข้อมูลผู้ให้คำปรึกษาได้</p>';
        }
    }
    
    // --- 2. เมื่อเลือกผู้ให้คำปรึกษา: ดึงวันที่ไม่ว่าง ---
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

    // --- 3. เมื่อเลือกวันที่: ตรวจสอบและแสดงฟอร์มกรอกข้อมูล ---
    bookingDateInput.addEventListener('change', () => {
        const selectedDate = bookingDateInput.value;
        if (unavailableDates.includes(selectedDate)) {
            alert('วันที่ท่านเลือกไม่ว่าง กรุณาเลือกวันอื่น');
            userInfoSection.classList.add('hidden');
            return;
        }
        // ถ้าวันปกติ ให้แสดงฟอร์มกรอกข้อมูลได้เลย
        userInfoSection.classList.remove('hidden');
    });

    // --- 4. กดปุ่มยืนยัน: ส่งข้อมูลการจอง ---
    submitButton.addEventListener('click', async () => {
        const bookingData = {
            name: userNameInput.value,
            phone: userPhoneInput.value,
            line_user_id: 'LIFF_USER_ID_PLACEHOLDER',
            consultant_id: selectedConsultantId,
            date: bookingDateInput.value,
            time: bookingTimeInput.value // ใช้ค่าจาก input โดยตรง
        };

        if (!bookingData.name || !bookingData.phone || !bookingData.date || !bookingData.time) {
            alert('กรุณากรอกข้อมูลให้ครบถ้วน');
            return;
        }
        
        try {
            submitButton.disabled = true;
            submitButton.textContent = 'กำลังบันทึก...';
            const response = await fetch(`${API_URL}/submit-booking`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
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

    // --- เริ่มการทำงานทั้งหมด ---
    fetchConsultants();
});