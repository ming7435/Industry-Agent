"""Offline adapter for script contracts, not native FreeCAD verification."""
import contextlib
import io
import json
import math
from pathlib import Path
import sys
from types import SimpleNamespace
from unittest.mock import patch


class Vector:
    def __init__(self, *values):
        self.x, self.y, self.z = values
    def __iter__(self):
        return iter((self.x,self.y,self.z))


class Rotation:
    def __init__(self, axis=None, angle=0):
        self.Axis = axis or Vector(0,0,1)
        self.Angle = math.radians(angle)


class Placement:
    def __init__(self, vector=None, rotation=None):
        self.Base, self.Rotation = vector or Vector(0,0,0), rotation or Rotation()


class Shape:
    def __init__(self, volume, sizes):
        self.Volume, self.Solids = volume, [self]
        self.BoundBox = SimpleNamespace(XLength=sizes[0],YLength=sizes[1],ZLength=sizes[2])
        self.Edges, self.Faces = [], []
    def isValid(self): return self.Volume > 0
    def isNull(self): return self.Volume <= 0
    def optimalBoundingBox(self, *_): return self.BoundBox


class Object:
    def __init__(self, kind, name):
        self.TypeId, self.Name, self.Label = kind,name,name
        self.PropertiesList, self.InList, self.OutList, self.State = [], [], [], []
        self.ViewObject = SimpleNamespace(Visibility=True)
        self.Placement = Placement()
    def addProperty(self, kind, name, *_):
        self.PropertiesList.append(name)
        setattr(self,name,'')
        return self
    def setEditorMode(self, *_): pass
    def getTypeIdOfProperty(self, name): return 'App::PropertyString'


class Document:
    def __init__(self, name): self.Name,self.Objects = name,[]
    def addObject(self, kind, name):
        obj = Object(kind,name)
        self.Objects.append(obj)
        return obj
    def getObject(self, name): return next((o for o in self.Objects if o.Name == name),None)
    def removeObject(self, name): self.Objects = [o for o in self.Objects if o.Name != name]
    def recompute(self):
        for o in self.Objects:
            if o.TypeId == 'Part::Box': o.Shape = Shape(o.Length*o.Width*o.Height,[o.Length,o.Width,o.Height])
            if o.TypeId == 'Part::Cylinder': o.Shape = Shape(math.pi*o.Radius**2*o.Height,[2*o.Radius,2*o.Radius,o.Height])
            if o.TypeId == 'Part::Sphere': o.Shape = Shape(4/3*math.pi*o.Radius**3,[2*o.Radius]*3)
            if o.TypeId == 'Part::Cone': o.Shape = Shape(math.pi*o.Height/3*(o.Radius1**2+o.Radius2**2+o.Radius1*o.Radius2),[2*o.Radius1,2*o.Radius1,o.Height])
    def saveAs(self, filename):
        values = []
        for o in self.Objects:
            fields = {k:v for k,v in vars(o).items() if isinstance(v,(str,int,float,bool))}
            fields.update(PropertiesList=o.PropertiesList,visible=o.ViewObject.Visibility)
            if hasattr(o,'Shape'): fields['shape'] = [o.Shape.Volume,[o.Shape.BoundBox.XLength,o.Shape.BoundBox.YLength,o.Shape.BoundBox.ZLength]]
            values.append(fields)
        Path(filename).write_text(json.dumps(values),encoding='utf-8')


class FakeKernel:
    def __init__(self): self.executions=0; self.closed=[]
    def call_tool(self, name, arguments, **_):
        def new(name): self.executions+=1; return Document(name)
        def opened(filename):
            doc = Document('Copy')
            for saved in json.loads(Path(filename).read_text(encoding='utf-8')):
                o = doc.addObject(saved.pop('TypeId'),saved.pop('Name'))
                o.ViewObject.Visibility = saved.pop('visible')
                shape = saved.pop('shape',None)
                if shape: o.Shape = Shape(*shape)
                for k,v in saved.items(): setattr(o,k,v)
            return doc
        def export(objects, filename):
            # STEP fake preserves independently computed volume/bounds for roundtrip comparison.
            if filename.endswith('.step'):
                Path(filename).write_text(json.dumps([[o.Shape.Volume,[o.Shape.BoundBox.XLength,o.Shape.BoundBox.YLength,o.Shape.BoundBox.ZLength]] for o in objects]))
            else: Path(filename).write_bytes(b'isolated mesh triangles')
        def read(filename):
            shapes = [Shape(*v) for v in json.loads(Path(filename).read_text())]
            return compound(shapes)
        def compound(shapes):
            s = Shape(sum(v.Volume for v in shapes),[max(v.BoundBox.XLength for v in shapes),max(v.BoundBox.YLength for v in shapes),max(v.BoundBox.ZLength for v in shapes)])
            s.Solids = [v for shape in shapes for v in shape.Solids]
            return s
        app = SimpleNamespace(newDocument=new,openDocument=opened,closeDocument=self.closed.append,
                              Vector=Vector,Rotation=Rotation,Placement=Placement,Version=lambda:['offline-test'])
        part = SimpleNamespace(export=export,read=read,makeCompound=compound,
                               makeBox=lambda x,y,z,*_: Shape(x*y*z,[x,y,z]))
        stream=io.StringIO()
        with patch.dict(sys.modules,{'FreeCAD':app,'Part':part,'Mesh':SimpleNamespace(export=export)}),contextlib.redirect_stdout(stream):
            exec(arguments['code'],{})
        return {'content':[{'type':'text','text':stream.getvalue()}]}
