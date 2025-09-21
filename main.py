import gspread
from oauth2client.service_account import ServiceAccountCredentials
from flask import Flask, jsonify, request
from datetime import datetime
from flask_cors import CORS

# ... (ส่วน Setup เหมือนเดิม) ...
app = Flask(__name__)
CORS(app)
# ... (ส่วนเชื่อมต่อ Google Sheets เหมือนเดิม) ...
scope = ["https://spreadsheets.google.com/feeds", 'https://www.googleapis.com/auth/spreadsheets', "https://www.googleapis.com/auth/drive.file", "https://www.googleapis.com/auth/drive"]
creds = ServiceAccountCredentials.from_json_keyfile_name("credentials.json", scope)
client = gspread.authorize(creds)
spreadsheet = client.open("ระบบจองคิว SOULLIS")
consultants_sheet = spreadsheet.worksheet("Consultants")
availability_sheet = spreadsheet.worksheet("Availability")
bookings_sheet = spreadsheet.worksheet("Bookings")

# --- API Endpoints ---

# == User App APIs ==
@app.route("/get-consultants")
def get_consultants():
    # ... (โค้ดเดิม) ...
    return jsonify(consultants_sheet.get_all_records())

# ----------------- vvv โค้ดใหม่ที่เพิ่มเข้ามา vvv -----------------
@app.route("/get-my-bookings")
def get_my_bookings():
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({"error": "User ID is required"}), 400
    
    all_bookings = bookings_sheet.get_all_records()
    my_bookings = [b for b in all_bookings if b.get('line_user_id') == user_id]
    
    return jsonify(my_bookings)
# ----------------- ^^^ โค้dใหม่ที่เพิ่มเข้ามา ^^^ -----------------

@app.route("/get-availability/<int:consultant_id>")
def get_availability(consultant_id):
    # ... (โค้ดเดิม) ...
    all_availability = availability_sheet.get_all_records()
    unavailable_dates = [r['date'] for r in all_availability if r.get('consultant_id') and int(r.get('consultant_id')) == consultant_id and r.get('status') == 'unavailable']
    return jsonify(unavailable_dates)

@app.route("/submit-booking", methods=['POST'])
def submit_booking():
    # ... (โค้ดเดิม) ...
    data = request.get_json()
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S"); booking_id = str(int(datetime.now().timestamp() * 1000))
    new_row = [ booking_id, timestamp, data.get('name'), data.get('phone'), data.get('line_user_id'), data.get('consultant_id'), data.get('date'), data.get('time'), 'confirmed' ]
    bookings_sheet.append_row(new_row)
    return jsonify({"status": "success", "booking_id": booking_id})

# ... (Admin App APIs เหมือนเดิม) ...
@app.route("/admin-login", methods=['POST'])
def admin_login():
    data = request.get_json()
    all_consultants = consultants_sheet.get_all_records()
    for consultant in all_consultants:
        if consultant.get('username') == data.get('username') and consultant.get('password') == data.get('password'):
            return jsonify({"status": "success", "consultant": {"id": consultant.get('consultant_id'), "name": consultant.get('name')}})
    return jsonify({"status": "error", "message": "Invalid credentials"}), 401
@app.route("/get-all-bookings")
def get_all_bookings(): return jsonify(bookings_sheet.get_all_records())
@app.route("/update-availability", methods=['POST'])
def update_availability():
    try:
        data = request.get_json()
        consultant_id = data.get('consultant_id'); date = data.get('date'); status = data.get('status')
        if not all([consultant_id, date, status]): return jsonify({"status": "error", "message": "Missing data"}), 400
        cell_list = availability_sheet.findall(date, in_column=2)
        found_row_number = None
        for cell in cell_list:
            try:
                if int(availability_sheet.cell(cell.row, 1).value) == consultant_id:
                    found_row_number = cell.row; break
            except (ValueError, TypeError): continue
        if found_row_number: availability_sheet.update_cell(found_row_number, 3, status)
        else: availability_sheet.append_row([consultant_id, date, status])
        return jsonify({"status": "success", "message": f"Availability for {date} updated to {status}"})
    except Exception as e:
        print(f"An error occurred in update_availability: {e}")
        return jsonify({"status": "error", "message": "An internal server error occurred."}), 500

if __name__ == "__main__":
    app.run(debug=True)