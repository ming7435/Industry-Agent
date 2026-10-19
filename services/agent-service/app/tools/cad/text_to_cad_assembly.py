"""Headless assembly constraints and wall/slab solids; no desktop workbenches."""
import json
import math
from pathlib import Path
from cadgen import build123d as bd


def build_bim(config):
    walls, products = {}, []
    for item in config['walls']:
        start, end = item['start'], item['end']
        length = math.dist(start, end)
        angle = math.degrees(math.atan2(end[1]-start[1], end[0]-start[0]))
        shape = bd.Solid.make_box(length, item['thickness'], item['height']).translate((0,-item['thickness']/2,0))
        shape = shape.rotate(bd.Axis.Z, angle).translate(tuple(start))
        walls[item['name']] = [shape, item, angle]
    before = sum(record[0].volume for record in walls.values())
    expected = 0
    for opening in config['openings']:
        shape, item, angle = walls[opening['wall']]
        cut = bd.Solid.make_box(opening['width'],item['thickness']+2,opening['height'])
        cut = cut.translate((opening['offset'],-item['thickness']/2-1,opening['sill']))
        cut = cut.rotate(bd.Axis.Z,angle).translate(tuple(item['start']))
        walls[opening['wall']][0] = shape.cut(cut)
        expected += opening['width']*opening['height']*item['thickness']
    removed = before-sum(record[0].volume for record in walls.values())
    if not math.isclose(removed,expected,rel_tol=1e-7,abs_tol=1e-5):
        raise ValueError('建筑开口的实际切除体积不符合指定尺寸')
    for name, (shape, _, _) in walls.items():
        shape.label = name
        products.append(shape)
    for item in config['slabs']:
        x,y,z = item['position']
        shape = bd.Solid.make_box(item['length'],item['width'],item['thickness']).translate((x,y,z-item['thickness']))
        shape.label = item['name']
        products.append(shape)
    if any(not shape.is_valid or len(shape.solids())!=1 or shape.volume<=0 for shape in products):
        raise ValueError('建筑对象没有形成有效单实体')
    return products, {'model_kind':'bim','bim':{'verified':True,'walls':len(config['walls']),
        'slabs':len(config['slabs']),'openings':len(config['openings']),'opening_volume_removed':removed}}


