import os
import sys
import ftplib

FTP_HOST = '187.110.165.199'
FTP_PORT = 21
FTP_USER = 'ecotroca@ecotroca.aguaboa.mt.gov.br'
FTP_PASS = 'Ckb9pmm$qCO1Uxoj'
DIST_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'dist'))

def connect_ftp():
    print(f"Connecting to FTP server {FTP_HOST}:{FTP_PORT}...")
    try:
        print("Attempting FTPS (Explicit TLS)...")
        ftp = ftplib.FTP_TLS()
        ftp.connect(FTP_HOST, FTP_PORT, timeout=30)
        ftp.login(FTP_USER, FTP_PASS)
        ftp.prot_p()
        print("FTPS Connection successful!")
        return ftp
    except Exception as e:
        print(f"FTPS failed ({e}), falling back to plain FTP...")
        try:
            ftp = ftplib.FTP()
            ftp.connect(FTP_HOST, FTP_PORT, timeout=30)
            ftp.login(FTP_USER, FTP_PASS)
            print("Plain FTP Connection successful!")
            return ftp
        except Exception as e2:
            print(f"Plain FTP failed as well: {e2}")
            raise e2

def ensure_remote_dir(ftp, remote_path):
    dirs = [d for d in remote_path.split('/') if d]
    current = ""
    for d in dirs:
        current += "/" + d
        try:
            ftp.cwd(current)
        except ftplib.error_perm:
            try:
                print(f"Creating remote dir: {current}")
                ftp.mkd(current)
                ftp.cwd(current)
            except Exception as ex:
                print(f"Could not create dir {current}: {ex}")

def upload_directory(ftp, local_dir, remote_prefix=""):
    print(f"Starting upload from {local_dir} to remote root '{remote_prefix}'...")
    uploaded_count = 0
    
    for root, dirs, files in os.walk(local_dir):
        rel_path = os.path.relpath(root, local_dir)
        if rel_path == ".":
            remote_dir = remote_prefix or "/"
        else:
            remote_dir = (remote_prefix + "/" + rel_path).replace("\\", "/").replace("//", "/")
        
        # Ensure remote directory exists
        if remote_dir != "/":
            ensure_remote_dir(ftp, remote_dir)
        else:
            ftp.cwd("/")

        for f in files:
            # Skip OS junk
            if f in ['.DS_Store', 'Thumbs.db']:
                continue
            local_filepath = os.path.join(root, f)
            remote_filepath = os.path.join(remote_dir, f).replace("\\", "/")
            
            print(f"Uploading: {rel_path}/{f} -> {remote_filepath}")
            with open(local_filepath, 'rb') as fp:
                ftp.storbinary(f'STOR {f}', fp)
            uploaded_count += 1

    print(f"\nUpload complete! Total {uploaded_count} files uploaded.")

def main():
    if not os.path.exists(DIST_DIR):
        print(f"Error: Build directory '{DIST_DIR}' does not exist. Run 'npm run build' first.")
        sys.exit(1)

    ftp = connect_ftp()
    try:
        print(f"Current remote directory: {ftp.pwd()}")
        print(f"Remote files before deploy: {ftp.nlst()}")
        upload_directory(ftp, DIST_DIR)
        print("\nDeployment to production completed successfully!")
    finally:
        try:
            ftp.quit()
        except:
            ftp.close()

if __name__ == "__main__":
    main()
