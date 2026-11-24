from argparse import ArgumentParser
from getpass import getpass

from email_validator import EmailNotValidError, validate_email
from sqlalchemy.exc import IntegrityError

from app.database import SessionLocal, initialize_database
from app.models.user import AccountStatus, User, UserRole
from app.security import hash_password


def main():
    parser = ArgumentParser(description="Create a new GlobalRoute administrator.")
    parser.add_argument("--email", required=True, help="Email address for a new account")
    parser.add_argument("--name", default="GlobalRoute Admin", help="Display name")
    args = parser.parse_args()

    try:
        email = validate_email(args.email.strip(), check_deliverability=False).normalized.lower()
    except EmailNotValidError as exc:
        parser.error(str(exc))

    name = args.name.strip()
    if not 2 <= len(name) <= 150:
        parser.error("the display name must contain 2 to 150 characters")

    password = getpass("New admin password: ")
    if not 16 <= len(password) <= 128 or not password.strip():
        parser.error("the password must contain 16 to 128 characters")
    if password != getpass("Confirm admin password: "):
        parser.error("the passwords do not match")

    initialize_database()
    with SessionLocal() as db:
        if db.query(User).filter(User.email == email).first() is not None:
            parser.error("an account with this email already exists")

        db.add(
            User(
                full_name=name,
                email=email,
                whatsapp_number="",
                country="",
                preferred_language="en",
                hashed_password=hash_password(password),
                role=UserRole.ADMIN,
                status=AccountStatus.ACTIVE,
                is_active=True,
            )
        )
        try:
            db.commit()
        except IntegrityError:
            parser.error("could not create the account; confirm the email is unused")

    print(f"An administrator was created for {email}.")


if __name__ == "__main__":
    main()