def constrain_assembly(shapes, part_names, config, out):
    """Solve explicit connector constraints and verify residuals for every frame.

    Ground is fixed. Fixed mates constrain all six DOF, revolute mates leave
    rotation about their z axis, and slider mates leave translation along z.
    Closed loops are accepted only if their residuals meet the same tolerance.
    """
    import numpy as np
    from scipy.optimize import least_squares
    from scipy.spatial.transform import Rotation
    from OCP.gp import gp_Trsf, gp_Quaternion, gp_Vec
    moving = [name for name in part_names if name!=config['grounded']]
    indices = {name:index for index,name in enumerate(moving)}
    scale = max(1.0, max(max(shape.bounding_box().size) for shape in shapes))

    def connector(value):
        axis = np.asarray(value['axis'],dtype=float)
        axis /= np.linalg.norm(axis)
        # Historical connector offsets rotate Z onto axis by the shortest arc.
        # Projecting world X onto its plane introduces an extra roll for oblique
        # axes, changing fixed mates, slider orientation, and revolute zero pose.
        transverse = math.hypot(axis[0], axis[1])
        if transverse:
            rotation_axis = np.array([-axis[1]/transverse, axis[0]/transverse, 0.])
            rotation = Rotation.from_rotvec(rotation_axis * math.atan2(transverse, axis[2]))
        else:
            rotation = Rotation.from_rotvec([math.pi if axis[2] < 0 else 0., 0., 0.])
        return np.asarray(value['position']), rotation.as_matrix()

    frames = {joint['name']:(connector(joint['connector1']),connector(joint['connector2'])) for joint in config['joints']}

    def poses(values):
        result = {config['grounded']:(np.zeros(3),np.eye(3))}
        for name,index in indices.items():
            data = values[index*6:index*6+6]
            result[name] = (data[:3]*scale,Rotation.from_rotvec(data[3:]).as_matrix())
        return result

    def residual(values, driven=None):
        position = poses(values)
        result = []
        for joint in config['joints']:
            (c1,r1),(c2,r2) = frames[joint['name']]
            t1,q1=position[joint['part1']]; t2,q2=position[joint['part2']]
            a,b=q1@r1,q2@r2
            delta=a.T@((q2@c2+t2)-(q1@c1+t1))/scale
            relative=a.T@b
            if joint['type']=='slider':
                result.extend(delta[:2])
                result.extend(Rotation.from_matrix(relative).as_rotvec())
                if driven is not None and driven[0]==joint['name']:
                    result.append(delta[2]-driven[1]/scale)
            else:
                result.extend(delta)
                if joint['type']=='fixed':
                    result.extend(Rotation.from_matrix(relative).as_rotvec())
                elif driven is not None and driven[0]==joint['name']:
                    expected=Rotation.from_euler('z',driven[1],degrees=True).as_matrix()
                    result.extend(Rotation.from_matrix(expected.T@relative).as_rotvec())
                else:
                    # Full axis residual also rejects anti-parallel connectors.
                    result.extend(relative[:,2]-np.array([0.,0,1]))
        return np.asarray(result)

    def solve(initial, driven=None):
        solution=least_squares(lambda values:residual(values,driven),initial,ftol=1e-12,xtol=1e-12,gtol=1e-12,max_nfev=500)
        error=residual(solution.x,driven)
        if not solution.success or not np.all(np.isfinite(solution.x)) or np.max(np.abs(error))>1e-8:
            raise ValueError('装配约束未求解到允许误差，不能生成推测姿态')
        return solution.x

    def location(pose):
        translation,rotation=pose
        quaternion=Rotation.from_matrix(rotation).as_quat()
        transform=gp_Trsf()
        transform.SetRotation(gp_Quaternion(*map(float,quaternion)))
        transform.SetTranslationPart(gp_Vec(*map(float,translation)))
        return bd.Location(transform)

    values=np.zeros(6*len(moving))
    motion=config.get('motion')
    values=solve(values,(motion['joint'],motion['start']) if motion else None)
    first=poses(values)
    if motion:
        meshes=[]
        triangles_count=0
        for name,shape in zip(part_names,shapes):
            vertices,triangles=shape.tessellate(.25)
            triangles_count+=len(triangles)
            if not triangles or triangles_count>60000:
                raise ValueError('运动网格为空或超过60000三角形资源上限')
            coordinates=[float(component) for face in triangles for index in face for component in vertices[index]]
            meshes.append({'name':name,'triangles':coordinates})
        timeline=[]
        for index in range(motion['frames']):
            amount=motion['start']+(motion['end']-motion['start'])*index/(motion['frames']-1)
            values=solve(values,(motion['joint'],amount))
            solved=poses(values)
            placements=[{'name':name,'position':solved[name][0].tolist(),
                         'quaternion':Rotation.from_matrix(solved[name][1]).as_quat().tolist()} for name in part_names]
            timeline.append({'time':index*motion['duration']/(motion['frames']-1),'placements':placements})
        # A full revolution has the same end pose; intermediate poses prove motion.
        if all(frame['placements']==timeline[0]['placements'] for frame in timeline[1:]):
            raise ValueError('运动驱动未改变零件姿态')
        payload=json.dumps({'components':meshes,'frames':timeline},ensure_ascii=False,allow_nan=False)
        if len(payload.encode('utf-8'))>32*1024*1024:
            raise ValueError('运动文件超过32MiB')
        (Path(out)/'motion.json').write_text(payload,encoding='utf-8')
    products=[]
    for name,shape in zip(part_names,shapes):
        transformed=shape.moved(location(first[name]))
        transformed.label=shape.label
        products.append(transformed)
    proof={'verified':True,'solver_status':0,'solver':'scipy-least-squares-connector-constraints',
           'grounded':config['grounded'],'joint_count':len(config['joints']),
           'motion_frames':motion['frames'] if motion else 0,'motion_interference_checked':False,
           'joints':[{key:joint[key] for key in ('name','type','part1','part2')} for joint in config['joints']]}
    return products, {'model_kind':'assembly','assembly':proof}
