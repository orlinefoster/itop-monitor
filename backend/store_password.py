"""
One-time script to store your iTOP password in Windows Credential Manager.

Usage:
    python store_password.py

It will prompt for the password (hidden input) and save it encrypted.
After that, you can delete the password from your .env file safely.
"""
from __future__ import annotations

import getpass

from credential import set_password


def main():
    print("=" * 55)
    print("  iTOP Monitor — Almacenar contraseña de forma segura")
    print("=" * 55)
    print()
    print("La contraseña se guardará en el Credential Manager de Windows.")
    print("Queda cifrada con tu usuario de Windows. Solo vos podés leerla.")
    print()

    pw = getpass.getpass("Ingresá la contraseña de iTOP: ")
    if not pw:
        print("❌ No ingresaste ninguna contraseña.")
        return

    if set_password(pw):
        print("✅ Contraseña almacenada de forma segura.")
        print()
        print("Ahora ya podés dejar ITOP_PASSWORD vacío (o borrarlo) en el .env")
        print()
        print("Para probar que funciona:")
        print("  python -c \"from credential import get_password; print('OK' if get_password() else 'FAIL')\"")
    else:
        print("❌ Error al guardar la contraseña.")


if __name__ == "__main__":
    main()
