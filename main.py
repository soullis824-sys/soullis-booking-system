# ... (ส่วน import และ setup เหมือนเดิม) ...
import gspread
from oauth2client.service_account import ServiceAccountCredentials
from flask import Flask, jsonify, request
from datetime import datetime
from flask_cors import CORS

app = Flask(__name__)
CORS(app)
scope = ["https://spreadsheets.google.com/feeds", 'https://www.googleapis.com/auth/spreadsheets', "https://www.googleapis.com/auth/drive.file", "https://www.googleapis.com/auth/drive"]
creds = ServiceAccountCredentials.from_json_keyfile_name("credentials.json", scope)
client = gspread.authorize(creds)
spreadsheet = client.open("ระบบจองคิว SOULLIS")
consultants_sheet = spreadsheet.worksheet("Consultants")
availability_sheet = spreadsheet.worksheet("Availability")
bookings_sheet = spreadsheet.worksheet("Bookings")

# ... (API ของ User App เหมือนเดิม) ...
@app.route("/get-consultants")
def get_consultants(): return jsonify(consultants_sheet.get_all_records())
@app.route("/get-availability/<int:consultant_id>")
def get_availability(consultant_id):
    all_availability = availability_sheet.get_all_records()
    unavailable_dates = [r['date'] for r in all_availability if r.get('consultant_id') and int(r.get('consultant_id')) == consultant_id and r.get('status') == 'unavailable']
    return jsonify(unavailable_dates)
@app.route("/submit-booking", methods=['POST'])
def submit_booking():
    data = request.get_json()
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S"); booking_id = str(int(datetime.now().timestamp() * 1000))
    new_row = [ booking_id, timestamp, data.get('name'), data.get('phone'), data.get('line_user_id'), data.get('consultant_id'), data.get('date'), data.get('time'), 'confirmed' ]
    bookings_sheet.append_row(new_row)
    return jsonify({"status": "success", "booking_id": booking_id})

# --- vvv ADMIN APIs ที่แก้ไขแล้ว vvv ---
@app.route("/admin-login", methods=['POST'])
def admin_login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    # ดึงข้อมูลผู้ให้คำปรึกษาทั้งหมดมาตรวจสอบ
    all_consultants = consultants_sheet.get_all_records()
    for consultant in all_consultants:
        if consultant.get('username') == username and consultant.get('password') == password:
            # ถ้าเจอ ให้ส่งข้อมูลของคนนั้นกลับไป
            return jsonify({
                "status": "success",
                "consultant": {
                    "id": consultant.get('consultant_id'),
                    "name": consultant.get('name')
                }
            })
    
    # ถ้าวนลูปจนจบแล้วยังไม่เจอ
    return jsonify({"status": "error", "message": "Invalid credentials"}), 401

@app.route("/get-all-bookings")
def get_all_bookings():
    return jsonify(bookings_sheet.get_all_records())

@app.route("/update-availability", methods=['POST'])
def update_availability():
    # ... (โค้ดส่วนนี้เหมือนเดิม ไม่ต้องแก้ไข) ...
    try:
        data = request.get_json()
        consultant_id = data.get('consultant_id')
        date = data.get('date')
        status = data.get('status')
        if not all([consultant_id, date, status]): return jsonify({"status": "error", "message": "Missing data"}), 400
        cell_list = availability_sheet.findall(date, in_column=2)
        found_row_number = None
        for cell in cell_list:
            try:
                if int(availability_sheet.cell(cell.row, 1).value) == consultant_id:
                    found_row_number = cell.row
                    break
            except (ValueError, TypeError): continue
        if found_row_number:
            availability_sheet.update_cell(found_row_number, 3, status)
        else:
            availability_sheet.append_row([consultant_id, date, status])
        return jsonify({"status": "success", "message": f"Availability for {date} updated to {status}"})
    except Exception as e:
        print(f"An error occurred in update_availability: {e}")
        return jsonify({"status": "error", "message": "An internal server error occurred."}), 500

if __name__ == "__main__":
    app.run(debug=True)