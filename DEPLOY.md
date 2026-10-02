# วิธีเอา Collab Poker ขึ้น host

แอปนี้รันเป็น service เดียว: server (Express) ให้บริการทั้ง API `/api/*` และหน้าเว็บจาก `client/dist`

## ทดสอบในเครื่อง
```bash
npm ci
npm run build
npm start        # เปิด http://localhost:4000
```

## Environment variables
| ชื่อ | ใช้ทำอะไร |
|---|---|
| `PORT` | host กำหนดให้อัตโนมัติ |
| `DEALER_PIN` | PIN ดีลเลอร์ตอนเริ่มครั้งแรก (ถ้าไม่ตั้งจะเป็น 245678) **ควรตั้งเสมอ** |
| `DATA_DIR` | โฟลเดอร์เก็บ `state.json` / `dealer-pin.json` (ใช้กับ persistent disk) |

## ทางเลือก A: Render (ฟรี)
1. Push โปรเจกต์ขึ้น GitHub
2. https://render.com → **New → Blueprint** → เลือก repo (ระบบจะอ่าน `render.yaml` ให้เอง)
3. ใส่ค่า `DEALER_PIN` → **Apply**
4. ได้ลิงก์ `https://collab-poker-xxxx.onrender.com`

ข้อจำกัดของแผนฟรี: ข้อมูลจะหายเมื่อ restart หรือ deploy ใหม่ และถ้าไม่มีคนใช้ประมาณ 15 นาที server จะหลับ (การเปิดครั้งแรกหลังจากนั้นจะช้าประมาณ 30 วินาที)

## ทางเลือก B: Railway (ข้อมูลอยู่ถาวร ประมาณ $5/เดือน)
1. https://railway.com → **New Project → Deploy from GitHub repo**
2. Settings: Build `npm ci && npm run build` / Start `npm start`
3. เพิ่ม **Volume** แล้ว mount ที่ `/data`
4. Variables: `DATA_DIR=/data`, `DEALER_PIN=xxxx`
5. Settings → Networking → **Generate Domain**
