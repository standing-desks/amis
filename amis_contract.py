"""Offline AMIS 0.4.0 contract checks. Importing this module never runs tests or writes files.

This is a repository API, not a native adapter or a complete conformance implementation.
Pin the repository revision together with its schemas. Only inline source snapshots
are resolved. Callers own input size limits, authorization and publication policy.
"""

import base64
import copy
import datetime
import hashlib
import json
from pathlib import Path

import jsonschema
import rfc8785

VERSION = "0.4.0"
ROOT = Path(__file__).resolve().parent


class ContractError(ValueError):
    """An AMIS artifact failed a semantic or integrity check."""


def _require(condition, message):
    if not condition:
        raise ContractError(message)


def strict_pairs(pairs):
    value = {}
    for key, item in pairs:
        _require(key not in value, "duplicate JSON member")
        value[key] = item
    return value


def loads(text):
    """Parse JSON without silently accepting duplicate members or nonfinite numbers."""
    def invalid_constant(value):
        raise ContractError("nonfinite JSON number: " + value)
    return json.loads(text, object_pairs_hook=strict_pairs, parse_constant=invalid_constant)


schemas = {
    name: loads((ROOT / "schemas" / VERSION / (name + ".schema.json")).read_text())
    for name in ("bundle", "plan", "receipt", "capabilities")
}
for schema in schemas.values():
    jsonschema.Draft202012Validator.check_schema(schema)
validators = {
    name: jsonschema.Draft202012Validator(schema, format_checker=jsonschema.FormatChecker())
    for name, schema in schemas.items()
}


def digest(value):
    value = copy.deepcopy(value)
    value.pop("integrity", None)
    return hashlib.sha256(rfc8785.dumps(value)).hexdigest()


def seal(value):
    value = copy.deepcopy(value)
    value["integrity"] = {
        "algorithm": "sha256", "canonicalization": "jcs-rfc8785", "digest": digest(value)
    }
    return value


def record_reference(record):
    return {
        "memory_id": record["id"], "revision_id": record["revision"]["id"],
        "digest": record["integrity"]["digest"],
    }


def path_ok(path):
    return (path.startswith("sources/")
            and all(part not in ("", ".", "..") for part in path.split("/"))
            and not any(char in path for char in ("\\", "\x00", ":")))


def validate_document(kind, value):
    """Check a document schema and its seal; bundle semantics use validate_bundle."""
    validators[kind].validate(value)
    _require(digest(value) == value["integrity"]["digest"], kind + " integrity")


def validate_bundle(bundle):
    """Return valid or archive_only; reject inconsistent inline source/record graphs."""
    validate_document("bundle", bundle)
    snapshots = {}
    for snapshot in bundle["snapshots"]:
        key = snapshot["sha256"]
        _require(key not in snapshots, "duplicate snapshot")
        if snapshot["availability"] != "included":
            snapshots[key] = None
            continue
        if "text" in snapshot:
            raw = snapshot["text"].encode()
        elif "base64" in snapshot:
            raw = base64.b64decode(snapshot["base64"], validate=True)
            _require(base64.b64encode(raw).decode() == snapshot["base64"], "base64 canonical")
        else:
            _require(path_ok(snapshot["path"]), "path escape")
            raise ContractError("external snapshots are not resolved by this offline checker")
        _require(snapshot["byte_length"] == len(raw)
                 and hashlib.sha256(raw).hexdigest() == key, "snapshot integrity")
        snapshots[key] = raw

    records = {}
    for record in bundle["records"]:
        revision = record["revision"]["id"]
        _require(revision not in records, "duplicate revision")
        records[revision] = record
        _require(digest(record) == record["integrity"]["digest"], "record integrity")
        validity = record["validity"]
        if validity["not_before"] and validity["expires_at"]:
            start = datetime.datetime.fromisoformat(validity["not_before"].replace("Z", "+00:00"))
            end = datetime.datetime.fromisoformat(validity["expires_at"].replace("Z", "+00:00"))
            _require(start < end, "validity interval")
        for source in record["sources"]:
            key = source["snapshot_ref"]
            if key is None:
                continue
            _require(key in snapshots, "undeclared source snapshot")
            raw = snapshots[key]
            if raw is not None and "selector" in source:
                selector = source["selector"]
                end = selector["start"] + selector["length"]
                _require(end <= len(raw), "selector bounds")
                raw.decode()
                raw[:selector["start"]].decode()
                raw[:end].decode()

    missing, edges = [], {}
    for revision, record in records.items():
        edges[revision] = []
        parents = record["revision"]["parents"]
        for parent in parents:
            _require(parent["memory_id"] == record["id"], "parent memory")
        for dependency in parents + record["derivation"]["inputs"]:
            _require(dependency["revision_id"] != revision, "self reference")
            other = records.get(dependency["revision_id"])
            if other:
                _require(record_reference(other) == dependency, "reference integrity")
                if dependency in parents:
                    _require(record["created_at"] == other["created_at"], "creation time")
                edges[revision].append(dependency["revision_id"])
            elif dependency not in missing:
                missing.append(dependency)
    if bundle["history"]["coverage"] == "complete":
        _require(not missing and not bundle["history"]["missing_parents"], "incomplete history")
    else:
        _require(sorted(missing, key=str) == sorted(bundle["history"]["missing_parents"], key=str),
                 "undeclared missing parents")

    def visit(revision, stack, seen):
        _require(revision not in stack, "cycle")
        if revision in seen:
            return
        for child in edges[revision]:
            visit(child, stack | {revision}, seen)
        seen.add(revision)

    seen = set()
    for revision in records:
        visit(revision, set(), seen)
    known = {"amis.scope.v1", "amis.revision-graph.v1", "amis.integrity.jcs-sha256.v1", "amis.links.v1"}
    return "archive_only" if set(bundle["required_features"]) - known else "valid"
