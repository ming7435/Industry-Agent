"""Prepare current real-gear YOLO11 and a generic PatchCore backbone.

Does not regenerate retired synthetic datasets or a synthetic normal memory bank.
A gear PatchCore bank must be built from confirmed normal product photographs.
"""
from pathlib import Path
import argparse,hashlib,json,shutil,urllib.request
ROOT=Path(__file__).resolve().parents[1]
BACKBONE_SHA="f37072fd47e89c5e827621c5baffa7500819f7896bbacec160b1a16c560e07ec"
BACKBONE_URL="https://download.pytorch.org/models/resnet18-f37072fd.pth"
def digest(path):
 with Path(path).open('rb') as stream:return hashlib.file_digest(stream,'sha256').hexdigest()
def main():
 parser=argparse.ArgumentParser(description=__doc__)
 parser.add_argument('--output',type=Path,default=ROOT/'.runtime/quality-models')
 parser.add_argument('--yolo-source',type=Path,default=ROOT/'.runtime/quality-models/yolo11-gear-v1')
 parser.add_argument('--backbone',type=Path,default=ROOT/'.runtime/quality-models/backbones/resnet18-f37072fd.pth')
 parser.add_argument('--download-source',action='store_true')
 args=parser.parse_args()
 source=args.yolo_source.resolve(strict=True)
 metadata=json.loads((source/'model.json').read_text(encoding='utf-8'))
 if metadata.get('architecture')!='yolo11n' or metadata.get('scope')!='public_gear_research_subset':
  raise ValueError('Expected the evaluated real-gear YOLO11n package')
 if digest(source/'best.pt')!=metadata.get('weights_sha256'):raise ValueError('Gear weights checksum mismatch')
 target=args.output.resolve()/'yolo11-gear-v1';target.mkdir(parents=True,exist_ok=True)
 if source!=target:
  for path in source.iterdir():
   if path.is_file():shutil.copy2(path,target/path.name)
 backbone=args.backbone.resolve()
 if not backbone.exists():
  if not args.download_source:raise FileNotFoundError('Missing ResNet18 backbone; use --download-source')
  backbone.parent.mkdir(parents=True,exist_ok=True)
  with urllib.request.urlopen(BACKBONE_URL,timeout=90) as response,backbone.open('xb') as stream:shutil.copyfileobj(response,stream)
 if digest(backbone)!=BACKBONE_SHA:raise ValueError('Backbone checksum mismatch')
 stable=args.output.resolve()/'backbones'/backbone.name;stable.parent.mkdir(parents=True,exist_ok=True)
 if stable!=backbone:shutil.copy2(backbone,stable)
 print(json.dumps({'QUALITY_YOLO_WEIGHTS':str(target/'best.pt'),'QUALITY_YOLO_METADATA':str(target/'model.json'),
  'QUALITY_PATCHCORE_BACKBONE_WEIGHTS':str(stable),'QUALITY_PATCHCORE_PRESET_DIR':'',
  'QUALITY_VISION_DATA_MODE':'gear','normal_memory_bank':'not supplied; requires confirmed normal gears',
  'settings_changed':False,'services_restarted':False},ensure_ascii=True,indent=2))
if __name__=='__main__':main()
