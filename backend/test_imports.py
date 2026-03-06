import sys
import traceback

results = []

def test(label, fn):
    try:
        fn()
        results.append(f"OK: {label}")
    except Exception as e:
        results.append(f"FAIL: {label} -> {e}")
        traceback.print_exc()

test("bcrypt", lambda: __import__("bcrypt"))
test("passlib", lambda: __import__("passlib.context", fromlist=["CryptContext"]))
test("jose", lambda: __import__("jose", fromlist=["jwt", "JWTError"]))
test("fastapi", lambda: __import__("fastapi"))
test("sqlalchemy", lambda: __import__("sqlalchemy"))
test("app.database", lambda: __import__("app.database"))
test("app.models", lambda: __import__("app.models"))
test("app.main", lambda: __import__("app.main"))

for r in results:
    print(r)
