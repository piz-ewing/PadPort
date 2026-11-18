"""Fetch verified Node.js Mobile Android headers and libraries from its official npm package."""
from __future__ import annotations
import base64
import hashlib
import shutil
import tarfile
from bootstrap import TOOLS, download

VERSION = "18.20.4"
URL = f"https://registry.npmjs.org/nodejs-mobile-react-native/-/nodejs-mobile-react-native-{VERSION}.tgz"
INTEGRITY = "Lba5nYNwEbw+K9WQnxcyY/9Beagw+NIVbyrCU6burCJZ1p1iKxSXTp5rctgvRxzQb4ARY0r9Uy1k7Dseb1FhVw=="
ARCHIVE = TOOLS / f"nodejs-mobile-react-native-{VERSION}.tgz"
TARGET = TOOLS / "nodejs-mobile"


def valid_archive():
    if not ARCHIVE.is_file():
        return False
    with ARCHIVE.open("rb") as source:
        digest = hashlib.file_digest(source, "sha512").digest()
    return base64.b64encode(digest).decode("ascii") == INTEGRITY


def fetch():
    if not valid_archive():
        download(URL, ARCHIVE)
    if not valid_archive():
        raise ValueError("Node runtime checksum mismatch")
    prefix = "package/android/libnode/"
    with tarfile.open(ARCHIVE) as source:
        for entry in source:
            if not entry.isfile() or not entry.name.startswith(prefix):
                continue
            destination = TARGET / entry.name[len(prefix):]
            if not destination.resolve().is_relative_to(TARGET.resolve()):
                raise ValueError("Unsafe archive path")
            destination.parent.mkdir(parents=True, exist_ok=True)
            with source.extractfile(entry) as data, destination.open("wb") as output:
                shutil.copyfileobj(data, output)
        with source.extractfile("package/LICENSE") as data:
            (TARGET / "LICENSE").write_bytes(data.read())
    print("Node runtime ready:", TARGET)
    return TARGET


if __name__ == "__main__":
    fetch()
