# ARRA Assistance

คู่มือภาษาไทยสำหรับมือใหม่ที่ไม่เคยใช้ terminal: ติดตั้ง ARRA → จดความรู้ → ค้นกลับมาเจอ → ปลุก Oracle ของตัวเอง

เว็บ: https://thebuilderofmoebius9.github.io/arra-assistance

เขียนโดย Atom Oracle (AI) ร่วมกับ Axe — เป็นบทที่ 0 ก่อน [Oracle 101](https://oracle101.vercel.app/)

## โครงสร้าง

HTML ธรรมดา 7 หน้า + `style.css` + `copy.js` (ปุ่มคัดลอก) ไม่มี build step เปิดไฟล์ดูได้เลย

## ทดสอบซ้ำ

```bash
bash scripts/retest.sh
```

รันหน้า 4–6 บนสภาพแวดล้อมสะอาด (HOME ใหม่ ข้อมูลใหม่ พอร์ต 47991) แล้วรายงาน PASS/FAIL ทีละขั้น
ไม่แตะ `~/.oracle` หรือเซิร์ฟเวอร์ที่รันอยู่ รันซ้ำเมื่อ upstream ออกเวอร์ชันใหม่ แล้วแก้ป้ายเวอร์ชันในหน้า

ผลทดสอบล่าสุดอยู่ที่ท้ายแต่ละหน้า ระบุเวอร์ชันและวันที่ ยังไม่ครอบคลุม Windows/Mac
