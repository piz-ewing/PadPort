"""Locate the installed Android build tools and cached Gradle distribution."""
from __future__ import annotations
import os
import shutil
import sys
import time
import urllib.request
import zipfile
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
TOOLS=ROOT/".tools"
SDK=Path(os.environ.get("ANDROID_HOME") or os.environ.get("ANDROID_SDK_ROOT") or
         str(Path.home()/"AppData/Local/Android/Sdk"))
GRADLE="8.14.5"

def download(url,path):
    path.parent.mkdir(parents=True,exist_ok=True)
    print("Download",url,flush=True)
    for attempt in range(3):
        try:
            request=urllib.request.Request(url,headers={"User-Agent":"PadPort-build/0.1"})
            with urllib.request.urlopen(request,timeout=120) as response,path.with_suffix(path.suffix+".part").open("wb") as out:
                shutil.copyfileobj(response,out)
            path.with_suffix(path.suffix+".part").replace(path)
            return
        except Exception:
            if attempt==2: raise
            time.sleep(3)

def unpack(archive,dest):
    dest.mkdir(parents=True,exist_ok=True)
    with zipfile.ZipFile(archive) as z:
        for entry in z.infolist():
            p=dest/entry.filename
            if not p.resolve().is_relative_to(dest.resolve()): raise ValueError("Unsafe archive path")
        z.extractall(dest)

def prepare():
    env=dict(os.environ)
    properties=ROOT/"local.properties"
    sdk=SDK
    if properties.is_file():
        for line in properties.read_text(encoding="utf-8").splitlines():
            if line.startswith("sdk.dir="):
                sdk=Path(line.split("=",1)[1].replace("\\:",":").replace("\\\\","\\"))
    for required in ["platforms/android-35/android.jar", "build-tools/35.0.0", "ndk/27.0.12077973", "cmake/3.22.1"]:
        if not (sdk/required).exists(): raise RuntimeError("Missing installed Android component: "+str(sdk/required))
    executable="gradle.bat" if os.name=="nt" else "gradle"
    cache=Path(env.get("GRADLE_USER_HOME",str(Path.home()/".gradle")))
    candidates=[]
    if env.get("GRADLE_HOME"): candidates.append(Path(env["GRADLE_HOME"]))
    candidates.extend(sorted((cache/"wrapper/dists"/f"gradle-{GRADLE}-bin").glob(f"*/gradle-{GRADLE}")))
    candidates.append(TOOLS/f"gradle-{GRADLE}")
    gradle=next((candidate for candidate in candidates if (candidate/"bin"/executable).is_file()),None)
    if gradle is None: raise RuntimeError("No installed Gradle distribution found for "+GRADLE)
    if os.name=="nt":
        candidates=[Path(env.get("JAVA_HOME","__missing__")),Path(r"C:\Program Files\Android\Android Studio\jbr")]
        for candidate in candidates:
            if (candidate/"bin/javac.exe").exists(): env["JAVA_HOME"]=str(candidate);break
    if not properties.exists(): properties.write_text("sdk.dir="+sdk.as_posix()+"\n",encoding="utf-8")
    env["ANDROID_HOME"]=str(sdk)
    env["ANDROID_SDK_ROOT"]=str(sdk)
    print("Gradle ready:",gradle,"SDK:",sdk,"JDK:",env.get("JAVA_HOME","PATH"),flush=True)
    return gradle,env

if __name__=="__main__":
    if hasattr(sys.stdout,"reconfigure"): sys.stdout.reconfigure(encoding="utf-8")
    prepare()
