"""Trusted harness. Uploaded source MUST run only in the isolated provider.

Local tests import this module only for repository-owned fixtures. AST policy is
coverage/tamper defense, not the isolation boundary. No local API execution path.
"""
import ast
import builtins
import copy
import hashlib
import json
import math
import sys
from typing import List, Dict, Set, Tuple, Optional

FILENAME = "submitted_solution.py"
ALLOWED = {
    ast.Module, ast.ClassDef, ast.FunctionDef, ast.arguments, ast.arg, ast.Return,
    ast.Assign, ast.AugAssign, ast.AnnAssign, ast.For, ast.While, ast.If,
    ast.Break, ast.Continue, ast.Pass, ast.Expr, ast.Name, ast.Load, ast.Store,
    ast.Constant, ast.List, ast.Tuple, ast.Set, ast.Dict, ast.Subscript, ast.Slice,
    ast.BinOp, ast.UnaryOp, ast.BoolOp, ast.Compare, ast.Call, ast.keyword,
    ast.Attribute, ast.IfExp, ast.ListComp, ast.SetComp, ast.DictComp,
    ast.GeneratorExp, ast.comprehension, ast.Add, ast.Sub, ast.Mult, ast.Div,
    ast.FloorDiv, ast.Mod, ast.USub, ast.UAdd, ast.Not, ast.And, ast.Or,
    ast.Eq, ast.NotEq, ast.Lt, ast.LtE, ast.Gt, ast.GtE, ast.In, ast.NotIn,
}
FUNCTIONS = {"len", "range", "sum", "min", "max", "abs", "enumerate", "zip",
             "sorted", "reversed", "list", "dict", "set", "tuple", "int",
             "float", "str", "bool", "any", "all"}
METHODS = {"append", "pop", "remove", "add", "discard", "get", "keys", "values",
           "items", "count", "index", "sort", "reverse", "copy", "clear"}
TYPES = {"List", "Dict", "Set", "Tuple", "Optional"}


class Unsupported(Exception):
    pass


def inspect(source, method):
    if len(source.encode("utf-8")) > 50000:
        raise Unsupported("Source exceeds 50 KB.")
    tree = ast.parse(source, filename=FILENAME)
    if len(tree.body) != 1 or not isinstance(tree.body[0], ast.ClassDef):
        raise Unsupported("Submit one class Solution. Imports are supplied by the harness.")
    cls = tree.body[0]
    if cls.name != "Solution" or cls.bases or cls.keywords or cls.decorator_list:
        raise Unsupported("Use class Solution without inheritance or decorators.")
    if len(cls.body) != 1 or not isinstance(cls.body[0], ast.FunctionDef):
        raise Unsupported("This release supports one solution method, without helper functions.")
    fn = cls.body[0]
    if fn.name != method or fn.decorator_list or fn.args.defaults or fn.args.kw_defaults:
        raise Unsupported("The method signature must match the selected problem, without defaults.")
    if fn.args.vararg or fn.args.kwarg or fn.args.kwonlyargs or fn.args.posonlyargs:
        raise Unsupported("Use ordinary positional arguments.")
    if not fn.args.args or fn.args.args[0].arg != "self":
        raise Unsupported("The first argument must be self.")
    for node in ast.walk(tree):
        if type(node) not in ALLOWED:
            raise Unsupported(f"{type(node).__name__} is not supported (line {getattr(node, 'lineno', 1)}).")
        if isinstance(node, ast.Name) and (node.id.startswith("_") or node.id in {"globals", "locals", "eval", "exec", "open", "compile", "getattr", "setattr", "type", "super", "vars"}):
            raise Unsupported(f"Name {node.id} is not supported.")
        if isinstance(node, ast.Attribute) and node.attr not in METHODS:
            raise Unsupported(f"Attribute {node.attr} is not supported.")
        if isinstance(node, ast.Call):
            if isinstance(node.func, ast.Name):
                if node.func.id not in FUNCTIONS:
                    raise Unsupported(f"Call {node.func.id} is not supported.")
            elif not isinstance(node.func, ast.Attribute):
                raise Unsupported("Indirect calls are not supported.")
        if isinstance(node, ast.Name) and isinstance(node.ctx, ast.Store) and node.id in FUNCTIONS | TYPES | {"self", "Solution"}:
            raise Unsupported("Do not shadow harness names or built-in functions.")
        if isinstance(node, ast.FunctionDef) and node is not fn:
            raise Unsupported("Nested functions are not supported.")
    return tree, fn


