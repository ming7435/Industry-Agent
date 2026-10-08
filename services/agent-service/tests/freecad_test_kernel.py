"""离线脚本契约适配器；不代表 FreeCAD 内核验收，真实验收另走 MCP。"""
import contextlib
import io
import math
from pathlib import Path
import sys
from types import SimpleNamespace
from unittest.mock import patch


class Shape:
    def __init__(self, volume, bounds):
        self.Volume = volume
        self.BoundBox = SimpleNamespace(XLength=bounds[0], YLength=bounds[1], ZLength=bounds[2])
        self.Solids = [self]
        self._exact_bounds = self.BoundBox

    def isValid(self): return self.Volume > 0
    def isNull(self): return self.Volume <= 0
    def removeSplitter(self): return self
    def cut(self, other): return Shape(self.Volume - other.Volume, (30, 30, 50))
    def fuse(self, other): return Shape(self.Volume + other.Volume, (30, 30, 50))
    def optimalBoundingBox(self, useTriangulation=True, useShapeTolerance=False): return self._exact_bounds


class ScriptMCP:
    def __init__(self, triangulated_bounds=False):
        self.triangulated_bounds = triangulated_bounds
        self.geometry_executions = 0

    def call_tool(self, name, arguments, **kwargs):
        assert name == 'execute_code'
        objects = []
        def add_object(*_):
            obj = SimpleNamespace(Shape=None)
            objects.append(obj)
            return obj
        def export(items, filename):
            Path(filename).write_bytes(b'isolated-test-export')
            if self.triangulated_bounds:
                items[-1].Shape.BoundBox = SimpleNamespace(XLength=29.96, YLength=29.98, ZLength=50)
        def read(_):
            shape = objects[-1].Shape
            bounds = shape._exact_bounds
            return Shape(shape.Volume, (bounds.XLength, bounds.YLength, bounds.ZLength))
        def new_document(_):
            self.geometry_executions += 1
            return doc
        doc = SimpleNamespace(Name='isolated', addObject=add_object, recompute=lambda: None,
            saveAs=lambda file: Path(file).write_bytes(b'isolated-test-document'))
        app = SimpleNamespace(newDocument=new_document, closeDocument=lambda _: None, Vector=lambda *a: a)
        def solid(faces):
            # 从闭合多面体边界独立计算有向体积、面积、边长，核对生成模板的拓扑。
            vertices = {v for face in faces for v in face[:-1]}
            cross = lambda a, b: (a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0])
            sub = lambda a, b: tuple(x-y for x,y in zip(a,b))
            edges, areas, volume = set(), [], 0
            for face in faces:
                a,b,c = face[:3]
                volume += sum(x*y for x,y in zip(a,cross(b,c))) / 6
                areas.append(math.sqrt(sum(x*x for x in cross(sub(b,a),sub(c,a)))) / 2)
                for a,b in zip(face, face[1:]):
                    edges.add(tuple(sorted((a,b))))
            bounds = tuple(max(v[i] for v in vertices)-min(v[i] for v in vertices) for i in range(3))
            shape = Shape(volume, bounds)
            shape.Edges = [SimpleNamespace(Length=math.dist(a,b)) for a,b in sorted(edges)]
            shape.Faces = [SimpleNamespace(Area=area) for area in areas]
            return shape
        part = SimpleNamespace(makeCylinder=lambda r, h, *_: Shape(math.pi*r*r*h, (r*2,r*2,h)),
            makeBox=lambda x,y,z,*_: Shape(x*y*z, (x,y,z)), export=export, read=read,
            makePolygon=lambda vertices: vertices, Face=lambda vertices: vertices,
            makeShell=lambda faces: faces, makeSolid=solid)
        output = io.StringIO()
        with patch.dict(sys.modules, {'FreeCAD': app, 'Part': part, 'Mesh': SimpleNamespace(export=export)}), contextlib.redirect_stdout(output):
            exec(arguments['code'], {})
        return {'content': [{'type': 'text', 'text': 'Code executed successfully: ' + output.getvalue()}]}
