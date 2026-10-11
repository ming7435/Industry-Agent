"""Extract the authoritative trusted builder; never parses model-provided Python."""
import ast
from pathlib import Path


def kernel_source(spec):
    from .freecad_mcp import _program
    tree = ast.parse(_program(spec, Path('trusted-kernel-output'), 'FC-'+'0'*64))
    outer = next(node for node in tree.body if isinstance(node, ast.Try)
                 and any(isinstance(n, ast.FunctionDef) and n.name == 'build' for n in node.body))
    body = []
    for node in outer.body:
        if (isinstance(node, ast.Expr) and isinstance(node.value, ast.Call)
                and isinstance(node.value.func, ast.Attribute) and node.value.func.attr == 'recompute'):
            break
        body.append(node)
    body.append(ast.Return(value=ast.Tuple(elts=[ast.Name(id='objects', ctx=ast.Load()),
                                                ast.Name(id='extra',ctx=ast.Load())],ctx=ast.Load())))
    function = ast.FunctionDef(name='build_spec_document', args=ast.arguments(
        posonlyargs=[],args=[ast.arg(arg=v) for v in ('doc','spec','out')],kwonlyargs=[],kw_defaults=[],defaults=[]),
        body=body,decorator_list=[])
    dependencies = [n for n in tree.body if isinstance(n,(ast.Import,ast.ImportFrom,ast.FunctionDef))]
    module = ast.fix_missing_locations(ast.Module(body=[*dependencies,function],type_ignores=[]))
    return ast.unparse(module)
