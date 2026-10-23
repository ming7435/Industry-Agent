"""Audit generated boxes, hashes and group isolation before native-crop training."""
from collections import Counter
from hashlib import sha256
from pathlib import Path
import sys

ROOT=Path(__file__).resolve().parents[1]
sys.path[:0]=[str(ROOT)]
from scripts.prepare_yolo_native_hard_examples import DATA, OUT, FULL, SOURCE, native, transform_truth
from scripts.train_yolo_fine_defects import read,save,digest,crop_truth


def main():
    import numpy as np
    from PIL import Image
    document=read(DATA/'manifest.json');source=read(SOURCE/'manifest.json')
    assert document['source_manifest_sha256']==digest(SOURCE/'manifest.json')
    lookup={r['sample_id']:r for r in source['samples']}
    inventory={r['sample_id']:r for r in read(FULL/'annotation-index.json')}
    groups={split:{r['group_id'] for r in source['samples'] if r['split']==split} for split in ('train','calibration','test')}
    assert not groups['train']&groups['calibration'] and not groups['train']&groups['test']
    assert not groups['calibration']&groups['test']
    native_cache={};seen=set();counts=Counter()
    for row in document['samples']:
        original=lookup[row['source_id']]
        assert row['source_split']==row['split']==original['split'] in ('train','calibration')
        assert row['source_group']==original['group_id']
        path=DATA/row['path'];assert digest(path)==row['file_sha256']
        with Image.open(path) as f:
            image=f.convert('RGB');pixels=sha256(f'{image.size}:'.encode()+image.tobytes()).hexdigest()
            assert pixels==row['pixel_sha256'] and pixels not in seen
            seen.add(pixels);assert image.size==(row['width'],row['height'])
        if row['kind']=='real_whole':
            assert row['ground_truth']==original['ground_truth']
            # Prepared manifests use a different dimension prefix in their
            # pixel digest; compare with that original convention as well.
            assert sha256(f'RGB:{image.width}:{image.height}:'.encode()+image.tobytes()).hexdigest()==original['pixel_sha256']
        else:
            assert row['split']=='train'
            if row['source_id'] not in native_cache:
                original_image,truth=native(original,inventory);original_image.close()
                native_cache[row['source_id']]=truth
            truth=crop_truth(native_cache[row['source_id']],row['window'])
            assert truth is not None
            if row['kind']=='mined_texture_edge_negative':
                assert truth==[]
            if row['augmentation']:
                a=row['augmentation'];window=row['window']
                truth=transform_truth(truth,window[2]-window[0],window[3]-window[1],a['flip'],a['clockwise_turns'])
            assert truth==row['ground_truth']
        lines=(DATA/'labels'/row['split']/(row['sample_id']+'.txt')).read_text().splitlines()
        assert len(lines)==len(row['ground_truth'])
        for line,g in zip(lines,row['ground_truth']):
            c,x,y,w,h=map(float,line.split());assert document['classes'][int(c)]==g['label']
            box=[(x-w/2)*row['width'],(y-h/2)*row['height'],(x+w/2)*row['width'],(y+h/2)*row['height']]
            assert np.allclose(box,g['bbox'],atol=1e-6,rtol=0)
        counts[row['split']]+=1
    result={'images_verified':sum(counts.values()),'splits':dict(counts),'source_manifest_sha256':digest(SOURCE/'manifest.json'),
            'dataset_manifest_sha256':digest(DATA/'manifest.json'),'all_file_and_pixel_hashes_valid':True,
            'all_crop_and_transformed_boxes_valid':True,'all_yolo_labels_valid':True,'group_leakage':False,
            'test_in_training':False,'calibration_in_training':False,'calibration_pixels_unchanged':True,
            'new_independent_photos':0}
    save(OUT/'data-audit.json',result);print(result,flush=True)


if __name__=='__main__':
    main()
