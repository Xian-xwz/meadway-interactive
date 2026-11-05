"""把现有查看器和同修订模型包组装为独立静态交付目录。"""
import argparse
import hashlib
import json
from pathlib import Path
import shutil


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def package(model, viewer, output):
    model, viewer, output = map(Path, (model, viewer, output))
    if output.exists():
        raise ValueError("交付目录已存在，请保留旧版并选择新目录")
    manifest_path = output.with_suffix(".manifest.json")
    if manifest_path.exists():
        raise ValueError("清单已存在，请选择新目录")
    summary = json.loads((model / "delivery.json").read_text("utf-8"))
    for key, filename in (("model_sha256", "model.glb"), ("metadata_sha256", "model.json"),
                          ("light_metadata_sha256", "model.light.json")):
        if sha(model / filename) != summary[key]:
            raise ValueError("模型包修订摘要不符")
    runtime = ["index.html", "engine.js", "viewer.js", "instances.js",
               "component-details.js", "style.css"]
    for name in runtime:
        if not (viewer / name).is_file():
            raise ValueError("查看器缺少 " + name)
    shutil.copytree(model, output)
    for name in runtime:
        shutil.copyfile(viewer / name, output / name)
    shutil.copytree(viewer / "vendor", output / "vendor")
    cfg = json.loads((viewer / "scene.json").read_text("utf-8"))
    cfg.update(model="./model.glb", metadata="./model.light.json")
    if cfg.get("ground"):
        shutil.copyfile(viewer / "ground.json", output / "ground.json")
    (output / "scene.json").write_text(json.dumps(cfg, ensure_ascii=False, indent=2) + "\n", "utf-8")
    (output / ".nojekyll").touch()
    files = [{"path": path.relative_to(output).as_posix(), "sha256": sha(path)}
             for path in sorted(output.rglob("*")) if path.is_file()]
    digest = hashlib.sha256(json.dumps(sorted((row["path"], row["sha256"]) for row in files),
                ensure_ascii=False, separators=(",", ":")).encode("utf-8")).hexdigest()
    assets = {"model": "model.glb", "metadata": "model.json"}
    if cfg.get("ground"):
        assets["terrain"] = "ground.json"
    manifest = {"schema": 1, "project": summary["project"], "root": str(output.resolve()),
                "entry": "index.html", "files": files, "assets": assets, "package_sha256": digest}
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", "utf-8")
    return manifest_path


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--model-package", required=True, type=Path)
    parser.add_argument("--out", required=True, type=Path)
    args = parser.parse_args()
    print(package(args.model_package, Path(__file__).resolve().parents[1], args.out))
