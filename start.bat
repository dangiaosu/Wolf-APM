@echo off
chcp 65001 >nul
SETLOCAL

:: Kiểm tra xem file .env có tồn tại hay không
IF EXIST .env (
    echo File .env đã tồn tại, bỏ qua bước tạo file.
) ELSE (
    echo Tạo file .env...

    :: Hỏi người dùng về PORT và tên database
    set /p PORT="Nhập PORT bạn muốn sử dụng cho server (mặc định là 5000): "
    if "%PORT%"=="" set PORT=5000
    set /p DBNAME="Nhập tên database MongoDB: "
    if "%DBNAME%"=="" set DBNAME=yourdbname

    :: Tạo file .env với thông tin từ người dùng
    echo PORT=%PORT%> .env
    echo MONGO_URI=mongodb://localhost:27017/%DBNAME%>> .env

    echo File .env đã được tạo thành công.
)

:: Cài đặt dependencies Backend nếu chưa có node_modules
echo Kiểm tra dependencies Backend...
cd /d "%~dp0backend"
if exist node_modules (
    echo Dependencies Backend đã được cài đặt, bỏ qua.
) else (
    echo Cài đặt dependencies Backend...
    npm install
)

:: Chạy Backend - chạy trực tiếp server.js
echo Khởi động Backend...
if exist server.js (
    start cmd /k "node server.js"
) else (
    echo Không tìm thấy server.js trong backend, vui lòng kiểm tra lại.
    pause
    exit /b
)

:: Quay lại thư mục chính
cd /d "%~dp0"

:: Cài đặt dependencies Frontend nếu chưa có node_modules
echo Kiểm tra dependencies Frontend...
cd /d "%~dp0frontend"
if exist node_modules (
    echo Dependencies Frontend đã được cài đặt, bỏ qua.
) else (
    echo Cài đặt dependencies Frontend...
    npm install
)

:: Chạy Frontend với react-scripts
echo Khởi động Frontend...
start cmd /k "npm start"

cd /d "%~dp0"
echo Đã khởi động thành công Backend và Frontend.
pause
