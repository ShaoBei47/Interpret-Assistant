@echo off
echo ========================================
echo  Interpret-Assistant - 本地开发服务器
echo ========================================
echo.
echo 在浏览器中打开: http://localhost:8000/src/index.html
echo 按 Ctrl+C 停止服务器
echo.
python -m http.server 8000
pause
