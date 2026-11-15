*** Settings ***
# ─────────────────────────────────────────────────────────────
# Library — นำเข้า Library ที่จะใช้ใน Suite นี้
# ─────────────────────────────────────────────────────────────
Library             SeleniumLibrary

# Suite Setup/Teardown — ทำงานครั้งเดียวต่อ Suite ทั้งหมด
Suite Setup         Open Browser    ${FRONTEND_URL}    ${BROWSER}
Suite Teardown      Close Browser

# Test Setup — Navigate กลับหน้า Login ก่อนทุก Test Case
Test Setup          Go To    ${LOGIN_URL}

*** Variables ***
# ─────────────────────────────────────────────────────────────
# ตัวแปรกลางที่ใช้ร่วมกันทั้ง Suite
# ${} = Scalar Variable   @{} = List   &{} = Dictionary
# ─────────────────────────────────────────────────────────────
${BROWSER}          chrome
${FRONTEND_URL}     http://localhost:5173
${LOGIN_URL}        http://localhost:5173/login
${ADMIN_URL}        http://localhost:5173/admin
${VALID_USER}       admin
${VALID_PASS}       admin123
${INVALID_PASS}     wrongpassword

*** Test Cases ***

# ─────────────────────────────────────────────────────────────
# TC_UI_001: ตรวจสอบ Element บนหน้า Login
# ─────────────────────────────────────────────────────────────
TC_UI_001 หน้า Login โหลดได้สำเร็จและแสดง Element ครบถ้วน
    [Documentation]    ตรวจสอบว่าหน้า Login มี Element พื้นฐานครบ
    ...                ได้แก่ หัวข้อ, Input username, Input password, ปุ่ม Submit

    # Page Should Contain — ตรวจสอบว่าหน้ามีข้อความที่ระบุ
    Page Should Contain             เข้าสู่ระบบ

    # Element Should Be Visible — ตรวจสอบว่า Element มองเห็นได้
    Element Should Be Visible       xpath=//input[@type='text']
    Element Should Be Visible       xpath=//input[@type='password']
    Element Should Be Visible       xpath=//button[@type='submit']

# ─────────────────────────────────────────────────────────────
# TC_UI_002: Happy Path — Login ด้วย Credentials ที่ถูกต้อง
# ─────────────────────────────────────────────────────────────
TC_UI_002 Login สำเร็จและ Redirect ไปหน้า Admin Dashboard
    [Documentation]    ทดสอบ Login ด้วย Admin Credentials ที่ถูกต้อง
    ...                ผลที่คาดหวัง: URL เปลี่ยนไป /admin และแสดงหน้า Dashboard

    # Input Text — พิมพ์ข้อความลง Input Field
    Input Text              xpath=//input[@type='text']       ${VALID_USER}
    Input Text              xpath=//input[@type='password']   ${VALID_PASS}

    # Click Button — คลิกปุ่ม Submit
    Click Button            xpath=//button[@type='submit']

    # Wait Until Location Is — รอจนกว่า URL จะเปลี่ยนเป็น Admin URL (timeout 5 วินาที)
    Wait Until Location Is  ${ADMIN_URL}    timeout=5s

    # ตรวจสอบว่าหน้า Dashboard แสดงข้อความถูกต้อง
    Page Should Contain     ระบบจัดการห้องพัก

    [Teardown]              Go To    ${LOGIN_URL}

# ─────────────────────────────────────────────────────────────
# TC_UI_003: Negative — Login ด้วย Password ผิด
# ─────────────────────────────────────────────────────────────
TC_UI_003 Login ล้มเหลวด้วย Password ผิดและแสดง Error Message
    [Documentation]    ทดสอบว่าระบบแสดง Error เมื่อ Password ไม่ถูกต้อง
    ...                ผลที่คาดหวัง: อยู่หน้า Login, เห็น Error แดง

    Input Text          xpath=//input[@type='text']       ${VALID_USER}
    Input Text          xpath=//input[@type='password']   ${INVALID_PASS}
    Click Button        xpath=//button[@type='submit']

    # Wait Until Element Is Visible — รอจนกว่า Error box จะปรากฏ
    Wait Until Element Is Visible
    ...                 xpath=//div[contains(@class,'bg-red')]    timeout=3s

    Element Should Be Visible
    ...                 xpath=//div[contains(@class,'bg-red')]

    # ตรวจสอบว่า URL ไม่เปลี่ยน (ยังอยู่หน้า Login)
    Location Should Be  ${LOGIN_URL}

# ─────────────────────────────────────────────────────────────
# TC_UI_004: Protected Route
# ─────────────────────────────────────────────────────────────
TC_UI_004 เข้าหน้า Admin โดยไม่ Login ต้อง Redirect กลับหน้า Login
    [Documentation]    ทดสอบว่า ProtectedRoute ทำงานถูกต้อง
    ...                ผลที่คาดหวัง: ถูก Redirect กลับ /login อัตโนมัติ

    # Delete All Cookies — ล้าง Session ทั้งหมดเพื่อ Simulate ไม่ได้ Login
    Delete All Cookies

    # พยายามเข้าหน้า Admin โดยตรง
    Go To               ${ADMIN_URL}

    # Wait Until Location Contains — รอจนกว่า URL จะมีคำว่า /login
    Wait Until Location Contains    /login    timeout=5s
    Page Should Contain             เข้าสู่ระบบ

# ─────────────────────────────────────────────────────────────
# TC_UI_005: Logout
# ─────────────────────────────────────────────────────────────
TC_UI_005 Logout สำเร็จและ Redirect กลับหน้า Login
    [Documentation]    ทดสอบการ Logout จาก Admin Dashboard

    # เรียก Custom Keyword ที่นิยามใน *** Keywords *** section
    Perform Admin Login     ${VALID_USER}    ${VALID_PASS}
    Wait Until Location Is  ${ADMIN_URL}     timeout=5s

    # คลิกปุ่ม "ออกจากระบบ"
    Click Element           xpath=//button[contains(text(),'ออกจากระบบ')]

    Wait Until Location Contains    /login    timeout=5s
    Page Should Contain             เข้าสู่ระบบ

# ─────────────────────────────────────────────────────────────
# TC_UI_006 (นักศึกษาออกแบบเอง)
# ─────────────────────────────────────────────────────────────
#TC_UI_006 ________________________________
#    [Documentation]    ________________________________

#    ________________________________
#    ________________________________
#    ________________________________

*** Keywords ***
# ─────────────────────────────────────────────────────────────
# Custom Keywords = Function ที่สร้างเองเพื่อใช้ซ้ำ
# ลดการเขียน Code ซ้ำ และทำให้ Test Case อ่านเข้าใจง่ายขึ้น
# ─────────────────────────────────────────────────────────────

Perform Admin Login
    [Documentation]    Keyword สำหรับทำ Login ด้วย credentials ที่ระบุ
    [Arguments]    ${username}    ${password}
    # [Arguments] — กำหนด Parameter ที่รับเข้ามา
    Go To           ${LOGIN_URL}
    Input Text      xpath=//input[@type='text']       ${username}
    Input Text      xpath=//input[@type='password']   ${password}
    Click Button    xpath=//button[@type='submit']

Verify Error Message Is Visible
    [Documentation]    Keyword สำหรับตรวจสอบว่า Error Message แสดงขึ้นมา
    Wait Until Element Is Visible
    ...    xpath=//div[contains(@class,'bg-red')]    timeout=3s
    Element Should Be Visible
    ...    xpath=//div[contains(@class,'bg-red')]