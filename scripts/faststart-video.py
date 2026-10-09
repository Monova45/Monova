"""Move an MP4's trailing moov before media, preserving encoded video bytes."""
from pathlib import Path
import struct
import sys

path = Path(sys.argv[1])
data = path.read_bytes()
def boxes(buf, start=0, end=None):
    end = len(buf) if end is None else end
    while start < end:
        size, kind = struct.unpack_from('>I4s', buf, start)
        if size < 8 or start + size > end:
            raise ValueError('Unsupported MP4 box layout')
        yield start, size, kind
        start += size

layout = list(boxes(data))
moov_pos, moov_size, _ = next(box for box in layout if box[2] == b'moov')
media_pos = next(box[0] for box in layout if box[2] == b'mdat')
if moov_pos < media_pos:
    print('Already optimized')
    sys.exit(0)
assert moov_pos + moov_size == len(data), 'Expected trailing moov'
moov = bytearray(data[moov_pos:])
def patch(start, end):
    for pos, size, kind in boxes(moov, start, end):
        if kind in (b'moov', b'trak', b'mdia', b'minf', b'stbl'):
            patch(pos + 8, pos + size)
        elif kind in (b'stco', b'co64'):
            count = struct.unpack_from('>I', moov, pos + 12)[0]
            fmt, width = ('>I', 4) if kind == b'stco' else ('>Q', 8)
            assert 16 + count * width <= size
            for index in range(count):
                offset = pos + 16 + index * width
                value = struct.unpack_from(fmt, moov, offset)[0]
                assert media_pos <= value < moov_pos
                struct.pack_into(fmt, moov, offset, value + moov_size)
patch(0, len(moov))
result = data[:media_pos] + moov + data[media_pos:moov_pos]
assert len(result) == len(data)
assert result[media_pos + moov_size:] == data[media_pos:moov_pos]
path.write_bytes(result)
print('Optimized streaming metadata; encoded media unchanged')
