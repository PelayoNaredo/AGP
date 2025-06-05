@echo off
set PORT=80
set SUBDOMAIN= jennet-choice-quietly.ngrok-free.app

echo Iniciando Ngrok en el puerto %PORT% con el subdominio %SUBDOMAIN%...

ngrok http --url=jennet-choice-quietly.ngrok-free.app 80
pause