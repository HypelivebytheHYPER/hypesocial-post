#!/usr/bin/env python3
"""
Audit types/post-for-me.ts against the OpenAPI JSON spec.
Usage: python3 scripts/audit-types.py
"""
import json, re, sys, os

SPEC_PATH = os.path.expanduser("/Users/mdch/Downloads/api-post-for-me.json")
TYPES_PATH = os.path.join(os.path.dirname(__file__), "..", "types", "post-for-me.ts")

with open(SPEC_PATH) as f:
    spec = json.load(f)
schemas = spec.get("components", {}).get("schemas", {})

with open(TYPES_PATH) as f:
    ts = f.read()

# API schema name -> TS interface name
NAME_MAP = {
    "SocialPostDto": "SocialPost",
    "SocialAccountDto": "SocialAccount",
    "SocialPostMediaDto": "MediaItem",
    "UserTagDto": "MediaTag",
    "CreateUploadUrlResponseDto": "CreateUploadUrlResponse",
    "SocialPostResultDto": "SocialPostResult",
}


def get_interface_fields(ts_content, iface_name):
    pattern = rf"export\s+interface\s+{re.escape(iface_name)}\s*\{{"
    m = re.search(pattern, ts_content)
    if not m:
        return None
    start = m.end()
    depth = 1
    pos = start
    while pos < len(ts_content) and depth > 0:
        if ts_content[pos] == "{":
            depth += 1
        elif ts_content[pos] == "}":
            depth -= 1
        pos += 1
    block = ts_content[start : pos - 1]
    block = re.sub(r"/\*\*.*?\*/", "", block, flags=re.DOTALL)
    block = re.sub(r"//.*", "", block)
    flat = " ".join(block.split())
    parts = [p.strip() for p in flat.split(";") if p.strip()]
    fields = {}
    for part in parts:
        fm = re.match(r'["\']?(\w+)["\']?(\?)?:\s*(.*)', part)
        if not fm:
            fm2 = re.match(r'"([^"]+)"(\?)?:\s*(.*)', part)
            if fm2:
                fields[fm2.group(1)] = {
                    "optional": fm2.group(2) == "?",
                    "has_null": bool(re.search(r"\bnull\b", fm2.group(3))),
                    "type": fm2.group(3).strip(),
                }
            continue
        fields[fm.group(1)] = {
            "optional": fm.group(2) == "?",
            "has_null": bool(re.search(r"\bnull\b", fm.group(3))),
            "type": fm.group(3).strip(),
        }
    return fields


issues = []
matched = 0
for schema_name in sorted(schemas.keys()):
    dto = schemas[schema_name]
    props = dto.get("properties", {})
    required_fields = dto.get("required", [])
    ts_name = NAME_MAP.get(schema_name, schema_name)
    fields = get_interface_fields(ts, ts_name)
    if fields is None:
        continue
    matched += 1
    for field_name in sorted(props.keys()):
        v = props[field_name]
        nullable = v.get("nullable", False)
        is_required = field_name in required_fields
        if field_name not in fields:
            issues.append(f"MISSING FIELD: {ts_name}.{field_name}")
            continue
        tf = fields[field_name]
        if nullable and not tf["has_null"]:
            issues.append(f"NEEDS | null:    {ts_name}.{field_name} — TS: {tf['type']}")
        if not nullable and tf["has_null"]:
            issues.append(f"EXTRA | null:    {ts_name}.{field_name} — TS: {tf['type']}")
        if is_required and tf["optional"]:
            issues.append(f"NEEDS required:  {ts_name}.{field_name}")
        if not is_required and not tf["optional"]:
            issues.append(f"SHOULD BE opt:   {ts_name}.{field_name}")

print(f"Audited {matched} interfaces against OpenAPI spec.\n")
if issues:
    print(f"Found {len(issues)} issues:\n")
    for i in issues:
        print(f"  {i}")
    sys.exit(1)
else:
    print("ALL TYPES MATCH SPEC — 0 issues")
