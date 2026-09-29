import paramiko

host = "85.120.216.163"
user = "root"
password = "pw5K11CnqL4WgSzm0V"
pubkey = "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIB2j1DWcuI34q9kxBBOLNWY4Rl/szj3tbCBFOErJbs0R jhona@DESKTOP-KJMRRTG"

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
try:
    ssh.connect(host, username=user, password=password)
    # Crear carpeta .ssh y agregar la llave
    ssh.exec_command('mkdir -p ~/.ssh && chmod 700 ~/.ssh')
    ssh.exec_command(f'echo "{pubkey}" >> ~/.ssh/authorized_keys')
    ssh.exec_command('chmod 600 ~/.ssh/authorized_keys')
    print("SUCCESS")
except Exception as e:
    print(f"ERROR: {e}")
finally:
    ssh.close()