def encode(value, depth=0):
    if depth > 5:
        raise Unsupported("The teaching state is too deeply nested.")
    if value is None or type(value) in (str, int, float, bool):
        if type(value) is float and not math.isfinite(value):
            # Preserve meaningful sentinels without invalid JSON numeric tokens.
            return "−∞" if value < 0 else "∞" if value > 0 else "NaN"
        if isinstance(value, str) and len(value) > 2000:
            raise Unsupported("String snapshot exceeds the teaching limit.")
        return value
    if type(value) in (list, tuple, set):
        if len(value) > 100:
            raise Unsupported("Collection snapshot exceeds the teaching limit.")
        items = [encode(v, depth + 1) for v in value]
        return sorted(items, key=lambda v: json.dumps(v, sort_keys=True)) if type(value) is set else items
    if type(value) is dict:
        if len(value) > 100 or any(type(k) is not str for k in value):
            raise Unsupported("Trace dictionaries require string keys and at most 100 entries.")
        return {k: encode(v, depth + 1) for k, v in value.items()}
    raise Unsupported("An unsupported runtime value entered the teaching state.")


def execute(source, method, args, trace=False):
    tree, fn = inspect(source, method)
    if len(fn.args.args) != len(args) + 1:
        raise Unsupported("The method argument count does not match the problem.")
    safe = {name: getattr(builtins, name) for name in FUNCTIONS}
    safe["__build_class__"] = builtins.__build_class__
    scope = {"__builtins__": safe, "__name__": "solution", "List": List,
             "Dict": Dict, "Set": Set, "Tuple": Tuple, "Optional": Optional}
    exec(compile(tree, FILENAME, "exec"), scope)
    events = []
    references = {}
    retained_objects = []
    def record(frame, event, arg):
        if frame.f_code.co_filename != FILENAME or frame.f_code.co_name != method:
            return record
        if event not in ("line", "return"):
            return record
        if len(events) >= 500:
            raise Unsupported("Trace exceeds 500 frames. Try a smaller example.")
        values = {k: encode(v) for k, v in frame.f_locals.items() if k != "self"}
        collections = {}
        for name, value in frame.f_locals.items():
            if type(value) in (list, tuple, set, dict):
                if id(value) not in references:
                    references[id(value)] = len(references)
                    retained_objects.append(value)  # Prevent recycled identities during this trace.
                collections[name] = {"kind": type(value).__name__, "ref": references[id(value)]}
        item = {"id": len(events), "line": frame.f_lineno,
                "kind": "return" if event == "return" else "before", "locals": values,
                "collections": collections}
        if event == "return":
            item["result"] = encode(arg)
        events.append(item)
        return record
    actual_args = copy.deepcopy(args)
    if trace:
        sys.settrace(record)
    try:
        result = getattr(scope["Solution"](), method)(*actual_args)
    finally:
        sys.settrace(None)
    if trace:
        output = {"version": 1, "sourceHash": hashlib.sha256(source.encode()).hexdigest(),
                  "input": args, "events": events, "result": encode(result),
                  "complete": True, "runtime": sys.version.split()[0]}
        if not events or events[-1]["kind"] != "return":
            raise Unsupported("Execution did not produce a complete return trace.")
        return {"result": result, "mutatedInput": actual_args, "trace": output}
    return {"result": result, "mutatedInput": actual_args}


def main():
    # OS isolation is provided externally. Apply process limits inside Linux too.
    import resource
    resource.setrlimit(resource.RLIMIT_CPU, (2, 2))
    resource.setrlimit(resource.RLIMIT_AS, (256 * 1024 * 1024, 256 * 1024 * 1024))
    resource.setrlimit(resource.RLIMIT_FSIZE, (10 * 1024 * 1024, 10 * 1024 * 1024))
    resource.setrlimit(resource.RLIMIT_NOFILE, (32, 32))
    payload = json.loads(open("/home/user/case.json", encoding="utf-8").read())
    try:
        output = execute(payload["source"], payload["method"], payload["args"], payload.get("trace", False))
        print(json.dumps({"ok": True, **output}, allow_nan=False))
    except SyntaxError as error:
        print(json.dumps({"ok": False, "kind": "syntax", "message": f"Syntax error on line {error.lineno}: {error.msg}"}))
    except Unsupported as error:
        print(json.dumps({"ok": False, "kind": "unsupported", "message": str(error)[:300]}))
    except Exception as error:
        print(json.dumps({"ok": False, "kind": "runtime", "message": type(error).__name__}))


if __name__ == "__main__":
    main()
