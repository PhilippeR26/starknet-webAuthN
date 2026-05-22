#!/usr/bin/env python3
"""
Parse a Redis RDB v12 file and extract all string key-value pairs.
Outputs SQL INSERT statements for Turso migration.
"""

import sys
import json

def read_length(data, pos):
    """Decode RDB length encoding. Returns (length, new_pos)."""
    b = data[pos]
    enc_type = (b & 0xC0) >> 6
    if enc_type == 0:
        return b & 0x3F, pos + 1
    elif enc_type == 1:
        return ((b & 0x3F) << 8) | data[pos + 1], pos + 2
    elif enc_type == 2:
        length = (data[pos+1] << 24) | (data[pos+2] << 16) | (data[pos+3] << 8) | data[pos+4]
        return length, pos + 5
    else:
        # Special encoding (integer stored as string)
        special = b & 0x3F
        if special == 0:
            return -1, pos + 1  # 8-bit int
        elif special == 1:
            return -2, pos + 1  # 16-bit int
        elif special == 2:
            return -4, pos + 1  # 32-bit int
        else:
            raise ValueError(f"Unknown special encoding: {special}")

def read_string(data, pos):
    """Read an RDB encoded string. Returns (string_bytes, new_pos)."""
    length, pos = read_length(data, pos)
    if length == -1:
        val = data[pos]
        return str(val).encode(), pos + 1
    elif length == -2:
        val = int.from_bytes(data[pos:pos+2], 'little', signed=True)
        return str(val).encode(), pos + 2
    elif length == -4:
        val = int.from_bytes(data[pos:pos+4], 'little', signed=True)
        return str(val).encode(), pos + 4
    else:
        s = data[pos:pos + length]
        return s, pos + length

def parse_rdb(path):
    with open(path, 'rb') as f:
        data = f.read()

    assert data[:5] == b'REDIS', "Not a Redis RDB file"
    pos = 9  # skip "REDIS0012"

    pairs = {}

    while pos < len(data):
        opcode = data[pos]
        pos += 1

        if opcode == 0xFF:  # EOF
            break
        elif opcode == 0xFA:  # Auxiliary field
            key, pos = read_string(data, pos)
            val, pos = read_string(data, pos)
        elif opcode == 0xFE:  # Select DB
            _, pos = read_length(data, pos)
        elif opcode == 0xFB:  # Resize DB
            _, pos = read_length(data, pos)
            _, pos = read_length(data, pos)
        elif opcode == 0xFC:  # Expire time ms
            pos += 8  # skip 8-byte timestamp
            val_type = data[pos]; pos += 1
            key, pos = read_string(data, pos)
            val, pos = read_string(data, pos)
            if val_type == 0:
                pairs[key.decode()] = val.decode()
        elif opcode == 0xFD:  # Expire time s
            pos += 4
            val_type = data[pos]; pos += 1
            key, pos = read_string(data, pos)
            val, pos = read_string(data, pos)
            if val_type == 0:
                pairs[key.decode()] = val.decode()
        elif opcode == 0:  # String value (no expiry)
            key, pos = read_string(data, pos)
            val, pos = read_string(data, pos)
            pairs[key.decode()] = val.decode()
        else:
            # Skip unknown opcode
            break

    return pairs

def main():
    rdb_path = '/D/Starknet/starknet-webAuthN/tmp/database.rdb'
    pairs = parse_rdb(rdb_path)

    print(f"-- Found {len(pairs)} entries\n")
    print("CREATE TABLE IF NOT EXISTS users (")
    print("  id TEXT PRIMARY KEY,")
    print("  userName TEXT NOT NULL,")
    print("  pubKey TEXT NOT NULL")
    print(");\n")

    for credential_id, json_val in sorted(pairs.items()):
        try:
            obj = json.loads(json_val)
            user_name = obj['userName'].replace("'", "''")
            pub_key = obj['pubKey'].replace("'", "''")
            print(f"INSERT OR REPLACE INTO users (id, userName, pubKey) VALUES ('{credential_id}', '{user_name}', '{pub_key}');")
        except Exception as e:
            print(f"-- ERROR parsing {credential_id}: {e}", file=sys.stderr)

if __name__ == '__main__':
    main()
