import paramiko

host = "85.120.216.163"
user = "root"
password = "pw5K11CnqL4WgSzm0V"

print("[*] Conectando para revisar el VPS...")
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    ssh.connect(host, username=user, password=password)
    print("[+] Conectado. Ejecutando comandos...")
    
    # Revisar procesos de PM2 y archivos
    commands = """
    pm2 status
    echo "--- ARCHIVOS EN /root ---"
    ls -la /root
    echo "--- ARCHIVOS EN /var/www/santuario ---"
    ls -la /var/www/santuario
    """
    
    stdin, stdout, stderr = ssh.exec_command(commands)
    exit_status = stdout.channel.recv_exit_status()
    
    out = stdout.read().decode()
    err = stderr.read().decode()
    
    print(out)
    if err:
        print("Errores:")
        print(err)
        
finally:
    ssh.close()
