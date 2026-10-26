"""Show every view and every proposed region; never change labels or models."""
from collections import Counter
import html
from pathlib import Path
from PIL import Image,ImageDraw
import patchcore_multiview_experiment as base


def main():
    audit=base.ROOT/'output/patchcore-label-audit-v2'
    out=base.ROOT/'output/patchcore-label-review-all-views';out.mkdir(exist_ok=True)
    manifest=base.read(audit/'corrected-manifest.json')
    proposals={r['sample_id']:r for r in base.read(audit/'proposals.json')}
    rows=[r for r in manifest if r['split'] in ('calibration','test') and r.get('review_v2')=='uncertain_edge_or_dark_region']
    extras={'mechanics_gear_01671','mechanics_gear_01244','mechanics_gear_00830'}
    rows += [r for r in manifest if r['sample_id'] in extras]
    records=[]
    for row in rows:
        sid=row['sample_id'];regions=proposals.get(sid,{}).get('brown_regions',[])
        width=1500;crop_rows=(len(regions)+11)//12
        canvas=Image.new('RGB',(width,360+crop_rows*130),'white');draw=ImageDraw.Draw(canvas)
        draw.text((5,5),sid+' / all five views / proposal crops below; review image content, not a model score',fill='black')
        with Image.open(row['path']) as src:
            src=src.convert('RGB')
            for view,box in enumerate(base.view_boxes(src.size)):
                tile=src.crop(box);tile.thumbnail((295,295));canvas.paste(tile,(view*300,35));draw.text((view*300+5,20),'view '+str(view),fill='black')
            for i,region in enumerate(regions):
                x1,y1,x2,y2=region['bbox'];box=region['view_box']
                crop=src.crop((max(box[0],x1-12),max(0,y1-12),min(box[2],x2+12),min(src.height,y2+12)))
                crop.thumbnail((120,110));crop=crop.resize((120,110))
                px=(i%12)*125;py=360+(i//12)*130
                canvas.paste(crop,(px,py+15));draw.text((px,py),f"region {i+1} / v{region['view']}",fill='black')
        path=out/(sid+'.jpg');canvas.save(path,quality=95)
        records.append(dict(sample_id=sid,source_sha256=row['file_sha256'],gallery_sha256=base.sha(path),path=str(path),
            all_views_shown=5,all_proposed_regions_shown=len(regions),split=row['split'],decision='pending_full_view_review'))
    base.write(out/'manifest.json',records)
    cards='\n'.join(f'<article><h2>{html.escape(r["sample_id"])}</h2><a href="{Path(r["path"]).name}"><img src="{Path(r["path"]).name}" loading="lazy"></a></article>' for r in records)
    page='<!doctype html><html lang="zh-CN"><meta charset="utf-8"><title>PatchCore 全视角复核</title><style>body{font:16px system-ui;background:#eef2f4;color:#173640;margin:24px}article{background:white;padding:16px;margin:20px 0}img{width:100%;height:auto}h2{font-size:18px}</style><h1>全视角标签复核</h1><p>每图展示完整五视角和全部筛查区域。点击查看大图。这里不显示模型分数，不自动改标签；当前实验标签仍冻结。</p>'+cards+'</html>'
    (out/'index.html').write_text(page,encoding='utf-8')
    print('review galleries',len(records),'labels_changed',0)


if __name__=='__main__':main()
